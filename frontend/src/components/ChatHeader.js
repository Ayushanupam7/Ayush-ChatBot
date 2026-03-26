import React from "react";

const ChatHeader = ({ mode, activeProvider, isFullScreen, setIsFullScreen, isLightMode, setIsLightMode, name, setShowLogoutModal }) => {
  return (
    <div className="chat-header">
      <div className="header-avatar">
        {mode === 'gemini' ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z" fill="url(#header-gemini-gradient)" />
            <defs>
              <linearGradient id="header-gemini-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#004ef7ff" />
                <stop offset="0.5" stopColor="#000000ff" />
                <stop offset="1" stopColor="#fc0054ff" />
              </linearGradient>
            </defs>
          </svg>
        ) : <img src="/image.png" alt="bot" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />}
      </div>
      <div className="header-info">
        <div className="header-name">AY Chatbot</div>
        <div className="header-status">
          <div className="status-dot" />
          {activeProvider}
        </div>
      </div>
      <div className="header-actions">
        <button
          className="theme-btn desktop-only"
          onClick={() => setIsFullScreen(!isFullScreen)}
          title="Toggle Full Screen"
        >
          {isFullScreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10.5 4.5v-4a.5.5 0 0 1 .5-.5zM0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zm10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4z" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344 0a.5.5 0 0 1 .707 0l4.096 4.096V11.5a.5.5 0 1 1 1 0v3.975a.5.5 0 0 1-.5.5H11.5a.5.5 0 0 1 0-1h2.768l-4.096-4.096a.5.5 0 0 1 0-.707zm0-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707zm-4.344 0a.5.5 0 0 1-.707 0L1.025 1.732V4.5a.5.5 0 0 1-1 0V.525a.5.5 0 0 1 .5-.5H4.5a.5.5 0 0 1 0 1H1.732l4.096 4.096a.5.5 0 0 1 0 .707z" /></svg>
          )}
        </button>
        <button
          className="theme-btn"
          onClick={() => setIsLightMode(!isLightMode)}
          title="Toggle Light/Dark Mode"
        >
          {isLightMode ? "🌙" : "☀️"}
        </button>
        <button
          className="profile-btn"
          onClick={() => setShowLogoutModal(true)}
          title="Logout / Change Name"
        >
          <div className="profile-avatar">{name ? name.charAt(0).toUpperCase() : "U"}</div>
          <span className="profile-name hide-on-mobile">{name}</span>
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
