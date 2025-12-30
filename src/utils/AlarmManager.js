/**
 * AlarmManager - Minimal localStorage operations for alarms
 */

const STORAGE_KEY = 'alarms';

export const AlarmManager = {
  getAll: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading alarms:', e);
      return [];
    }
  },

  save: (alarms) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
    } catch (e) {
      console.error('Error saving alarms:', e);
    }
  },

  add: (alarm) => {
    const alarms = AlarmManager.getAll();
    const newAlarm = {
      ...alarm,
      id: Date.now().toString(),
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    alarms.push(newAlarm);
    AlarmManager.save(alarms);
    return newAlarm;
  },

  update: (id, updates) => {
    const alarms = AlarmManager.getAll();
    const idx = alarms.findIndex((a) => a.id === id);
    if (idx !== -1) {
      alarms[idx] = { ...alarms[idx], ...updates };
      AlarmManager.save(alarms);
    }
    return alarms[idx] || null;
  },

  delete: (id) => {
    const alarms = AlarmManager.getAll().filter((a) => a.id !== id);
    AlarmManager.save(alarms);
  },

  deleteMultiple: (ids) => {
    const alarms = AlarmManager.getAll().filter((a) => !ids.includes(a.id));
    AlarmManager.save(alarms);
  },

  toggle: (id) => {
    const alarms = AlarmManager.getAll();
    const alarm = alarms.find((a) => a.id === id);
    if (alarm) {
      alarm.enabled = !alarm.enabled;
      AlarmManager.save(alarms);
    }
    return alarm;
  },
};

export default AlarmManager;

