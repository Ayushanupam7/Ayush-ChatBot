import React from "react";

const NameScreen = ({ name, setName, onNameSubmit }) => {
  return (
    <div className="name-screen">
      <div className="name-card">
        <div className="name-bot-icon">🤖</div>
        <h2 className="name-title">Welcome to Ayush Chatbot</h2>
        <p className="name-subtitle">Tell me your name to get started</p>
        <input
          className="name-input"
          type="text"
          placeholder="Enter your name..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onNameSubmit()}
          autoFocus
        />
        <button className="name-btn" onClick={onNameSubmit}>
          Start Chatting →
        </button>
      </div>
    </div>
  );
};

export default NameScreen;
