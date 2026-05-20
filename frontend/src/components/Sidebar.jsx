import { useRef, useState } from "react";
import PropTypes from "prop-types";
import FileTree from "./FileTree";

const isOwnerMatch = (owner, userName) => {
  if (typeof owner !== "string" || typeof userName !== "string") return false;
  return owner.toLowerCase() === userName.toLowerCase();
};

function Sidebar({
  files,
  activeFile,
  onSelectFile,
  onDeleteFile,
  onRenameFileOrFolder,
  onExportWorkspace,
  onCreateFile,
  onCreateFolder,
  onUploadFile,
  members,
  onlineUsers,
  userName,
  owner,
  isRoomLocked,
  onToggleRoomLock,
  onDeleteRoom,
  ySettings,
  handleToggleLock,
  handleKickUser,
  isCollapsed,
  onToggleCollapse,
}) {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // Local UI states for creation forms
  const [showNewFileForm, setShowNewFileForm] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const handleFilesUploadChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach((file) => {
      const name = file.name;
      const reader = new FileReader();
      reader.onload = (event) => {
        onUploadFile(name, event.target.result);
      };
      reader.readAsText(file);
    });
    e.target.value = ""; // Reset
  };

  const handleFolderUploadChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach((file) => {
      const name = file.webkitRelativePath || file.name;
      
      // Filter directories we don't want (dependencies/system/hidden files)
      if (
        name.includes("node_modules/") ||
        name.includes(".git/") ||
        name.includes(".github/") ||
        name.includes(".DS_Store")
      ) {
        return;
      }

      // Filter binaries
      const ext = name.split(".").pop().toLowerCase();
      const binaries = [
        "png", "jpg", "jpeg", "gif", "ico", "pdf", "zip", "tar", "gz", 
        "mp4", "mp3", "woff", "woff2", "ttf", "eot", "exe", "dll"
      ];
      if (binaries.includes(ext)) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        onUploadFile(name, event.target.result);
      };
      reader.readAsText(file);
    });
    e.target.value = ""; // Reset
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const items = e.dataTransfer.items;
    if (!items) return;

    const traverseFileTree = async (entry, path = "") => {
      if (entry.isFile) {
        entry.file((file) => {
          // Filter binaries
          const ext = file.name.split(".").pop().toLowerCase();
          const binaries = [
            "png", "jpg", "jpeg", "gif", "ico", "pdf", "zip", "tar", "gz", 
            "mp4", "mp3", "woff", "woff2", "ttf", "eot", "exe", "dll"
          ];
          if (binaries.includes(ext)) return;

          const reader = new FileReader();
          reader.onload = (event) => {
            const relativePath = (path ? path + "/" : "") + file.name;
            onUploadFile(relativePath, event.target.result);
          };
          reader.readAsText(file);
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const readAllEntries = async () => {
          let allEntries = [];
          let results = await new Promise((resolve) => {
            dirReader.readEntries((res) => resolve(res));
          });
          while (results.length > 0) {
            allEntries = allEntries.concat(results);
            results = await new Promise((resolve) => {
              dirReader.readEntries((res) => resolve(res));
            });
          }
          return allEntries;
        };

        const entries = await readAllEntries();
        if (entries.length === 0) {
          // Represent empty folder via placeholder `.keep` file
          const folderPlaceholderPath = (path ? path + "/" : "") + entry.name + "/.keep";
          onUploadFile(folderPlaceholderPath, "");
        } else {
          for (const childEntry of entries) {
            await traverseFileTree(childEntry, (path ? path + "/" : "") + entry.name);
          }
        }
      }
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          await traverseFileTree(entry);
        }
      }
    }
  };

  const handleFileSubmit = (e) => {
    e.preventDefault();
    const name = newFileName.trim();
    if (name) {
      onCreateFile(name);
      setNewFileName("");
      setShowNewFileForm(false);
    }
  };

  const handleFolderSubmit = (e) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (name) {
      onCreateFolder(name);
      setNewFolderName("");
      setShowNewFolderForm(false);
    }
  };

  return (
    <aside
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`absolute md:relative left-0 top-0 bottom-0 h-full bg-slate-950/95 md:bg-slate-950/40 border-slate-900 flex flex-col z-30 md:z-10 select-none transition-all duration-300 ease-in-out shrink-0 ${isCollapsed ? "w-0 border-r-0" : "w-80 border-r"}`}
    >
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 z-50 cursor-pointer shadow-md transition-colors"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className={`flex flex-col h-full overflow-hidden transition-opacity duration-200 ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <div className="w-80 h-full flex flex-col min-w-[320px]">
      
      {/* Hidden File Inputs */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFilesUploadChange}
        className="hidden"
      />
      <input
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        ref={folderInputRef}
        onChange={handleFolderUploadChange}
        className="hidden"
      />

      {/* Files Panel */}
      <div className="flex-1 flex flex-col min-h-0 border-b border-slate-900">
        <div className="p-4 border-b border-slate-900 bg-slate-950/20 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Files ({files.filter(f => !f.endsWith(".keep")).length})
          </h2>
          
          <div className="flex items-center gap-1">
            {/* Create File Button */}
            <button
              onClick={() => {
                setShowNewFileForm(!showNewFileForm);
                setShowNewFolderForm(false);
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="New File"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </button>

            {/* Create Folder Button */}
            <button
              onClick={() => {
                setShowNewFolderForm(!showNewFolderForm);
                setShowNewFileForm(false);
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="New Folder"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v4m-2-2h4" />
              </svg>
            </button>

            {/* Upload Files Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="Upload Files from PC"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>

            {/* Upload Folder Button */}
            <button
              onClick={() => folderInputRef.current?.click()}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="Upload Folder from PC"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2zM4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>

            {/* Export Workspace Button */}
            <button
              onClick={onExportWorkspace}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="Export Workspace as ZIP"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        </div>

        {showNewFileForm && (
          <form onSubmit={handleFileSubmit} className="p-3 bg-slate-950/60 border-b border-slate-900/60 flex items-center gap-2">
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. app.py, src/index.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Create
            </button>
          </form>
        )}

        {showNewFolderForm && (
          <form onSubmit={handleFolderSubmit} className="p-3 bg-slate-950/60 border-b border-slate-900/60 flex items-center gap-2">
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. components, src/utils"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Create
            </button>
          </form>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <FileTree
            files={files}
            activeFile={activeFile}
            onSelectFile={onSelectFile}
            onDeleteFile={onDeleteFile}
            onRenameFileOrFolder={onRenameFileOrFolder}
            onCreateFile={onCreateFile}
            onCreateFolder={onCreateFolder}
          />
        </div>
      </div>

      {/* Collaborators Panel */}
      <div className="h-[280px] flex flex-col min-h-0">
        <div className="p-4 border-b border-slate-900 bg-slate-950/20 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Collaborators ({members.length})
          </h2>
          {isOwnerMatch(owner, userName) && (
            <button
              onClick={onToggleRoomLock}
              className={`px-2 py-0.5 rounded transition text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                isRoomLocked
                  ? "bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
              title={isRoomLocked ? "Unlock room (allow new joins)" : "Lock room (block new joins)"}
            >
              {isRoomLocked ? "🔒 Locked" : "🔓 Open"}
            </button>
          )}
        </div>

        <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-2">
          {(() => {
            const membersList = Array.isArray(members) ? members : [];
            const onlineList = Array.isArray(onlineUsers) ? onlineUsers : [];
            const cleanMembers = membersList.filter((m) => typeof m === "string" && m.trim() !== "");

            return cleanMembers
              .sort((a, b) => {
                const aOnline = onlineList.includes(a);
                const bOnline = onlineList.includes(b);
                if (aOnline && !bOnline) return -1;
                if (!aOnline && bOnline) return 1;
                return a.localeCompare(b);
              })
              .map((member, index) => {
                const isOnline = onlineList.includes(member);
                const isLocalUser = member === userName;
                const isTargetAdmin = owner === member;
                const isTargetLocked = ySettings && typeof ySettings.get === "function" ? !!ySettings.get(`readonly-${member}`) : false;
                const isLocalUserAdmin = isOwnerMatch(owner, userName);

                // Resolve styles for each role dynamically
                let containerClass = "";
                let nameFontClass = "";
                let roleFontClass = "";

                if (isLocalUser) {
                  // Current Local User (Me)
                  containerClass = isOnline
                    ? "bg-[#0b543e]/20 border-[#0b543e]/40 hover:bg-[#0b543e]/30 hover:border-[#0b543e]/50"
                    : "bg-[#0b543e]/10 border-[#0b543e]/20 opacity-70 hover:opacity-90";
                  nameFontClass = "font-sans font-semibold text-slate-100";
                  roleFontClass = "text-emerald-450 font-bold uppercase tracking-wider text-[9px]";
                } else if (isTargetAdmin) {
                  // Room Owner / Admin (Host)
                  containerClass = isOnline
                    ? "bg-indigo-950/30 border-indigo-500/30 hover:bg-indigo-950/50 hover:border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.08)]"
                    : "bg-indigo-950/15 border-indigo-500/20 opacity-70 hover:opacity-90";
                  nameFontClass = "font-sans font-bold italic tracking-wide text-indigo-200";
                  roleFontClass = "text-indigo-405 font-extrabold uppercase tracking-wider text-[9px]";
                } else {
                  // Rest of Users (Guests)
                  containerClass = isOnline
                    ? "bg-slate-900/40 border-slate-800/40 hover:bg-slate-900/60 hover:border-slate-800"
                    : "bg-slate-950/20 border-slate-900/40 hover:bg-slate-950/40 hover:border-slate-900 opacity-55 hover:opacity-80";
                  nameFontClass = "font-sans font-normal text-slate-300";
                  roleFontClass = "text-slate-500 font-semibold text-[9px]";
                }

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

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all duration-150 group ${containerClass}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-slate-950 relative border-2 border-slate-900 flex-shrink-0"
                        style={{ backgroundColor: getDeterministicColor(member) }}
                      >
                        {member.charAt(0).toUpperCase()}
                        {isTargetAdmin && (
                          <span className="absolute -top-1 -right-1 bg-amber-500 p-0.5 rounded-full border border-slate-950 text-slate-950" title="Admin">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm truncate max-w-[110px] ${nameFontClass}`}>
                            {member}
                          </span>
                          {isTargetLocked && (
                            <svg className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Locked (Read-Only)">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                          {/* Online/Offline Status Indicator */}
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-600"
                            }`}
                            title={isOnline ? "Online" : "Offline"}
                          />
                        </div>
                        <span className={`truncate text-[10px] ${roleFontClass}`}>
                          {isLocalUser ? "You" : isTargetAdmin ? "Host Admin" : "Collaborator"}
                        </span>
                      </div>
                    </div>

                    {/* Admin Actions on guest users */}
                    {isLocalUserAdmin && !isLocalUser && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleToggleLock(member, e)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            isTargetLocked
                              ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                              : "hover:bg-slate-800 text-slate-500 hover:text-slate-200"
                          }`}
                          title={isTargetLocked ? "Unlock typing (Make Read-Write)" : "Lock typing (Make Read-Only)"}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d={
                                isTargetLocked
                                  ? "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                                  : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z"
                              }
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleKickUser(member, e)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="Kick user from room"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              });
          })()}
        </div>
      </div>

      {/* Danger Zone: Host Delete Room */}
      {isOwnerMatch(owner, userName) && (
        <div className="p-4 border-t border-slate-900 bg-slate-950/40 flex flex-col gap-2">
          <button
            onClick={onDeleteRoom}
            className="w-full py-2 bg-gradient-to-r from-red-900/60 to-rose-700/60 hover:from-red-800/80 hover:to-rose-600/80 text-rose-100 border border-rose-800/40 text-xs font-semibold rounded-lg shadow transition cursor-pointer flex items-center justify-center gap-1.5"
            title="Delete Room permanently and kick all users"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Room (Host)
          </button>
        </div>
      )}
        </div>
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  files: PropTypes.array.isRequired,
  activeFile: PropTypes.string,
  onSelectFile: PropTypes.func.isRequired,
  onDeleteFile: PropTypes.func.isRequired,
  onRenameFileOrFolder: PropTypes.func.isRequired,
  onExportWorkspace: PropTypes.func.isRequired,
  onCreateFile: PropTypes.func.isRequired,
  onCreateFolder: PropTypes.func.isRequired,
  onUploadFile: PropTypes.func.isRequired,
  members: PropTypes.array.isRequired,
  onlineUsers: PropTypes.array.isRequired,
  userName: PropTypes.string.isRequired,
  owner: PropTypes.string,
  isRoomLocked: PropTypes.bool.isRequired,
  onToggleRoomLock: PropTypes.func.isRequired,
  onDeleteRoom: PropTypes.func.isRequired,
  ySettings: PropTypes.object.isRequired,
  handleToggleLock: PropTypes.func.isRequired,
  handleKickUser: PropTypes.func.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
};

export default Sidebar;
