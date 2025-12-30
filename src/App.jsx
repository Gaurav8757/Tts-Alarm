import { useEffect } from 'react';
import Alarm from './components/Alarm';
import Clock from './Clock';
import './styles/main.css';

const App = () => {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="App">
      <Clock />
      <Alarm />
    </div>
  );
};

export default App;
