// ═══════════════════════════════════════════════════════════════════════════
// Prompt Enhancer Pro — Options Page Logic
// Auto-detects provider from API key, fetches available models
// ═══════════════════════════════════════════════════════════════════════════

const $ = (sel) => document.querySelector(sel);

// ─── Provider Registry ──────────────────────────────────────────────────────

const PROVIDERS = {
  openai: {
    name: '🤖 OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    keyPatterns: [/^sk-proj-/i, /^sk-[A-Za-z0-9_-]{30,}/],
    keyHint: 'Get your key from <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a>',
    format: 'openai',
    detectPriority: 2
  },
  anthropic: {
    name: '🧠 Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-20250514',
    keyPatterns: [/^sk-ant-/],
    keyHint: 'Get your key from <a href="https://console.anthropic.com/" target="_blank">console.anthropic.com</a>',
    format: 'anthropic',
    detectPriority: 10,
    hardcodedModels: [
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-haiku-4-20250514',
      'claude-3.5-sonnet-20241022',
      'claude-3.5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ]
  },
  gemini: {
    name: '✨ Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    keyPatterns: [/^AIza/],
    keyHint: 'Get your key from <a href="https://aistudio.google.com/apikey" target="_blank">aistudio.google.com</a>',
    format: 'openai',
    detectPriority: 10
  },
  groq: {
    name: '⚡ Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    keyPatterns: [/^gsk_/],
    keyHint: 'Get your key from <a href="https://console.groq.com/keys" target="_blank">console.groq.com</a>',
    format: 'openai',
    detectPriority: 10
  },
  openrouter: {
    name: '🔀 OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'inclusionai/ring-2.6-1t:free',
    keyPatterns: [/^sk-or-/],
    keyHint: 'Get your key from <a href="https://openrouter.ai/keys" target="_blank">openrouter.ai</a>',
    format: 'openai',
    detectPriority: 10
  },
  deepseek: {
    name: '🔮 DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    keyPatterns: [/^sk-[a-f0-9]{32,48}$/],
    keyHint: 'Get your key from <a href="https://platform.deepseek.com/" target="_blank">platform.deepseek.com</a>',
    format: 'openai',
    detectPriority: 5
  },
  moonshot: {
    name: '🌙 Moonshot AI (Kimi)',
    baseUrl: 'https://api.moonshot.ai/v1',
    defaultModel: 'kimi-k2.6',
    keyHint: 'Get your key from <a href="https://platform.moonshot.ai" target="_blank">platform.moonshot.ai</a>',
    format: 'openai',
    detectPriority: 0
  },
  mistral: {
    name: '🌬️ Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-latest',
    keyHint: 'Get your key from <a href="https://console.mistral.ai/" target="_blank">console.mistral.ai</a>',
    format: 'openai',
    detectPriority: 0
  },
  together: {
    name: '🤝 Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    keyHint: 'Get your key from <a href="https://api.together.ai/" target="_blank">together.ai</a>',
    format: 'openai',
    detectPriority: 0
  },
  xai: {
    name: '✖️ xAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-3',
    keyPatterns: [/^xai-/],
    keyHint: 'Get your key from <a href="https://console.x.ai/" target="_blank">console.x.ai</a>',
    format: 'openai',
    detectPriority: 10
  },
  custom: {
    name: '⚙️ Custom Provider',
    baseUrl: '',
    defaultModel: '',
    keyHint: 'Enter the API key for your custom OpenAI-compatible provider',
    format: 'openai',
    detectPriority: 0
  }
};

const DEFAULTS = {
  apiKey: '',
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'inclusionai/ring-2.6-1t:free',
  maxTokens: 4096,
  customInstructions: '',
  defaultMode: 'general',
  defaultIntensity: 'medium',
  provider: 'openrouter',
  providerFormat: 'openai'
};

let originalValues = {};
let hasChanges = false;
let fetchedModels = [];
let detectDebounceTimer = null;

// ─── Initialize ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  initListeners();
  loadDataStats();
});

// ─── Load Settings ───────────────────────────────────────────────────────────

async function loadSettings() {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULTS));
  const settings = { ...DEFAULTS, ...stored };

  $('#provider').value = settings.provider || 'openrouter';
  $('#apiKey').value = settings.apiKey;
  $('#baseUrl').value = settings.baseUrl;
  $('#model').value = settings.model;
  $('#maxTokens').value = settings.maxTokens;
  $('#customInstructions').value = settings.customInstructions;
  $('#defaultMode').value = settings.defaultMode;
  $('#defaultIntensity').value = settings.defaultIntensity;

  // Update provider hint
  const providerConfig = PROVIDERS[$('#provider').value];
  if (providerConfig && providerConfig.keyHint) {
    $('#apiKeyHint').innerHTML = providerConfig.keyHint;
  }

  // If we have an API key, try to fetch models
  if (settings.apiKey) {
    updateDetectionStatus('saved', `Provider: ${PROVIDERS[settings.provider]?.name || settings.provider}`);
    fetchAndPopulateModels(settings.baseUrl, settings.apiKey, settings.provider, settings.model);
  }

  originalValues = { ...settings };
}

