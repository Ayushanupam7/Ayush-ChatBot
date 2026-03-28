import React, { useState, useEffect } from "react";
import { db } from "../firebase_config";
import "./SessionHistory.css";
import {
  collection,
  query,
  getDocs,
  orderBy,
  writeBatch,
  doc
} from "firebase/firestore";

const SessionHistory = ({ user, currentSessionId, onSelectSession, onClearAll, onDeleteSession, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [previewMessages, setPreviewMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // "list" or "preview" for mobile
  const [isClosing, setIsClosing] = useState(false);

  // Custom close function for smooth animation
  const handleClose = () => {
    setIsClosing(true);
    // Remove the history state we pushed if it's still there
    if (window.history.state?.modalOpen) {
      window.history.back();
    }
    setTimeout(() => {
      onClose();
    }, 250);
  };

  // Sync hardware back button with modal state
  useEffect(() => {
    // 1. Initial State for Modal
    if (!window.history.state?.modalOpen) {
      window.history.pushState({ modalOpen: true, type: "list" }, "");
    }

    const handleHardwareBack = (event) => {
      // If we are in preview mode, go back to list
      if (viewMode === "preview") {
        setViewMode("list");
      } else {
        // If we were already in list, close the modal
        setIsClosing(true);
        setTimeout(() => onClose(), 250);
      }
    };

    window.addEventListener("popstate", handleHardwareBack);
    return () => window.removeEventListener("popstate", handleHardwareBack);
  }, [viewMode, onClose]);

  // Push new state when entering preview to allow hardware back button to return to list
  useEffect(() => {
    if (viewMode === "preview") {
      window.history.pushState({ modalOpen: true, type: "preview" }, "");
    }
  }, [viewMode]);

  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchEndY, setTouchEndY] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEndX(null);
    setTouchEndY(null);
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX || !touchStartY || !touchEndY) return;
    const distanceX = touchStartX - touchEndX;
    const distanceY = touchStartY - touchEndY;

    // Ensure horizontal swipe is dominant and moved at least 60px right
    if (Math.abs(distanceX) > Math.abs(distanceY) && distanceX < -60) {
      handleClose(); // Closes the modal and goes to chat bot
    }
  };

  // 1. Fetch ALL sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "users", user.uid, "sessions"),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        const sessionList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().timestamp?.toDate() || new Date(),
        }));

        setSessions(sessionList);

        if (sessionList.length > 0 && !selectedSessionId) {
          const current = sessionList.find(s => s.id === currentSessionId);
          setSelectedSessionId(current ? current.id : sessionList[0].id);
        }
      } catch (e) {
        console.error("Error fetching sessions:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentSessionId]);

  // 2. Fetch messages for preview
  useEffect(() => {
    const fetchPreviewMessages = async () => {
      if (!user || !selectedSessionId) return;
      try {
        const q = query(
          collection(db, "users", user.uid, "sessions", selectedSessionId, "messages"),
          orderBy("timestamp", "asc")
        );
        const snapshot = await getDocs(q);
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPreviewMessages(msgs);
      } catch (e) {
        console.error("Error fetching preview messages:", e);
      }
    };

    fetchPreviewMessages();
  }, [user, selectedSessionId]);

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();

    try {
      const msgsQ = query(collection(db, "users", user.uid, "sessions", sessionId, "messages"));
      const msgsSnapshot = await getDocs(msgsQ);
      const batch = writeBatch(db);
      msgsSnapshot.docs.forEach(d => batch.delete(d.ref));
      batch.delete(doc(db, "users", user.uid, "sessions", sessionId));
      await batch.commit();

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
        setPreviewMessages([]);
        setViewMode("list");
      }
      if (onDeleteSession) {
        onDeleteSession(sessionId);
      }
    } catch (e) {
      console.error("Error deleting session:", e);
    }
  };

  const filteredSessions = sessions.filter(s =>
    (s.lastMessage || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.id || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSessionData = sessions.find(s => s.id === selectedSessionId);

  const formatText = (text) => {
    if (!text) return null;
    return text.split(/(\*\*.*?\*\*|https?:\/\/[^\s]+)/g).map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      if (typeof part === 'string' && part.match(/^https?:\/\//)) {
        return <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="message-link">{part}</a>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className={`modal-overlay ${isClosing ? 'fade-out' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div 
        className={`modal-content history-browser-modal ${isClosing ? 'slide-out-right' : 'slide-in-right'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button className="modal-close-btn history-close-btn" onClick={handleClose}>
          <span className="desktop-close">×</span>
          <span className="mobile-close">Close</span>
        </button>

        <div className="history-browser-container">
          {/* Sidebar */}
          <div className={`history-sidebar ${viewMode === 'preview' ? 'mobile-hide' : ''}`}>
            <div className="history-sidebar-header">
              <h3>History</h3>
              <p>{sessions.length} Conversations</p>
            </div>

            <div className="history-search-container">
              <input
                type="text"
                className="history-search-input"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            </div>

            <div className="session-list-compact">
              {isLoading ? (
                <div className="loading-state">Loading...</div>
              ) : filteredSessions.length === 0 ? (
                <div className="empty-preview-state" style={{ padding: '20px' }}>
                  <p>{searchQuery ? "No matches found." : "No history yet."}</p>
                </div>
              ) : (
                filteredSessions.map(session => (
                  <div
                    key={session.id}
                    className={`session-item-compact ${session.id === selectedSessionId ? 'selected' : ''} ${session.id === currentSessionId ? 'is-current' : ''}`}
                    onClick={() => { setSelectedSessionId(session.id); setViewMode("preview"); }}
                  >
                    <div className="session-dot" />
                    <div className="session-item-content">
                      <div className="session-item-preview">{session.lastMessage || "Empty Chat"}</div>
                      <div className="session-item-date">{session.startTime.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <button className="delete-icon-btn" onClick={(e) => handleDeleteSession(e, session.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="history-sidebar-footer">
              <button className="clear-all-data-btn" onClick={() => { if (window.confirm("Delete ALL history?")) onClearAll(); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Clear all cloud data
              </button>
            </div>
          </div>

          {/* Preview Area */}
          <div className={`history-preview-area ${viewMode === 'list' ? 'mobile-hide' : ''}`}>
            <button className="back-to-list-btn mobile-only" onClick={() => setViewMode("list")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
              Back to Conversations
            </button>

            {selectedSessionId ? (
              <div className="preview-container">
                <div className="preview-header">
                  <div className="preview-meta">
                    {activeSessionData && (
                      <>
                        <h4>{activeSessionData.startTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</h4>
                        <span>{activeSessionData.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {previewMessages.length} messages</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="preview-messages-list">
                  {previewMessages.map((msg, idx) => (
                    <div key={idx} className={`msg-row ${msg.sender}`}>
                      {msg.sender === "bot" && (
                        <div className="msg-avatar" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                          <img src="/image.png" alt="bot" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                        </div>
                      )}
                      <div className={`bubble ${msg.sender}`}>
                        {msg.image && <img src={msg.image} alt="Generated" style={{ maxWidth: '100%', borderRadius: '12px', marginBottom: '8px', display: 'block' }} />}
                        <div className="bubble-text">{formatText(msg.text)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="preview-footer">
                  <button className="restore-session-btn" onClick={() => {
                    // Pop any preview state and main history state before selecting
                    if (window.history.state?.modalOpen) {
                      window.history.go(viewMode === "preview" ? -2 : -1);
                    }
                    onSelectSession(selectedSessionId);
                  }}>
                    {selectedSessionId === currentSessionId ? "Continue Chat" : "Restore"}
                  </button>
                  <button
                    className="delete-session-btn"
                    onClick={(e) => handleDeleteSession(e, selectedSessionId)}
                  >
                    Delete
                  </button>
                </div>

              </div>
            ) : (
              <div className="empty-preview-state">

                <p>Select a conversation from the list to see the full chat history</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionHistory;