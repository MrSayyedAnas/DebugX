import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'
import {
  ShieldCheck,
  Bug,
  Code2,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react'

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
    <div className="min-h-screen bg-black overflow-hidden flex items-center justify-center px-6 py-10 relative">

      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,0,0,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,0,0,0.12),transparent_25%)]" />

      {/* Main Container */}
      <div className="relative w-full max-w-7xl h-[850px] rounded-[32px] border border-red-500/20 bg-[#050505] shadow-[0_0_80px_rgba(255,0,0,0.08)] overflow-hidden grid lg:grid-cols-2">

        {/* LEFT SIDE */}
        <div className="relative flex flex-col justify-center px-10 lg:px-20 py-14 z-10">

          {/* Logo */}
          <div className="absolute top-10 left-10">
            <h1 className="text-5xl font-black tracking-tight text-white">
              Debug<span className="text-red-500">X</span>
            </h1>

            <p className="text-xs tracking-[0.35em] uppercase text-gray-500 mt-3">
              AI-Powered Bug Management
            </p>
          </div>

          {/* Side Features */}
          <div className="hidden xl:flex absolute left-10 top-1/2 -translate-y-1/2 flex-col gap-12">

            <div>
              <div className="w-14 h-14 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(255,0,0,0.15)]">
                <Bug className="text-red-500" size={24} />
              </div>

              <h3 className="text-white font-semibold mb-2">
                AI-Powered Insights
              </h3>

              <p className="text-gray-500 text-sm leading-relaxed max-w-[180px]">
                Smart bug detection and automated resolution suggestions.
              </p>
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(255,0,0,0.15)]">
                <ShieldCheck className="text-red-500" size={24} />
              </div>

              <h3 className="text-white font-semibold mb-2">
                Enterprise Security
              </h3>

              <p className="text-gray-500 text-sm leading-relaxed max-w-[180px]">
                End-to-end encrypted authentication and workspace protection.
              </p>
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(255,0,0,0.15)]">
                <Code2 className="text-red-500" size={24} />
              </div>

              <h3 className="text-white font-semibold mb-2">
                Built For Developers
              </h3>

              <p className="text-gray-500 text-sm leading-relaxed max-w-[180px]">
                Streamline your workflow and ship bug-free code faster.
              </p>
            </div>
          </div>

          {/* Login Form */}
          <div className="w-full max-w-md mx-auto">

            <div className="mb-10">
              <h2 className="text-6xl font-black text-white leading-tight">
                Welcome{' '}
                <span className="text-red-500">Back.</span>
              </h2>

              <p className="text-gray-500 mt-4 text-lg">
                Sign in to continue to your workspace
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300 backdrop-blur-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
              <div>
                <label className="block text-sm text-gray-300 mb-3 font-medium">
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full h-16 rounded-2xl bg-white/[0.03] border border-white/10 px-6 text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500 focus:bg-red-500/[0.03] transition-all duration-300"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-gray-300 font-medium">
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-sm text-red-400 hover:text-red-300 transition"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full h-16 rounded-2xl bg-white/[0.03] border border-white/10 px-6 pr-14 text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500 focus:bg-red-500/[0.03] transition-all duration-300"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-red-500 bg-black text-red-500 focus:ring-red-500"
                />

                <span className="text-gray-400 text-sm">
                  Remember me
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full h-16 rounded-2xl bg-red-600 hover:bg-red-500 transition-all duration-300 text-white font-semibold text-lg shadow-[0_0_40px_rgba(255,0,0,0.25)] hover:shadow-[0_0_60px_rgba(255,0,0,0.45)] disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-3">
                  {loading ? 'Signing In...' : 'Sign In'}

                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-600 text-sm">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google Button */}
            <button className="w-full h-16 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] text-white transition-all duration-300">
              Continue with Google
            </button>

            {/* Register */}
            <p className="text-center text-gray-500 mt-8">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="text-red-400 hover:text-red-300 font-semibold"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* RIGHT SIDE IMAGE */}
        <div className="relative hidden lg:block overflow-hidden">

          {/* Background Image */}
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600&auto=format&fit=crop"
            alt="mountain"
            className="w-full h-full object-cover opacity-30"
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-l from-black/10 via-black/30 to-black" />

          {/* Curved Line */}
          <div className="absolute left-0 top-0 h-full w-[2px] border-l border-dashed border-red-500/40 rounded-full" />

          {/* Quote */}
          <div className="absolute bottom-20 right-16 max-w-xs">
            <div className="text-red-500 text-6xl font-black mb-4">“</div>

            <p className="text-4xl font-bold text-white leading-tight">
              Smarter debugging.
            </p>

            <p className="text-4xl font-bold text-gray-400 leading-tight">
              Better code.
            </p>

            <p className="text-4xl font-bold text-gray-500 leading-tight">
              Faster.
            </p>

            <div className="mt-5 w-24 h-1 rounded-full bg-red-500" />
          </div>
        </div>
      </div>
    </div>
  )
}