import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { showToast } from "./Toast";
import "./Flashcards.css";

function Flashcards() {
  const { documents } = useOutletContext();
  const [selectedDocId, setSelectedDocId] = useState("");
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id.toString());
    }
  }, [documents, selectedDocId]);

  const handleGenerateCards = async (e) => {
    e.preventDefault();
    if (!selectedDocId) {
      showToast("Please select a valid document", "error");
      return;
    }

    setLoading(true);
    setCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);

    try {
      const response = await fetch("http://localhost:8000/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: selectedDocId }),
      });

      if (!response.ok) throw new Error("Failed compiling AI flashcard vectors.");
      const data = await response.json();
      
      setCards(data.cards || []);
      showToast("Smart Flashcards generated successfully!", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flashcards-page-container">
      <form onSubmit={handleGenerateCards} className="flashcard-config-card">
        <div className="form-group">
          <label className="config-label">Select Source Document</label>
          <select
            className="config-select"
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
          >
            {documents.length === 0 ? (
              <option value="">No documents loaded yet.</option>
            ) : (
              documents.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))
            )}
          </select>
        </div>
        <button type="submit" className="btn-generate-cards" disabled={loading || documents.length === 0}>
          {loading ? "Compiling Deck..." : "Generate Flashcards"}
        </button>
      </form>

      {loading && <div className="loader-spinner"></div>}

      {cards.length > 0 && !loading && (
        <div className="deck-workspace">
          <div className="progress-tracker">Card {currentIndex + 1} of {cards.length}</div>
          
          {/* Interactive CSS 3D Flip Card */}
          <div className={`flashcard-stage ${isFlipped ? "flipped" : ""}`} onClick={() => setIsFlipped(!isFlipped)}>
            <div className="card-face card-front">
              <span className="face-tag">QUESTION / TERM</span>
              <p className="card-text">{cards[currentIndex].front}</p>
              <span className="flip-hint">Click to flip 🔄</span>
            </div>
            <div className="card-face card-back">
              <span className="face-tag back-tag">ANSWER / EXPLANATION</span>
              <p className="card-text">{cards[currentIndex].back}</p>
              <span className="flip-hint">Click to return 🔄</span>
            </div>
          </div>

          {/* 🛠️ FIXED: Added Missing Deck Navigation Controls Node */}
          <div className="deck-controls">
            <button 
              type="button"
              className="nav-btn" 
              disabled={currentIndex === 0} 
              onClick={() => { setCurrentIndex(p => p - 1); setIsFlipped(false); }}
            >
              ◀ Previous
            </button>
            <button 
              type="button"
              className="nav-btn next-btn" 
              disabled={currentIndex === cards.length - 1} 
              onClick={() => { setCurrentIndex(p => p + 1); setIsFlipped(false); }}
            >
              Next ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Flashcards;