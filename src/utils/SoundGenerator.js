/**
 * Sound Generator - Creates audio tones dynamically
 */

export const generateTone = (frequency = 800, duration = 500) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration / 1000);
};

export const SystemSounds = {
  bell: {
    id: 'bell',
    name: 'Bell',
    generate: () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;

      for (let i = 0; i < 3; i++) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.frequency.value = 800 + i * 100;
        gain.gain.setValueAtTime(0.3, now + i * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.3);

        osc.start(now + i * 0.3);
        osc.stop(now + i * 0.3 + 0.3);
      }
    },
  },

  chirp: {
    id: 'chirp',
    name: 'Chirp',
    generate: () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;

      for (let i = 0; i < 4; i++) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.frequency.setValueAtTime(600, now + i * 0.15);
        osc.frequency.linearRampToValueAtTime(1200, now + i * 0.15 + 0.15);
        gain.gain.setValueAtTime(0.3, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.15);

        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.15);
      }
    },
  },

  digital: {
    id: 'digital',
    name: 'Digital',
    generate: () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;

      const freqs = [700, 900, 700, 900];
      freqs.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.frequency.value = freq;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.2, now + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.2);

        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.2);
      });
    },
  },

  buzz: {
    id: 'buzz',
    name: 'Buzzer',
    generate: () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;

      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.value = 400;
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1);

      osc.start(now);
      osc.stop(now + 1);
    },
  },
};

export default { generateTone, SystemSounds };
