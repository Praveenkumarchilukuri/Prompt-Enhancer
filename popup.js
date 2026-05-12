// ═══════════════════════════════════════════════════════════════════════════
// Prompt Enhancer Pro — Popup Logic
// ═══════════════════════════════════════════════════════════════════════════

// ─── State ───────────────────────────────────────────────────────────────────
let currentMode = 'general';
let currentIntensity = 'medium';
let currentVariantCount = 1;
let variants = [];
let currentVariantIndex = 0;

// ─── DOM Elements ────────────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const promptInput = $('#promptInput');
const outputSection = $('#outputSection');
const outputText = $('#outputText');
const enhanceBtn = $('#enhanceBtn');
const analyzeBtn = $('#analyzeBtn');
const tokenCount = $('#tokenCount');
const analysisPanel = $('#analysisPanel');
const errorPanel = $('#errorPanel');
const errorText = $('#errorText');
const customInstructionsWrapper = $('#customInstructionsWrapper');
const customInstructions = $('#customInstructions');

// ─── Templates Data ──────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    emoji: '🤖',
    title: 'Expert System Design',
    category: 'General',
    desc: 'Create a detailed expert system prompt with role, rules, and output format.',
    prompt: 'Act as a [ROLE] expert. I need help with [TASK]. Consider [CONTEXT] and provide [OUTPUT FORMAT].'
  },
  {
    emoji: '💻',
    title: 'Full-Stack Feature',
    category: 'Coding',
    desc: 'Build a complete feature with frontend, backend, and database.',
    prompt: 'Build a [FEATURE] with [TECH STACK]. Include error handling, validation, and tests.'
  },
  {
    emoji: '🐛',
    title: 'Debug Assistant',
    category: 'Coding',
    desc: 'Systematically debug an issue with root cause analysis.',
    prompt: 'Debug this issue: [DESCRIBE BUG]. Here is the code: [CODE]. Error message: [ERROR].'
  },
  {
    emoji: '📝',
    title: 'Blog Article',
    category: 'Creative',
    desc: 'Write an engaging, SEO-optimized blog post.',
    prompt: 'Write a blog post about [TOPIC] targeting [AUDIENCE]. Tone: [TONE]. Length: [WORD COUNT].'
  },
  {
    emoji: '📖',
    title: 'Story Creator',
    category: 'Creative',
    desc: 'Craft an immersive short story with vivid details.',
    prompt: 'Write a [GENRE] short story about [PREMISE]. Include [CHARACTER DETAILS] and [SETTING].'
  },
  {
    emoji: '🔬',
    title: 'Research Analysis',
    category: 'Research',
    desc: 'Deep-dive analysis with structured findings and sources.',
    prompt: 'Analyze [TOPIC] comprehensively. Cover: background, current state, key findings, implications, and future directions.'
  },
  {
    emoji: '📊',
    title: 'Data Insights',
    category: 'Research',
    desc: 'Extract actionable insights from data or metrics.',
    prompt: 'Analyze this data: [DATA]. Identify trends, anomalies, correlations. Provide actionable recommendations.'
  },
  {
    emoji: '🎨',
    title: 'Cinematic Scene',
    category: 'Image',
    desc: 'Generate a photorealistic cinematic image prompt.',
    prompt: 'A [SUBJECT] in [SETTING], [LIGHTING] lighting, cinematic composition, 8K, photorealistic, [MOOD] atmosphere.'
  },
  {
    emoji: '🖌️',
    title: 'Artistic Portrait',
    category: 'Image',
    desc: 'Create an artistic portrait with specific style.',
    prompt: 'Portrait of [SUBJECT], [ART STYLE] style, [COLOR PALETTE] colors, [MEDIUM], highly detailed, trending on ArtStation.'
  },
  {
    emoji: '📧',
    title: 'Professional Email',
    category: 'General',
    desc: 'Craft a well-structured professional email.',
    prompt: 'Write a professional email to [RECIPIENT] about [SUBJECT]. Tone: [TONE]. Include [KEY POINTS].'
  },
  {
    emoji: '🧠',
    title: 'Chain of Thought',
    category: 'General',
    desc: 'Force step-by-step reasoning for complex problems.',
    prompt: 'Solve this step by step: [PROBLEM]. Show your reasoning at each step. Verify your answer.'
  },
  {
    emoji: '📋',
    title: 'API Documentation',
    category: 'Coding',
    desc: 'Generate comprehensive API documentation.',
    prompt: 'Document this API: [API DETAILS]. Include endpoints, parameters, responses, examples, and error codes.'
  }
];

