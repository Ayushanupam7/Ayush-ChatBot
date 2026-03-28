import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

// Firebase
import { auth, db } from "./firebase_config";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  getDoc,
  writeBatch,
  setDoc,
  doc
} from "firebase/firestore";

// Components
import LoginScreen from "./components/LoginScreen";
import ChatHeader from "./components/ChatHeader";
import ChatBox from "./components/ChatBox";
import ChatInput from "./components/ChatInput";
import LogoutModal from "./components/LogoutModal";
import ProfileModal from "./components/ProfileModal";
import SettingsModal from "./components/SettingsModal";
import SessionHistory from "./components/SessionHistory";
import OnboardingTour from "./components/OnboardingTour";

const API = process.env.REACT_APP_API_URL || "https://ayush-chatbot-2.onrender.com/api";

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("short"); // "short", "detailed", "gemini", "image"
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState("Online");

  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [modalType, setModalType] = useState("logout");
  const [localGreeting, setLocalGreeting] = useState(null);
  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem("theme") === "light");
  const [profileImage, setProfileImage] = useState(() => {
    try {
      return localStorage.getItem("profileImage") || null;
    } catch {
      return null;
    }
  });
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    return `session_${Date.now()}`;
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const bottomRef = useRef(null);
  const dropdownTimerRef = useRef(null);
  const greetedSessionsRef = useRef(new Set());

  // 💾 Firestore Database Helpers
  const saveMessageToFirestore = useCallback(async (msg) => {
    if (!user) return;
    try {
      // ⚠️ IMPORTANT: Firestore DOES NOT allow `undefined` values. 
      // We must clean the object before sending!
      const cleanMsg = {};
      Object.keys(msg).forEach(key => {
        if (msg[key] !== undefined) {
          cleanMsg[key] = msg[key];
        }
      });

      // 1. Save message to the subcollection
      await addDoc(collection(db, "users", user.uid, "sessions", currentSessionId, "messages"), {
        ...cleanMsg,
        timestamp: serverTimestamp()
      });

      // 2. Update session metadata (for the history list)
      await setDoc(doc(db, "users", user.uid, "sessions", currentSessionId), {
        lastMessage: cleanMsg.text || "Image",
        timestamp: serverTimestamp(),
        sessionId: currentSessionId
      }, { merge: true });

    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }, [user, currentSessionId]);

  const fetchGreeting = useCallback((userName) => {
    fetch(`${API}/greet?name=${encodeURIComponent(userName)}`)
      .then(r => r.json())
      .then(d => {
        // Display locally instead of saving to Firestore
        setLocalGreeting({ text: d.response, sender: "bot", id: "local-greet" });
      })
      .catch(() => {
        setLocalGreeting({ text: "Hello! 👋 How can I help?", sender: "bot", id: "local-greet" });
      });
  }, []);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Automatically set a default name if it's missing
        if (!currentUser.displayName && currentUser.email) {
          try {
            const defaultName = currentUser.email.split("@")[0].substring(0, 5);
            await updateProfile(currentUser, { displayName: defaultName });

            await setDoc(doc(db, "users", currentUser.uid), {
              displayName: defaultName,
              email: currentUser.email,
              lastLogin: serverTimestamp(),
              createdAt: serverTimestamp()
            }, { merge: true });

            setUser({ ...currentUser, displayName: defaultName });
          } catch (error) {
            console.error("Error initializing profile:", error);
            setUser(currentUser);
          }
        } else {
          setUser(currentUser);
        }

        // 🖼️ Sync Avatar from Firestore
        try {
          const userSnap = await getDoc(doc(db, "users", currentUser.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.profileImage) {
              setProfileImage(data.profileImage);
              localStorage.setItem("profileImage", data.profileImage);
            }
          }
        } catch (e) {
          console.error("Cloud avatar sync failed:", e);
        }

      } else {
        setUser(null);
        setMessages([]); // Clear chat on logout
      }
    });
    return () => unsubscribe();
  }, []);

  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowTour(false);
      return;
    }

    const userId = user.uid;
    const onboardKey = `onboarded_${userId}`;
    const onboarded = localStorage.getItem(onboardKey) === "true";
    if (!onboarded) {
      const userName = user.displayName || (user.email ? user.email.split("@")[0] : "Friend");
      setLocalGreeting({ text: `Welcome ${userName}! 👋 Let's take a quick tour of the app.`, sender: "bot", id: "tour-welcome" });
      setShowTour(true);
    } else {
      setShowTour(false);
    }
  }, [user]);

  // 2. Firestore Sync (Listen for messages in the CURRENT session)
  useEffect(() => {
    if (!user) return;

    // Listen DIRECTLY to the active session's subcollection
    const q = query(
      collection(db, "users", user.uid, "sessions", currentSessionId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionMsgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (sessionMsgs.length > 0) {
        setMessages(sessionMsgs);
        setLocalGreeting(null);
      } else {
        // If this session is empty, get a fresh greeting!
        if (user && !isTyping && !greetedSessionsRef.current.has(currentSessionId)) {
          greetedSessionsRef.current.add(currentSessionId);
          fetchGreeting(user.displayName || user.email.split("@")[0]);
        }
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [user, fetchGreeting, currentSessionId, isTyping]);

  const createNewSession = useCallback(() => {
    const newId = `session_${Date.now()}`;
    setCurrentSessionId(newId);
    setLocalGreeting(null);
    setMessages([]); // Optimistic clear
  }, []);

  const loadSession = useCallback((sessionId) => {
    setCurrentSessionId(sessionId);
    setLocalGreeting(null);
    setShowHistoryModal(false);
  }, []);

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


  const clearChat = useCallback(async () => {
    if (!user) return;
    if (!window.confirm("This will permanently delete ALL conversations from the cloud. Continue?")) return;

    try {
      const sessionsQ = query(collection(db, "users", user.uid, "sessions"));
      const sessionsSnapshot = await getDocs(sessionsQ);
      const batch = writeBatch(db);

      for (const sessionDoc of sessionsSnapshot.docs) {
        // Delete messages subcollection for this session
        const msgsQ = query(collection(db, "users", user.uid, "sessions", sessionDoc.id, "messages"));
        const msgsSnapshot = await getDocs(msgsQ);
        msgsSnapshot.docs.forEach(m => batch.delete(m.ref));

        // Delete the session document
        batch.delete(sessionDoc.ref);
      }

      await batch.commit();
      setMessages([]);
      greetedSessionsRef.current.clear();
      createNewSession();
    } catch (e) {
      console.error("Error clearing history: ", e);
    }
  }, [user, createNewSession]);

  const handleDropdownLeave = () => {
    dropdownTimerRef.current = setTimeout(() => setIsModeOpen(false), 5000);
  };

  const handleDropdownEnter = () => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setInput("");

    // Save user message to Firestore
    const userMsg = { text: trimmed, sender: "user" };
    await saveMessageToFirestore(userMsg);

    setIsTyping(true);
    try {
      const history = messages.slice(-10).map(m => ({
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
        let botMsg;
        if (data.error) {
          botMsg = { text: `Error: ${data.error}`, sender: "bot" };
        } else {
          let imageUrl = data.images?.[0]?.url || data.url;
          if (imageUrl && imageUrl.startsWith("/")) {
            imageUrl = `${API}${imageUrl}`;
          }
          if (imageUrl) {
            botMsg = { text: "Here is your generated image: ", image: imageUrl, sender: "bot" };
          } else {
            botMsg = { text: "Failed to generate image. 😕", sender: "bot" };
          }
        }
        await saveMessageToFirestore(botMsg);
        return;
      }

      if (data.provider) {
        if (data.provider === "Dictionary" || data.provider === "System") {
          setActiveProvider("Online");
        } else {
          setActiveProvider(`${data.provider} is Online`);
        }
      }
      const botMsg = { text: data.response, image: data.image, sender: "bot" };
      await saveMessageToFirestore(botMsg);
    } catch {
      setIsTyping(false);
      const botMsg = { text: "Server error ❌ Is FastAPI running?", sender: "bot" };
      // Don't save server errors to Firestore
      setMessages(prev => [...prev, botMsg]);
    }
  };

  if (!user) {
    return <LoginScreen />;
  }

  const displayName = user.displayName || user.email.split("@")[0];

  return (
    <div className={`chat-app ${isFullScreen ? "full-screen" : ""}`}>
      <ChatHeader
        mode={mode}
        activeProvider={activeProvider}
        isFullScreen={isFullScreen}
        setIsFullScreen={setIsFullScreen}
        isLightMode={isLightMode}
        setIsLightMode={setIsLightMode}
        name={user.displayName || user.email.split("@")[0]}
        setShowLogoutModal={setShowLogoutModal}
        setModalType={setModalType}
        profileImage={profileImage}
        setShowProfileModal={setShowProfileModal}
        setShowSettingsModal={setShowSettingsModal}
        onNewChat={createNewSession}
        setShowHistoryModal={setShowHistoryModal}
      />

      <ChatBox
        messages={localGreeting ? [localGreeting, ...messages] : messages}
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
          name={displayName}
          setName={() => { }} // Disabled for now, as it's linked to Firebase
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

      {showHistoryModal && (
        <SessionHistory
          user={user}
          currentSessionId={currentSessionId}
          onSelectSession={loadSession}
          onClearAll={clearChat}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showTour && (
        <OnboardingTour
          user={user}
          onComplete={() => setShowTour(false)}
        />
      )}

      {showLogoutModal && (
        <LogoutModal
          setShowLogoutModal={setShowLogoutModal}
          messages={messages}
          modalType={modalType}
          onClearChat={clearChat}
          onLogout={() => signOut(auth)}
        />
      )}
    </div>
  );
}

export default App;