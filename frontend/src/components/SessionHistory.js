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

const SessionHistory = ({ user, currentSessionId, onSelectSession, onClearAll, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [previewMessages, setPreviewMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // "list" or "preview" for mobile

  // 1. Fetch ALL sessions (metadata only)
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

        // Auto-select current session or first session on load
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
  }, [user, currentSessionId]); // Reduced dependencies to avoid loops

  // 2. Fetch messages for the SELECTED session preview
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
    } catch (e) {
      console.error("Error deleting session:", e);
    }
  };

  const activeSessionData = sessions.find(s => s.id === selectedSessionId);

  const formatText = (text) => {
    if (!text) return null;
    return text.split(/(\*\*.*?\*\*|https?:\/\/[^\s]+)/g).map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      if (part.match(/^https?:\/\//)) {
        return <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="message-link">{part}</a>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content history-browser-modal">
        <button className="modal-close-btn" onClick={onClose}>×</button>

        <div className="history-browser-container">
          <div className={`history-sidebar ${viewMode === 'preview' ? 'mobile-hide' : ''}`}>
            <div className="history-sidebar-header">
              <h3>History</h3>
              <p>{sessions.length} Conversations</p>
            </div>

            <div className="session-list-compact">
              {isLoading ? (
                <div className="loading-state">Loading...</div>
              ) : sessions.length === 0 ? (
                <div className="no-history-text">No history found.</div>
              ) : (
                sessions.map(session => (
                  <div
                    key={session.id}
                    className={`session-item-compact ${session.id === selectedSessionId ? 'selected' : ''} ${session.id === currentSessionId ? 'is-current' : ''}`}
                    onClick={() => { setSelectedSessionId(session.id); setViewMode("preview"); }}
                  >
                    <div className="session-dot" />
                    <div className="session-item-content">

                      <div className="session-item-preview">{session.lastMessage}</div>
                      <div className="session-item-date">{session.startTime.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
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

          <div className={`history-preview-area ${viewMode === 'list' ? 'mobile-hide' : ''}`}>
            {viewMode === 'preview' && (
              <button className="back-to-list-btn mobile-only" onClick={() => setViewMode("list")}>
                ← Back to List
              </button>
            )}

            {selectedSessionId ? (
              <div className="preview-container">
                <div className="preview-header">
                  <div className="preview-meta">
                    {activeSessionData && (
                      <>
                        <h4>{activeSessionData.startTime.toLocaleDateString()} at {activeSessionData.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</h4>
                        <span>{previewMessages.length} Messages</span>
                      </>
                    )}
                  </div>
                  <button className="restore-session-btn" onClick={() => onSelectSession(selectedSessionId)}>
                    {selectedSessionId === currentSessionId ? "Continue Chat" : "Restore this Session"}
                  </button>
                </div>

                <div className="preview-messages-list">
                  <div className="date-divider" style={{ margin: '0 0 20px 0' }}>
                    {activeSessionData?.startTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  {previewMessages.map((msg, idx) => (
                    <div key={idx} className={`msg-row ${msg.sender}`} style={{ marginBottom: '12px' }}>
                      {msg.sender === "bot" && <div className="msg-avatar" style={{ width: '28px', height: '28px' }}><img src="/image.png" alt="bot" style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} /></div>}
                      <div className={`bubble ${msg.sender}`} style={{ padding: '8px 12px', fontSize: '13px' }}>
                        {msg.image && <img src={msg.image} alt="Generated" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '8px', display: 'block' }} />}
                        <div className="bubble-text">{formatText(msg.text)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-preview-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Select a conversation to see the full chat</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionHistory;
