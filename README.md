# ⚡ Prompt Enhancer

> AI-powered Chrome extension for unlimited prompt enhancement. Works with **any AI provider** — OpenAI, Anthropic, Gemini, Groq, OpenRouter, DeepSeek, Mistral, Together AI, xAI & more.

Just paste your API key — the provider and available models are detected automatically.

![Floating Panel injected into Chat](docs/floating-panel.png)

---

## ✨ Features

### Core Enhancement
- **6 Enhancement Modes** — General, Coding, Creative, Research, Image Generation, Custom
- **3 Intensity Levels** — Light (minor tweaks), Medium (balanced), Heavy (complete rewrite)
- **Multiple Variants** — Generate up to 3 different enhanced versions
- **Prompt Analysis** — Score your prompt on clarity, specificity, context, structure & effectiveness

### Multi-Provider Support
- **11 providers** supported out of the box:
  | Provider | Key Prefix | Auto-Detect |
  |----------|-----------|:-----------:|
  | OpenAI | `sk-proj-...` / `sk-...` | ✅ |
  | Anthropic (Claude) | `sk-ant-...` | ✅ |
  | Google Gemini | `AIza...` | ✅ |
  | Groq | `gsk_...` | ✅ |
  | OpenRouter | `sk-or-...` | ✅ |
  | xAI (Grok) | `xai-...` | ✅ |
  | DeepSeek | `sk-...` (hex) | ⚡ |
  | Moonshot AI (Kimi) | — | Manual |
  | Mistral AI | — | Manual |
  | Together AI | — | Manual |
  | Custom | — | Manual |

- **Auto-detect provider** from API key pattern
- **Auto-fetch models** from the provider's API — no need to type model names
- **Searchable model dropdown** with filter to find the right model quickly

![Settings Page with Auto-Detect](docs/settings.png)

### Platform Integration
- **Floating ⚡ Icon** — Compact icon on ChatGPT, Claude, Gemini, DeepSeek & Kimi that expands into a full panel
- **Right-Click Enhancement** — Select text anywhere → right-click → Enhance
- **Keyboard Shortcut** — `Ctrl+Shift+E` to enhance instantly

### Productivity
- **12+ Templates** — Pre-built prompts for common tasks
- **Full History** — Search, reuse, and manage past enhancements
- **Favorites** — Star your best prompts
- **Export/Import** — Backup your data as JSON
- **Re-enhance** — Iteratively improve results

### Design
- **Theme Support** — Auto (System), Light, or Dark mode
- Premium aesthetic with glassmorphism
- Smooth micro-animations
- Neon purple/cyan accents
- Compact floating icon UI (not a bar)

---

## 🚀 Installation

### 1. Get an API Key

Pick **any** supported provider:

| Provider | Get Key At |
|----------|-----------|
| OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Anthropic | [console.anthropic.com](https://console.anthropic.com/) |
| Google Gemini | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Groq (free tier) | [console.groq.com/keys](https://console.groq.com/keys) |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) |
| DeepSeek | [platform.deepseek.com](https://platform.deepseek.com/) |
| xAI | [console.x.ai](https://console.x.ai/) |
| Moonshot AI | [platform.moonshot.ai](https://platform.moonshot.ai) |
| Mistral AI | [console.mistral.ai](https://console.mistral.ai/) |
| Together AI | [api.together.ai](https://api.together.ai/) |

### 2. Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `Prompt Enhancer` folder
5. The ⚡ icon will appear in your extensions bar

### 3. Configure
1. Click the ⚡ extension icon → ⚙️ Settings
2. **Paste your API key** — the provider is auto-detected
3. Available models are fetched automatically — **pick one from the dropdown**
4. (Optional) Adjust max tokens and custom instructions
5. Click **Save Settings**

> **Tip:** If auto-detection doesn't work for your key, manually select the provider from the dropdown and click the 🔄 button to fetch models.

---

## 📁 Project Structure

```
Prompt Enhancer/
├── manifest.json        # Extension manifest (MV3)
├── background.js        # Service worker — API calls, context menus, multi-provider routing
├── popup.html/css/js    # Main extension popup UI
├── content.js/css       # Floating icon + panel injected into AI chat platforms
├── options.html/css/js  # Settings page with auto-detection & model fetching
├── preview.html         # Enhancement preview page
└── icons/               # Extension icons (16, 48, 128px)
```

---

## 🎯 Usage

### From the Popup
1. Click the ⚡ extension icon
2. Select an enhancement mode (General, Coding, Creative, etc.)
3. Type or paste your prompt
4. Choose intensity and number of variants
5. Click **Enhance Prompt**
6. Copy, Insert into chat, or Save the result

![Main Extension Popup](docs/popup.png)

### From AI Chat Platforms
- Visit ChatGPT, Claude, Gemini, DeepSeek, or Kimi
- A floating ⚡ icon appears near the chat input
- Click it to open the enhancement panel
- Select mode & intensity, then click **Enhance**
- Your prompt gets enhanced in-place!

### Right-Click Menu
- Select any text on a webpage
- Right-click → **⚡ Enhance Selected Text**

### Keyboard Shortcut
- Press `Ctrl+Shift+E` (or `Cmd+Shift+E` on Mac) while in any supported AI chat

---

## 🔧 Configuration Options

### API Settings
| Setting | Default | Description |
|---------|---------|-------------|
| API Key | — | Your provider's API key (auto-detects provider) |
| Provider | Auto-detected | OpenAI, Anthropic, Gemini, Groq, OpenRouter, etc. |
| Base URL | Per provider | API endpoint (auto-filled) |
| Model | Per provider | Fetched from API — pick from dropdown |
| Max Tokens | `4096` | Max response length (256–32,000) |

### Preferences
| Setting | Default | Description |
|---------|---------|-------------|
| Theme | `Auto (System)` | UI Appearance. Can be set to Light or Dark manually. |
| Default Mode | `General` | The default AI enhancement approach. |
| Default Intensity| `Medium` | The default prompt rewrite level. |

### Provider API Formats
- **OpenAI-compatible** (OpenAI, Gemini, Groq, OpenRouter, DeepSeek, Moonshot, Mistral, Together, xAI) — Uses `/chat/completions` with `Bearer` token
- **Anthropic** — Uses `/messages` endpoint with `x-api-key` header and Anthropic-specific response format

---

## 📄 License

MIT License — Use freely, enhance infinitely! ⚡
