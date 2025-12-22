// Sound System (Procedural / Web Audio API)

const SoundManager = {
    ctx: null,
    masterGain: null,
    ambientOsc: null,
    isInitialized: false,

    init: () => {
        if (SoundManager.isInitialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            SoundManager.ctx = new AudioContext();
            SoundManager.masterGain = SoundManager.ctx.createGain();
            SoundManager.masterGain.gain.value = 0.3; // Master Volume
            SoundManager.masterGain.connect(SoundManager.ctx.destination);

            SoundManager.startAmbience();
            SoundManager.isInitialized = true;
            console.log("Audio System Initialized");
        } catch (e) {
            console.error("Audio Init Failed", e);
        }
    },

    startAmbience: () => {
        // Minimal/Silent Ambience - Removed Engine Drone
        // Could play subtle wind or AC hum if requested, but user asked for silence/music.
        // For now, we leave this empty or play a very quiet placeholder if needed.
        console.log("Ambience started (Silent)");
    },

    playClick: () => {
        if (!SoundManager.ctx) return;

        // High-tech "Sonar Ping"
        const osc = SoundManager.ctx.createOscillator();
        const gain = SoundManager.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, SoundManager.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, SoundManager.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.5, SoundManager.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, SoundManager.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(SoundManager.masterGain);

        osc.start();
        osc.stop(SoundManager.ctx.currentTime + 0.2);
    },

    playHover: () => {
        if (!SoundManager.ctx) return;

        // Subtle "Tick"
        const osc = SoundManager.ctx.createOscillator();
        const gain = SoundManager.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2000, SoundManager.ctx.currentTime);

        gain.gain.setValueAtTime(0.05, SoundManager.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, SoundManager.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(SoundManager.masterGain);

        osc.start();
        osc.stop(SoundManager.ctx.currentTime + 0.05);
    }
};

export default SoundManager;
