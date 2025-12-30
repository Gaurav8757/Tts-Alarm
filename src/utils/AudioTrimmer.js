/**
 * AudioTrimmer - Trim audio files to maximum 30 seconds
 */

export const AudioTrimmer = {
  // Trim audio file to specified duration (in seconds)
  trimAudio: async (audioFile, maxDuration = 30) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target.result;
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Calculate trim duration
            const originalDuration = audioBuffer.duration;
            const trimDuration = Math.min(originalDuration, maxDuration);
            
            // Create new audio context and buffer
            const trimmedContext = new (window.AudioContext || window.webkitAudioContext)();
            const trimmedBuffer = trimmedContext.createBuffer(
              audioBuffer.numberOfChannels,
              Math.floor(trimmedContext.sampleRate * trimDuration),
              trimmedContext.sampleRate
            );

            // Copy audio data
            for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
              const sourceData = audioBuffer.getChannelData(i);
              const trimmedData = trimmedBuffer.getChannelData(i);
              const samplesToCopy = Math.floor(
                trimmedContext.sampleRate * trimDuration
              );
              trimmedData.set(sourceData.slice(0, samplesToCopy));
            }

            // Convert to WAV
            const wav = AudioTrimmer.bufferToWav(trimmedBuffer);
            const blob = new Blob([wav], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);

            resolve({
              url,
              duration: trimDuration,
              originalDuration,
              blob,
              wasTrimmed: originalDuration > maxDuration,
            });
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(audioFile);
      });
    } catch (error) {
      console.error('Audio trim error:', error);
      throw error;
    }
  },

  // Convert AudioBuffer to WAV format
  bufferToWav: (audioBuffer) => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const channelData = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channelData.push(audioBuffer.getChannelData(i));
    }

    const frameLength = audioBuffer.length;
    const dataLength = frameLength * numberOfChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const writeFloat = (offset, input) => {
      let s = Math.max(-1, Math.min(1, input)) < 0 ? 0x8000 : 0;
      s |= (Math.abs(input) * 0xffff) ^ 0xffff;
      view.setInt16(offset, s, true);
    };

    // WAV header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');

    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < frameLength; i++) {
      for (let j = 0; j < numberOfChannels; j++) {
        writeFloat(offset, channelData[j][i]);
        offset += bytesPerSample;
      }
    }

    return buffer;
  },

  // Format duration to readable string
  formatDuration: (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  },
};

export default AudioTrimmer;
