import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import React from 'react';
import Header from './components/header';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Footer from './components/footer';
import { AuthProvider } from './components/AuthContext';
import LocationDetailPage from './pages/LocationDetailPage';
import AQIMapComponent from './components/aqiMap';
import { EventProvider } from './context/EventContext';

function App() {
  return (
    <AuthProvider> 
      <EventProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-white">
            <Header /> 
            
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<AQIMapComponent />} />
                <Route path="/map" element={<AQIMapComponent />} />
                <Route path="/location/:lat/:lon" element={<LocationDetailPage />} />
              </Routes>
            </main>

            <Footer /> 
          </div>
        </Router>
      </EventProvider>
    </AuthProvider>
  );
}

export default App