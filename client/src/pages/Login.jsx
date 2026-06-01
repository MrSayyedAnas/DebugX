import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await API.post('/auth/login', form)
      login(res.data.data.user, res.data.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">

      {/* Grid Background */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          opacity: 0.3
        }}
      />

      {/* Red glow top center */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-red-600 opacity-[0.06] -top-48 left-1/2 -translate-x-1/2" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-red-600 opacity-[0.04] top-1/3 -left-24" />
      <div className="absolute w-[200px] h-[200px] rounded-full bg-red-600 opacity-[0.04] bottom-10 -right-16" />

      {/* Scan lines */}
      <div className="absolute h-px w-48 bg-red-600 opacity-15 top-1/4 left-0" />
      <div className="absolute h-px w-28 bg-red-600 opacity-15 bottom-1/3 right-0" />
      <div className="absolute w-px h-36 bg-red-600 opacity-15 top-0 left-1/4" />
      <div className="absolute w-px h-24 bg-red-600 opacity-15 bottom-0 right-1/3" />

      {/* Dots */}
      {[
        { top: '22%', left: '24%' }, { top: '70%', left: '18%' },
        { top: '35%', right: '22%' }, { bottom: '25%', right: '28%' },
        { top: '15%', right: '35%' },
      ].map((pos, i) => (
        <div key={i} className="absolute w-1 h-1 rounded-full bg-red-500 opacity-50" style={pos} />
      ))}

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Card glow border */}
        <div className="relative bg-[#0a0a0a] border border-[#222] rounded-2xl p-10">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-9">
            <h1 className="text-lg font-bold text-white tracking-tight">
              Debug<span className="text-red-500">X</span>
            </h1>
            <span className="text-[10px] bg-[#1a0505] border border-[#3f0f0f] text-red-400 px-3 py-1 rounded-full tracking-wide">
              AI Powered
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Welcome back.</h2>
          <p className="text-sm text-zinc-600 mb-8">Sign in to your workspace</p>

          {/* Error */}
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-zinc-600 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                required
                className="w-full bg-[#0d0d0d] border border-[#1c1c1c] text-white rounded-xl px-4 py-3 text-sm placeholder:text-zinc-800 focus:outline-none focus:border-red-600 focus:bg-[#0f0505] transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-zinc-600 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0d0d0d] border border-[#1c1c1c] text-white rounded-xl px-4 py-3 text-sm placeholder:text-zinc-800 focus:outline-none focus:border-red-600 focus:bg-[#0f0505] transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-zinc-400 transition text-xs"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
                <input type="checkbox" className="accent-red-600 w-3 h-3" />
                Remember me
              </label>
              <button type="button" className="text-xs text-zinc-600 hover:text-red-500 transition">
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-semibold transition mt-2 tracking-wide"
            >
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#151515]" />
            <span className="text-[11px] text-zinc-800">or continue with</span>
            <div className="flex-1 h-px bg-[#151515]" />
          </div>

          {/* Social */}
          <div className="flex gap-3 mb-6">
            {['G', 'GH', 'f'].map((s, i) => (
              <button key={i} className="flex-1 bg-[#0a0a0a] border border-[#1c1c1c] hover:border-red-600 text-zinc-700 hover:text-red-500 rounded-xl py-3 text-xs font-semibold transition">
                {s}
              </button>
            ))}
          </div>

          {/* Register */}
          <p className="text-center text-xs text-zinc-700">
            Don't have an account?{' '}
            <Link to="/register" className="text-red-500 hover:text-red-400 transition">
              Register for free
            </Link>
          </p>

          {/* Version tag */}
          <div className="absolute top-4 right-4 text-[9px] text-zinc-800 tracking-widest uppercase">v2.0</div>
        </div>
      </div>
    </div>
  )
}