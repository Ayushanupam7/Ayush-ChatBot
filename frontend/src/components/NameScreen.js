import React, { useState, useEffect } from "react";
import desktopBgVideo from "./vecteezy_artificial-intelligence-chatbot-motion-graphic-animation_26745505.mp4";
import mobileBgVideo from "./0327(2).mp4";

const NameScreen = ({ name, setName, onNameSubmit }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="name-screen">
      <video
        key={isMobile ? "mobile" : "desktop"} /* Forces React to securely reload video element on swap */
        autoPlay
        loop
        muted
        playsInline
        className="name-bg-video"
      >
        <source src={isMobile ? mobileBgVideo : desktopBgVideo} type="video/mp4" />
      </video>
      <div className="name-card">
        <div className="name-bot-icon"><img src="/image.png" alt="bot" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /></div>
        <h2 className="name-title">Welcome to AY Chatbot</h2>
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
        <div className="name-footer">
          v1.0 • by Ayush Anupam
        </div>
      </div>
    </div>
  );
};

export default NameScreen;
