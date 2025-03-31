import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Header from './components/header';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Footer from './components/footer';
import { AuthProvider } from './components/AuthContext';

// import Home from './Home';
import LocationDetailPage from './pages/LocationDetailPage';
import AQIMapComponent from './components/aqiMap';

function App() {
  return (
    <AuthProvider> 
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
    </AuthProvider>
  );
}

export default App