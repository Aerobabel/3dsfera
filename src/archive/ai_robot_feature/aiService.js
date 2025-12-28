import axios from 'axios';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

// Default Voice ID (Bella - Soft & Professional, or similar pre-made)
// Feel free to change to a specific ID if the user provides one.
// '21m00Tcm4TlvDq8ikWAM' is "Rachel"
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export const generateAIResponse = async (userMessage, context = "") => {
    if (!OPENAI_API_KEY) {
        console.warn("OpenAI API Key is missing.");
        return "I'm sorry, my language circuits are offline. Please check your API keys.";
    }

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o', // Or gpt-3.5-turbo if 4o is not available to the key
                messages: [
                    {
                        role: 'system',
                        content: `You are SFERA-BOT, a helpful and slightly witty AI guide for the 3DSFERA Virtual Exhibition. 
                        Your goal is to assist visitors in navigating the pavilion, explaining products, and answering questions about the company.
                        Keep your responses concise (under 2-3 sentences) as you are a real-time voice assistant.
                        Context about the scene: ${context}`
                    },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 150,
                temperature: 0.7,
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return "I'm having trouble connecting to the neural network.";
    }
};

export const generateSpeech = async (text) => {
    if (!ELEVENLABS_API_KEY) {
        console.warn("ElevenLabs API Key is missing.");
        return null; // Silent fail or handle otherwise
    }

    try {
        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
            {
                text: text,
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                }
            },
            {
                headers: {
                    'xi-api-key': ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json',
                },
                responseType: 'arraybuffer' // Important for audio data
            }
        );

        // Convert arraybuffer to blob URL
        const blob = new Blob([response.data], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        return url;

    } catch (error) {
        console.error("ElevenLabs API Error:", error);
        return null;
    }
};
