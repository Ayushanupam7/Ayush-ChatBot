import React, { useState, useRef } from "react";

const ChatHeader = ({ 
  mode, activeProvider, isFullScreen, setIsFullScreen, isLightMode, setIsLightMode, 
  name, setShowLogoutModal, setModalType, profileImage, setShowProfileModal, 
  setShowSettingsModal, onNewChat, setShowHistoryModal 
}) => {

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileTimerRef = useRef(null);

  const handleProfileEnter = () => {
    if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
    setIsProfileMenuOpen(true);
  };

  const handleProfileLeave = () => {
    profileTimerRef.current = setTimeout(() => {
      setIsProfileMenuOpen(false);
    }, 300);
  };

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
        
        <div 
          className="profile-dropdown-container" 
          style={{ position: 'relative' }}
          onMouseEnter={handleProfileEnter}
          onMouseLeave={handleProfileLeave}
        >
          <button
            className="profile-btn"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            title="Profile Menu"
          >
            <div className="profile-avatar" style={{overflow: 'hidden'}}>
              {profileImage ? (
                <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                name ? name.charAt(0).toUpperCase() : "U"
              )}
            </div>
            <span className="profile-name hide-on-mobile">{name}</span>
          </button>

          {isProfileMenuOpen && (
            <div className="profile-dropdown-menu">
              <div
                className="profile-dropdown-item"
                onClick={() => { setIsProfileMenuOpen(false); setShowProfileModal(true); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Profile setting
              </div>
              <div
                className="profile-dropdown-item"
                onClick={() => { setIsProfileMenuOpen(false); onNewChat(); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                New Chat
              </div>
              <div
                className="profile-dropdown-item"
                onClick={() => { setIsProfileMenuOpen(false); setShowHistoryModal(true); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><polyline points="12 8 12 12 14 14"></polyline><circle cx="12" cy="12" r="10"></circle></svg>
                Session history
              </div>
              <div
                className="profile-dropdown-item"
                onClick={() => { setIsProfileMenuOpen(false); setShowSettingsModal(true); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                Setting
              </div>
              <div className="profile-separator"></div>
              <div
                className="profile-dropdown-item logout"
                onClick={() => { setIsProfileMenuOpen(false); setModalType("logout"); setShowLogoutModal(true); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Log out
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
