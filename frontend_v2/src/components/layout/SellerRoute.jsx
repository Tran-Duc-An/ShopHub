import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function SellerRoute({ children }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (user && user.role !== 'seller') return <Navigate to="/" replace />
  return children
}