import React from "react";

const LogoutModal = ({ setShowLogoutModal }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Log Out</h3>
        <p>Are you sure you want to log out?</p>
        <div className="modal-buttons">
          <button
            className="modal-cancel-btn"
            onClick={() => setShowLogoutModal(false)}
          >
            Cancel
          </button>
          <button
            className="modal-confirm-btn"
            onClick={() => {
              localStorage.removeItem("username");
              window.location.reload();
            }}
          >
            Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
