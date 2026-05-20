import { useState } from "react";
import PropTypes from "prop-types";

function Header({
  connectionStatus,
  isReadOnly,
  handleShare,
  copied,
  onLeaveRoom,
  onLogout,
  currentUser,
  onGoToDashboard,
  roomId,
  onToggleSidebar,
  isSidebarCollapsed,
  onUpdateUsername,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser || "");
  const [validationError, setValidationError] = useState("");

  const getDeterministicColor = (name) => {
    if (!name) return "#A855F7";
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444",
      "#EC4899", "#06B6D4", "#14B8A6", "#F43F5E", "#A855F7"
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const handleUsernameChange = (val) => {
    setNewUsername(val);
    if (val.length < 3) {
      setValidationError("Username must be at least 3 characters.");
    } else if (!/^[a-zA-Z_]+$/.test(val)) {
      setValidationError("Username can only contain letters (a-z, A-Z) and underscores (_).");
    } else {
      setValidationError("");
    }
  };

  const handleSaveUsername = () => {
    if (newUsername.length < 3) {
      setValidationError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z_]+$/.test(newUsername)) {
      setValidationError("Username can only contain letters (a-z, A-Z) and underscores (_).");
      return;
    }
    if (onUpdateUsername) {
      onUpdateUsername(newUsername);
    }
    setShowEditProfile(false);
  };

  const renderStatus = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <span
            className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0"
            title="Connected to server"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-green flex-shrink-0"></span>
            <span className="hidden md:inline">Connected</span>
          </span>
        );
      case "connecting":
        return (
          <span
            className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0"
            title="Connecting to server..."
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0"></span>
            <span className="hidden md:inline">Connecting</span>
          </span>
        );
      default:
        return (
          <span
            className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20 flex-shrink-0"
            title="Disconnected from server"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span>
            <span className="hidden md:inline">Disconnected</span>
          </span>
        );
    }
  };

  return (
    <>
      <header className="h-16 w-full px-4 sm:px-6 flex items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-md z-20">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Sidebar Toggle Button for mobile and desktop convenience */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition active:scale-95 cursor-pointer border border-slate-800 bg-slate-900/40 flex-shrink-0"
            title={isSidebarCollapsed ? "Show Sidebar (Ctrl+B)" : "Hide Sidebar (Ctrl+B)"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h6" />
              )}
            </svg>
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-md shadow-blue-500/10">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-violet-400 hidden md:inline">
            CollabEdit
          </span>
        </div>

        {renderStatus()}

        {roomId && (
          <span className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 max-w-[100px] sm:max-w-none min-w-0 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
            <span className="hidden md:inline flex-shrink-0">Room:</span> <span className="text-white truncate">{roomId}</span>
          </span>
        )}

        {isReadOnly && (
          <span
            className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex-shrink-0"
            title="Read-Only Mode"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="hidden md:inline">Read-Only</span>
          </span>
        )}
      </div>

      {/* Desktop view: side-by-side buttons on sm screens and up */}
      <div className="hidden sm:flex items-center gap-1.5 sm:gap-3">
        {/* User tag */}
        {currentUser && (
          <button
            onClick={() => {
              setNewUsername(currentUser);
              setValidationError("");
              setShowEditProfile(true);
            }}
            className="hidden lg:flex items-center gap-2 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl transition cursor-pointer group mr-1 animate-in fade-in duration-300"
            title="Edit Profile Username"
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-slate-950 flex-shrink-0"
              style={{ backgroundColor: getDeterministicColor(currentUser) }}
            >
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-slate-350 font-semibold group-hover:text-slate-200 transition truncate max-w-[90px]">
              {currentUser}
            </span>
            <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-350 transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="p-2 sm:px-3.5 sm:py-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-200 transition-all duration-200 hover:border-slate-700 active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">Share Room</span>
            </>
          )}
        </button>

        {/* Dashboard / Back Button */}
        {onGoToDashboard && (
          <button
            onClick={onGoToDashboard}
            className="p-2 sm:px-3.5 sm:py-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-200 transition-all duration-200 hover:border-slate-700 active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            title="Go back to dashboard"
          >
            <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="hidden sm:inline">Go Back</span>
          </button>
        )}

        {/* Leave Room Button */}
        <button
          onClick={onLeaveRoom}
          className="p-2 sm:px-3.5 sm:py-2 rounded-lg bg-indigo-900/60 hover:bg-indigo-850/80 border border-indigo-800/40 text-xs font-bold text-indigo-200 transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
          title="Leave Room"
        >
          <svg className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Leave Room</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="p-2 sm:px-3.5 sm:py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-xs font-bold text-rose-300 transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
          title="Logout"
        >
          <svg className="w-3.5 h-3.5 text-rose-450 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Mobile view: single actions menu button */}
      <div className="flex sm:hidden items-center relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition active:scale-95 cursor-pointer border border-slate-800 bg-slate-900/40"
          title="More Actions"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {showMenu && (
          <>
            {/* Click-outside backdrop */}
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setShowMenu(false)}
            />
            {/* Dropdown Card */}
            <div className="absolute right-0 top-10 w-48 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
              {currentUser && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setNewUsername(currentUser);
                    setValidationError("");
                    setShowEditProfile(true);
                  }}
                  className="w-full px-3.5 py-2 border-b border-slate-800/60 mb-1 text-left flex items-center justify-between hover:bg-slate-850 transition cursor-pointer group"
                >
                  <div className="min-w-0">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Logged In As</p>
                    <p className="text-xs text-slate-200 font-extrabold truncate max-w-[110px]">{currentUser}</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-350 transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}

              {/* Share Button */}
              <button
                onClick={() => {
                  handleShare();
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center gap-2.5 text-slate-350 hover:text-slate-100 hover:bg-slate-850 transition active:scale-[0.98]"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Share Room</span>
                  </>
                )}
              </button>

              {/* Dashboard / Back Button */}
              {onGoToDashboard && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onGoToDashboard();
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center gap-2.5 text-slate-350 hover:text-slate-100 hover:bg-slate-850 transition active:scale-[0.98]"
                >
                  <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Go Back</span>
                </button>
              )}

              {/* Leave Room Button */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  onLeaveRoom();
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center gap-2.5 text-indigo-300 hover:text-indigo-100 hover:bg-indigo-950/40 transition border-t border-slate-800/60 mt-1 active:scale-[0.98]"
              >
                <svg className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Leave Room</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  onLogout();
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center gap-2.5 text-rose-400 hover:text-rose-250 hover:bg-rose-950/20 transition active:scale-[0.98]"
              >
                <svg className="w-3.5 h-3.5 text-rose-450 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>

    {/* Edit Profile Modal */}
    {showEditProfile && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200 p-4">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Edit Username
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl outline-none text-sm transition-all placeholder-slate-650 focus:ring-1 focus:ring-indigo-500/20 font-medium"
                  placeholder="Enter new username..."
                  autoFocus
                />
                {validationError ? (
                  <p className="text-xs text-rose-400 font-medium mt-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0 text-rose-450" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {validationError}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 font-semibold mt-2 leading-relaxed">
                    Must be greater than 3 characters and contain only letters (a-z, A-Z) and underscores (_).
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-900 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowEditProfile(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-350 hover:text-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveUsername}
              disabled={!!validationError}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                validationError
                  ? "bg-slate-800 text-slate-500 border border-slate-850/50 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95"
              }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}

Header.propTypes = {
  connectionStatus: PropTypes.string.isRequired,
  isReadOnly: PropTypes.bool.isRequired,
  handleShare: PropTypes.func.isRequired,
  copied: PropTypes.bool.isRequired,
  onLeaveRoom: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  currentUser: PropTypes.string,
  onGoToDashboard: PropTypes.func,
  roomId: PropTypes.string,
  onToggleSidebar: PropTypes.func,
  isSidebarCollapsed: PropTypes.bool,
  onUpdateUsername: PropTypes.func.isRequired,
};

export default Header;