// ─── Initialize ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initModeSelector();
  initIntensitySelector();
  initVariantSelector();
  initEnhanceButton();
  initAnalyzeButton();
  initOutputActions();
  initTokenCounter();
  initHistory();
  initTemplates();
  initSettings();
  initErrorHandling();
});

// ─── Navigation ──────────────────────────────────────────────────────────────
function initNavigation() {
  $$('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const viewName = tab.dataset.view;
      $$('.view').forEach(v => v.classList.remove('active'));
      $(`#${viewName}View`).classList.add('active');

      if (viewName === 'history') loadHistory();
    });
  });
}

// ─── Mode Selector ───────────────────────────────────────────────────────────
function initModeSelector() {
  $$('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;

      if (currentMode === 'custom') {
        customInstructionsWrapper.classList.remove('hidden');
      } else {
        customInstructionsWrapper.classList.add('hidden');
      }
    });
  });
}

// ─── Intensity Selector ──────────────────────────────────────────────────────
function initIntensitySelector() {
  $$('.intensity-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.intensity-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentIntensity = btn.dataset.intensity;
    });
  });
}

// ─── Variant Selector ────────────────────────────────────────────────────────
function initVariantSelector() {
  $$('.variant-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.variant-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentVariantCount = parseInt(btn.dataset.variants);
    });
  });
}

// ─── Token Counter ───────────────────────────────────────────────────────────
function initTokenCounter() {
  promptInput.addEventListener('input', () => {
    const text = promptInput.value;
    const tokens = Math.ceil(text.length / 4);
    tokenCount.textContent = `~${tokens} tokens`;
  });
}

// ─── Enhance Button ──────────────────────────────────────────────────────────
function initEnhanceButton() {
  enhanceBtn.addEventListener('click', handleEnhance);
}

async function handleEnhance() {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    showError('Please enter a prompt to enhance.');
    return;
  }

  setLoading(enhanceBtn, true);
  hideError();
  outputSection.classList.add('hidden');

  try {
    if (currentVariantCount > 1) {
      const response = await sendMessage({
        type: 'GENERATE_VARIANTS',
        prompt,
        mode: currentMode,
        count: currentVariantCount
      });
      if (!response.success) throw new Error(response.error);
      variants = response.result;
    } else {
      const response = await sendMessage({
        type: 'ENHANCE',
        prompt,
        mode: currentMode,
        intensity: currentIntensity,
        customInstructions: currentMode === 'custom' ? customInstructions.value : ''
      });
      if (!response.success) throw new Error(response.error);
      variants = [response.result];
    }

    currentVariantIndex = 0;
    displayOutput();
    saveToHistory(prompt, variants, currentMode, currentIntensity);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(enhanceBtn, false);
  }
}

function displayOutput() {
  outputSection.classList.remove('hidden');
  outputText.textContent = variants[currentVariantIndex];

  const variantNav = $('#variantNav');
  if (variants.length > 1) {
    variantNav.classList.remove('hidden');
    $('#variantIndicator').textContent = `${currentVariantIndex + 1}/${variants.length}`;
  } else {
    variantNav.classList.add('hidden');
  }
}

// ─── Analyze Button ──────────────────────────────────────────────────────────
function initAnalyzeButton() {
  analyzeBtn.addEventListener('click', handleAnalyze);
  $('#closeAnalysis').addEventListener('click', () => {
    analysisPanel.classList.add('hidden');
  });
}

async function handleAnalyze() {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    showError('Please enter a prompt to analyze.');
    return;
  }

  setLoading(analyzeBtn, true);
  hideError();

  try {
    const response = await sendMessage({ type: 'ANALYZE', prompt });
    if (!response.success) throw new Error(response.error);
    displayAnalysis(response.result);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(analyzeBtn, false);
  }
}

