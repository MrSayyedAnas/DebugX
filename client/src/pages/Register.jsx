import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'developer'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
      const res = await API.post('/auth/register', form)
      login(res.data.data.user, res.data.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">

      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white tracking-tight">
          Debug<span className="text-red-500">X</span>
        </h1>
        <p className="text-gray-500 mt-2 text-sm tracking-widest uppercase">
          AI-Powered Bug Management
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-zinc-950 rounded-2xl p-8 border border-zinc-800 shadow-2xl">

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Create Account</h2>
          <p className="text-gray-500 text-sm mt-1">Join your team on DebugX</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Sayyed Anas"
              required
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 transition placeholder-gray-600"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 transition placeholder-gray-600"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 transition placeholder-gray-600"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Role
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 transition"
            >
              <option value="developer">Developer</option>
              <option value="tester">Tester</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all mt-2 tracking-wide"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-zinc-800"></div>
          <span className="px-4 text-gray-600 text-xs">OR</span>
          <div className="flex-1 border-t border-zinc-800"></div>
        </div>

        {/* Login Link */}
        <p className="text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-red-400 hover:text-red-300 font-medium transition"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="text-gray-700 text-xs mt-8">
        DebugX © 2026 — Final Year Capstone Project
      </p>
    </div>
  )
}