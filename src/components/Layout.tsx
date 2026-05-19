import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [location.pathname])

  return (
    <div className="temple-shell min-h-screen text-[var(--temple-text)]">
      <Navbar />
      <main className="relative z-10 pt-[72px]">
        <Outlet />
      </main>
    </div>
  )
}
