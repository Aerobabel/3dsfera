import { ConvaiClient } from 'convai-web-sdk';

export class ConvaiManager {
    constructor(apiKey, characterId) {
        console.log(`Convai: Init. Key Length: ${apiKey?.length}, CharID Length: ${characterId?.length}`);

        this.client = new ConvaiClient({
            apiKey: apiKey,
            characterId: characterId,
            enableAudio: true,
            disableAudioGeneration: false,
            enableFacialData: true, // REQUIRED for Visemes
            faceModel: 3, // 3 = OVR LipSync (Visemes)
        });

        console.log("Convai: Initializing Client with Character ID:", characterId);

        this.client.setResponseCallback((response) => {
            // console.log("Convai: Raw Response Received", response); 

            if (response.hasUserQuery()) {
                const transcript = response.getUserQuery();
                if (transcript.getIsFinal()) {
                    console.log('Convai: User Query Final:', transcript.getTextData());
                }
            }
            if (response.hasAudioResponse()) {
                const audioResponse = response.getAudioResponse();

                // Audio Data
                // if (audioResponse) console.log("Convai: Audio Chunk");

                // Viseme Data Extract
                if (audioResponse && audioResponse.getVisemesData) {
                    const visemeData = audioResponse.getVisemesData();
                    if (visemeData && this.onFaceCallback) {
                        this.onFaceCallback(visemeData);
                    }
                } else if (audioResponse && audioResponse.getVisorVisemes) {
                    const visorData = audioResponse.getVisorVisemes();
                    if (visorData && this.onFaceCallback) {
                        this.onFaceCallback(visorData);
                    }
                }
            }
        });

        this.client.setErrorCallback((code, message) => {
            console.error(`Convai SDK Error: ${code} - ${message}`);
        });

        // Audio Playback State Callbacks
        this.client.onAudioPlay(() => {
            console.log("Convai: Audio Started Playing");
            if (this.onTalkingStateChange) this.onTalkingStateChange(true);
        });

        this.client.onAudioStop(() => {
            console.log("Convai: Audio Stopped Playing");
            if (this.onTalkingStateChange) this.onTalkingStateChange(false);
        });

        this.isRecording = false;
        this.onTalkingStateChange = null;
        this.onFaceCallback = null;

        console.log("ConvaiManager: v3 (Viseme Configured) Loaded");
    }

    setTalkingCallback(callback) {
        this.onTalkingStateChange = callback;
    }

    setFaceDataCallback(callback) {
        this.onFaceCallback = callback;
    }

    sendText(text) {
        console.log("Convai: Sending Debug Text:", text);
        this.client.sendTextChunk(text);
    }

    async startListening() {
        if (this.isRecording) return;

        console.log("Convai: Requesting Microphone...");
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("Convai: Microphone Permission Granted.");
        } catch (err) {
            console.error("Convai: Microphone Permission DENIED.", err);
            return;
        }

        // Resume AudioContext if needed (Browser Autoplay Policy)
        /* 
           Note: The standard SDK *should* handle this, but if the context is initialized 
           before user interaction, it might be suspended. 
           We attempt to access the internal audio player context if exposed, 
           or just rely on the user interaction (click/keydown) that triggered this 
           to be sufficient for the browser.
        */

        console.log("Convai: Start Recording (SDK)...");
        try {
            this.client.startAudioChunk();
            this.isRecording = true;
        } catch (error) {
            console.error("Convai Error (Local):", error);
        }
    }

    stopListening() {
        if (!this.isRecording) return;
        console.log("Convai: Stop Recording & Processing...");
        try {
            this.client.endAudioChunk();
            this.isRecording = false;
        } catch (error) {
            console.error("Convai Error:", error);
        }
    }

    toggleListening() {
        if (this.isRecording) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    reset() {
        this.client.resetSession();
    }
}
