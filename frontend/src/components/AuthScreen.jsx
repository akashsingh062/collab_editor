import { useState } from "react";
import PropTypes from "prop-types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function AuthScreen({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters");
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z_]+$/.test(cleanUsername)) {
      setError("Username can only contain letters (a-z, A-Z) and underscores (_)");
      setLoading(false);
      return;
    }

    const endpoint = isLogin ? "/auth/login" : "/auth/signup";

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "An error occurred");
      } else {
        // Success
        localStorage.setItem("collab_user", data.username);
        onAuthSuccess(data.username);
      }
    } catch {
      setError("Connection to server failed. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main card container */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* App Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white shadow-lg mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
            Collab Editor
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Real-time collaborative workspace
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-850/60 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
              isLogin
                ? "bg-slate-900 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
              !isLogin
                ? "bg-slate-900 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              Username
            </label>
            <input
              type="text"
              autoFocus
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter unique username"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-650 to-blue-600 hover:from-indigo-600 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold text-sm rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              "Login to Workspace"
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

AuthScreen.propTypes = {
  onAuthSuccess: PropTypes.func.isRequired,
};

export default AuthScreen;
