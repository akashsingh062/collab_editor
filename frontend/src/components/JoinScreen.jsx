import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function JoinScreen({
  handleJoin,
  kickedMessage,
  activeRooms = [],
  onRefreshRooms,
  currentUser,
  onLogout,
  activeSessionRoomId,
  onResumeSession,
  onUpdateUsername,
}) {
  const rooms = activeRooms || [];
  const [newRoomId, setNewRoomId] = useState("");
  const [newRoomPassword, setNewRoomPassword] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [joinPassword, setJoinPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Profile update states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser || "");
  const [validationError, setValidationError] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    setNewUsername(currentUser || "");
  }, [currentUser]);

  const handleSaveUsername = async (e) => {
    e.preventDefault();
    setValidationError("");

    const trimmed = newUsername.trim();
    if (trimmed === currentUser) {
      setShowEditProfile(false);
      return;
    }

    if (trimmed.length < 3) {
      setValidationError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z_]+$/.test(trimmed)) {
      setValidationError("Username can only contain letters (a-z, A-Z) and underscores (_).");
      return;
    }

    setIsSavingUsername(true);
    const success = await onUpdateUsername(trimmed);
    setIsSavingUsername(false);
    if (success) {
      setShowEditProfile(false);
    }
  };

  // Keyboard shortcut: pressing '/' focuses the search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        if (
          document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA"
        ) {
          return;
        }
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCreateRoomSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanRoomId = newRoomId.trim();
    if (!cleanRoomId) {
      setErrorMsg("Room ID is required");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: cleanRoomId,
          password: newRoomPassword || null,
          owner: currentUser,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to create room");
        return;
      }

      setShowCreateModal(false);
      setNewRoomId("");
      setNewRoomPassword("");
      handleJoin(cleanRoomId, currentUser, newRoomPassword || null);
    } catch (err) {
      setErrorMsg("Unable to connect to server: " + err.message);
    }
  };

  const handleSelectRoomToJoin = (room) => {
    setErrorMsg("");
    if (room.isLocked) {
      setErrorMsg("This room is locked by the Host");
      return;
    }
    if (room.hasPassword) {
      setSelectedRoomId(room.roomId);
      setJoinPassword("");
    } else {
      handleJoin(room.roomId, currentUser, null);
    }
  };

  const handleJoinPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoomId,
          password: joinPassword,
          userName: currentUser,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Incorrect password");
        return;
      }

      setSelectedRoomId(null);
      setJoinPassword("");
      handleJoin(selectedRoomId, currentUser, joinPassword);
    } catch (err) {
      setErrorMsg("Join failed: " + err.message);
    }
  };

  const getRoomAvatarStyle = (roomId) => {
    let hash = 0;
    const str = roomId || "";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradients = [
      "from-blue-600 to-indigo-600 shadow-blue-500/10",
      "from-violet-600 to-purple-600 shadow-violet-500/10",
      "from-emerald-600 to-teal-600 shadow-emerald-500/10",
      "from-cyan-600 to-blue-600 shadow-cyan-500/10",
      "from-pink-600 to-rose-600 shadow-pink-500/10",
      "from-amber-600 to-orange-600 shadow-amber-500/10",
    ];
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const getUserInitials = (name) => {
    if (!name) return "?";
    return name.slice(0, 2).toUpperCase();
  };

  const getRoomInitials = (id) => {
    if (!id) return "?";
    return id.slice(0, 2).toUpperCase();
  };

  const filteredRooms = rooms.filter(
    (room) =>
      room &&
      room.roomId &&
      room.roomId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsersOnline = rooms.reduce((acc, r) => acc + (r.activeCount || 0), 0);

  return (
    <div className="min-h-screen w-full bg-[#030712] relative overflow-y-auto flex items-center justify-center font-sans py-8 lg:py-0">
      {/* Background Glowing Mesh Orbs */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none"></div>

      {/* Grid Overlay Line Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>

      {/* Main Responsive Dashboard Container */}
      <div className="w-full max-w-5xl h-auto lg:h-[80vh] flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 p-6 lg:p-8 rounded-3xl border border-slate-900 bg-slate-950/60 backdrop-blur-xl relative z-10 mx-4 shadow-2xl">
        
        {/* Left column: Sidebar */}
        <div className="col-span-12 lg:col-span-4 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-900 pb-6 lg:pb-0 pr-0 lg:pr-8 h-auto lg:h-full flex-shrink-0">
          <div className="flex flex-col gap-6">
            {/* Logo Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400 tracking-tight">
                  CollabEdit
                </h1>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Workspace Hub</p>
              </div>
            </div>

            {/* Profile Card */}
            <div 
              onClick={() => setShowEditProfile(true)}
              className="bg-slate-900/40 border border-slate-900 hover:border-slate-800/80 hover:bg-slate-900/60 rounded-2xl p-4 flex items-center justify-between gap-3.5 shadow-sm transition-all duration-200 cursor-pointer group"
              title="Click to edit username"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/10 group-hover:scale-105 transition-transform duration-200">
                  {getUserInitials(currentUser)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Collaborator</span>
                  <span className="block text-sm font-bold text-white truncate">{currentUser}</span>
                  <span className="inline-flex items-center gap-1.5 mt-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active Session
                  </span>
                </div>
              </div>
              <div className="text-slate-500 group-hover:text-blue-400 transition-colors duration-150 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </div>

            {/* Simulated Live Statistics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/25 border border-slate-900/60 rounded-xl p-3.5 flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Rooms</span>
                <span className="text-2xl font-black text-slate-100">{rooms.length}</span>
              </div>
              <div className="bg-slate-900/25 border border-slate-900/60 rounded-xl p-3.5 flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Online</span>
                <span className="text-2xl font-black text-slate-100">{totalUsersOnline}</span>
              </div>
            </div>

            {/* Create Room Button Trigger */}
            <button
              onClick={() => {
                setErrorMsg("");
                setShowCreateModal(true);
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create New Room
            </button>
          </div>

          {/* Lobby Server Status & Logout */}
          <div className="mt-6 pt-4 border-t border-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Lobby Server: Connected
            </div>
            <button
              onClick={onLogout}
              className="text-[10px] font-bold text-rose-400 hover:text-rose-350 uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Right column: Main Panel (Room Feed) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-auto lg:h-full overflow-visible lg:overflow-hidden mt-6 lg:mt-0 min-h-0 flex-1">
          
          {/* Header Action Row: Search & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Collaborative Workspaces</h2>
              <p className="text-xs text-slate-400 mt-0.5">Select a lobby room to join or create one</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search rooms... (Press '/' to focus)"
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900/60 border border-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition duration-150"
                />
                <div className="absolute left-3 top-2.5 text-slate-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                ) : (
                  <span className="absolute right-3 top-2 px-1.5 py-0.5 text-[9px] bg-slate-900/40 text-slate-500 border border-slate-900 rounded font-bold pointer-events-none">
                    /
                  </span>
                )}
              </div>
              <button
                onClick={onRefreshRooms}
                className="p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-slate-200 transition cursor-pointer flex items-center justify-center active:scale-95"
                title="Refresh Room List"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Connected Session Banner */}
          {activeSessionRoomId && (
            <div className="mb-6 p-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 via-teal-950/20 to-green-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-emerald-950/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
                  <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Active Workspace Session</h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Currently connected to room: <span className="text-emerald-400 font-extrabold">{activeSessionRoomId}</span>.
                  </p>
                </div>
              </div>
              <button
                onClick={onResumeSession}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95 flex-shrink-0"
              >
                Return to Editor
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Quick Resume Previous Session Banner */}
          {(() => {
            const prevRoomId = localStorage.getItem(`collab_prev_room_id_${currentUser}`);
            const prevRoomPassword = localStorage.getItem(`collab_prev_room_password_${currentUser}`) || "";
            const activeRoom = rooms.find(r => r && r.roomId === prevRoomId);
            const isPrevActive = !!activeRoom && prevRoomId !== activeSessionRoomId;

            if (isPrevActive) {
              return (
                <div className="mb-6 p-4 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/20 via-indigo-950/20 to-violet-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-blue-950/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Quick Resume Workspace</h3>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Your previously joined room <span className="text-blue-400 font-extrabold">{prevRoomId}</span> is online.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <button
                      onClick={() => {
                        localStorage.removeItem(`collab_prev_room_id_${currentUser}`);
                        localStorage.removeItem(`collab_prev_room_password_${currentUser}`);
                        onRefreshRooms();
                      }}
                      className="px-3 py-2 text-[10px] font-bold text-slate-500 hover:text-slate-400 uppercase tracking-wider transition cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleJoin(prevRoomId, currentUser, prevRoomPassword)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer active:scale-95"
                    >
                      Join Room
                    </button>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Global Warnings / Messages */}
          {(kickedMessage || errorMsg) && (
            <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{kickedMessage || errorMsg}</span>
            </div>
          )}

          {/* Inline Password Entry Area */}
          {selectedRoomId && (
            <form onSubmit={handleJoinPasswordSubmit} className="mb-6 p-4 rounded-2xl bg-slate-900/50 border border-slate-900 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-350">
                  Password Required for room: <span className="text-blue-400 font-extrabold">{selectedRoomId}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRoomId(null)}
                  className="text-[10px] font-bold uppercase text-slate-500 hover:text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Room Password..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-900 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 rounded-xl border border-slate-900 hover:bg-slate-900 text-slate-400 transition cursor-pointer"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer active:scale-95"
                >
                  Join
                </button>
              </div>
            </form>
          )}

          {/* Active Rooms Grid Scroll Area */}
          <div className="flex-1 h-auto lg:overflow-y-auto lg:custom-scrollbar lg:pr-1 pb-4">
            {filteredRooms.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900/10 border border-dashed border-slate-900 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-900/60 flex items-center justify-center text-slate-600 mb-4 border border-slate-900">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-350">No workspaces found</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  {searchQuery
                    ? `No active lobby rooms matching "${searchQuery}". Clear your search query or create a new workspace room.`
                    : "There are currently no active collaboration rooms open. Click 'Create New Room' to spin up your workspace."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRooms.map((room, idx) => (
                  <div
                    key={idx}
                    className="relative group p-5 rounded-2xl border border-slate-900 bg-slate-950/40 hover:bg-slate-900/30 hover:border-slate-800 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between h-[165px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Unique hash-gradient avatar */}
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getRoomAvatarStyle(room.roomId)} flex items-center justify-center text-white font-extrabold text-xs shadow-md`}>
                          {getRoomInitials(room.roomId)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition">
                            {room.roomId}
                          </h4>
                          <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">
                            Host: {room.owner || "Anonymous"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Security Status Badge */}
                      <div className="flex items-center gap-1">
                        {room.hasPassword && (
                          <span className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400" title="Password Protected">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </span>
                        )}
                        {room.isLocked && (
                          <span className="p-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400" title="Locked by Host">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Active count indicator */}
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-450 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        </span>
                        {room.activeCount || 0} online
                      </span>

                      <button
                        onClick={() => handleSelectRoomToJoin(room)}
                        className="px-4 py-1.5 bg-slate-900 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white border border-slate-800 group-hover:border-transparent text-slate-300 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer active:scale-95 shadow-md"
                      >
                        Join Workspace
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Room Glassmorphic Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 p-4">
          <div className="bg-slate-950 border border-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  Create New Workspace
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setErrorMsg("");
                  }}
                  className="p-1 text-slate-500 hover:text-slate-300 transition cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRoomSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Room ID / Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoomId}
                    onChange={(e) => setNewRoomId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                    placeholder="e.g. workspace-alpha"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-900 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/10 transition text-xs font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Password (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newRoomPassword}
                      onChange={(e) => setNewRoomPassword(e.target.value)}
                      placeholder="Leave blank for public access"
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-900/60 border border-slate-900 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/10 transition text-xs font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-350 transition cursor-pointer"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  Create & Launch Workspace
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowEditProfile(false);
                setValidationError("");
                setNewUsername(currentUser || "");
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 text-sm cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-white mb-2">Edit Profile Username</h3>
            <p className="text-xs text-slate-400 mb-6">
              Update your workspace identity. This will update your name across all active rooms and chat logs.
            </p>

            <form onSubmit={handleSaveUsername} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => {
                    setNewUsername(e.target.value);
                    setValidationError("");
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  placeholder="Enter username..."
                  autoFocus
                />
                {validationError && (
                  <p className="text-[11px] text-rose-400 mt-2 font-medium">{validationError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProfile(false);
                    setValidationError("");
                    setNewUsername(currentUser || "");
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUsername || !newUsername.trim() || newUsername.trim() === currentUser}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSavingUsername ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

JoinScreen.propTypes = {
  handleJoin: PropTypes.func.isRequired,
  kickedMessage: PropTypes.string,
  activeRooms: PropTypes.array.isRequired,
  onRefreshRooms: PropTypes.func.isRequired,
  currentUser: PropTypes.string.isRequired,
  onLogout: PropTypes.func.isRequired,
  activeSessionRoomId: PropTypes.string,
  onResumeSession: PropTypes.func,
  onUpdateUsername: PropTypes.func.isRequired,
};

export default JoinScreen;
