import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import ReviewPage from './pages/ReviewPage'
import Profile from './pages/Profile'
import Grialo from './pages/Grialo'
import Leaderboard from './pages/Leaderboard'
import RialoCity from './pages/RialoCity'
import RialoCityModule from './pages/RialoCityModule'
import RialoCityPassport from './pages/RialoCityPassport'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/grialo" element={<Grialo />} />
        <Route path="/rialo-city" element={<RialoCity />} />
        <Route path="/rialo-city/module/:slug" element={<RialoCityModule />} />
        <Route path="/rialo-city/passport" element={<RialoCityPassport />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}
