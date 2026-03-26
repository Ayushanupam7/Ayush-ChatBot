import React from "react";
import { jsPDF } from "jspdf";

const LogoutModal = ({ setShowLogoutModal, messages }) => {

  const generatePDF = async () => {
    const doc = new jsPDF();
    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(40, 44, 52);
    doc.text("Chat History", margin, y);

    // Subtitle / Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, margin, y + 8);

    y += 25;

    for (const msg of messages) {
      const isUser = msg.sender === "user";
      const sender = isUser ? "YOU" : "BOT";

      // Message Header (Sender Name)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(isUser ? 66 : 159, isUser ? 153 : 122, isUser ? 225 : 234); // Match theme colors
      doc.text(sender, margin, y);
      y += 6;

      // Message Content
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(60);

      const splitText = doc.splitTextToSize(msg.text || "", pageWidth - margin * 2);

      // Page break check for text
      if (y + splitText.length * 6 > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(splitText, margin, y);
      y += splitText.length * 6 + 4;

      // Image handling
      if (msg.image) {
        try {
          const imgBase64 = await getBase64Image(msg.image);
          if (imgBase64) {
            // Calculate image dimensions to maintain aspect ratio (approx)
            const imgWidth = 120;
            const imgHeight = 80;

            if (y + imgHeight > 270) {
              doc.addPage();
              y = 20;
            }

            doc.addImage(imgBase64, "PNG", margin, y, imgWidth, imgHeight);
            y += imgHeight + 10;
          }
        } catch (error) {
          console.error("PDF Image Error:", error);
        }
      }

      // Divider
      doc.setDrawColor(240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
    }

    return doc;
  };

  const handleDownload = async () => {
    const doc = await generatePDF();
    doc.save("Chat_History.pdf");
  };

  const handlePreview = async () => {
    const doc = await generatePDF();
    const string = doc.output('bloburl');
    window.open(string, '_blank');
  };

  const getBase64Image = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content history-modal">
        <div className="modal-header">
          <div className="modal-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <h3>Sign Out</h3>
          <p>Would you like to save your conversation before leaving?</p>
        </div>

        <div className="history-options">
          <button className="history-btn preview" onClick={handlePreview}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Preview History</span>
          </button>

          <button className="history-btn download" onClick={handleDownload}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download PDF</span>
          </button>
        </div>

        <div className="modal-footer-actions">
          <button className="modal-cancel-btn" onClick={() => setShowLogoutModal(false)}>

            Stay
          </button>
          <button className="modal-confirm-btn" onClick={() => {
            localStorage.removeItem("username");
            window.location.reload();
          }}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
