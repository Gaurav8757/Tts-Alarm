import { useState, useRef } from 'react';
import { FaUpload, FaPlay, FaStop, FaTimes } from 'react-icons/fa';
import AudioTrimmer from '../utils/AudioTrimmer';
import '../styles/audioUploader.css';

const AudioUploader = ({ onAudioSelect, onCancel, initialAudio = null }) => {
  const [audio, setAudio] = useState(initialAudio || null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [trimming, setTrimming] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const MAX_DURATION = 30;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setTrimming(true);

    try {
      // Check file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
      if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
        throw new Error('Please upload an audio file (MP3, WAV, OGG, M4A)');
      }

      // Trim audio
      const trimmedAudio = await AudioTrimmer.trimAudio(file, MAX_DURATION);
      
      setAudio({
        url: trimmedAudio.url,
        blob: trimmedAudio.blob,
        duration: trimmedAudio.duration,
        originalDuration: trimmedAudio.originalDuration,
        wasTrimmed: trimmedAudio.wasTrimmed,
      });

      setTrimStart(0);
      setTrimEnd(trimmedAudio.duration);
    } catch (err) {
      setError(err.message || 'Failed to process audio file');
      setAudio(null);
    } finally {
      setTrimming(false);
    }
  };

  const handlePlayPause = () => {
    if (!audio?.url) return;

    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      audioRef.current?.play();
      setPlaying(true);
    }
  };

  const handleConfirmTrim = async () => {
    if (!audio?.blob) return;

    try {
      setTrimming(true);
      
      // Create new trimmed file from selected range
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await audio.blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const sampleRate = audioContext.sampleRate;
      const startSample = Math.floor(trimStart * sampleRate);
      const endSample = Math.floor(trimEnd * sampleRate);

      const trimmedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        endSample - startSample,
        sampleRate
      );

      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        const sourceData = audioBuffer.getChannelData(i);
        const trimmedData = trimmedBuffer.getChannelData(i);
        trimmedData.set(sourceData.slice(startSample, endSample));
      }

      const wav = AudioTrimmer.bufferToWav(trimmedBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      const finalAudio = {
        url,
        blob,
        duration: trimEnd - trimStart,
        originalDuration: audio.originalDuration,
        wasTrimmed: true,
      };

      onAudioSelect?.(finalAudio);
      setTrimming(false);
    } catch (err) {
      setError('Failed to trim audio: ' + err.message);
      setTrimming(false);
    }
  };

  const handleClear = () => {
    setAudio(null);
    setError('');
    setTrimStart(0);
    setTrimEnd(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancel = () => {
    handleClear();
    onCancel?.();
  };

  const handleAudioEnd = () => {
    setPlaying(false);
  };

  return (
    <div className="audio-uploader">
      <div className="audio-uploader-header">
        <h4>Select Alarm Sound</h4>
        <button className="close-btn" onClick={handleCancel} title="Close">
          <FaTimes />
        </button>
      </div>

      {!audio ? (
        <div className="audio-upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            disabled={trimming}
            style={{ display: 'none' }}
          />
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={trimming}
          >
            <FaUpload />
            {trimming ? 'Processing...' : 'Choose Audio File'}
          </button>
          <p className="upload-hint">
            MP3, WAV, OGG, M4A • Max 30 seconds
          </p>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <div className="audio-preview">
          <div className="audio-info">
            <p className="duration-label">
              Duration: {AudioTrimmer.formatDuration(audio.duration)}
              {audio.wasTrimmed && <span className="trimmed-badge">Trimmed</span>}
            </p>
            {audio.originalDuration > MAX_DURATION && (
              <p className="warning">
                Original: {AudioTrimmer.formatDuration(audio.originalDuration)} 
                (trimmed to {MAX_DURATION}s)
              </p>
            )}
          </div>

          <audio
            ref={audioRef}
            src={audio.url}
            onEnded={handleAudioEnd}
            style={{ display: 'none' }}
          />

          <div className="audio-controls">
            <button
              className="play-btn"
              onClick={handlePlayPause}
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? <FaStop /> : <FaPlay />}
              {playing ? 'Pause' : 'Play'}
            </button>
          </div>

          <div className="trim-section">
            <p className="trim-label">Trim Audio (0-30 seconds)</p>
            <div className="trim-inputs">
              <div className="trim-input-group">
                <label>Start (s)</label>
                <input
                  type="number"
                  min="0"
                  max={audio.duration - 0.1}
                  step="0.1"
                  value={trimStart.toFixed(1)}
                  onChange={(e) => setTrimStart(Math.max(0, Math.min(parseFloat(e.target.value) || 0, trimEnd - 0.1)))}
                />
              </div>
              <div className="trim-input-group">
                <label>End (s)</label>
                <input
                  type="number"
                  min={trimStart + 0.1}
                  max={audio.duration}
                  step="0.1"
                  value={trimEnd.toFixed(1)}
                  onChange={(e) => setTrimEnd(Math.min(audio.duration, Math.max(parseFloat(e.target.value) || audio.duration, trimStart + 0.1)))}
                />
              </div>
              <div className="trim-info">
                {(trimEnd - trimStart).toFixed(1)}s selected
              </div>
            </div>
          </div>

          <div className="audio-actions">
            <button
              className="confirm-btn"
              onClick={handleConfirmTrim}
              disabled={trimming}
            >
              {trimming ? 'Processing...' : 'Use This Sound'}
            </button>
            <button
              className="change-btn"
              onClick={handleClear}
              disabled={trimming}
            >
              Change Audio
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default AudioUploader;
