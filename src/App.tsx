import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import ReviewPage from './pages/ReviewPage'
import Profile from './pages/Profile'
import Grialo from './pages/Grialo'
import Leaderboard from './pages/Leaderboard'
import ScalePlaygroundPage from './pages/ScalePlaygroundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/grialo" element={<Grialo />} />
        <Route path="/scale-playground" element={<ScalePlaygroundPage />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}
