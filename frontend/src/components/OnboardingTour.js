import React, { useState, useEffect } from "react";

const TOUR_STEPS = [
  {
    id: 1,
    selector: ".chat-header",
    title: "Welcome to AY Chatbot",
    description: "This is your control header. Open profile, settings, new chat, and session history here.",
  },
  {
    id: 2,
    selector: ".chat-box",
    title: "Chat History",
    description: "Here you can read messages and copy bot answers instantly.",
  },
  {
    id: 3,
    selector: ".input-area",
    title: "Send messages",
    description: "Type in prompts, choose mode, then hit Send. Try @image, @gemini, @short, @detailed.",
  },
];

const OnboardingTour = ({ user, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    const updateRect = () => {
      const step = TOUR_STEPS[currentStep];
      const element = step ? document.querySelector(step.selector) : null;
      if (element) {
        setRect(element.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [currentStep]);

  const finish = () => {
    try {
      if (user && user.uid) {
        localStorage.setItem(`onboarded_${user.uid}`, "true");
      }
    } catch {
      // ignore storage errors
    }
    onComplete();
  };

  const goNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      finish();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true">
      <div className="tour-backdrop" onClick={finish} />

      {rect && (
        <div
          className="tour-highlight"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
      )}

      <div
        className="tour-card"
        style={{
          top: rect ? Math.min(window.innerHeight - 180, rect.bottom + 16) : "40%",
          left: rect ? Math.min(window.innerWidth - 320, rect.left) : "50%",
          transform: rect ? "none" : "translateX(-50%)",
        }}
      >
        <h3>{step.title}</h3>
        <p>{step.description}</p>
        <div className="tour-footer">
          <button className="tour-link" onClick={finish} type="button">
            Skip tour
          </button>
          <div>
            <button className="tour-btn" onClick={goPrev} type="button" disabled={currentStep === 0}>
              Back
            </button>
            <button className="tour-btn primary" onClick={goNext} type="button">
              {currentStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>

      {rect && (
        <div
          className="tour-arrow"
          style={{
            top: rect.bottom + 4,
            left: rect.left + rect.width / 2 - 12,
          }}
        >
          <span />
        </div>
      )}
    </div>
  );
};

export default OnboardingTour;
