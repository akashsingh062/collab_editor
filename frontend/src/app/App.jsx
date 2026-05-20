import "./App.css";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import { MonacoBinding } from "y-monaco";
import JSZip from "jszip";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Import modular components
import AuthScreen from "../components/AuthScreen";
import JoinScreen from "../components/JoinScreen";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import EditorWorkspace from "../components/EditorWorkspace";
import { useToast } from "../components/ToastProvider";

const COLLAB_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#8B5CF6", // violet
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#14B8A6", // teal
  "#F43F5E", // rose
  "#A855F7", // purple
];

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.15);

    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime); // A5
      gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      
      osc2.start(audioCtx.currentTime);
      osc2.stop(audioCtx.currentTime + 0.25);
    }, 100);
  } catch (err) {
    console.warn("Could not play notification sound:", err);
  }
};

function App() {
  const { toast, confirm: confirmAction } = useToast();

  // Authentication & Session State
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem("collab_user") || null;
  });

  const [roomId, setRoomId] = useState(() => {
    return new URLSearchParams(window.location.search).get("room") || null;
  });
  const [roomPassword, setRoomPassword] = useState(() => {
    return new URLSearchParams(window.location.search).get("pw") || null;
  });

  const [editor, setEditor] = useState(null);
  const [provider, setProvider] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [copied, setCopied] = useState(false);

  // Collaborative files & settings state
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [kickedMessage, setKickedMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Server-driven room members and presence states
  const [members, setMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [roomOwner, setRoomOwner] = useState("");
  const [activeRooms, setActiveRooms] = useState([]);
  const [currentView, setCurrentView] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const isChatOpenRef = useRef(false);
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  const handleLeaveRoom = useCallback(() => {
    if (currentUser) {
      localStorage.removeItem(`collab_prev_room_id_${currentUser}`);
      localStorage.removeItem(`collab_prev_room_password_${currentUser}`);
    }
    setRoomId(null);
    setRoomPassword(null);
    setMembers([]);
    setOnlineUsers([]);
    setRoomOwner("");
    setChatMessages([]);
    setIsChatOpen(false);
    setUnreadChatCount(0);
    setCurrentView("dashboard");
    window.history.pushState({}, "", window.location.pathname);
  }, [currentUser]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ydoc = useMemo(() => new Y.Doc(), [roomId]);
  const yFiles = useMemo(() => ydoc.getMap("files"), [ydoc]);
  const ySettings = useMemo(() => ydoc.getMap("settings"), [ydoc]);

  // Stable local user information
  const userColor = useMemo(() => {
    return COLLAB_COLORS[Math.floor(Math.random() * COLLAB_COLORS.length)];
  }, []);
  const userJoinedAt = useMemo(() => Date.now(), []);

  const handleExportWorkspace = useCallback(async () => {
    const zip = new JSZip();
    const keys = Array.from(yFiles.keys());
    
    keys.forEach((fileName) => {
      const yText = yFiles.get(fileName);
      if (yText) {
        zip.file(fileName, yText.toString());
      }
    });

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `collab-workspace-${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export zip error:", err);
      toast("Failed to export workspace as ZIP.", "error");
    }
  }, [yFiles, toast]);

  const handleMount = useCallback((editorInstance) => {
    setEditor(editorInstance);
  }, []);

  // Hook 1: Room Connection & User presence
  useEffect(() => {
    if (currentUser && roomId) {
      setConnectionStatus("connecting");
      const p = new SocketIOProvider(
        API_URL,
        roomId,
        ydoc,
        {
          autoConnect: true,
        },
      );
      setProvider(p);

      p.on("status", ({ status }) => {
        console.log(`[Collab] Connection status changed to: ${status}`);
        setConnectionStatus(status);
        if (status === "connected" && p.socket) {
          console.log(`[Collab] Emitting join-metadata for user: ${currentUser} in room: ${roomId}`);
          p.socket.emit("join-metadata", { roomId, userName: currentUser });

          if (!p.socket._hasPresenceListeners) {
            p.socket._hasPresenceListeners = true;
            p.socket.on("room-presence-updated", ({ members, onlineUsers, owner }) => {
              console.log("[Collab] Received room-presence-updated:", { members, onlineUsers, owner });
              setMembers(members || []);
              setOnlineUsers(onlineUsers || []);
              setRoomOwner(owner || "");
            });

            p.socket.on("room-lock-changed", ({ isLocked }) => {
              console.log(`[Collab] Room lock state changed to: ${isLocked}`);
              setIsRoomLocked(isLocked);
            });

            p.socket.on("room-deleted", () => {
              console.log("[Collab] Room was deleted by host.");
              toast("This room has been deleted by the host.", "error");
              handleLeaveRoom();
            });

            p.socket.on("chat-history", (history) => {
              setChatMessages(history || []);
            });

            p.socket.on("chat-history-updated", (history) => {
              setChatMessages(history || []);
            });

            p.socket.on("chat-message-received", (message) => {
              setChatMessages((prev) => {
                if (prev.some((m) => m.id === message.id)) return prev;
                return [...prev, message];
              });

              if (message.sender !== currentUser) {
                if (isChatOpenRef.current) {
                  p.socket.emit("mark-message-read", {
                    messageId: message.id,
                    userName: currentUser,
                  });
                } else {
                  setUnreadChatCount((c) => c + 1);
                  playNotificationSound();
                }
              }
            });

            p.socket.on("chat-message-deleted", ({ messageId }) => {
              setChatMessages((prev) =>
                prev.map((msg) => (msg.id === messageId ? { ...msg, isDeleted: true } : msg))
              );
            });

            p.socket.on("chat-message-status-updated", ({ messageId, deliveredTo, readBy }) => {
              setChatMessages((prev) =>
                prev.map((msg) =>
                  msg.id === messageId ? { ...msg, deliveredTo, readBy } : msg
                )
              );
            });
          }
        }
      });

      // Set user presence awareness
      p.awareness.setLocalStateField("user", {
        color: userColor,
        name: currentUser,
        joinedAt: userJoinedAt,
      });

      const handleAwarenessChange = () => {
        const statesMap = p.awareness.getStates();
        
        // Enforce unique username check
        const myClientId = ydoc.clientID;
        let isDuplicate = false;
        for (const [cid, state] of statesMap.entries()) {
          if (
            cid !== myClientId &&
            state.user &&
            state.user.name === currentUser &&
            state.user.joinedAt < userJoinedAt
          ) {
            isDuplicate = true;
            break;
          }
        }

        if (isDuplicate) {
          toast("This username is already connected in this room. Sharing session details...", "info");
        }
      };

      p.awareness.on("change", handleAwarenessChange);

      function handleBeforeUnload() {
        p.awareness.setLocalStateField("user", null);
      }
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        try {
          p.destroy();
        } catch (err) {
          console.warn("[Collab] Error destroying provider:", err);
        }
        window.removeEventListener("beforeunload", handleBeforeUnload);
        setProvider(null);
      };
    }
  }, [currentUser, roomId, ydoc, userColor, userJoinedAt, handleLeaveRoom, toast]);

  // Hook 2: Collaborative settings & files sync
  useEffect(() => {
    if (provider) {
      const handleSettingsChange = () => {
        // Track room locked state
        const roomLocked = !!ySettings.get("room-locked");
        setIsRoomLocked(roomLocked);

        // React to Admin Lock / Read-Only
        const locked = !!ySettings.get(`readonly-${currentUser}`);
        setIsReadOnly(locked);

        // React to Admin Kick
        const kicked = !!ySettings.get(`kick-${currentUser}`);
        if (kicked) {
          ySettings.delete(`kick-${currentUser}`);
          provider.disconnect();
          handleLeaveRoom();
          setKickedMessage("You have been kicked by the admin.");
        }
      };

      const handleFilesChange = () => {
        const keys = Array.from(yFiles.keys());
        setFiles(keys);

        // Auto-select first file if current active is deleted or none selected
        if (keys.length > 0) {
          setActiveFile((curr) => {
            if (!curr || !keys.includes(curr)) {
              return keys[0];
            }
            return curr;
          });
        }
      };

      ySettings.observe(handleSettingsChange);
      yFiles.observe(handleFilesChange);

      // Initialize default file if room is completely new
      if (yFiles.size === 0) {
        const defaultText = new Y.Text();
        defaultText.insert(0, "// Welcome to CollabEdit! Start coding here...\n");
        yFiles.set("index.js", defaultText);
      }

      // Initial populate
      handleSettingsChange();
      handleFilesChange();

      return () => {
        ySettings.unobserve(handleSettingsChange);
        yFiles.unobserve(handleFilesChange);
      };
    }
  }, [provider, ydoc, ySettings, yFiles, currentUser, handleLeaveRoom]);

  // Hook 3: Monaco Collaborative Binding
  useEffect(() => {
    if (editor && provider && activeFile) {
      try {
        const yText = yFiles.get(activeFile);
        if (yText) {
          const model = editor.getModel();
          if (model) {
            // Pre-fill the editor model immediately to prevent flickering during switch
            editor.setValue(yText.toString());

            const binding = new MonacoBinding(
              yText,
              model,
              new Set([editor]),
              provider.awareness,
            );

            return () => {
              try {
                binding.destroy();
              } catch (err) {
                console.warn("[Collab] Error destroying Monaco binding:", err);
              }
            };
          }
        }
      } catch (err) {
        console.warn("[Collab] Exception during Monaco binding setup:", err);
      }
    }
  }, [editor, provider, activeFile, yFiles]);

  // Reset editor instance and active file state on room change to prevent binding to unmounted elements
  useEffect(() => {
    setEditor(null);
    setActiveFile("");
    setFiles([]);
  }, [roomId]);

  // Reset editor instance when view changes (e.g. going to dashboard or back)
  useEffect(() => {
    setEditor(null);
  }, [currentView]);

  const handleLogout = () => {
    handleLeaveRoom();
    localStorage.removeItem("collab_user");
    setCurrentUser(null);
  };

  const handleUpdateUsername = async (newUsername) => {
    try {
      const res = await fetch(`${API_URL}/auth/update-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldUsername: currentUser, newUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Failed to update username", "error");
      } else {
        setCurrentUser(data.username);
        localStorage.setItem("collab_user", data.username);
        toast(`Username updated to ${data.username}`, "success");
      }
    } catch {
      toast("Connection to server failed. Username was not updated.", "error");
    }
  };

  const handleJoin = (selectedRoomId, name, password) => {
    setKickedMessage("");
    setVerificationError("");
    setRoomId(selectedRoomId);
    setRoomPassword(password);
    
    // Save previously joined room uniquely for this user
    if (currentUser) {
      localStorage.setItem(`collab_prev_room_id_${currentUser}`, selectedRoomId);
      if (password) {
        localStorage.setItem(`collab_prev_room_password_${currentUser}`, password);
      } else {
        localStorage.removeItem(`collab_prev_room_password_${currentUser}`);
      }
    }
    
    const url = new URL(window.location);
    url.searchParams.set("room", selectedRoomId);
    if (password) {
      url.searchParams.set("pw", password);
    } else {
      url.searchParams.delete("pw");
    }
    window.history.pushState({}, "", url);
  };

  const handleToggleRoomLock = () => {
    const nextLocked = !isRoomLocked;
    ySettings.set("room-locked", nextLocked);
    if (provider && provider.socket) {
      provider.socket.emit("toggle-room-lock", { roomId, isLocked: nextLocked, userName: currentUser });
    }
  };

  const handleDeleteRoom = async () => {
    const isConfirmed = await confirmAction("Are you sure you want to delete this room? All users will be kicked and document state will be removed.");
    if (!isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}`, {
        method: "DELETE",
        headers: {
          "X-Username": currentUser
        }
      });
      if (res.ok) {
        toast("Room deleted successfully", "success");
        handleLeaveRoom();
      } else {
        const errData = await res.json();
        toast("Failed to delete room: " + (errData.error || "Forbidden"), "error");
      }
    } catch (err) {
      toast("Error deleting room: " + err.message, "error");
    }
  };



  // Automatically switch to editor when joining a room
  useEffect(() => {
    if (roomId) {
      setCurrentView("editor");
    } else {
      setCurrentView("dashboard");
    }
  }, [roomId]);

  const fetchActiveRooms = async () => {
    try {
      const res = await fetch(`${API_URL}/rooms`);
      const data = await res.json();
      if (res.ok && data.rooms) {
        setActiveRooms(data.rooms);
      }
    } catch (err) {
      console.error("Failed to fetch active rooms:", err);
    }
  };

  // Poll for rooms list
  useEffect(() => {
    fetchActiveRooms();
    const interval = setInterval(fetchActiveRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  // Global keyboard shortcuts (Ctrl/Cmd + B, Ctrl/Cmd + S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentView !== "editor") return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleExportWorkspace();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentView, handleExportWorkspace]);

  // Reload authorization check
  useEffect(() => {
    const initCheck = async () => {
      if (roomId && currentUser && !provider) {
        setVerifying(true);
        try {
          const res = await fetch(`${API_URL}/rooms/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, password: roomPassword, userName: currentUser }),
          });
          const data = await res.json();
          if (!res.ok) {
            setRoomId(null);
            setRoomPassword(null);
            setVerificationError(data.error || "Access Denied");
            window.history.pushState({}, "", window.location.pathname);
          }
        } catch (err) {
          console.error("Verification error:", err);
        } finally {
          setVerifying(false);
        }
      }
    };
    initCheck();
  }, [roomId, currentUser, roomPassword, provider]);

  const handleShare = () => {
    // Generate clean link without password inside link
    const shareUrl = window.location.origin + window.location.pathname + `?room=${roomId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Collaborative File Management Handlers
  const handleCreateFile = (name) => {
    if (!name) return;
    if (files.includes(name)) {
      toast("A file with this name already exists.", "error");
      return;
    }

    const text = new Y.Text();
    text.insert(0, "// Start coding here...\n");
    yFiles.set(name, text);
    setActiveFile(name);
  };

  const handleCreateFolder = (name) => {
    if (!name) return;
    const placeholderPath = name + "/.keep";
    if (files.includes(placeholderPath)) {
      toast("A folder with this name already exists.", "error");
      return;
    }

    const text = new Y.Text();
    yFiles.set(placeholderPath, text);
  };

  const handleDeleteFileOrFolder = async (path, e) => {
    e.stopPropagation();
    const isDirectory = !yFiles.has(path);
    const prefix = path + "/";
    const filesToDelete = files.filter(
      (f) => f === path || f.startsWith(prefix)
    );

    if (filesToDelete.length === 0) return;

    if (files.length - filesToDelete.length < 1) {
      toast(
        isDirectory
          ? "Cannot delete this folder as it would leave the workspace empty. Please create a file outside this folder first."
          : "Cannot delete the last remaining file.", "error"
      );
      return;
    }

    const message = isDirectory
      ? `Are you sure you want to delete the folder '${path}' and all of its contents?`
      : `Are you sure you want to delete '${path}'?`;

    const isConfirmed = await confirmAction(message);
    if (isConfirmed) {
      ydoc.transact(() => {
        filesToDelete.forEach((f) => {
          yFiles.delete(f);
        });
      });

      if (filesToDelete.includes(activeFile)) {
        const remaining = files.filter((f) => !filesToDelete.includes(f));
        setActiveFile(remaining[0]);
      }
    }
  };

  // Upload handler for files / folder contents
  const handleUploadFile = (name, content) => {
    const yFiles = ydoc.getMap("files");
    const yText = new Y.Text();
    yText.insert(0, content);
    yFiles.set(name, yText);
  };

  const handleRenameFileOrFolder = (oldPath) => {
    const isDirectory = !yFiles.has(oldPath);
    const itemType = isDirectory ? "folder" : "file";
    const newPath = prompt(`Enter new name/path for this ${itemType}:`, oldPath);
    if (!newPath || newPath.trim() === "" || newPath === oldPath) return;

    const trimmedNewPath = newPath.trim();

    if (isDirectory) {
      const prefix = oldPath + "/";
      const filesToRename = Array.from(yFiles.keys()).filter(
        (key) => key === oldPath || key.startsWith(prefix)
      );

      if (filesToRename.length === 0) {
        toast("Folder is empty or not found.", "error");
        return;
      }

      ydoc.transact(() => {
        filesToRename.forEach((oldName) => {
          const suffix = oldName.substring(oldPath.length);
          const newName = trimmedNewPath + suffix;

          const oldText = yFiles.get(oldName);
          if (oldText) {
            const newText = new Y.Text();
            newText.insert(0, oldText.toString());
            yFiles.set(newName, newText);
            yFiles.delete(oldName);
            
            if (activeFile === oldName) {
              setActiveFile(newName);
            }
          }
        });
      });
    } else {
      if (yFiles.has(trimmedNewPath)) {
        toast("A file with this name already exists.", "error");
        return;
      }

      const oldText = yFiles.get(oldPath);
      if (oldText) {
        const newText = new Y.Text();
        newText.insert(0, oldText.toString());
        yFiles.set(trimmedNewPath, newText);
        yFiles.delete(oldPath);
        
        if (activeFile === oldPath) {
          setActiveFile(trimmedNewPath);
        }
      }
    }
  };

  const handleSendMessage = useCallback(
    (msgContent) => {
      if (!provider || !provider.socket) return;
      const messageId = Math.random().toString(36).substring(2, 11);
      const msgData = {
        id: messageId,
        sender: currentUser,
        text: msgContent.text || "",
        type: msgContent.type || "text",
        image: msgContent.image || null,
        timestamp: Date.now(),
      };
      provider.socket.emit("send-chat-message", msgData);
    },
    [provider, currentUser]
  );

  const handleDeleteChatMessage = useCallback(
    (messageId) => {
      if (!provider || !provider.socket) return;
      provider.socket.emit("delete-chat-message", { messageId, userName: currentUser });
    },
    [provider, currentUser]
  );

  const handleMarkAllMessagesRead = useCallback(() => {
    if (!provider || !provider.socket) return;
    provider.socket.emit("mark-all-read", { userName: currentUser });
    setUnreadChatCount(0);
  }, [provider, currentUser]);

  const handleMarkSingleMessageRead = useCallback(
    (messageId) => {
      if (!provider || !provider.socket) return;
      provider.socket.emit("mark-message-read", { messageId, userName: currentUser });
    },
    [provider, currentUser]
  );

  // Admin Management Handlers
  const handleToggleLock = (targetUser, e) => {
    e.stopPropagation();
    const key = `readonly-${targetUser}`;
    const currentlyLocked = !!ySettings.get(key);
    ySettings.set(key, !currentlyLocked);
  };

  const handleKickUser = async (targetUser, e) => {
    e.stopPropagation();
    const isConfirmed = await confirmAction(`Are you sure you want to kick '${targetUser}' from this session?`);
    if (isConfirmed) {
      ySettings.set(`kick-${targetUser}`, true);
    }
  };

  // Render Logic
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  if (verifying) {
    return (
      <div className="h-screen w-full bg-[#030712] flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verifying Room Access...</span>
      </div>
    );
  }

  if (currentView === "dashboard") {
    return (
      <JoinScreen
        handleJoin={handleJoin}
        kickedMessage={kickedMessage || verificationError}
        activeRooms={activeRooms}
        onRefreshRooms={fetchActiveRooms}
        currentUser={currentUser}
        onLogout={handleLogout}
        activeSessionRoomId={roomId}
        onResumeSession={() => setCurrentView("editor")}
        onUpdateUsername={handleUpdateUsername}
      />
    );
  }

  return (
    <div className="h-screen w-full bg-[#090d16] text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      <Header
        connectionStatus={connectionStatus}
        isReadOnly={isReadOnly}
        handleShare={handleShare}
        copied={copied}
        onLeaveRoom={handleLeaveRoom}
        onLogout={handleLogout}
        currentUser={currentUser}
        onGoToDashboard={() => setCurrentView("dashboard")}
        roomId={roomId}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        isSidebarCollapsed={isSidebarCollapsed}
        onUpdateUsername={handleUpdateUsername}
      />

      <div className="flex-1 w-full flex overflow-hidden relative">
        <Sidebar
          files={files}
          activeFile={activeFile}
          onSelectFile={setActiveFile}
          onDeleteFile={handleDeleteFileOrFolder}
          onRenameFileOrFolder={handleRenameFileOrFolder}
          onExportWorkspace={handleExportWorkspace}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onUploadFile={handleUploadFile}
          members={members}
          onlineUsers={onlineUsers}
          userName={currentUser}
          owner={roomOwner}
          isRoomLocked={isRoomLocked}
          onToggleRoomLock={handleToggleRoomLock}
          onDeleteRoom={handleDeleteRoom}
          ySettings={ySettings}
          handleToggleLock={handleToggleLock}
          handleKickUser={handleKickUser}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <EditorWorkspace
          activeFile={activeFile}
          isReadOnly={isReadOnly}
          handleMount={handleMount}
          editor={editor}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          onExportWorkspace={handleExportWorkspace}
          roomId={roomId}
          currentUser={currentUser}
          roomOwner={roomOwner}
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          onDeleteChatMessage={handleDeleteChatMessage}
          onMarkAllMessagesRead={handleMarkAllMessagesRead}
          onMarkSingleMessageRead={handleMarkSingleMessageRead}
          isChatOpen={isChatOpen}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          unreadChatCount={unreadChatCount}
        />
      </div>
    </div>
  );
}

export default App;
