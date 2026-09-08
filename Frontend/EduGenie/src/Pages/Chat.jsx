import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { showToast } from "./Toast";
import "./Chat.css"; // Ensure you style this according to your design system

function Chat() {
  const { documents } = useOutletContext();

  const [selectedDocId, setSelectedDocId] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  
  const chatEndRef = useRef(null);

  // Default to selecting the first document uploaded automatically
  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id.toString());
    }
  }, [documents, selectedDocId]);

  // Keep chat viewport automatically scrolled to the bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    if (!selectedDocId) {
      showToast("Please select a document context before chatting.", "error");
      return;
    }

    const userMessage = { sender: "user", text: inputValue.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doc_id: selectedDocId,
          message: userMessage.text,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to receive a response from the tutoring cluster.");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
    } catch (error) {
      showToast(error.message, "error");
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ Generation failed. Check backend server connection topology." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-page-container">
      {/* Header Selector Control */}
      <div className="chat-config-bar">
        <label className="config-label">Active Learning Context:</label>
        <select
          className="config-select"
          value={selectedDocId}
          onChange={(e) => setSelectedDocId(e.target.value)}
        >
          {documents.length === 0 ? (
            <option value="">No indexed documents found. Upload via Materials section first.</option>
          ) : (
            documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                📄 {doc.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Main Thread Feed Window */}
      <div className="chat-messages-window">
        {messages.length === 0 && (
          <div className="chat-welcome-placeholder">
            <h3>EduGenie Contextual Chat</h3>
            <p>Select an uploaded PDF from the drop-down menu above and start asking questions about the material!</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`message-bubble-wrapper ${msg.sender}`}>
            <div className={`avatar-icon ${msg.sender}`}>
              {msg.sender === "user" ? "👤" : "🧙‍♂️"}
            </div>
            <div className="message-bubble-text">{msg.text}</div>
          </div>
        ))}

        {loading && (
          <div className="message-bubble-wrapper ai processing">
            <div className="avatar-icon ai">🧙‍♂️</div>
            <div className="message-bubble-text loading-dots">Thinking</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Action Form */}
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          className="chat-text-input"
          placeholder="Ask a question about the document concepts..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={loading || documents.length === 0}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={loading || !inputValue.trim() || documents.length === 0}
        >
          Send ➔
        </button>
      </form>
    </div>
  );
}

export default Chat;