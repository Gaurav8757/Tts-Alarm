import { useState } from 'react';
import { FaClock, FaTimes } from 'react-icons/fa';

const TimePicker = ({ onTimeSelect, initialTime = { hours: 9, minutes: 0 } }) => {
  const [showModal, setShowModal] = useState(false);
  const [hours, setHours] = useState(initialTime.hours);
  const [minutes, setMinutes] = useState(initialTime.minutes);

  const handleConfirm = () => {
    onTimeSelect({ hours: parseInt(hours), minutes: parseInt(minutes) });
    setShowModal(false);
  };

  const handleHourChange = (e) => {
    setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)));
  };

  const handleMinuteChange = (e) => {
    setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)));
  };

  return (
    <div className="time-picker-wrapper">
      <button className="time-display" onClick={() => setShowModal(true)}>
        <FaClock />
        <span>{String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}</span>
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-center" onClick={(e) => e.stopPropagation()}>
            <div className="time-picker-modal">
              <div className="modal-header">
                <h3>Set Time</h3>
                <button className="close-btn" onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="time-inputs">
                <div className="time-input-group">
                  <label>Hour</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={handleHourChange}
                    className="time-input"
                  />
                </div>
                <div className="separator">:</div>
                <div className="time-input-group">
                  <label>Minute</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={handleMinuteChange}
                    className="time-input"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="btn-confirm" onClick={handleConfirm}>
                  Set
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
