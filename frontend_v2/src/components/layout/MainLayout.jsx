import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl px-2 sm:px-4 md:px-6 py-6 min-h-[calc(100vh-60px)] md:min-h-[calc(100vh-52px)]">
        <Outlet />
      </main>
    </div>
  )
}