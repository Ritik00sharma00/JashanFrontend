import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthModal } from './components/auth/AuthModal'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { LandingPage } from './screens/LandingPage'
import { Dashboard } from './screens/Dashboard'

function App() {
  const [authMode, setAuthMode] = useState(null)

  return (
    <div className="min-h-screen overflow-hidden bg-ivory-50 text-ink-900">
      <Navbar onAuth={setAuthMode} />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage onAuth={setAuthMode} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>
      <Footer />
      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onModeChange={setAuthMode} />}
    </div>
  )
}

export default App