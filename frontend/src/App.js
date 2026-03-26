import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Components
import NameScreen from "./components/NameScreen";
import ChatHeader from "./components/ChatHeader";
import ChatBox from "./components/ChatBox";
import ChatInput from "./components/ChatInput";
import LogoutModal from "./components/LogoutModal";
import ProfileModal from "./components/ProfileModal";
import SettingsModal from "./components/SettingsModal";

const API = process.env.REACT_APP_API_URL || "https://ayush-chatbot-2.onrender.com/api";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [name, setName] = useState(localStorage.getItem("username") || "");
  const [mode, setMode] = useState("short"); // "short", "detailed", "gemini", "image"
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState("Online");

  const [isNameSet, setIsNameSet] = useState(!!localStorage.getItem("username"));
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [modalType, setModalType] = useState("logout");
  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem("theme") === "light");
  const [profileImage, setProfileImage] = useState(() => {
    try {
      return localStorage.getItem("profileImage") || null;
    } catch {
      return null;
    }
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const bottomRef = useRef(null);
  const dropdownTimerRef = useRef(null);

  useEffect(() => {
    if (mode === "image") {
      setActiveProvider("Kling AI is Online");
    } else {
      setActiveProvider("Online");
    }
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("theme", isLightMode ? "light" : "dark");
    if (isLightMode) {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }, [isLightMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const savedName = localStorage.getItem("username");
    if (savedName) {
      setName(savedName);
      setIsNameSet(true);
      fetchGreeting(savedName);
    }
  }, []);

  const fetchGreeting = (userName) => {
    fetch(`${API}/greet?name=${encodeURIComponent(userName)}`)
      .then(r => r.json())
      .then(d => setMessages([{ text: d.response, sender: "bot" }]))
      .catch(() => setMessages([{ text: "Hello! 👋 How can I help?", sender: "bot" }]));
  };

  const handleDropdownLeave = () => {
    dropdownTimerRef.current = setTimeout(() => setIsModeOpen(false), 5000);
  };

  const handleDropdownEnter = () => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
  };

  const handleNameSubmit = () => {
    if (!name.trim()) return;
    localStorage.setItem("username", name.trim());
    setIsNameSet(true);
    fetchGreeting(name.trim());
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setInput("");
    setMessages(prev => [...prev, { text: trimmed || "", sender: "user" }]);
    setIsTyping(true);
    try {
      const history = messages.map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text
      }));

      let detectedMode = mode;
      let promptToProcess = trimmed;
      const lowerInput = trimmed.toLowerCase();

      if (lowerInput.includes("@gemini")) {
        detectedMode = "gemini";
        promptToProcess = trimmed.replace(/@gemini/gi, "").trim();
      } else if (lowerInput.includes("@image")) {
        detectedMode = "image";
        promptToProcess = trimmed.replace(/@image/gi, "").trim();
      } else if (lowerInput.includes("@short")) {
        detectedMode = "short";
        promptToProcess = trimmed.replace(/@short/gi, "").trim();
      } else if (lowerInput.includes("@detailed")) {
        detectedMode = "detailed";
        promptToProcess = trimmed.replace(/@detailed/gi, "").trim();
      }

      const isAutoImage = detectedMode === "image" || lowerInput.startsWith("generate-image") || lowerInput.startsWith("create image") || lowerInput.startsWith("generate image");
      const currentMode = isAutoImage ? "image" : detectedMode;

      let res;
      if (currentMode === "image") {
        setIsGeneratingImage(true);
        const finalPrompt = isAutoImage && !lowerInput.includes("@image")
          ? promptToProcess.replace(/^(generate-image|create image|generate image)\s+/i, "")
          : promptToProcess;

        res = await fetch(`${API}/generate-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: finalPrompt || promptToProcess }),
        });
        setIsGeneratingImage(false);
      } else {
        res = await fetch(`${API}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: promptToProcess,
            mode: detectedMode,
            history: history
          }),
        });
      }

      const data = await res.json();
      setIsTyping(false);

      if (currentMode === "image") {
        if (data.error) {
          setMessages(prev => [...prev, { text: `Error: ${data.error}`, sender: "bot" }]);
        } else {
          let imageUrl = data.images?.[0]?.url || data.url;
          if (imageUrl && imageUrl.startsWith("/")) {
            imageUrl = `${API}${imageUrl}`;
          }
          if (imageUrl) {
            setMessages(prev => [...prev, { text: "Here is your generated image: ", image: imageUrl, sender: "bot" }]);
          } else {
            setMessages(prev => [...prev, { text: "Failed to generate image. 😕", sender: "bot" }]);
          }
        }
        return;
      }

      if (data.provider) {
        if (data.provider === "Dictionary" || data.provider === "System") {
          setActiveProvider("Online");
        } else {
          setActiveProvider(`${data.provider} is Online`);
        }
      }
      setMessages(prev => [...prev, { text: data.response, image: data.image, sender: "bot" }]);
    } catch {
      setIsTyping(false);
      setMessages(prev => [...prev, { text: "Server error ❌ Is FastAPI running?", sender: "bot" }]);
    }
  };

  if (!isNameSet) {
    return <NameScreen name={name} setName={setName} onNameSubmit={handleNameSubmit} />;
  }

  return (
    <div className={`chat-app ${isFullScreen ? "full-screen" : ""}`}>
      <ChatHeader
        mode={mode}
        activeProvider={activeProvider}
        isFullScreen={isFullScreen}
        setIsFullScreen={setIsFullScreen}
        isLightMode={isLightMode}
        setIsLightMode={setIsLightMode}
        name={name}
        setShowLogoutModal={setShowLogoutModal}
        setModalType={setModalType}
        profileImage={profileImage}
        setShowProfileModal={setShowProfileModal}
        setShowSettingsModal={setShowSettingsModal}
      />

      <ChatBox
        messages={messages}
        isTyping={isTyping}
        isGeneratingImage={isGeneratingImage}
        bottomRef={bottomRef}
      />

      <ChatInput
        input={input}
        setInput={setInput}
        mode={mode}
        setMode={setMode}
        isModeOpen={isModeOpen}
        setIsModeOpen={setIsModeOpen}
        sendMessage={sendMessage}
        handleDropdownEnter={handleDropdownEnter}
        handleDropdownLeave={handleDropdownLeave}
        dropdownTimerRef={dropdownTimerRef}
      />

      {showProfileModal && (
        <ProfileModal 
          setShowProfileModal={setShowProfileModal} 
          name={name} 
          setName={setName} 
          profileImage={profileImage}
          setProfileImage={setProfileImage}
        />
      )}

      {showSettingsModal && (
        <SettingsModal 
          setShowSettingsModal={setShowSettingsModal}
          isLightMode={isLightMode}
          setIsLightMode={setIsLightMode}
        />
      )}

      {showLogoutModal && <LogoutModal setShowLogoutModal={setShowLogoutModal} messages={messages} modalType={modalType} />}
    </div>
  );
}

export default App;