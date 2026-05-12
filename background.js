// ─── Background Service Worker ───────────────────────────────────────────────
// Handles API calls, context menus, and keyboard shortcuts

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'enhance-selected-text',
    title: '⚡ Enhance Selected Text',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'analyze-selected-text',
    title: '🔍 Analyze Selected Prompt',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'enhance-selected-text') {
    const enhanced = await enhancePrompt(info.selectionText, 'general', 'medium');
    chrome.tabs.sendMessage(tab.id, {
      type: 'REPLACE_SELECTION',
      text: enhanced
    });
  } else if (info.menuItemId === 'analyze-selected-text') {
    const analysis = await analyzePrompt(info.selectionText);
    chrome.tabs.sendMessage(tab.id, {
      type: 'SHOW_ANALYSIS',
      analysis
    });
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'enhance-prompt') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_ENHANCE' });
  }
});

// Message handler for popup and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ENHANCE') {
    enhancePrompt(message.prompt, message.mode, message.intensity, message.customInstructions)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async
  }

  if (message.type === 'ANALYZE') {
    analyzePrompt(message.prompt)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'GENERATE_VARIANTS') {
    generateVariants(message.prompt, message.mode, message.count)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// ─── API Functions ───────────────────────────────────────────────────────────

async function getSettings() {
  const defaults = {
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'inclusionai/ring-2.6-1t:free',
    customInstructions: '',
    maxTokens: 4096,
    provider: 'openrouter',
    providerFormat: 'openai'
  };
  const stored = await chrome.storage.local.get(Object.keys(defaults));
  return { ...defaults, ...stored };
}

async function callAPI(systemPrompt, userPrompt) {
  const settings = await getSettings();
  if (!settings.apiKey) {
    throw new Error('API key not set. Please configure it in the extension settings.');
  }

  // Route to the appropriate API format
  if (settings.providerFormat === 'anthropic') {
    return await callAnthropicAPI(settings, systemPrompt, userPrompt);
  }

  return await callOpenAIAPI(settings, systemPrompt, userPrompt);
}

async function callOpenAIAPI(settings, systemPrompt, userPrompt) {
  const response = await fetch(`${settings.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: settings.maxTokens,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function callAnthropicAPI(settings, systemPrompt, userPrompt) {
  const response = await fetch(`${settings.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: settings.model,
      max_tokens: settings.maxTokens,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error (${response.status}): ${err}`);
  }

  const data = await response.json();
  // Anthropic returns content as an array of content blocks
  if (data.content && Array.isArray(data.content)) {
    return data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
      .trim();
  }
  return data.content?.text?.trim() || '';
}

// ─── Enhancement System Prompts ──────────────────────────────────────────────

const SYSTEM_PROMPTS = {
  general: `You are a world-class prompt engineer. Your task is to enhance the given prompt to make it dramatically more effective for AI language models.

Rules:
- Add specific context, constraints, and desired output format
- Include role assignment if beneficial
- Add relevant examples or edge cases
- Specify tone, style, and length expectations
- Maintain the original intent while amplifying clarity
- Structure with clear sections if the prompt is complex
- ONLY return the enhanced prompt, no explanations or meta-commentary`,

  coding: `You are an expert programming prompt engineer. Transform the given prompt into an optimal code generation instruction.

Rules:
- Specify programming language, version, and paradigm
- Define input/output formats with examples
- Include error handling and edge case requirements
- Add performance and scalability considerations
- Specify testing requirements and code style
- Mention relevant frameworks, libraries, or patterns
- Include security considerations where relevant
- ONLY return the enhanced prompt, no explanations`,

  creative: `You are a creative writing prompt specialist. Transform the given prompt into an inspiring, detailed creative brief.

Rules:
- Add vivid sensory details and atmosphere
- Specify narrative perspective and voice
- Include emotional tone and thematic depth
- Define character complexity and motivation
- Add world-building elements and setting details
- Specify pacing, structure, and length
- Include stylistic influences if relevant
- ONLY return the enhanced prompt, no explanations`,

  research: `You are a research prompt specialist. Transform the given prompt into a comprehensive analytical instruction.

Rules:
- Define scope, boundaries, and research questions
- Specify required methodological approach
- Add analytical framework and evaluation criteria
- Include comparison and contrast requirements
- Specify citation style and source requirements
- Define depth of analysis and evidence standards
- Add structured output format requirements
- ONLY return the enhanced prompt, no explanations`,

  image: `You are an AI image generation prompt specialist (for DALL-E, Midjourney, Stable Diffusion, etc). Transform the given prompt into a detailed visual description.

Rules:
- Add visual style, artistic medium, and aesthetic
- Specify lighting, atmosphere, and mood
- Include composition, framing, and perspective
- Add color palette and tonal qualities
- Specify level of detail and realism
- Include technical parameters (aspect ratio, quality level)
- Reference artistic styles or photographers if relevant
- ONLY return the enhanced prompt, no explanations`,

  custom: `You are an expert prompt engineer. Enhance the given prompt according to the user's custom instructions below.

ONLY return the enhanced prompt, no explanations or meta-commentary.`
};

const INTENSITY_INSTRUCTIONS = {
  light: '\n\nINTENSITY: LIGHT — Make minimal, surgical improvements. Keep the original structure and wording mostly intact. Focus on clarity and removing ambiguity.',
  medium: '\n\nINTENSITY: MEDIUM — Moderately rewrite and expand the prompt. Add meaningful detail, structure, and context while preserving the core intent.',
  heavy: '\n\nINTENSITY: HEAVY — Completely transform this into a comprehensive, expertly-crafted prompt. Add extensive detail, structure, examples, constraints, and output formatting. Make it as thorough as possible.'
};

async function enhancePrompt(prompt, mode = 'general', intensity = 'medium', customInstructions = '') {
  let systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.general;
  systemPrompt += INTENSITY_INSTRUCTIONS[intensity] || INTENSITY_INSTRUCTIONS.medium;

  if (mode === 'custom' && customInstructions) {
    systemPrompt += `\n\nCustom Instructions: ${customInstructions}`;
  }

  const settings = await getSettings();
  if (settings.customInstructions && mode !== 'custom') {
    systemPrompt += `\n\nAdditional user preferences: ${settings.customInstructions}`;
  }

  return await callAPI(systemPrompt, `Enhance this prompt:\n\n${prompt}`);
}

async function analyzePrompt(prompt) {
  const systemPrompt = `You are a prompt analysis expert. Analyze the given prompt and return a JSON object with the following structure:
{
  "scores": {
    "clarity": <0-100>,
    "specificity": <0-100>,
    "context": <0-100>,
    "structure": <0-100>,
    "effectiveness": <0-100>
  },
  "overall": <0-100>,
  "strengths": ["<strength1>", "<strength2>"],
  "weaknesses": ["<weakness1>", "<weakness2>"],
  "suggestions": ["<suggestion1>", "<suggestion2>"],
  "category": "<detected category: general/coding/creative/research/image>"
}

Return ONLY valid JSON, no markdown formatting or code blocks.`;

  const result = await callAPI(systemPrompt, prompt);
  try {
    return JSON.parse(result);
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Failed to parse analysis result');
  }
}

async function generateVariants(prompt, mode = 'general', count = 3) {
  const systemPrompt = `You are a world-class prompt engineer. Generate exactly ${count} different enhanced versions of the given prompt. Each variant should take a distinctly different approach or angle while maintaining the original intent.

Return ONLY a JSON array of strings, each being one enhanced variant. No markdown, no code blocks, just the JSON array.

Example format: ["variant 1 text", "variant 2 text", "variant 3 text"]`;

  const result = await callAPI(systemPrompt, prompt);
  try {
    return JSON.parse(result);
  } catch {
    const arrMatch = result.match(/\[[\s\S]*\]/);
    if (arrMatch) return JSON.parse(arrMatch[0]);
    return [result];
  }
}
