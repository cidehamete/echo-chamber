# Aphorism Echo

A minimal, voice-controlled AI conversation switcher that lets you interact with four different AI personalities through simple button presses. Each bot has its own unique voice and personality, responding with brief, aphoristic-style responses.

## Features

- **Four AI Personalities**: Each button triggers a different AI bot with unique system prompts
- **Voice Recording**: Tap a button to start recording, tap again to stop and process
- **Voice Synthesis**: Each bot responds with a different ElevenLabs voice
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **Configurable Settings**: Customize system prompts, voices, and AI parameters
- **Local Storage**: Settings are saved locally in your browser

## Setup

### 1. Get API Keys

You'll need two API keys:

**OpenAI API Key:**
- Visit [OpenAI Platform](https://platform.openai.com/api-keys)
- Create a new API key
- The app uses GPT-4o by default (can be changed in settings)

**ElevenLabs API Key:**
- Visit [ElevenLabs](https://elevenlabs.io/)
- Sign up and get your API key
- Find voice IDs in your ElevenLabs dashboard

### 2. Run the Application

1. Download all files to a local directory
2. Open `index.html` in a modern web browser
3. Click the settings button (⚙️) to configure your API keys
4. Enter your OpenAI and ElevenLabs API keys
5. Add ElevenLabs voice IDs for each bot
6. Save settings

### 3. Configure Voice IDs

For each bot, you need to specify an ElevenLabs voice ID:

1. Go to your ElevenLabs dashboard
2. Find the voice you want to use
3. Copy the voice ID (found in the voice settings)
4. Paste it into the corresponding bot configuration

## Usage

1. **Start Recording**: Tap any numbered button (1-4) to begin recording your voice
2. **Stop Recording**: Tap the same button again to stop recording and process your request
3. **Listen to Response**: The AI will generate a response and play it back using the configured voice
4. **Switch Bots**: Each button corresponds to a different AI personality

## Default Bot Personalities

- **Bot 1**: Wise philosopher - responds with profound aphorisms
- **Bot 2**: Creative poet - responds with evocative verses
- **Bot 3**: Life coach - responds with practical advice
- **Bot 4**: Comedian - responds with witty one-liners

## Settings

Access settings by clicking the ⚙️ button. You can configure:

- **API Keys**: OpenAI and ElevenLabs credentials
- **OpenAI Model**: Choose between GPT-4o, GPT-4, or GPT-3.5 Turbo
- **Temperature**: Controls response creativity (0.0-2.0)
- **Max Tokens**: Maximum response length (50-500)
- **System Prompts**: Customize each bot's personality
- **Voice IDs**: Assign different ElevenLabs voices to each bot

## Browser Compatibility

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Requirements**: HTTPS required for microphone access (or localhost)

## File Structure

```
Aphorism Echo/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── app.js             # JavaScript application logic
└── README.md          # This file
```

## Troubleshooting

**Microphone Access Denied:**
- Ensure you're using HTTPS or localhost
- Check browser permissions for microphone access
- Try refreshing the page

**API Errors:**
- Verify your API keys are correct
- Check your OpenAI and ElevenLabs account status
- Ensure you have sufficient credits/quota

**Voice Not Playing:**
- Verify ElevenLabs voice IDs are correct
- Check your ElevenLabs account has available characters
- Ensure audio is not muted in your browser

## Privacy

- All audio processing happens through OpenAI and ElevenLabs APIs
- No audio is stored locally beyond the current session
- Settings are stored locally in your browser's localStorage
- No data is sent to any servers other than OpenAI and ElevenLabs

## Development

To modify the application:

1. Edit `app.js` for functionality changes
2. Edit `styles.css` for visual modifications
3. Edit `index.html` for structure changes
4. Settings are stored in browser localStorage under 'aphorismEchoSettings'

## License

This project is open source and available under the MIT License. 