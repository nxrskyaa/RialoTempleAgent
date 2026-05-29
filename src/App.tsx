import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import ReviewPage from './pages/ReviewPage'
import Profile from './pages/Profile'
import Grialo from './pages/Grialo'
import Leaderboard from './pages/Leaderboard'
import SignatureCardPage from './pages/SignatureCardPage'
import World from './pages/World'
import RialoQuiz from './pages/RialoQuiz'
import RialoWish from './pages/RialoWish'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/grialo" element={<Grialo />} />
        <Route path="/world" element={<World />} />
        <Route path="/world-map" element={<Navigate to="/world" replace />} />
        <Route path="/quiz" element={<RialoQuiz />} />
        <Route path="/wish" element={<RialoWish />} />
        <Route path="/signature-card" element={<SignatureCardPage />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
