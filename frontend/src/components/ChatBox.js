import React from "react";
import CopyButton from "./CopyButton";

const ChatBox = ({ messages, isTyping, isGeneratingImage, bottomRef }) => {
  return (
    <div className="chat-box">
      <div className="date-divider">Today</div>

      {messages.map((msg, i) => (
        <div key={i} className={`msg-row ${msg.sender}`}>
          {msg.sender === "bot" && <div className="msg-avatar"><img src="/image.png" alt="bot" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit'}} /></div>}
          {msg.sender === "user" && msg.text && <CopyButton text={msg.text} title="Copy user message" />}
          <div className={`bubble ${msg.sender}`}>
            {msg.image && <img src={msg.image} alt="Attachment" className="bubble-image" />}
            {msg.text && (
              <div className="bubble-text">
                {msg.text.split(/(\*\*.*?\*\*|https?:\/\/[^\s]+)/g).map((part, idx) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={idx}>{part.slice(2, -2)}</strong>;
                  }
                  if (part.match(/^https?:\/\//)) {
                    return (
                      <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="message-link">
                        {part}
                      </a>
                    );
                  }
                  return <span key={idx}>{part}</span>;
                })}
              </div>
            )}
          </div>
          {msg.sender === "bot" && msg.text && <CopyButton text={msg.text} title="Copy bot response" />}
        </div>
      ))}

      {/* Generating Image indicator */}
      {isGeneratingImage && (
        <div className="msg-row bot">
          <div className="msg-avatar"><img src="/image.png" alt="bot" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit'}} /></div>
          <div className="bubble bot">
            <div className="generating-text">
              Generating Image...
              <div className="typing-wrap" style={{ display: 'inline-flex', marginLeft: '10px' }}>
                <div className="dot" />
                <div className="dot" />
                <div className="dot" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Typing indicator */}
      {isTyping && !isGeneratingImage && (
        <div className="msg-row bot">
          <div className="msg-avatar"><img src="/image.png" alt="bot" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit'}} /></div>
          <div className="bubble bot">
            <div className="typing-wrap">
              <div className="dot" />
              <div className="dot" />
              <div className="dot" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default ChatBox;
