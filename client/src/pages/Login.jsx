return (
  <div className="min-h-screen bg-black flex items-center justify-center p-6 overflow-hidden">

    {/* Background Glow */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,0,0,0.18),transparent_35%)]" />

    {/* Main Card */}
    <div className="relative w-full max-w-7xl rounded-[30px] overflow-hidden border border-red-500/20 bg-[#070707] shadow-[0_0_80px_rgba(255,0,0,0.08)] grid lg:grid-cols-2">

      {/* LEFT SIDE */}
      <div className="relative px-8 md:px-14 py-12 flex flex-col justify-center">

        {/* Logo */}
        <div className="mb-14">
          <h1 className="text-5xl font-black text-white">
            Debug<span className="text-red-500">X</span>
          </h1>

          <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mt-3">
            AI-Powered Bug Management
          </p>
        </div>

        {/* Form */}
        <div className="max-w-md w-full">

          <h2 className="text-5xl font-black text-white leading-tight">
            Welcome{' '}
            <span className="text-red-500">Back.</span>
          </h2>

          <p className="text-gray-500 mt-4 mb-10 text-lg">
            Sign in to continue to your workspace
          </p>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-300 mb-3">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full h-14 rounded-2xl bg-white/[0.03] border border-white/10 px-5 text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500 transition"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-gray-300">
                  Password
                </label>

                <button
                  type="button"
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Forgot Password?
                </button>
              </div>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full h-14 rounded-2xl bg-white/[0.03] border border-white/10 px-5 text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500 transition"
              />
            </div>

            {/* Remember */}
            <div className="flex items-center gap-3">
              <input type="checkbox" className="accent-red-500" />

              <span className="text-sm text-gray-400">
                Remember me
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all duration-300 shadow-[0_0_40px_rgba(255,0,0,0.25)]"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-sm">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google */}
          <button className="w-full h-14 rounded-2xl border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.05] transition">
            Continue with Google
          </button>

          {/* Register */}
          <p className="text-center text-gray-500 mt-8">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-red-400 hover:text-red-300 font-semibold"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="hidden lg:block relative min-h-[800px]">

        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600&auto=format&fit=crop"
          alt="bg"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/20 via-black/40 to-black" />

        {/* Red Glow */}
        <div className="absolute inset-0 bg-red-500/5" />

        {/* Quote */}
        <div className="absolute bottom-16 left-16 max-w-sm">
          <div className="text-red-500 text-6xl font-black mb-4">
            “
          </div>

          <h3 className="text-4xl font-bold text-white leading-tight">
            Smarter debugging.
          </h3>

          <h3 className="text-4xl font-bold text-gray-400 leading-tight">
            Better code.
          </h3>

          <h3 className="text-4xl font-bold text-gray-500 leading-tight">
            Faster.
          </h3>
        </div>
      </div>
    </div>
  </div>
)