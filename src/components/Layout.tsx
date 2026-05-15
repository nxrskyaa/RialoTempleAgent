import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="temple-shell min-h-screen text-[var(--temple-text)]">
      <Navbar />
      <main className="relative z-10 pt-[72px]">
        <Outlet />
      </main>
    </div>
  )
}