// ─── Auto-detect Provider from API Key ───────────────────────────────────────

function detectProvider(apiKey) {
  if (!apiKey || apiKey.length < 5) return null;

  let bestMatch = null;
  let bestPriority = -1;

  for (const [id, config] of Object.entries(PROVIDERS)) {
    if (!config.keyPatterns) continue;
    for (const pattern of config.keyPatterns) {
      if (pattern.test(apiKey) && config.detectPriority > bestPriority) {
        bestMatch = id;
        bestPriority = config.detectPriority;
      }
    }
  }

  return bestMatch;
}

// ─── Fetch Models from Provider ──────────────────────────────────────────────

async function fetchModelsFromAPI(baseUrl, apiKey, providerId) {
  const providerConfig = PROVIDERS[providerId];

  // Anthropic doesn't have a standard models listing endpoint
  if (providerId === 'anthropic' && providerConfig.hardcodedModels) {
    return providerConfig.hardcodedModels.map(id => ({ id, name: id }));
  }

  const url = `${baseUrl.replace(/\/+$/, '')}/models`;

  const headers = {};

  // Anthropic uses x-api-key, others use Bearer
  if (providerConfig?.format === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch models (HTTP ${response.status})`);
  }

  const data = await response.json();

  // OpenAI-compatible format: { data: [...] }
  if (data.data && Array.isArray(data.data)) {
    return data.data
      .map(m => ({
        id: m.id,
        name: m.name || m.id,
        owned_by: m.owned_by || '',
        created: m.created || 0
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  // Some providers return a plain array
  if (Array.isArray(data)) {
    return data
      .map(m => ({
        id: typeof m === 'string' ? m : (m.id || m.name),
        name: typeof m === 'string' ? m : (m.name || m.id)
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  // Gemini format: { models: [...] }
  if (data.models && Array.isArray(data.models)) {
    return data.models
      .map(m => ({
        id: m.name?.replace('models/', '') || m.id,
        name: m.displayName || m.name || m.id
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  return [];
}

// ─── Populate Model Dropdown ─────────────────────────────────────────────────

async function fetchAndPopulateModels(baseUrl, apiKey, providerId, selectedModel = '') {
  const modelSelect = $('#model');
  const modelStatus = $('#modelStatus');
  const fetchBtn = $('#fetchModels');

  // Show loading state
  fetchBtn.disabled = true;
  fetchBtn.classList.add('spinning');
  modelStatus.innerHTML = '<span class="status-loading">⏳ Fetching models...</span>';
  modelSelect.disabled = true;

  try {
    const models = await fetchModelsFromAPI(baseUrl, apiKey, providerId);
    fetchedModels = models;

    // Clear and populate the select
    modelSelect.innerHTML = '';

    if (models.length === 0) {
      modelSelect.innerHTML = '<option value="">No models found</option>';
      modelStatus.innerHTML = '<span class="status-error">No models found. Check your API key and provider.</span>';
    } else {
      // Add a placeholder
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = `-- Select a model (${models.length} available) --`;
      placeholder.disabled = true;
      modelSelect.appendChild(placeholder);

      // Add all models
      models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.id;
        if (m.owned_by) opt.textContent += ` (${m.owned_by})`;
        modelSelect.appendChild(opt);
      });

      // Try to select the previously selected model, or the default
      const defaultModel = selectedModel || PROVIDERS[providerId]?.defaultModel || '';
      if (defaultModel && models.some(m => m.id === defaultModel)) {
        modelSelect.value = defaultModel;
      } else if (models.length > 0) {
        // Select the default for this provider, or first model
        const providerDefault = PROVIDERS[providerId]?.defaultModel;
        if (providerDefault && models.some(m => m.id === providerDefault)) {
          modelSelect.value = providerDefault;
        } else {
          modelSelect.value = models[0].id;
        }
      }

      modelStatus.innerHTML = `<span class="status-success">✅ ${models.length} models loaded</span>`;
    }
  } catch (error) {
    console.error('Error fetching models:', error);
    modelStatus.innerHTML = `<span class="status-error">❌ ${escapeHtml(error.message)}</span>`;

    // Fall back: keep current value or set default
    if (modelSelect.options.length === 0) {
      const providerDefault = PROVIDERS[providerId]?.defaultModel || '';
      modelSelect.innerHTML = `<option value="${providerDefault}">${providerDefault || 'Enter model manually'}</option>`;
      if (selectedModel) {
        const opt = document.createElement('option');
        opt.value = selectedModel;
        opt.textContent = selectedModel;
        opt.selected = true;
        modelSelect.appendChild(opt);
      }
    }
  } finally {
    modelSelect.disabled = false;
    fetchBtn.disabled = false;
    fetchBtn.classList.remove('spinning');
    checkForChanges();
  }
}

// ─── Update Detection Status ─────────────────────────────────────────────────

function updateDetectionStatus(type, message) {
  const statusEl = $('#detectionStatus');
  if (!statusEl) return;

  statusEl.className = `detection-status detection-${type}`;
  statusEl.innerHTML = message;
  statusEl.style.display = message ? 'flex' : 'none';
}

// ─── Handle API Key Change (auto-detect) ─────────────────────────────────────

function onApiKeyInput() {
  clearTimeout(detectDebounceTimer);

  const apiKey = $('#apiKey').value.trim();

  if (!apiKey || apiKey.length < 5) {
    updateDetectionStatus('', '');
    return;
  }

  updateDetectionStatus('detecting', '🔍 Detecting provider...');

  detectDebounceTimer = setTimeout(() => {
    const detectedProvider = detectProvider(apiKey);

    if (detectedProvider) {
      const config = PROVIDERS[detectedProvider];

      // Auto-fill provider, base URL
      $('#provider').value = detectedProvider;
      $('#baseUrl').value = config.baseUrl;
      if (config.keyHint) $('#apiKeyHint').innerHTML = config.keyHint;

      updateDetectionStatus('success', `✅ Detected: <strong>${config.name}</strong>`);

      // Auto-fetch models
      fetchAndPopulateModels(config.baseUrl, apiKey, detectedProvider);
    } else {
      updateDetectionStatus('info', '🔧 Could not auto-detect provider. Please select manually, then click "Fetch Models".');
    }

    checkForChanges();
  }, 800);
}

// ─── Listeners ───────────────────────────────────────────────────────────────

function initListeners() {
  // Track changes on all form inputs
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('input', checkForChanges);
    input.addEventListener('change', checkForChanges);
  });

  // API key input — auto-detect provider
  $('#apiKey').addEventListener('input', onApiKeyInput);
  $('#apiKey').addEventListener('paste', () => {
    // Small delay to let paste complete
    setTimeout(onApiKeyInput, 50);
  });

  // Provider selector — auto-fill base URL and update hints
  $('#provider').addEventListener('change', () => {
    const providerId = $('#provider').value;
    const provider = PROVIDERS[providerId];
    if (provider) {
      if (provider.baseUrl) $('#baseUrl').value = provider.baseUrl;
      if (provider.keyHint) $('#apiKeyHint').innerHTML = provider.keyHint;
    }

    // If we have an API key, auto-fetch models for the new provider
    const apiKey = $('#apiKey').value.trim();
    if (apiKey && provider.baseUrl) {
      fetchAndPopulateModels(provider.baseUrl, apiKey, providerId);
    }

    checkForChanges();
  });

  // Fetch models button
  $('#fetchModels').addEventListener('click', () => {
    const apiKey = $('#apiKey').value.trim();
    const baseUrl = $('#baseUrl').value.trim();
    const providerId = $('#provider').value;

    if (!apiKey) {
      showToast('Please enter an API key first', 'error');
      return;
    }
    if (!baseUrl) {
      showToast('Please set a Base URL first', 'error');
      return;
    }

    fetchAndPopulateModels(baseUrl, apiKey, providerId);
  });

  // Model filter input
  $('#modelFilter').addEventListener('input', () => {
    filterModels($('#modelFilter').value);
  });

  // Toggle API key visibility
  $('#toggleApiKey').addEventListener('click', () => {
    const apiKeyInput = $('#apiKey');
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });

  // Save
  $('#saveBtn').addEventListener('click', saveSettings);

  // Test connection
  $('#testConnection').addEventListener('click', testConnection);

  // Export data
  $('#exportData').addEventListener('click', exportAllData);

  // Clear all data
  $('#clearAllData').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear ALL data? This includes history, favorites, and settings. This cannot be undone.')) {
      await chrome.storage.local.clear();
      await loadSettings();
      loadDataStats();
      showToast('All data cleared', 'success');
    }
  });
}

// ─── Filter Models ───────────────────────────────────────────────────────────

function filterModels(query) {
  const modelSelect = $('#model');
  const options = modelSelect.querySelectorAll('option');
  const q = query.toLowerCase().trim();

  options.forEach(opt => {
    if (opt.disabled) {
      // Keep the placeholder visible
      opt.style.display = '';
      return;
    }
    if (!q || opt.value.toLowerCase().includes(q) || opt.textContent.toLowerCase().includes(q)) {
      opt.style.display = '';
    } else {
      opt.style.display = 'none';
    }
  });
}

// ─── Check Changes ───────────────────────────────────────────────────────────

function checkForChanges() {
  const current = getCurrentValues();
  hasChanges = Object.keys(DEFAULTS).some(key => {
    if (key === 'providerFormat') return false; // derived value
    return String(current[key]) !== String(originalValues[key]);
  });

  const saveBar = $('#saveBar');
  if (hasChanges) {
    saveBar.classList.add('visible');
  } else {
    saveBar.classList.remove('visible');
  }
}

function getCurrentValues() {
  const providerId = $('#provider').value;
  const providerConfig = PROVIDERS[providerId];
  return {
    apiKey: $('#apiKey').value,
    baseUrl: $('#baseUrl').value || DEFAULTS.baseUrl,
    model: $('#model').value || DEFAULTS.model,
    maxTokens: parseInt($('#maxTokens').value) || DEFAULTS.maxTokens,
    customInstructions: $('#customInstructions').value,
    defaultMode: $('#defaultMode').value,
    defaultIntensity: $('#defaultIntensity').value,
    provider: providerId,
    providerFormat: providerConfig?.format || 'openai'
  };
}

// ─── Save Settings ───────────────────────────────────────────────────────────

async function saveSettings() {
  const values = getCurrentValues();

  // Validate
  if (!values.apiKey) {
    showToast('Please enter an API key', 'error');
    return;
  }

  if (!values.model) {
    showToast('Please select a model', 'error');
    return;
  }

  if (values.maxTokens < 256 || values.maxTokens > 32000) {
    showToast('Max tokens must be between 256 and 32000', 'error');
    return;
  }

  await chrome.storage.local.set(values);
  originalValues = { ...values };
  hasChanges = false;
  $('#saveBar').classList.remove('visible');
  showToast('Settings saved! ✨', 'success');
}

// ─── Test Connection ─────────────────────────────────────────────────────────

async function testConnection() {
  const testBtn = $('#testConnection');
  const testResult = $('#testResult');
  const apiKey = $('#apiKey').value;
  const baseUrl = ($('#baseUrl').value || DEFAULTS.baseUrl).replace(/\/+$/, '');
  const model = $('#model').value || DEFAULTS.model;
  const providerId = $('#provider').value;
  const providerConfig = PROVIDERS[providerId];

  if (!apiKey) {
    testResult.innerHTML = '❌ <span style="color:#ef4444">Please enter an API key first</span>';
    return;
  }

  testBtn.disabled = true;
  testBtn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.6s linear infinite;display:inline-block"></div> Testing...';
  testResult.innerHTML = '';

  try {
    let chatResponse;

    if (providerConfig?.format === 'anthropic') {
      // Anthropic uses different API format
      chatResponse = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Say "OK"' }]
        })
      });
    } else {
      // OpenAI-compatible
      chatResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Say "OK"' }],
          max_tokens: 10
        })
      });
    }

    if (chatResponse.ok) {
      testResult.innerHTML = '✅ <span style="color:#22c55e"><strong>Connection successful!</strong> API key is valid and model is accessible.</span>';
    } else {
      const errText = await chatResponse.text();
      testResult.innerHTML = `❌ <span style="color:#ef4444">Error (${chatResponse.status}): ${escapeHtml(errText.substring(0, 200))}</span>`;
    }
  } catch (error) {
    testResult.innerHTML = `❌ <span style="color:#ef4444">Network error: ${escapeHtml(error.message)}. Check the Base URL.</span>`;
  } finally {
    testBtn.disabled = false;
    testBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Test Connection`;
  }
}

// ─── Data Stats ──────────────────────────────────────────────────────────────

async function loadDataStats() {
  const { history = [], favorites = [] } = await chrome.storage.local.get(['history', 'favorites']);

  $('#historyCount').textContent = history.length;
  $('#favoritesCount').textContent = favorites.length;

  // Estimate storage used
  const bytesUsed = await chrome.storage.local.getBytesInUse();
  const kb = (bytesUsed / 1024).toFixed(1);
  $('#storageUsed').textContent = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

// ─── Export Data ─────────────────────────────────────────────────────────────

async function exportAllData() {
  const data = await chrome.storage.local.get(null);
  // Remove the API key from export for security
  const exportData = { ...data };
  delete exportData.apiKey;
  exportData.exportedAt = new Date().toISOString();

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prompt-enhancer-export-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported!', 'success');
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = '') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
