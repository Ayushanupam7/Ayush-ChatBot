import React, { useState, useEffect, useRef } from "react";

const ChatInput = ({ input, setInput, mode, setMode, isModeOpen, setIsModeOpen, sendMessage, handleDropdownEnter, handleDropdownLeave, dropdownTimerRef }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionComponent = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionComponent();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? prev + ' ' + transcript : transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [setInput]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="input-area">
      <div
        className="custom-dropdown"
        onMouseEnter={handleDropdownEnter}
        onMouseLeave={handleDropdownLeave}
      >
        <div
          className="dropdown-toggle"
          onClick={() => {
            setIsModeOpen(!isModeOpen);
            if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
          }}
          title="Response Mode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
          <span className="hide-on-mobile">{mode === 'short' ? 'Short' : mode === 'detailed' ? 'Detailed' : mode === 'gemini' ? 'Gemini' : 'Image'}</span>
          <span className={`chevron ${isModeOpen ? 'open' : ''}`}>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>
          </span>
        </div>
        {isModeOpen && (
          <div className="dropdown-menu">
            <div
              className={`dropdown-item ${mode === 'short' ? 'active' : ''}`}
              onClick={() => { setMode('short'); setIsModeOpen(false); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginRight: '6px' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              Short
            </div>
            <div
              className={`dropdown-item ${mode === 'detailed' ? 'active' : ''}`}
              onClick={() => { setMode('detailed'); setIsModeOpen(false); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginRight: '6px' }}><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="3" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
              Detailed
            </div>
            <div
              className={`dropdown-item ${mode === 'gemini' ? 'active' : ''}`}
              onClick={() => { setMode('gemini'); setIsModeOpen(false); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
                <path d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z" fill="url(#gemini-gradient)" />
                <defs>
                  <linearGradient id="gemini-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4e82ee" />
                    <stop offset="0.5" stopColor="#b062f8" />
                    <stop offset="1" stopColor="#e67399" />
                  </linearGradient>
                </defs>
              </svg>
              Gemini
            </div>
            <div
              className={`dropdown-item ${mode === 'image' ? 'active' : ''}`}
              onClick={() => { setMode('image'); setIsModeOpen(false); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginRight: '6px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              Image
            </div>
          </div>
        )}
      </div>
      <button 
        className={`mic-btn ${isListening ? 'listening' : ''}`} 
        onClick={toggleListening}
        title={isListening ? "Stop Listening" : "Start Voice Input"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke={isListening ? "#fc8181" : "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      </button>
      <input
        className="input-field"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={mode === 'image' ? "Give prompt for creating images..." : "Type a message..."}
        onKeyDown={e => e.key === "Enter" && sendMessage()}
      />
      <button className="send-btn" onClick={sendMessage} title="Send Message">
        <span className="hide-on-mobile">Send </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </div>
  );
};

export default ChatInput;
