import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import React from 'react'
import Header from './components/Header'
import Home from "./Home";

import Footer from './components/Footer'
function App() {
  const [count, setCount] = useState(0)

  return (
    <div className = "min-h-screen flex flex-col">
    <Header />
    <Home />
    <Footer />
    </div>
  )
}

export default App
