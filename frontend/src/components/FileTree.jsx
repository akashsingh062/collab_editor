import { useState } from "react";
import PropTypes from "prop-types";

// Helper to get file-specific icons
const getFileIcon = (filename) => {
  if (!filename || typeof filename !== "string") {
    return (
      <span className="text-[10px] font-bold text-slate-400 bg-slate-400/10 w-5 h-5 rounded flex items-center justify-center font-mono">
        📄
      </span>
    );
  }
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return (
        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 w-5 h-5 rounded flex items-center justify-center font-mono">
          JS
        </span>
      );
    case "ts":
    case "tsx":
      return (
        <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 w-5 h-5 rounded flex items-center justify-center font-mono">
          TS
        </span>
      );
    case "py":
      return (
        <span className="text-[10px] font-bold text-sky-400 bg-sky-400/10 w-5 h-5 rounded flex items-center justify-center font-mono">
          PY
        </span>
      );
    case "html":
      return (
        <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 w-5 h-5 rounded flex items-center justify-center font-mono">
          HT
        </span>
      );
    case "css":
      return (
        <span className="text-[10px] font-bold text-teal-400 bg-teal-400/10 w-5 h-5 rounded flex items-center justify-center font-mono">
          CS
        </span>
      );
    case "json":
      return (
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 w-5 h-5 rounded flex items-center justify-center font-mono">
          {"{}"}
        </span>
      );
    case "md":
      return (
        <span className="text-[10px] font-bold text-violet-400 bg-violet-400/10 w-5 h-5 rounded flex items-center justify-center font-mono">
          MD
        </span>
      );
    case "java":
      return (
        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 w-5 h-5 rounded flex items-center justify-center font-mono">
          JV
        </span>
      );
    case "cpp":
    case "c":
    case "h":
    case "hpp":
      return (
        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 w-5 h-5 rounded flex items-center justify-center font-mono">
          C+
        </span>
      );
    case "go":
      return (
        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 w-5 h-5 rounded flex items-center justify-center font-mono">
          GO
        </span>
      );
    case "rs":
      return (
        <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 w-5 h-5 rounded flex items-center justify-center font-mono">
          RS
        </span>
      );
    default:
      return (
        <span className="text-[10px] font-bold text-slate-400 bg-slate-400/10 w-5 h-5 rounded flex items-center justify-center font-mono">
          TXT
        </span>
      );
  }
};

// Tree-building utility
const buildFileTree = (paths) => {
  const root = { name: "root", isDirectory: true, children: {} };
  if (!paths || !Array.isArray(paths)) return root;

  paths.forEach((path) => {
    if (typeof path !== "string") return;
    const parts = path.split("/");
    let current = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      if (!isLast) {
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            isDirectory: true,
            children: {},
            path: parts.slice(0, index + 1).join("/"),
          };
        }
        current = current.children[part];
      } else {
        if (part !== ".keep") {
          current.children[part] = {
            name: part,
            isDirectory: false,
            path: path,
          };
        }
      }
    });
  });

  return root;
};

