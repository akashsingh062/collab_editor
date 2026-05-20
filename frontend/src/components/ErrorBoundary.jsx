import React from "react";
import PropTypes from "prop-types";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught an uncaught React error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    // Clear state and reload page to try recovery
    localStorage.removeItem("collab_prev_room_id_null");
    localStorage.removeItem("collab_prev_room_password_null");
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-2xl bg-slate-900/80 border border-red-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-200 tracking-tight">Application Render Error</h1>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  React caught an unhandled exception in the component tree.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 mb-6 font-mono text-xs overflow-x-auto max-h-[300px] custom-scrollbar text-red-400">
              <div className="font-bold text-red-300 mb-2">
                {this.state.error && this.state.error.toString()}
              </div>
              <pre className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-wrap">
                {this.state.error && this.state.error.stack}
              </pre>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm">
                Pressing the button below will clear broken room session states and reload the application back to the dashboard.
              </p>
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition active:scale-[0.98] cursor-pointer"
              >
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
