import React, { useState, useRef } from "react";

const ProfileModal = ({ setShowProfileModal, name, setName, profileImage, setProfileImage }) => {
  const [tempName, setTempName] = useState(name);
  const [tempImage, setTempImage] = useState(profileImage);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (tempName.trim()) {
      setName(tempName.trim());
      localStorage.setItem("username", tempName.trim());
    }
    if (tempImage) {
      setProfileImage(tempImage);
      try {
        localStorage.setItem("profileImage", tempImage);
      } catch (e) {
        console.warn("Storage quota full, could not save image.", e);
      }
    }
    setShowProfileModal(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowProfileModal(false); }}>
      <div className="modal-content profile-setting-modal" style={{maxWidth: '400px'}}>
        <div className="modal-header">
          <h3>Profile Settings</h3>
          <p>Update your custom avatar and display name.</p>
        </div>

        <div className="profile-edit-section" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px'}}>
          <div 
            className="profile-image-upload" 
            onClick={() => fileInputRef.current.click()}
            title="Click to upload new avatar"
          >
            {tempImage ? (
              <img src={tempImage} alt="Profile" className="profile-upload-preview" />
            ) : (
              <div className="profile-upload-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Upload</span>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{display: 'none'}} />
          </div>

          <div className="input-group" style={{marginTop: '24px', width: '100%', textAlign: 'left'}}>
            <label style={{display: 'block', marginBottom: '8px', color: '#a0aec0', fontSize: '13px', fontWeight: 500, fontFamily: '"DM Sans", sans-serif'}}>Display Name</label>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="name-input"
              style={{width: '100%', marginBottom: '24px'}}
            />
          </div>
        </div>

        <div className="modal-footer-actions">
          <button className="modal-cancel-btn" onClick={() => setShowProfileModal(false)}>Cancel</button>
          <button className="modal-confirm-btn" style={{background: '#3182ce'}} onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
