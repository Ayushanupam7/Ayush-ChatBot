import React, { useState } from "react";

const SettingsModal = ({ setShowSettingsModal, isLightMode, setIsLightMode }) => {
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  const handleCheckUpdates = () => {
    setCheckingUpdates(true);
    setTimeout(() => {
      alert("You are on the latest version! (v1.0.0)");
      setCheckingUpdates(false);
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowSettingsModal(false); }}>
      <div className="modal-content settings-modal" style={{maxWidth: '500px', width: '90%', textAlign: 'left'}}>
        <div className="modal-header" style={{alignItems: 'flex-start'}}>
          <h3 style={{margin: 0, marginBottom: '6px'}}>Settings</h3>
          <p style={{margin: 0}}>Manage your application preferences and system updates.</p>
        </div>

        <div className="settings-content" style={{marginTop: '24px'}}>
          <div className="settings-section">
            <h4 style={{color: '#e2e8f0', fontSize: '15px', marginBottom: '16px', fontFamily: '"Syne", sans-serif', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px'}}>Appearance</h4>
            <div className="setting-item">
              <div className="setting-info">
                <h5 style={{margin: 0, color: '#fff', fontSize: '14px', fontWeight: 500}}>Dark Mode</h5>
                <span style={{fontSize: '12px', color: '#a0aec0'}}>Toggle between light and dark themes.</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={!isLightMode} onChange={() => setIsLightMode(!isLightMode)} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <div className="settings-section" style={{marginTop: '32px'}}>
            <h4 style={{color: '#e2e8f0', fontSize: '15px', marginBottom: '16px', fontFamily: '"Syne", sans-serif', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px'}}>About</h4>
            <div className="setting-item">
              <div className="setting-info">
                <h5 style={{margin: 0, color: '#fff', fontSize: '14px', fontWeight: 500}}>Developer</h5>
                <span style={{fontSize: '12px', color: '#63b3ed', fontWeight: 500}}>Ayush Anupam</span>
              </div>
            </div>
            <div className="setting-item" style={{borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px'}}>
              <div className="setting-info">
                <h5 style={{margin: 0, color: '#fff', fontSize: '14px', fontWeight: 500}}>System Version</h5>
                <span style={{fontSize: '12px', color: '#a0aec0'}}>v1.0.0 (Latest)</span>
              </div>
              <button className="action-btn-small" onClick={handleCheckUpdates} disabled={checkingUpdates}>
                {checkingUpdates ? "Checking..." : "Check Updates"}
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer-actions" style={{marginTop: '32px'}}>
          <button className="modal-cancel-btn full-width" onClick={() => setShowSettingsModal(false)}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
