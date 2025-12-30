import { useEffect, useState } from 'react';
import { useSpeechSynthesis } from 'react-speech-kit';
import { FaPlus, FaToggleOn, FaToggleOff, FaTrash, FaEllipsisV, FaEdit, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { FaX } from 'react-icons/fa6';
import AlarmManager from '../utils/AlarmManager';
import TimePicker from './TimePicker';
import AudioUploader from './AudioUploader';
import { SystemSounds } from '../utils/SoundGenerator';

const Alarm = () => {
  const [alarms, setAlarms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAudioUpload, setShowAudioUpload] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [formData, setFormData] = useState({
    hours: 9,
    minutes: 0,
    label: 'Alarm',
    message: 'Wake up!',
    sound: Object.values(SystemSounds)[0],
    repeat: 'never',
    customAudio: null,
    language: 'en-IN',
    messageRepeat: 1,
  });
  const [menuOpen, setMenuOpen] = useState(null);

  const { speak, cancel, speaking } = useSpeechSynthesis();

  useEffect(() => {
    const loaded = AlarmManager.getAll();
    setAlarms(loaded);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check alarms every second (for second-level precision)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      alarms.forEach((alarm) => {
        if (!alarm.enabled) return;

        const matches =
          now.getHours() === alarm.hours && 
          now.getMinutes() === alarm.minutes && 
          now.getSeconds() === 0;

        if (matches) {
          triggerAlarm(alarm);
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [alarms]);

  const triggerAlarm = (alarm) => {
    // Play custom audio or system sound
    if (alarm.customAudio?.url) {
      try {
        const audio = new Audio(alarm.customAudio.url);
        audio.play().catch(e => console.log('Audio play error:', e));
      } catch (e) {
        console.log('Custom audio error:', e);
      }
    } else if (alarm.sound?.generator) {
      try {
        alarm.sound.generator();
      } catch (e) {
        console.log('Sound error:', e);
      }
    }

    // Speak message with repetition and language
    const messageRepeatCount = alarm.messageRepeat || 1;
    const language = alarm.language || 'en-IN';
    
    for (let i = 0; i < messageRepeatCount; i++) {
      setTimeout(() => {
        speak({
          text: alarm.message,
          rate: 0.9,
          pitch: 1.1,
          lang: language,
        });
      }, i * 3000); // 3 second delay between repetitions
    }

    // Notification
    if (Notification.permission === 'granted') {
      new Notification(alarm.label, { body: alarm.message });
    }

    // Disable if one-time
    if (alarm.repeat === 'never') {
      AlarmManager.update(alarm.id, { enabled: false });
      setAlarms(AlarmManager.getAll());
    }
  };

  const handleSaveAlarm = (e) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing alarm
      AlarmManager.update(editingId, formData);
      setEditingId(null);
      speak({ text: `Alarm updated for ${String(formData.hours).padStart(2, '0')}:${String(formData.minutes).padStart(2, '0')}` });
    } else {
      // Add new alarm
      AlarmManager.add(formData);
      speak({ text: `Alarm set for ${String(formData.hours).padStart(2, '0')}:${String(formData.minutes).padStart(2, '0')}` });
    }
    
    setAlarms(AlarmManager.getAll());
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      hours: 9,
      minutes: 0,
      label: 'Alarm',
      message: 'Wake up!',
      sound: Object.values(SystemSounds)[0],
      repeat: 'never',
      customAudio: null,
      language: 'en-IN',
      messageRepeat: 1,
    });
    setShowAudioUpload(false);
  };

  const handleEditAlarm = (alarm) => {
    setFormData({
      hours: alarm.hours,
      minutes: alarm.minutes,
      label: alarm.label,
      message: alarm.message,
      sound: alarm.sound || Object.values(SystemSounds)[0],
      repeat: alarm.repeat,
      customAudio: alarm.customAudio || null,
      language: alarm.language || 'en-IN',
      messageRepeat: alarm.messageRepeat || 1,
    });
    setEditingId(alarm.id);
    setShowForm(true);
    setMenuOpen(null);
  };

  const handleTimeSelect = (time) => {
    setFormData({ ...formData, ...time });
  };

  const handleToggle = (id) => {
    AlarmManager.toggle(id);
    setAlarms(AlarmManager.getAll());
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this alarm?')) {
      AlarmManager.delete(id);
      setAlarms(AlarmManager.getAll());
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleSelectAlarm = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setSelectAllChecked(newSelected.size === alarms.length);
  };

  const handleSelectAll = () => {
    if (selectAllChecked) {
      setSelectedIds(new Set());
      setSelectAllChecked(false);
    } else {
      const allIds = new Set(alarms.map(a => a.id));
      setSelectedIds(allIds);
      setSelectAllChecked(true);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedIds.size) return;
    if (window.confirm(`Delete ${selectedIds.size} alarm${selectedIds.size > 1 ? 's' : ''}?`)) {
      AlarmManager.deleteMultiple(Array.from(selectedIds));
      setAlarms(AlarmManager.getAll());
      setSelectedIds(new Set());
      setSelectAllChecked(false);
    }
  };

  const handleBatchToggle = (enable) => {
    if (!selectedIds.size) return;
    const newAlarms = alarms.map(alarm =>
      selectedIds.has(alarm.id) ? { ...alarm, enabled: enable } : alarm
    );
    newAlarms.forEach(alarm => {
      AlarmManager.update(alarm.id, { enabled: alarm.enabled });
    });
    setAlarms(AlarmManager.getAll());
    setSelectedIds(new Set());
    setSelectAllChecked(false);
  };

  const handleAudioSelect = (audio) => {
    setFormData({ ...formData, customAudio: audio });
    setShowAudioUpload(false);
    speak({ text: 'Audio selected' });
  };

  const handleRemoveCustomAudio = () => {
    setFormData({ ...formData, customAudio: null });
  };

  return (
    <div className="alarm-app">
      {/* Header */}
      <div className="alarm-header">
        <h1>Alarms</h1>
        <button 
          className="btn-add" 
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          title={showForm ? 'Close form' : 'Add new alarm'}
        >
          <FaPlus /> New
        </button>
      </div>

      {/* Add/Edit Alarm Form */}
      {showForm && (
        <div className="alarm-form">
          <div className="form-header">
            <h3>{editingId ? 'Edit Alarm' : 'New Alarm'}</h3>
            <button 
              className="form-close-btn"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              title="Close"
            >
              <FaX />
            </button>
          </div>

          <div className="form-group">
            <label>Time</label>
            <TimePicker onTimeSelect={handleTimeSelect} initialTime={formData} />
          </div>

          <div className="form-group">
            <label>Label</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Alarm"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="What should I say?"
              className="form-input"
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>Sound</label>
            <div className="sound-selector">
              <select
                value={formData.sound?.id || ''}
                onChange={(e) => {
                  const sound = Object.values(SystemSounds).find(
                    (s) => s.id === e.target.value
                  );
                  setFormData({ ...formData, sound });
                }}
                className="form-input"
              >
                {Object.values(SystemSounds).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-upload-audio"
                onClick={() => setShowAudioUpload(!showAudioUpload)}
              >
                📁 Upload Audio
              </button>
            </div>
            {formData.customAudio && (
              <div className="custom-audio-badge">
                ✓ Custom audio selected ({formData.customAudio.duration?.toFixed(1)}s)
                <button
                  type="button"
                  className="remove-audio-btn"
                  onClick={handleRemoveCustomAudio}
                  title="Remove custom audio"
                >
                  <FaX />
                </button>
              </div>
            )}
          </div>

          {showAudioUpload && (
            <AudioUploader
              onAudioSelect={handleAudioSelect}
              onCancel={() => setShowAudioUpload(false)}
              initialAudio={formData.customAudio}
            />
          )}

          <div className="form-group">
            <label>Voice Language</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="form-input"
            >
              <option value="en-IN">English (Indian)</option>
              <option value="hi-IN">Hindi</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="form-group">
            <label>Message Repeat Count</label>
            <input
              type="number"
              min="1"
              max="5"
              value={formData.messageRepeat}
              onChange={(e) => setFormData({ ...formData, messageRepeat: parseInt(e.target.value) || 1 })}
              className="form-input"
            />
            <small style={{ display: 'block', marginTop: '5px', color: '#999' }}>
              Message will repeat {formData.messageRepeat} time{formData.messageRepeat !== 1 ? 's' : ''} (3s between each)
            </small>
          </div>

          <div className="form-group">
            <label>Repeat</label>
            <select
              value={formData.repeat}
              onChange={(e) => setFormData({ ...formData, repeat: e.target.value })}
              className="form-input"
            >
              <option value="never">Never</option>
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekends">Weekends</option>
            </select>
          </div>

          <div className="form-actions">
            <button 
              className="btn-cancel" 
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancel
            </button>
            <button className="btn-save" onClick={handleSaveAlarm}>
              {editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Batch Actions */}
      {selectedIds.size > 0 && (
        <div className="batch-actions">
          <span className="batch-info">{selectedIds.size} selected</span>
          <button className="batch-btn resume-btn" onClick={() => handleBatchToggle(true)}>
            ▶ Resume
          </button>
          <button className="batch-btn stop-btn" onClick={() => handleBatchToggle(false)}>
            ⏸ Stop
          </button>
          <button className="batch-btn delete-btn" onClick={handleDeleteSelected}>
            <FaTrash /> Delete
          </button>
        </div>
      )}

      {/* Alarms List */}
      <div className="alarms-list">
        {alarms.length === 0 ? (
          <div className="empty-state">
            <p>No alarms set</p>
          </div>
        ) : (
          <>
            {alarms.length > 1 && (
              <div className="select-all-container">
                <button
                  className="select-all-btn"
                  onClick={handleSelectAll}
                  title={selectAllChecked ? 'Deselect all' : 'Select all'}
                >
                  {selectAllChecked ? <FaCheckSquare /> : <FaSquare />}
                  {selectAllChecked ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            )}
            {alarms.map((alarm) => (
              <div key={alarm.id} className={`alarm-item ${!alarm.enabled ? 'disabled' : ''}`}>
                <button
                  className="select-checkbox"
                  onClick={() => handleSelectAlarm(alarm.id)}
                  title={selectedIds.has(alarm.id) ? 'Deselect' : 'Select'}
                >
                  {selectedIds.has(alarm.id) ? <FaCheckSquare /> : <FaSquare />}
                </button>

                <div className="alarm-time">
                  <div className="time">
                    {String(alarm.hours).padStart(2, '0')}:{String(alarm.minutes).padStart(2, '0')}
                  </div>
                  <div className="label">{alarm.label}</div>
                  {alarm.customAudio && <div className="audio-badge">🎵 Custom</div>}
                </div>

                <div className="alarm-controls">
                  <button
                    className="toggle-btn"
                    onClick={() => handleToggle(alarm.id)}
                    title={alarm.enabled ? 'Turn off' : 'Turn on'}
                  >
                    {alarm.enabled ? <FaToggleOn /> : <FaToggleOff />}
                  </button>

                  <div className="menu-container">
                    <button
                      className="menu-btn"
                      onClick={() => setMenuOpen(menuOpen === alarm.id ? null : alarm.id)}
                      title="More options"
                    >
                      <FaEllipsisV />
                    </button>
                    {menuOpen === alarm.id && (
                      <div className="menu-dropdown">
                        <button 
                          onClick={() => handleEditAlarm(alarm)} 
                          className="menu-item edit"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(alarm.id)} 
                          className="menu-item delete"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Voice Indicator */}
      {speaking && (
        <div className="voice-indicator">
          <span>🔊 Speaking...</span>
          <button onClick={cancel} className="btn-stop">
            Stop
          </button>
        </div>
      )}
    </div>
  );
};

export default Alarm;