function displayAnalysis(analysis) {
  analysisPanel.classList.remove('hidden');

  // Overall score
  const overall = analysis.overall || 0;
  $('#scoreValue').textContent = overall;
  $('#scoreRingFill').setAttribute('stroke-dasharray', `${overall}, 100`);

  // Score bars
  const scoreBars = $('#scoreBars');
  scoreBars.innerHTML = '';
  const scores = analysis.scores || {};
  for (const [key, value] of Object.entries(scores)) {
    scoreBars.innerHTML += `
      <div class="score-bar-item">
        <span class="score-bar-label">${key}</span>
        <div class="score-bar-track">
          <div class="score-bar-fill" style="width: ${value}%"></div>
        </div>
        <span class="score-bar-value">${value}</span>
      </div>`;
  }

  // Details
  renderDetailSection('strengths', '💪 Strengths', analysis.strengths, 'strengths-list');
  renderDetailSection('weaknesses', '⚠️ Weaknesses', analysis.weaknesses, 'weaknesses-list');
  renderDetailSection('suggestions', '💡 Suggestions', analysis.suggestions, 'suggestions-list');
}

function renderDetailSection(id, title, items, listClass) {
  const el = $(`#${id}`);
  if (!items || items.length === 0) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `
    <div class="detail-title">${title}</div>
    <ul class="detail-list ${listClass}">
      ${items.map(item => `<li>${item}</li>`).join('')}
    </ul>`;
}

// ─── Output Actions ──────────────────────────────────────────────────────────
function initOutputActions() {
  // Copy
  $('#copyBtn').addEventListener('click', async () => {
    const text = variants[currentVariantIndex];
    await navigator.clipboard.writeText(text);
    const btn = $('#copyBtn');
    btn.classList.add('copied');
    btn.querySelector('span').textContent = 'Copied!';
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.querySelector('span').textContent = 'Copy';
    }, 2000);
  });

  // Insert into active page
  $('#insertBtn').addEventListener('click', async () => {
    const text = variants[currentVariantIndex];
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { type: 'INSERT_TEXT', text });
    showToast('Inserted into active chat!', 'success');
  });

  // Save to favorites
  $('#saveBtn').addEventListener('click', async () => {
    const original = promptInput.value.trim();
    const enhanced = variants[currentVariantIndex];
    const { favorites = [] } = await chrome.storage.local.get('favorites');
    favorites.unshift({
      id: Date.now(),
      original,
      enhanced,
      mode: currentMode,
      date: new Date().toISOString()
    });
    await chrome.storage.local.set({ favorites: favorites.slice(0, 100) });
    showToast('Saved to favorites! ⭐', 'success');
  });

  // Re-enhance
  $('#reenhanceBtn').addEventListener('click', () => {
    promptInput.value = variants[currentVariantIndex];
    promptInput.dispatchEvent(new Event('input'));
    outputSection.classList.add('hidden');
    handleEnhance();
  });

  // Variant navigation
  $('#prevVariant').addEventListener('click', () => {
    if (currentVariantIndex > 0) {
      currentVariantIndex--;
      displayOutput();
    }
  });

  $('#nextVariant').addEventListener('click', () => {
    if (currentVariantIndex < variants.length - 1) {
      currentVariantIndex++;
      displayOutput();
    }
  });
}

// ─── History ─────────────────────────────────────────────────────────────────
function initHistory() {
  $('#historySearch').addEventListener('input', (e) => {
    loadHistory(e.target.value);
  });

  $('#exportHistory').addEventListener('click', exportHistory);
  $('#importHistory').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', importHistory);
  $('#clearHistory').addEventListener('click', async () => {
    if (confirm('Clear all history? This cannot be undone.')) {
      await chrome.storage.local.set({ history: [] });
      loadHistory();
      showToast('History cleared', 'success');
    }
  });
}

async function loadHistory(searchTerm = '') {
  const { history = [] } = await chrome.storage.local.get('history');
  const list = $('#historyList');

  let filtered = history;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = history.filter(h =>
      h.original.toLowerCase().includes(term) ||
      h.enhanced.toLowerCase().includes(term)
    );
  }

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">${searchTerm ? '🔍' : '📭'}</span>
        <p>${searchTerm ? 'No results found' : 'No history yet'}</p>
        <p class="empty-subtitle">${searchTerm ? 'Try a different search term' : 'Enhanced prompts will appear here'}</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map((item, idx) => `
    <div class="history-item" data-index="${idx}">
      <div class="history-item-header">
        <span class="history-mode">${item.mode} • ${item.intensity}</span>
        <span class="history-date">${formatDate(item.date)}</span>
      </div>
      <div class="history-preview">${escapeHtml(item.original)}</div>
      <div class="history-item-actions">
        <button class="history-action-btn use-original" data-idx="${idx}">Use Original</button>
        <button class="history-action-btn use-enhanced" data-idx="${idx}">Use Enhanced</button>
        <button class="history-action-btn copy-enhanced" data-idx="${idx}">Copy</button>
        <button class="history-action-btn delete" data-idx="${idx}">Delete</button>
      </div>
    </div>
  `).join('');

  // Bind history item actions
  list.querySelectorAll('.use-original').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = filtered[btn.dataset.idx];
      promptInput.value = item.original;
      promptInput.dispatchEvent(new Event('input'));
      switchToView('enhance');
    });
  });

  list.querySelectorAll('.use-enhanced').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = filtered[btn.dataset.idx];
      promptInput.value = item.enhanced;
      promptInput.dispatchEvent(new Event('input'));
      switchToView('enhance');
    });
  });

  list.querySelectorAll('.copy-enhanced').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const item = filtered[btn.dataset.idx];
      await navigator.clipboard.writeText(item.enhanced);
      showToast('Copied!', 'success');
    });
  });

  list.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const { history: h = [] } = await chrome.storage.local.get('history');
      h.splice(parseInt(btn.dataset.idx), 1);
      await chrome.storage.local.set({ history: h });
      loadHistory($('#historySearch').value);
    });
  });
}

