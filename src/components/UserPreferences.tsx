import React, { useState } from 'react';

export default function UserPreferences() {
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="user-preferences">
      <h2>User Preferences</h2>
      <label>
        Language:
        <select value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
      </label>
      <label>
        Theme:
        <select value={theme} onChange={e => setTheme(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <label>
        <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} />
        Enable Notifications
      </label>
    </div>
  );
}
