import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

function ChatPanel({
  roomId,
  currentUser,
  roomOwner,
  messages = [],
  onSendMessage,
  onDeleteMessage,
  onMarkAllRead,
  onMarkRead,
  isOpen,
  onToggleOpen,
}) {
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [deletePromptMsg, setDeletePromptMsg] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [hiddenMessageIds, setHiddenMessageIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`collab_editor_hidden_msgs_${roomId}_${currentUser}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`collab_editor_hidden_msgs_${roomId}_${currentUser}`);
      setHiddenMessageIds(stored ? JSON.parse(stored) : []);
    } catch (e) {
      setHiddenMessageIds([]);
    }
  }, [roomId, currentUser]);

  const visibleMessages = messages.filter((msg) => !hiddenMessageIds.includes(msg.id));

  // Auto-scroll to bottom on new messages or opening the panel
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [visibleMessages, isOpen]);

  // Mark all messages read on panel open or on new message arrival while open
  useEffect(() => {
    if (isOpen && visibleMessages.length > 0) {
      // Find any messages sent by others that have not been read by currentUser
      const unread = visibleMessages.filter(
        (m) => !m.isDeleted && m.sender !== currentUser && (!m.readBy || !m.readBy.includes(currentUser))
      );
      if (unread.length > 0) {
        onMarkAllRead();
      }
    }
  }, [visibleMessages, isOpen, currentUser, onMarkAllRead]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    onSendMessage({
      text: inputText.trim(),
      type: selectedImage ? "image" : "text",
      image: selectedImage || null,
    });

    setInputText("");
    setSelectedImage(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (limit Base64 image to 2MB to keep WebSockets lightweight)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const getTickStatus = (msg) => {
    if (msg.sender !== currentUser) return null;

    const othersRead = (msg.readBy || []).filter((u) => u !== currentUser).length > 0;
    const othersDelivered = (msg.deliveredTo || []).filter((u) => u !== currentUser).length > 0;

    if (othersRead) {
      // Double blue ticks
      return (
        <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M2 12l5 5 11-11" opacity="0.6" />
          <path d="M7 12l5 5 10-10" />
        </svg>
      );
    } else if (othersDelivered) {
      // Double grey ticks
      return (
        <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M2 12l5 5 11-11" opacity="0.6" />
          <path d="M7 12l5 5 10-10" />
        </svg>
      );
    } else {
      // Single tick (sent to server)
      return (
        <svg className="w-3.5 h-3.5 text-slate-450" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!isOpen) return null;

  const isHost = roomOwner?.toLowerCase() === currentUser?.toLowerCase();

  return (
    <div className="w-80 sm:w-90 flex flex-col h-full bg-[#090d16] border-l border-slate-900 flex-shrink-0 relative z-30 transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-900 flex items-center justify-between bg-slate-950/40">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Room Lobby Chat
          </h3>
          <span className="text-[10px] text-slate-500 font-semibold">{roomId}</span>
        </div>
        <button
          onClick={onToggleOpen}
          className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          title="Close Chat Panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0 bg-[#070b12] bg-[radial-gradient(#80808003_1px,transparent_1px)] bg-[size:16px_16px]">
        {visibleMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-655">
            <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">No Messages Yet</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">Send text messages or photos to other workspace members.</p>
          </div>
        ) : (
          visibleMessages.map((msg, idx) => {
            const isMe = msg.sender === currentUser;
            const isAdmin = msg.sender === roomOwner;

            // Resolve role-based class styling (admin, me, rest)
            let bubbleBgClass = "";
            let textFontClass = "";

            if (isMe) {
              // Current User (Me)
              bubbleBgClass = "bg-[#0b543e] text-slate-100 rounded-tr-none";
              textFontClass = "font-sans font-medium text-slate-100";
            } else if (isAdmin) {
              // Admin/Host (not Me)
              bubbleBgClass = "bg-[#211a3d] text-indigo-100 rounded-tl-none border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]";
              textFontClass = "font-sans font-bold tracking-wide italic text-indigo-200";
            } else {
              // Rest Users (Other Room Members)
              bubbleBgClass = "bg-[#182235] text-slate-200 rounded-tl-none border border-slate-900/40";
              textFontClass = "font-sans font-normal text-slate-300";
            }

            return (
              <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"} group`}>
                <div className={`text-[10px] font-semibold text-slate-500 mb-0.5 px-1 ${isMe ? "text-right" : "text-left"}`}>
                  {msg.sender} {isAdmin && <span className="text-[8px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1 rounded font-black uppercase">Host</span>}
                </div>

                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl relative shadow-md ${bubbleBgClass}`}
                >
                  {/* Delete Button Menu (visible on hover, z-10 overlays image attachments) */}
                  {!msg.isDeleted && (
                    <button
                      onClick={() => setDeletePromptMsg(msg)}
                      className="z-10 absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-950/80 hover:bg-slate-950 text-slate-400 hover:text-rose-400 transition cursor-pointer shadow-lg"
                      title="Delete Message"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  {msg.isDeleted ? (
                    <span className="text-slate-500 text-xs italic flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      {isMe ? "You unsent this message" : "This message was deleted"}
                    </span>
                  ) : (
                    <>
                      {msg.type === "image" && msg.image && (
                        <div className="relative mb-1 rounded-lg overflow-hidden border border-slate-950 group/img">
                          <img
                            src={msg.image}
                            alt="Shared attachment"
                            className="max-w-full max-h-48 object-cover cursor-zoom-in hover:brightness-90 transition"
                            onClick={() => setFullscreenImage(msg.image)}
                          />
                          <a
                            href={msg.image}
                            download={`collab_edit_image_${Date.now()}.png`}
                            className="absolute bottom-2 right-2 opacity-0 group-hover/img:opacity-100 p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-950 text-slate-200 hover:text-white transition cursor-pointer shadow-lg z-10 flex items-center justify-center"
                            title="Download Image"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        </div>
                      )}
                      <p className={`text-xs break-words whitespace-pre-wrap pr-4 ${textFontClass}`}>{msg.text}</p>
                    </>
                  )}

                  {/* Status row: time and tick mark */}
                  <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[9px] text-slate-400 font-medium">
                    <span>{formatMessageTime(msg.timestamp)}</span>
                    {!msg.isDeleted && getTickStatus(msg)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview bar before send */}
      {selectedImage && (
        <div className="p-3 border-t border-slate-900 bg-slate-950/80 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-150">
          <div className="relative flex items-center gap-3">
            <img src={selectedImage} alt="Attachment preview" className="w-12 h-12 object-cover rounded-lg border border-slate-800" />
            <div>
              <span className="block text-[10px] text-slate-350 font-bold uppercase tracking-wider">Photo Ready</span>
              <span className="block text-[9px] text-slate-500 font-semibold">Will be shared in lobby room</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-900 bg-slate-950/40 flex items-end gap-2">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-900 text-slate-450 hover:text-slate-200 transition cursor-pointer flex items-center justify-center flex-shrink-0"
          title="Attach Photo (Max 2MB)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <div className="flex-1 min-h-0 relative">
          <textarea
            rows="1"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Type message..."
            className="w-full pl-3 pr-3 py-2 rounded-xl bg-slate-900/60 border border-slate-900 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/10 resize-none font-sans max-h-24 overflow-y-auto custom-scrollbar"
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() && !selectedImage}
          className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition flex items-center justify-center flex-shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>

      {/* Lightbox / Fullscreen Image Overlay */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <a
              href={fullscreenImage}
              download={`collab_edit_image_${Date.now()}.png`}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
            <button
              onClick={() => setFullscreenImage(null)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-250 transition text-xs font-bold cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
          <img src={fullscreenImage} alt="Shared fullscreen attachment" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}

      {/* WhatsApp-Style Delete Confirmation Modal */}
      {deletePromptMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xs font-bold text-slate-100 mb-1">Delete message?</h3>
              <p className="text-[10px] text-slate-500 leading-normal mb-5">
                {deletePromptMsg.type === "image" ? "This image attachment" : `"${deletePromptMsg.text.length > 25 ? deletePromptMsg.text.slice(0, 25) + "..." : deletePromptMsg.text}"`} will be removed.
              </p>

              <div className="flex flex-col gap-1.5">
                {(deletePromptMsg.sender === currentUser || roomOwner?.toLowerCase() === currentUser?.toLowerCase()) && (
                  <button
                    onClick={() => {
                      onDeleteMessage(deletePromptMsg.id);
                      setDeletePromptMsg(null);
                    }}
                    className="w-full py-2 rounded-xl text-[10px] font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/10 transition active:scale-98 cursor-pointer"
                  >
                    Delete for Everyone
                  </button>
                )}

                <button
                  onClick={() => {
                    const updated = [...hiddenMessageIds, deletePromptMsg.id];
                    setHiddenMessageIds(updated);
                    localStorage.setItem(`collab_editor_hidden_msgs_${roomId}_${currentUser}`, JSON.stringify(updated));
                    setDeletePromptMsg(null);
                  }}
                  className="w-full py-2 rounded-xl text-[10px] font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 transition active:scale-98 cursor-pointer"
                >
                  Delete for Me
                </button>

                <button
                  onClick={() => setDeletePromptMsg(null)}
                  className="w-full py-2 rounded-xl text-[10px] font-bold bg-transparent border border-slate-800 hover:bg-slate-900 text-slate-400 transition active:scale-98 cursor-pointer mt-0.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ChatPanel.propTypes = {
  roomId: PropTypes.string.isRequired,
  currentUser: PropTypes.string.isRequired,
  roomOwner: PropTypes.string,
  messages: PropTypes.array.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onDeleteMessage: PropTypes.func.isRequired,
  onMarkAllRead: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggleOpen: PropTypes.func.isRequired,
};

export default ChatPanel;