async function saveToHistory(original, enhancedVariants, mode, intensity) {
  const { history = [] } = await chrome.storage.local.get('history');
  history.unshift({
    id: Date.now(),
    original,
    enhanced: enhancedVariants[0],
    variants: enhancedVariants,
    mode,
    intensity,
    date: new Date().toISOString()
  });
  // Keep last 200 entries
  await chrome.storage.local.set({ history: history.slice(0, 200) });
}

async function exportHistory() {
  const { history = [], favorites = [] } = await chrome.storage.local.get(['history', 'favorites']);
  const data = JSON.stringify({ history, favorites, exportedAt: new Date().toISOString() }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `prompt-enhancer-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('History exported!', 'success');
}

async function importHistory(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const { history: existing = [] } = await chrome.storage.local.get('history');
    const merged = [...(data.history || []), ...existing];
    await chrome.storage.local.set({
      history: merged.slice(0, 200),
      favorites: data.favorites || []
    });
    loadHistory();
    showToast('History imported!', 'success');
  } catch {
    showError('Invalid backup file.');
  }

  e.target.value = '';
}

// ─── Templates ───────────────────────────────────────────────────────────────
function initTemplates() {
  const grid = $('#templatesGrid');
  grid.innerHTML = TEMPLATES.map((t, i) => `
    <div class="template-card" data-index="${i}">
      <div class="template-header">
        <span class="template-emoji">${t.emoji}</span>
        <span class="template-title">${t.title}</span>
        <span class="template-category">${t.category}</span>
      </div>
      <div class="template-desc">${t.desc}</div>
      <div class="template-preview">${t.prompt}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const template = TEMPLATES[card.dataset.index];
      promptInput.value = template.prompt;
      promptInput.dispatchEvent(new Event('input'));

      // Auto-select the matching mode
      const modeMap = {
        'General': 'general', 'Coding': 'coding', 'Creative': 'creative',
        'Research': 'research', 'Image': 'image'
      };
      const mode = modeMap[template.category] || 'general';
      $$('.mode-btn').forEach(b => b.classList.remove('active'));
      $(`.mode-btn[data-mode="${mode}"]`).classList.add('active');
      currentMode = mode;

      switchToView('enhance');
    });
  });
}

// ─── Settings ────────────────────────────────────────────────────────────────
function initSettings() {
  $('#settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// ─── Error Handling ──────────────────────────────────────────────────────────
function initErrorHandling() {
  $('#closeError').addEventListener('click', hideError);
}

function showError(message) {
  errorPanel.classList.remove('hidden');
  errorText.textContent = message;
}

function hideError() {
  errorPanel.classList.add('hidden');
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, resolve);
  });
}

function setLoading(button, loading) {
  const text = button.querySelector('.btn-text');
  const loader = button.querySelector('.btn-loader');
  if (loading) {
    text.classList.add('hidden');
    loader.classList.remove('hidden');
    button.disabled = true;
  } else {
    text.classList.remove('hidden');
    loader.classList.add('hidden');
    button.disabled = false;
  }
}

function switchToView(viewName) {
  $$('.nav-tab').forEach(t => t.classList.remove('active'));
  $(`.nav-tab[data-view="${viewName}"]`).classList.add('active');
  $$('.view').forEach(v => v.classList.remove('active'));
  $(`#${viewName}View`).classList.add('active');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = '') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
