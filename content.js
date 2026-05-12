// ═══════════════════════════════════════════════════════════════════════════
// Prompt Enhancer — Content Script
// Injects a toolbar above the chat input on ChatGPT, Claude, Gemini, etc.
// ═══════════════════════════════════════════════════════════════════════════

(() => {
  'use strict';

  // ─── Platform Configurations ─────────────────────────────────────────────
  const PLATFORMS = {
    chatgpt: {
      match: /chatgpt\.com|chat\.openai\.com/,
      // Find the form or the container around the textarea
      getInputContainer: () => {
        const textarea = document.querySelector('#prompt-textarea');
        if (textarea) {
          // Walk up to find a suitable parent container
          let container = textarea.closest('form') || textarea.parentElement?.parentElement?.parentElement;
          return container;
        }
        return null;
      },
      getInput: () => document.querySelector('#prompt-textarea') || document.querySelector('textarea'),
      getText: (el) => el.value || el.textContent || el.innerText,
      setText: (el, text) => {
        // ChatGPT uses a contenteditable div or textarea
        if (el.tagName === 'TEXTAREA') {
          const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
          nativeSetter.call(el, text);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          el.innerHTML = '';
          const p = document.createElement('p');
          p.textContent = text;
          el.appendChild(p);
          el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
        }
      }
    },
    claude: {
      match: /claude\.ai/,
      getInputContainer: () => {
        const input = document.querySelector('div[contenteditable="true"].ProseMirror')
          || document.querySelector('div[contenteditable="true"]');
        if (input) {
          // Find the fieldset or parent container of the input
          let container = input.closest('fieldset') || input.closest('form') || input.parentElement?.parentElement;
          return container;
        }
        return null;
      },
      getInput: () => document.querySelector('div[contenteditable="true"].ProseMirror')
        || document.querySelector('div[contenteditable="true"]'),
      getText: (el) => el.textContent || el.innerText,
      setText: (el, text) => {
        el.innerHTML = `<p>${text.replace(/\n/g, '</p><p>')}</p>`;
        el.dispatchEvent(new InputEvent('input', { bubbles: true }));
      }
    },
    gemini: {
      match: /gemini\.google\.com/,
      getInputContainer: () => {
        const input = document.querySelector('.ql-editor')
          || document.querySelector('rich-textarea div[contenteditable="true"]')
          || document.querySelector('div[contenteditable="true"]');
        if (input) {
          let container = input.closest('.input-area-container') || input.closest('form') || input.parentElement?.parentElement;
          return container;
        }
        return null;
      },
      getInput: () => document.querySelector('.ql-editor')
        || document.querySelector('rich-textarea div[contenteditable="true"]'),
      getText: (el) => el.textContent || el.innerText,
      setText: (el, text) => {
        el.innerHTML = `<p>${text.replace(/\n/g, '</p><p>')}</p>`;
        el.dispatchEvent(new InputEvent('input', { bubbles: true }));
      }
    },
    deepseek: {
      match: /chat\.deepseek\.com/,
      getInputContainer: () => {
        const textarea = document.querySelector('textarea');
        if (textarea) return textarea.closest('form') || textarea.parentElement?.parentElement;
        return null;
      },
      getInput: () => document.querySelector('textarea'),
      getText: (el) => el.value,
      setText: (el, text) => {
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        nativeSetter.call(el, text);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },
    kimi: {
      match: /kimi\.moonshot\.cn/,
      getInputContainer: () => {
        const input = document.querySelector('textarea') || document.querySelector('div[contenteditable="true"]');
        if (input) return input.closest('form') || input.parentElement?.parentElement;
        return null;
      },
      getInput: () => document.querySelector('textarea') || document.querySelector('div[contenteditable="true"]'),
      getText: (el) => el.value || el.textContent,
      setText: (el, text) => {
        if (el.tagName === 'TEXTAREA') {
          const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
          nativeSetter.call(el, text);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          el.textContent = text;
          el.dispatchEvent(new InputEvent('input', { bubbles: true }));
        }
      }
    }
  };

  // ─── State ───────────────────────────────────────────────────────────────
  let currentPlatform = null;
  let toolbar = null;
  let isEnhancing = false;
  let selectedMode = 'general';
  let selectedIntensity = 'medium';

  // ─── Apply Theme ─────────────────────────────────────────────────────────
  function applyTheme(theme) {
    if (!toolbar) return;
    if (theme === 'auto') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        toolbar.setAttribute('data-pe-theme', 'light');
      } else {
        toolbar.removeAttribute('data-pe-theme');
      }
    } else if (theme === 'light') {
      toolbar.setAttribute('data-pe-theme', 'light');
    } else {
      toolbar.removeAttribute('data-pe-theme');
    }
  }

  // Load theme and listen to media changes
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    chrome.storage.local.get('theme', res => {
      if ((res.theme || 'auto') === 'auto') applyTheme('auto');
    });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.theme) {
      applyTheme(changes.theme.newValue || 'auto');
    }
  });

  // Detect platform
  for (const [name, config] of Object.entries(PLATFORMS)) {
    if (config.match.test(window.location.hostname)) {
      currentPlatform = { name, ...config };
      break;
    }
  }

  if (!currentPlatform) return;

  // ─── Build Toolbar HTML ──────────────────────────────────────────────────
  function createToolbar() {
    if (toolbar) return;

    toolbar = document.createElement('div');
    toolbar.id = 'pe-toolbar';

    toolbar.innerHTML = `
      <button class="pe-icon-trigger" id="pe-icon-trigger" title="Prompt Enhancer (Ctrl+Shift+E)">
        <span class="pe-trigger-icon">⚡</span>
        <span class="pe-status-dot" id="pe-status-dot"></span>
      </button>

      <div class="pe-panel">
        <div class="pe-panel-header">
          <div class="pe-brand">
            <span class="pe-brand-icon">⚡</span>
            <span class="pe-brand-text">Enhancer</span>
          </div>
          <button class="pe-close-panel" id="pe-close-panel" title="Close">✕</button>
        </div>

        <div class="pe-panel-section">
          <span class="pe-section-label">Mode</span>
          <div class="pe-modes">
            <button class="pe-mode-btn pe-active" data-mode="general" title="General Enhancement">
              <span class="pe-mode-emoji">🎯</span> General
            </button>
            <button class="pe-mode-btn" data-mode="coding" title="Code Optimization">
              <span class="pe-mode-emoji">💻</span> Code
            </button>
            <button class="pe-mode-btn" data-mode="creative" title="Creative Writing">
              <span class="pe-mode-emoji">🎨</span> Creative
            </button>
            <button class="pe-mode-btn" data-mode="research" title="Research & Analysis">
              <span class="pe-mode-emoji">🔬</span> Research
            </button>
            <button class="pe-mode-btn" data-mode="image" title="Image Generation">
              <span class="pe-mode-emoji">🖼️</span> Image
            </button>
          </div>
        </div>

        <div class="pe-panel-section">
          <span class="pe-section-label">Intensity</span>
          <div class="pe-intensity">
            <button class="pe-int-btn" data-intensity="light" title="Light touch">Light</button>
            <button class="pe-int-btn pe-active" data-intensity="medium" title="Medium rewrite">Medium</button>
            <button class="pe-int-btn" data-intensity="heavy" title="Heavy rewrite">Heavy</button>
          </div>
        </div>

        <div class="pe-score-badge" id="pe-score-badge">
          <span>Score:</span>
          <span class="pe-score-val" id="pe-score-val">--</span>
        </div>

        <div class="pe-actions">
          <button class="pe-enhance-btn" id="pe-enhance-btn" title="Enhance your prompt">
            <span class="pe-btn-content">⚡ Enhance</span>
            <span class="pe-spinner"></span>
          </button>
          <button class="pe-analyze-btn" id="pe-analyze-btn" title="Analyze prompt quality">
            🔍 Analyze
          </button>
        </div>

        <div class="pe-shortcut-hint">
          <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> to quick enhance
        </div>
      </div>
    `;

    // Bind events
    bindToolbarEvents(toolbar);

    chrome.storage.local.get('theme', res => {
      applyTheme(res.theme || 'auto');
    });

    return toolbar;
  }

  // ─── Toggle Panel ───────────────────────────────────────────────────────
  let isPanelOpen = false;

  function togglePanel(forceClose = false) {
    if (forceClose) {
      isPanelOpen = false;
    } else {
      isPanelOpen = !isPanelOpen;
    }
    toolbar.classList.toggle('pe-panel-open', isPanelOpen);
  }

  // ─── Bind Toolbar Events ─────────────────────────────────────────────────
  function bindToolbarEvents(tb) {
    // Icon trigger click
    tb.querySelector('#pe-icon-trigger').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePanel();
    });

    // Close panel button
    tb.querySelector('#pe-close-panel').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePanel(true);
    });

    // Close panel on outside click
    document.addEventListener('click', (e) => {
      if (isPanelOpen && !tb.contains(e.target)) {
        togglePanel(true);
      }
    });

    // Mode selection
    tb.querySelectorAll('.pe-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        tb.querySelectorAll('.pe-mode-btn').forEach(b => b.classList.remove('pe-active'));
        btn.classList.add('pe-active');
        selectedMode = btn.dataset.mode;
      });
    });

    // Intensity selection
    tb.querySelectorAll('.pe-int-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        tb.querySelectorAll('.pe-int-btn').forEach(b => b.classList.remove('pe-active'));
        btn.classList.add('pe-active');
        selectedIntensity = btn.dataset.intensity;
      });
    });

    // Enhance button
    tb.querySelector('#pe-enhance-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleEnhance();
    });

    // Analyze button
    tb.querySelector('#pe-analyze-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleAnalyze();
    });
  }

  // ─── Inject Toolbar ──────────────────────────────────────────────────────
  function injectToolbar() {
    if (document.getElementById('pe-toolbar')) return;

    const container = currentPlatform.getInputContainer();
    if (!container) return;

    createToolbar();

    // Insert toolbar before the container (above the chat input)
    container.parentElement.insertBefore(toolbar, container);
  }

  // ─── Handle Enhance ──────────────────────────────────────────────────────
  async function handleEnhance() {
    if (isEnhancing) return;

    const input = currentPlatform.getInput();
    if (!input) {
      showNotification('Could not find the chat input.', true);
      return;
    }

    const text = currentPlatform.getText(input).trim();
    if (!text) {
      showNotification('Type a prompt first, then enhance it.', true);
      return;
    }

    isEnhancing = true;
    const enhBtn = toolbar.querySelector('#pe-enhance-btn');
    const statusDot = toolbar.querySelector('#pe-status-dot');
    enhBtn.classList.add('pe-loading');
    enhBtn.disabled = true;
    statusDot.className = 'pe-status-dot pe-processing';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'ENHANCE',
        prompt: text,
        mode: selectedMode,
        intensity: selectedIntensity
      });

      if (response && response.success) {
        currentPlatform.setText(input, response.result);
        showNotification('Prompt enhanced! ⚡');
      } else {
        showNotification('Error: ' + (response?.error || 'Unknown error'), true);
      }
    } catch (error) {
      showNotification('Enhancement failed. Check your API key in settings.', true);
    } finally {
      isEnhancing = false;
      enhBtn.classList.remove('pe-loading');
      enhBtn.disabled = false;
      statusDot.className = 'pe-status-dot';
    }
  }

  // ─── Handle Analyze ──────────────────────────────────────────────────────
  async function handleAnalyze() {
    const input = currentPlatform.getInput();
    if (!input) return;

    const text = currentPlatform.getText(input).trim();
    if (!text) {
      showNotification('Type a prompt first to analyze it.', true);
      return;
    }

    const analyzeBtn = toolbar.querySelector('#pe-analyze-btn');
    analyzeBtn.textContent = '⏳ ...';
    analyzeBtn.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE',
        prompt: text
      });

      if (response && response.success) {
        const score = response.result.overall || 0;
        const badge = toolbar.querySelector('#pe-score-badge');
        const scoreVal = toolbar.querySelector('#pe-score-val');
        scoreVal.textContent = score + '/100';
        badge.classList.add('pe-visible');
        showNotification(`Score: ${score}/100 • ${response.result.suggestions?.[0] || 'Looking good!'}`);
      } else {
        showNotification('Analysis failed: ' + (response?.error || 'Unknown error'), true);
      }
    } catch (error) {
      showNotification('Analysis failed. Check settings.', true);
    } finally {
      analyzeBtn.textContent = '🔍 Analyze';
      analyzeBtn.disabled = false;
    }
  }

  // ─── Notification ────────────────────────────────────────────────────────
  function showNotification(message, isError = false) {
    const existing = document.querySelector('.pe-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = `pe-notification ${isError ? 'pe-error' : 'pe-success'}`;
    notif.textContent = message;
    document.body.appendChild(notif);

    requestAnimationFrame(() => notif.classList.add('pe-show'));
    setTimeout(() => {
      notif.classList.remove('pe-show');
      setTimeout(() => notif.remove(), 300);
    }, 3500);
  }

  // ─── Message Handling ────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INSERT_TEXT') {
      const input = currentPlatform.getInput();
      if (input) {
        currentPlatform.setText(input, message.text);
        showNotification('Prompt inserted! ✨');
      }
    }

    if (message.type === 'REPLACE_SELECTION') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(message.text));
        showNotification('Text enhanced! ⚡');
      }
    }

    if (message.type === 'SHOW_ANALYSIS') {
      const analysis = message.analysis;
      showNotification(`Score: ${analysis.overall}/100 | ${analysis.category} prompt`);
    }

    if (message.type === 'TRIGGER_ENHANCE') {
      handleEnhance();
    }
  });

  // ─── Observer — Watch for Dynamic Page Changes ───────────────────────────
  let lastCheck = 0;
  const observer = new MutationObserver(() => {
    const now = Date.now();
    if (now - lastCheck < 1000) return; // Throttle to once per second
    lastCheck = now;

    if (!document.getElementById('pe-toolbar')) {
      toolbar = null;
      injectToolbar();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // ─── Initial Injection ───────────────────────────────────────────────────
  // Retry a few times since the page might still be loading
  function tryInject(attempts = 0) {
    if (document.getElementById('pe-toolbar')) return;
    if (attempts > 20) return; // Give up after ~10 seconds

    injectToolbar();

    if (!document.getElementById('pe-toolbar')) {
      setTimeout(() => tryInject(attempts + 1), 500);
    }
  }

  // Start after a short delay to let the page render
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => tryInject(), 1000));
  } else {
    setTimeout(() => tryInject(), 1500);
  }
})();
