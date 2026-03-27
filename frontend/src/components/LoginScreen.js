import React, { useState, useEffect } from "react";
import { auth } from "../firebase_config";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import desktopBgVideo from "./vecteezy_artificial-intelligence-chatbot-motion-graphic-animation_26745505.mp4";
import mobileBgVideo from "./0327(2).mp4";

const LoginScreen = ({ onLoginSuccess }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 767);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // onAuthStateChanged in App.js will handle redirect
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="name-screen">
      <video
        key={isMobile ? "mobile" : "desktop"}
        autoPlay loop muted playsInline
        className="name-bg-video"
      >
        <source src={isMobile ? mobileBgVideo : desktopBgVideo} type="video/mp4" />
      </video>
      <div className="name-card">
        <div className="name-bot-icon">
          <img src="/image.png" alt="bot" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
        </div>
        <h2 className="name-title">{isLogin ? "Welcome Back" : "Create Account"}</h2>
        <p className="name-subtitle">{isLogin ? "Log in to access your chat history" : "Join AY Chatbot today"}</p>
        
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {error && <p className="auth-error">{error}</p>}
          <input
            className="name-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="name-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
          <button className="name-btn" type="submit" disabled={isLoading}>
            {isLoading ? "Please wait..." : isLogin ? "Sign In →" : "Sign Up →"}
          </button>
        </form>

        <p className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#6366f1', cursor: 'pointer', fontWeight: '600' }}>
            {isLogin ? "Sign Up" : "Log In"}
          </span>
        </p>

        <div className="name-footer">v1.1 • by Ayush Anupam</div>
      </div>
    </div>
  );
};

export default LoginScreen;
