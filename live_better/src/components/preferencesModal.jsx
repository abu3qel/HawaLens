import React, { useState, useContext } from 'react';
import { AuthContext } from './AuthContext';

const PreferencesModal = ({ onClose }) => {
  const { 
    emailPreferences, 
    updateEmailPreferences,
    userPreferences,
    updateUserPreferences 
  } = useContext(AuthContext);
  
  const [localEmailPrefs, setLocalEmailPrefs] = useState(emailPreferences);
  const [localUserPrefs, setLocalUserPrefs] = useState(userPreferences);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    updateEmailPreferences(localEmailPrefs);
    updateUserPreferences(localUserPrefs);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-black">Notification Preferences</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Refresh Settings */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refresh Interval
            </label>
            <select
              value={localUserPrefs.refreshInterval}
              onChange={(e) => setLocalUserPrefs({
                ...localUserPrefs,
                refreshInterval: Number(e.target.value)
              })}
              className="w-full p-2 border rounded text-black"
            >
              <option value={60000}>1 minute</option>
              <option value={300000}>5 minutes</option>
              <option value={900000}>15 minutes</option>
              <option value={3600000}>1 hour</option>
            </select>
          </div>

          {/* AQI Threshold Settings */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AQI Alert Threshold
            </label>
            <select
              value={localUserPrefs.aqiAlertThreshold}
              onChange={(e) => setLocalUserPrefs({
                ...localUserPrefs,
                aqiAlertThreshold: Number(e.target.value)
              })}
              className="w-full p-2 border rounded text-black"
            >
              <option value={2}>Normal (2)</option>
              <option value={3}>Moderate (3+)</option>
              <option value={4}>Poor (4+)</option>
              <option value={5}>Very Poor (5)</option>
            </select>
          </div>

          {/* Email Notification Settings */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Email Notifications</h3>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="aqiAlerts"
                  checked={localEmailPrefs.aqiAlerts}
                  onChange={(e) => setLocalEmailPrefs({
                    ...localEmailPrefs,
                    aqiAlerts: e.target.checked
                  })}
                  className="mr-2"
                />
                <label htmlFor="aqiAlerts" className="text-sm text-gray-700">
                  Air Quality Alerts
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="weeklyReports"
                  checked={localEmailPrefs.weeklyReports}
                  onChange={(e) => setLocalEmailPrefs({
                    ...localEmailPrefs,
                    weeklyReports: e.target.checked
                  })}
                  className="mr-2"
                />
                <label htmlFor="weeklyReports" className="text-sm text-gray-700">
                  Weekly Summary Reports
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreferencesModal;