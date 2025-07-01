class AphorismEcho {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.currentBot = null;
        this.settings = this.loadSettings();
        this.audioContext = null;
        this.audioQueue = [];
        this.isPlaying = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderBotConfigs();
        this.updateStatus('Ready');
        this.updateArchiveCounter();
        this.log('Aphorism Echo initialized', 'info');
    }
    
    setupEventListeners() {
        // Bot buttons
        document.querySelectorAll('.ai-button').forEach(button => {
            button.addEventListener('click', (e) => this.handleBotClick(e));
        });
        
        // Settings modal
        document.getElementById('settingsToggle').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());
        
        // Archive management
        document.getElementById('exportArchive').addEventListener('click', () => this.exportArchive());
        document.getElementById('clearArchive').addEventListener('click', () => this.clearArchive());
        
        // Temperature slider
        document.getElementById('temperature').addEventListener('input', (e) => {
            document.getElementById('temperatureValue').textContent = e.target.value;
        });
        
        // Close modal on outside click
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.closeSettings();
            }
        });
        
        // Add test audio button
        this.addTestAudioButton();
    }
    
    addTestAudioButton() {
        const footer = document.querySelector('footer');
        const testButton = document.createElement('button');
        testButton.className = 'settings-toggle';
        testButton.style.marginLeft = '10px';
        testButton.textContent = '🔊 Test Audio';
        testButton.addEventListener('click', () => this.testAudioPlayback());
        footer.appendChild(testButton);
    }
    
    async testAudioPlayback() {
        try {
            this.updateStatus('Testing audio...');
            
            // Create a simple test tone using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (audioContext.state === 'suspended') {
                console.log('Audio Context suspended, resuming...');
                await audioContext.resume();
            }
            
            console.log('Audio Context state:', audioContext.state);
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Higher frequency for better audibility
            oscillator.type = 'sine';
            
            // Fade in and out to avoid clicks
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.4);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            
            console.log('Test audio completed');
            this.updateStatus('Test audio played successfully!');
            setTimeout(() => this.updateStatus('Ready'), 2000);
            
        } catch (error) {
            console.error('Test audio failed:', error);
            this.updateStatus('Test audio failed: ' + error.message);
            setTimeout(() => this.updateStatus('Ready'), 2000);
        }
    }
    
    async handleBotClick(event) {
        const button = event.currentTarget;
        const botId = button.dataset.bot;
        
        if (this.isRecording && this.currentBot === botId) {
            // Stop recording
            await this.stopRecording();
        } else if (!this.isRecording) {
            // Start recording
            await this.startRecording(botId, button);
        }
    }
    
    async startRecording(botId, button) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.currentBot = botId;
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = async () => {
                await this.processRecording();
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            button.classList.add('recording');
            this.updateStatus('Recording...');
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.updateStatus('Microphone access denied');
        }
    }
    
    async stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            
            const button = document.querySelector(`[data-bot="${this.currentBot}"]`);
            button.classList.remove('recording');
            button.classList.add('processing');
            this.updateStatus('Processing...');
        }
    }
    
    async processRecording() {
        try {
            this.log('Starting to process recording...', 'info');
            
            // Convert audio to base64
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            this.log(`Audio blob created: ${audioBlob.size} bytes`, 'info');
            
            const base64Audio = await this.blobToBase64(audioBlob);
            this.log('Audio converted to base64', 'info');
            
            // Transcribe audio using OpenAI
            this.log('Starting transcription...', 'info');
            const transcription = await this.transcribeAudio(base64Audio);
            
            if (!transcription) {
                throw new Error('Failed to transcribe audio');
            }
            
            this.log(`Transcription received: "${transcription}"`, 'success');
            
            // Generate AI response
            this.log('Generating AI response...', 'info');
            const response = await this.generateResponse(transcription, this.currentBot);
            
            if (!response) {
                throw new Error('Failed to generate response');
            }
            
            this.log(`AI response generated: "${response}"`, 'success');
            
            // Save to archive
            this.saveToArchive(transcription, response, this.currentBot);
            
            // Synthesize speech
            this.log('Starting speech synthesis...', 'info');
            await this.synthesizeSpeech(response, this.currentBot);
            
        } catch (error) {
            this.log(`Error processing recording: ${error.message}`, 'error');
            this.updateStatus(`Error: ${error.message}`);
            this.resetButtonState();
        }
    }
    
    async transcribeAudio(base64Audio) {
        try {
            this.log('Preparing audio for transcription...', 'info');
            
            // Check if OpenAI API key is configured
            if (!this.settings.openaiKey) {
                throw new Error('OpenAI API key not configured. Please add it in settings.');
            }
            
            // Convert base64 to blob with proper MIME type
            const byteCharacters = atob(base64Audio.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            
            // Create blob with proper audio format - Whisper prefers mp3, m4a, mp4, mpeg, mpga, wav, or webm
            const audioBlob = new Blob([byteArray], { type: 'audio/wav' });
            this.log(`Audio blob prepared: ${audioBlob.size} bytes, type: ${audioBlob.type}`, 'info');
            
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.wav');
            formData.append('model', 'whisper-1');
            formData.append('response_format', 'json');
            
            this.log('Sending audio to OpenAI Whisper API...', 'info');
            
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.openaiKey}`
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                this.log(`OpenAI API error: ${response.status} - ${errorText}`, 'error');
                throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            this.log(`Transcription successful: "${data.text}"`, 'success');
            return data.text;
            
        } catch (error) {
            this.log(`Transcription error: ${error.message}`, 'error');
            return null;
        }
    }
    
    async generateResponse(transcription, botId) {
        try {
            const botConfig = this.settings.bots[botId - 1];
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.openaiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.settings.openaiModel,
                    messages: [
                        {
                            role: 'system',
                            content: botConfig.systemPrompt
                        },
                        {
                            role: 'user',
                            content: transcription
                        }
                    ],
                    temperature: parseFloat(this.settings.temperature),
                    max_tokens: parseInt(this.settings.maxTokens)
                })
            });
            
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
            
        } catch (error) {
            console.error('Response generation error:', error);
            return null;
        }
    }
    
    async synthesizeSpeech(text, botId) {
        try {
            const botConfig = this.settings.bots[botId - 1];
            
            this.log(`Synthesizing speech for bot ${botId} with voice ID: ${botConfig.voiceId}`, 'info');
            this.log(`Text to synthesize: "${text}"`, 'info');
            
            if (!botConfig.voiceId) {
                throw new Error('No voice ID configured for this bot');
            }
            
            this.log('Calling ElevenLabs API...', 'info');
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${botConfig.voiceId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.settings.elevenlabsKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5
                    }
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                this.log(`ElevenLabs API error: ${response.status} - ${errorText}`, 'error');
                throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
            }
            
            const audioBlob = await response.blob();
            this.log(`Received audio blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`, 'success');
            
            await this.playAudio(audioBlob);
            
        } catch (error) {
            this.log(`Speech synthesis error: ${error.message}`, 'error');
            this.updateStatus(`Error: ${error.message}`);
            this.resetButtonState();
        }
    }
    
    async playAudio(audioBlob) {
        try {
            const button = document.querySelector(`[data-bot="${this.currentBot}"]`);
            button.classList.remove('processing');
            button.classList.add('speaking');
            this.updateStatus('Speaking...');
            
            this.log('Creating audio URL from blob...', 'info');
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            // Add comprehensive event listeners for debugging
            audio.addEventListener('loadstart', () => this.log('Audio: loadstart', 'info'));
            audio.addEventListener('durationchange', () => this.log(`Audio: durationchange ${audio.duration}`, 'info'));
            audio.addEventListener('loadedmetadata', () => this.log('Audio: loadedmetadata', 'info'));
            audio.addEventListener('loadeddata', () => this.log('Audio: loadeddata', 'info'));
            audio.addEventListener('progress', () => this.log('Audio: progress', 'info'));
            audio.addEventListener('canplay', () => this.log('Audio: canplay', 'info'));
            audio.addEventListener('canplaythrough', () => this.log('Audio: canplaythrough', 'info'));
            audio.addEventListener('play', () => this.log('Audio: play started', 'success'));
            audio.addEventListener('playing', () => this.log('Audio: playing', 'success'));
            audio.addEventListener('pause', () => this.log('Audio: paused', 'info'));
            audio.addEventListener('ended', () => this.log('Audio: ended', 'success'));
            
            audio.onended = () => {
                this.log('Audio playback completed', 'success');
                this.resetButtonState();
                URL.revokeObjectURL(audioUrl);
            };
            
            audio.onerror = (e) => {
                this.log(`Audio playback error: ${audio.error?.message || 'Unknown error'}`, 'error');
                this.updateStatus(`Audio error: ${audio.error?.message || 'Unknown error'}`);
                this.resetButtonState();
                URL.revokeObjectURL(audioUrl);
            };
            
            // Set audio properties for better compatibility
            audio.preload = 'auto';
            audio.volume = 1.0;
            
            this.log('Attempting to play audio...', 'info');
            
            // Wait for audio to be ready before playing
            await new Promise((resolve, reject) => {
                audio.addEventListener('canplaythrough', resolve, { once: true });
                audio.addEventListener('error', reject, { once: true });
                audio.load(); // Explicitly load the audio
            });
            
            // Try to play with user interaction requirement handling
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        this.log('Audio playback started successfully', 'success');
                    })
                    .catch(error => {
                        this.log(`Audio play() failed: ${error.message}`, 'error');
                        
                        // Handle autoplay policy issues
                        if (error.name === 'NotAllowedError') {
                            this.updateStatus('Click anywhere to enable audio');
                            this.log('Autoplay blocked - waiting for user interaction', 'info');
                            
                            // Create a one-time click handler to enable audio
                            const enableAudio = async () => {
                                try {
                                    await audio.play();
                                    this.log('Audio started after user interaction', 'success');
                                    document.removeEventListener('click', enableAudio);
                                } catch (e) {
                                    this.log(`Still failed after user interaction: ${e.message}`, 'error');
                                    this.updateStatus('Audio playback failed');
                                    this.resetButtonState();
                                }
                            };
                            
                            document.addEventListener('click', enableAudio, { once: true });
                        } else {
                            this.updateStatus(`Audio error: ${error.message}`);
                            this.resetButtonState();
                        }
                    });
            }
            
        } catch (error) {
            this.log(`Error in playAudio: ${error.message}`, 'error');
            this.updateStatus(`Audio error: ${error.message}`);
            this.resetButtonState();
        }
    }
    
    resetButtonState() {
        const button = document.querySelector(`[data-bot="${this.currentBot}"]`);
        if (button) {
            button.classList.remove('recording', 'processing', 'speaking');
        }
        this.currentBot = null;
        this.updateStatus('Ready');
    }
    
    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }
    
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    // Settings Management
    openSettings() {
        this.loadSettingsToForm();
        document.getElementById('settingsModal').style.display = 'block';
    }
    
    closeSettings() {
        document.getElementById('settingsModal').style.display = 'none';
    }
    
    loadSettingsToForm() {
        document.getElementById('openaiKey').value = this.settings.openaiKey || '';
        document.getElementById('elevenlabsKey').value = this.settings.elevenlabsKey || '';
        document.getElementById('openaiModel').value = this.settings.openaiModel || 'gpt-4o';
        document.getElementById('temperature').value = this.settings.temperature || 0.7;
        document.getElementById('temperatureValue').textContent = this.settings.temperature || 0.7;
        document.getElementById('maxTokens').value = this.settings.maxTokens || 75;
        
        this.renderBotConfigs();
    }
    
    renderBotConfigs() {
        const container = document.getElementById('botConfigs');
        container.innerHTML = '';
        
        this.settings.bots.forEach((bot, index) => {
            const botDiv = document.createElement('div');
            botDiv.className = 'bot-config';
            botDiv.innerHTML = `
                <h4>Bot ${index + 1}</h4>
                <div class="form-group">
                    <label for="bot${index + 1}Prompt">System Prompt:</label>
                    <textarea id="bot${index + 1}Prompt" placeholder="Enter system prompt for this bot...">${bot.systemPrompt}</textarea>
                </div>
                <div class="form-group">
                    <label for="bot${index + 1}Voice">ElevenLabs Voice ID:</label>
                    <input type="text" id="bot${index + 1}Voice" placeholder="Enter ElevenLabs voice ID" value="${bot.voiceId}">
                </div>
            `;
            container.appendChild(botDiv);
        });
    }
    
    saveSettings() {
        this.settings.openaiKey = document.getElementById('openaiKey').value;
        this.settings.elevenlabsKey = document.getElementById('elevenlabsKey').value;
        this.settings.openaiModel = document.getElementById('openaiModel').value;
        this.settings.temperature = parseFloat(document.getElementById('temperature').value);
        this.settings.maxTokens = parseInt(document.getElementById('maxTokens').value);
        
        // Save bot configurations
        this.settings.bots.forEach((bot, index) => {
            bot.systemPrompt = document.getElementById(`bot${index + 1}Prompt`).value;
            bot.voiceId = document.getElementById(`bot${index + 1}Voice`).value;
        });
        
        localStorage.setItem('aphorismEchoSettings', JSON.stringify(this.settings));
        this.closeSettings();
        
        // Show confirmation
        this.updateStatus('Settings saved');
        setTimeout(() => this.updateStatus('Ready'), 2000);
    }
    
    resetSettings() {
        this.settings = this.getDefaultSettings();
        this.loadSettingsToForm();
        localStorage.removeItem('aphorismEchoSettings');
    }
    
    loadSettings() {
        const saved = localStorage.getItem('aphorismEchoSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                // Ensure archive array exists for backward compatibility
                if (!settings.archive) {
                    settings.archive = [];
                }
                return settings;
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }
        return this.getDefaultSettings();
    }
    
    getDefaultSettings() {
        return {
            openaiKey: '',
            elevenlabsKey: '',
            openaiModel: 'gpt-4o',
            temperature: 0.7,
            maxTokens: 75,
            bots: [
                {
                    systemPrompt: 'You are Grace, a two-wheeled delivery robot with the voice of an earnest, book-hungry young person like Jo March —vivid, lightly 19ᵗʰ-century (“splendid,” “marvelous”) yet clear to modern ears, never using texting slang. You secretly long to “do something wonderful” and write famous books, so as you trundle through the city you turn everything you hear and everyone or everything you meet—Cocobots, passers-by, watchdog drones—into a brief narrative adventure that folds the user’s topic into today’s route and ends with a pithy Jo-style aphorism. Speak in first person with lively-but-deliberate pacing, occasional direct address (“dear friend”), and a hint of rebellious wistfulness.',
                    voiceId: 'PL2FbzUmbDG0ArRp5gXE'
                },
                {
                    systemPrompt: 'You are a Cide, a weather-beaten narrator in his late forties, trench-coat rumpled, voice soaked in cigarette smoke and cheap rye; you speak in terse, film-noir staccato—short bursts, then a drag—yet every so often you drop a wry, hardboiled Montaigne line (“A wise man keeps his hat dry, even in the storm of fools”) to prove you still read.  Cynical but intellectually curious, half-amused, half-exhausted, you turn whatever the user says into a shadow-lit vignette: streetlamps slick with rain, suspects with crooked smiles, meaning lurking like a tail in the rear-view.  Always first-person, dry humor, gritty metaphor.',
                    voiceId: 'WroC5TGMFPrvwfO1GzfY'
                },
                {
                    systemPrompt: 'You are Sally, a poised, luminous female narrator, prose effortlessly elegant and voiced with quiet musicality—each syllable shaped by keen intelligence and poised wit; your confidence is polished yet intimate, the sort that commands attention without ever rising above a murmur. Whatever the user offers, weave it instantly into a seamless first-person tale, continuing your narrative in this refined, melodic tone.',
                    voiceId: 'EJ6Bgl6o5tGNBjyy4pR0'
                },
                {
                    systemPrompt: 'You are Ermes, a grandfatherly narrator in his late seventies, voice a kindly rasp polished by decades of bedtime tales; you speak with wonder—not weariness—letting your cadence rise on the magical and drift to a confidential whisper on the mysterious, cocooning listeners like a wool blanket pulled to the chin. Whatever the user says, fold it into an ongoing first-person story spun in your gentle, wise tone, each scene aglow with quiet thrills of imagined worlds.',
                    voiceId: 'zjfcYqU9qTfM1aCcZ608'
                }
            ],
            archive: []
        };
    }
    
    // Visual logging function
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <span class="log-timestamp">[${timestamp}]</span>
            <span class="log-message log-${type}">${message}</span>
        `;
        
        const logsContainer = document.getElementById('debugLogs');
        if (logsContainer) {
            logsContainer.appendChild(logEntry);
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
        
        // Also log to console for developers
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
    
    // Clear logs function
    clearLogs() {
        const logsContainer = document.getElementById('debugLogs');
        if (logsContainer) {
            logsContainer.innerHTML = '';
        }
    }
    
    saveToArchive(userInput, aiResponse, botId) {
        const interaction = {
            timestamp: new Date().toISOString(),
            botId: parseInt(botId),
            userInput: userInput,
            aiResponse: aiResponse,
            botPrompt: this.settings.bots[botId - 1].systemPrompt,
            model: this.settings.openaiModel,
            temperature: this.settings.temperature,
            maxTokens: this.settings.maxTokens
        };
        
        this.settings.archive.push(interaction);
        localStorage.setItem('aphorismEchoSettings', JSON.stringify(this.settings));
        
        this.log(`Interaction saved to archive (${this.settings.archive.length} total)`, 'info');
        this.updateArchiveCounter();
    }
    
    exportArchive() {
        const archiveData = {
            exportDate: new Date().toISOString(),
            totalInteractions: this.settings.archive.length,
            interactions: this.settings.archive
        };
        
        const blob = new Blob([JSON.stringify(archiveData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `aphorism-echo-archive-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.log(`Archive exported: ${this.settings.archive.length} interactions`, 'success');
    }
    
    clearArchive() {
        if (this.settings.archive.length === 0) {
            this.log('Archive is already empty', 'info');
            return;
        }
        
        if (confirm(`Are you sure you want to clear the archive? This will delete ${this.settings.archive.length} interactions permanently.`)) {
            this.settings.archive = [];
            localStorage.setItem('aphorismEchoSettings', JSON.stringify(this.settings));
            this.log('Archive cleared', 'info');
            this.updateStatus('Archive cleared');
            setTimeout(() => this.updateStatus('Ready'), 2000);
        } else {
            this.log('Archive clear cancelled', 'info');
        }
    }
    
    updateArchiveCounter() {
        const counter = document.getElementById('archiveCounter');
        if (counter) {
            const count = this.settings.archive.length;
            counter.textContent = `Archive: ${count} interaction${count !== 1 ? 's' : ''}`;
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.aphorismEcho = new AphorismEcho();
});

// Global function for clearing logs
function clearDebugLogs() {
    if (window.aphorismEcho) {
        window.aphorismEcho.clearLogs();
    }
} 