function FileNode({
  node,
  activeFile,
  onSelect,
  onDelete,
  onRename,
  onCreateFile,
  onCreateFolder,
  expandedFolders,
  onToggleFolder,
  filesCount
}) {
  const [inlineFormType, setInlineFormType] = useState(null); // "file" | "folder" | null
  const [inlineName, setInlineName] = useState("");

  const handleInlineSubmit = (e) => {
    e.preventDefault();
    const cleanName = inlineName.trim();
    if (!cleanName) {
      setInlineFormType(null);
      return;
    }

    const fullPath = `${node.path}/${cleanName}`;
    if (inlineFormType === "file") {
      onCreateFile(fullPath);
    } else {
      onCreateFolder(fullPath);
    }

    setInlineFormType(null);
    setInlineName("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setInlineFormType(null);
      setInlineName("");
    }
  };

  if (!node.isDirectory) {
    const isActive = activeFile === node.path;
    return (
      <div
        onClick={() => onSelect(node.path)}
        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-150 group cursor-pointer pl-6 ${
          isActive
            ? "bg-blue-600/10 border-blue-500/30 text-white font-medium shadow-sm"
            : "bg-slate-900/20 border-slate-800/40 hover:bg-slate-900/40 hover:border-slate-800 text-slate-400 hover:text-slate-200"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {getFileIcon(node.name)}
          <span className="text-sm truncate max-w-[140px]">{node.name}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => onRename(node.path, e)}
            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-blue-400 transition cursor-pointer flex-shrink-0"
            title="Rename file"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          {filesCount > 1 && (
            <button
              onClick={(e) => onDelete(node.path, e)}
              className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition cursor-pointer flex-shrink-0"
              title="Delete file"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  const isExpanded = expandedFolders[node.path] !== false; // Default expanded
  const childKeys = Object.keys(node.children).sort((a, b) => {
    const aIsDir = node.children[a].isDirectory;
    const bIsDir = node.children[b].isDirectory;
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col gap-1">
      {/* Folder Header */}
      <div
        className="flex items-center justify-between rounded-xl hover:bg-slate-900/40 text-slate-350 hover:text-slate-100 cursor-pointer font-semibold text-sm transition group"
      >
        <div onClick={() => onToggleFolder(node.path)} className="flex items-center gap-2 p-2 flex-1 min-w-0">
          <span className="text-slate-500">
            {isExpanded ? (
              <svg className="w-3.5 h-3.5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </span>
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="truncate max-w-[110px]">{node.name}</span>
        </div>

        {/* Action icons */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 mr-2 transition-all">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setInlineFormType("file");
              setInlineName("");
              if (!isExpanded) onToggleFolder(node.path);
            }}
            className="p-1 rounded hover:bg-slate-805 text-slate-500 hover:text-blue-400 transition cursor-pointer flex-shrink-0"
            title="New File inside this folder"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setInlineFormType("folder");
              setInlineName("");
              if (!isExpanded) onToggleFolder(node.path);
            }}
            className="p-1 rounded hover:bg-slate-805 text-slate-500 hover:text-amber-400 transition cursor-pointer flex-shrink-0"
            title="New Folder inside this folder"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          <button
            onClick={(e) => onRename(node.path, e)}
            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-blue-400 transition cursor-pointer flex-shrink-0"
            title="Rename folder"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          <button
            onClick={(e) => onDelete(node.path, e)}
            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition cursor-pointer flex-shrink-0"
            title="Delete folder"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Folder Children */}
      {isExpanded && (
        <div className="pl-3 border-l border-slate-900/60 ml-3.5 flex flex-col gap-1.5 py-0.5">
          {/* Inline Input Field */}
          {inlineFormType && (
            <form
              onSubmit={handleInlineSubmit}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 p-1.5 bg-slate-950 border border-blue-500/30 rounded-xl mx-1"
            >
              {inlineFormType === "file" ? (
                <span className="text-[9px] font-bold text-blue-400 bg-blue-400/10 w-4.5 h-4.5 rounded flex items-center justify-center font-mono flex-shrink-0">
                  +F
                </span>
              ) : (
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              )}
              <input
                type="text"
                autoFocus
                value={inlineName}
                onChange={(e) => setInlineName(e.target.value)}
                onBlur={handleInlineSubmit}
                onKeyDown={handleKeyDown}
                placeholder={inlineFormType === "file" ? "file.txt" : "new-folder"}
                className="flex-1 min-w-0 bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none py-0.5"
              />
            </form>
          )}

          {childKeys.map((key) => (
            <FileNode
              key={node.children[key].path || key}
              node={node.children[key]}
              activeFile={activeFile}
              onSelect={onSelect}
              onDelete={onDelete}
              onRename={onRename}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              filesCount={filesCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

FileNode.propTypes = {
  node: PropTypes.object.isRequired,
  activeFile: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
  onCreateFile: PropTypes.func.isRequired,
  onCreateFolder: PropTypes.func.isRequired,
  expandedFolders: PropTypes.object.isRequired,
  onToggleFolder: PropTypes.func.isRequired,
  filesCount: PropTypes.number.isRequired,
};

function FileTree({
  files,
  activeFile,
  onSelectFile,
  onDeleteFile,
  onRenameFileOrFolder,
  onCreateFile,
  onCreateFolder
}) {
  const [expandedFolders, setExpandedFolders] = useState({});

  const handleToggleFolder = (folderPath) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: prev[folderPath] === false ? true : false,
    }));
  };

  const tree = buildFileTree(files);
  const rootKeys = Object.keys(tree.children).sort((a, b) => {
    const aIsDir = tree.children[a].isDirectory;
    const bIsDir = tree.children[b].isDirectory;
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col gap-1.5">
      {rootKeys.map((key) => (
        <FileNode
          key={tree.children[key].path || key}
          node={tree.children[key]}
          activeFile={activeFile}
          onSelect={onSelectFile}
          onDelete={onDeleteFile}
          onRename={onRenameFileOrFolder}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          expandedFolders={expandedFolders}
          onToggleFolder={handleToggleFolder}
          filesCount={files.length}
        />
      ))}
    </div>
  );
}

FileTree.propTypes = {
  files: PropTypes.array.isRequired,
  activeFile: PropTypes.string.isRequired,
  onSelectFile: PropTypes.func.isRequired,
  onDeleteFile: PropTypes.func.isRequired,
  onRenameFileOrFolder: PropTypes.func.isRequired,
  onCreateFile: PropTypes.func.isRequired,
  onCreateFolder: PropTypes.func.isRequired,
};

export default FileTree;
/* eslint-disable-next-line react-refresh/only-export-components */
export { getFileIcon };
