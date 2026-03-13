import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.login({ email, password })
      login(data.token)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <Card className="w-full max-w-[420px] animate-pop rounded-card2
                       border-slate-200 shadow-auth">
        <CardContent className="p-10">
          <div className="mb-2 text-center text-[2.25rem]">👋</div>
          <h2 className="mb-1 text-center text-[1.5rem] font-extrabold tracking-tight text-slate-900">
            Welcome Back
          </h2>
          <p className="mb-7 text-center text-[0.88rem] text-slate-400">
            Log in to your account
          </p>

          {error && (
            <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50
                            px-4 py-3 text-sm font-medium text-rose-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[0.82rem] font-semibold text-slate-700">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="border-[1.5px] border-slate-200 bg-slate-50 text-[0.9rem]
                           focus:border-indigo-400 focus:ring-[3px] focus:ring-indigo-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[0.82rem] font-semibold text-slate-700">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border-[1.5px] border-slate-200 bg-slate-50 text-[0.9rem]
                           focus:border-indigo-400 focus:ring-[3px] focus:ring-indigo-100"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-1 w-full bg-indigo-600 py-3 text-[0.95rem] font-bold
                         transition-all hover:-translate-y-0.5 hover:bg-indigo-700
                         active:translate-y-0 disabled:bg-indigo-200"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-[0.85rem] text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-bold text-indigo-600 no-underline hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}