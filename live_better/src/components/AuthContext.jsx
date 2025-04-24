import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [emailPreferences, setEmailPreferences] = useState({
    aqiAlerts: true,
    weeklyReports: false
  });
  const [userPreferences, setUserPreferences] = useState({
    refreshInterval: 300000, // 5 minutes default
    aqiAlertThreshold: 4,   // Default threshold for alerts (AQI >= 4)
  });

  // Load saved data on initial render
  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    const emailPrefs = localStorage.getItem('emailPreferences');
    const userPrefs = localStorage.getItem('userPreferences');
    
    if (user) setCurrentUser(JSON.parse(user));
    if (emailPrefs) setEmailPreferences(JSON.parse(emailPrefs));
    if (userPrefs) setUserPreferences(JSON.parse(userPrefs));
  }, []);

  const register = async (username, password, email) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.some(u => u.username === username)) {
      throw new Error('Username already exists');
    }

    const newUser = { username, password, email };
    localStorage.setItem('users', JSON.stringify([...users, newUser]));
    await login(username, password);
    
    // Set default preferences for new users
    localStorage.setItem('emailPreferences', JSON.stringify({
      aqiAlerts: true,
      weeklyReports: false
    }));
    localStorage.setItem('userPreferences', JSON.stringify({
      refreshInterval: 300000,
      aqiAlertThreshold: 4
    }));
    setEmailPreferences({
      aqiAlerts: true,
      weeklyReports: false
    });
    setUserPreferences({
      refreshInterval: 300000,
      aqiAlertThreshold: 4
    });
  };

  const login = (username, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) throw new Error('Invalid credentials');
    
    const userData = {
      username: user.username,
      email: user.email
    };
    
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setCurrentUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  const updateEmailPreferences = (newPreferences) => {
    const updatedPrefs = { ...emailPreferences, ...newPreferences };
    localStorage.setItem('emailPreferences', JSON.stringify(updatedPrefs));
    setEmailPreferences(updatedPrefs);
  };

  const updateUserPreferences = (newPreferences) => {
    const updatedPrefs = { ...userPreferences, ...newPreferences };
    localStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));
    setUserPreferences(updatedPrefs);
  };

  const triggerEmailAlert = async (location, aqiLevel) => {
    console.log("[triggerEmailAlert] Called with", {
      email: currentUser?.email,
      aqiAlerts: emailPreferences.aqiAlerts,
      threshold: userPreferences.aqiAlertThreshold,
      level: aqiLevel
    });
    if (!currentUser?.email || !emailPreferences.aqiAlerts || aqiLevel <= userPreferences.aqiAlertThreshold) return;
    console.log("triggerEmailAlert", location, aqiLevel);
    try {
      const response = await fetch('api/send-aqi-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          locationName: location.name,
          aqi: aqiLevel,
          threshold: userPreferences.aqiAlertThreshold,
          coordinates: location.coords,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send alert');
      }
      return true;
    } catch (error) {
      console.error('Email alert failed:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      register,
      login,
      logout,
      emailPreferences,
      updateEmailPreferences,
      userPreferences,
      updateUserPreferences,
      triggerEmailAlert
    }}>
      {children}
    </AuthContext.Provider>
  );
};