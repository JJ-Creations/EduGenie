import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { showToast } from "./Toast";
import "./QuizGenerator.css";

function QuizGenerator() {
  const { documents } = useOutletContext();

  // Configuration UI States
  const [selectedDocId, setSelectedDocId] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);

  // Runtime Quiz Execution States
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionIdx: "A" }
  const [quizFinished, setQuizFinished] = useState(false);

  // Default to selecting the first document uploaded automatically
  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id.toString());
    }
  }, [documents, selectedDocId]);

  const handleGenerateQuiz = async () => {
    if (!selectedDocId) {
      showToast("Please select a document context first.", "error");
      return;
    }

    setLoading(true);
    setQuizFinished(false);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setQuestions([]);

    try {
      const response = await fetch("http://localhost:8000/mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_id: selectedDocId,
          difficulty:difficulty.toLowerCase(),
          count:questionCount
        }),
      });

      if (!response.ok) throw new Error("Failed to compile quiz engine.");
      const data = await response.json();
      
      if (data.questions && data.questions.length > 0) {
        // Slice the array locally to match the user's requested 'questionCount'
        // This keeps the UI perfect even without the backend update!
        const slicedQuestions = data.questions.slice(0, questionCount);
        setQuestions(slicedQuestions);
      } else {
        throw new Error("No questions could be parsed from this document.");
      }
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optionKey) => {
    if (quizFinished) return; 
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optionKey,
    }));
  };

  const calculateScore = () => {
    return questions.reduce((score, q, idx) => {
      return score + (selectedAnswers[idx] === q.answer ? 1 : 0);
    }, 0);
  };

  const activeQuestion = questions[currentIdx];
  const progressPercent = questions.length ? ((currentIdx + 1) / questions.length) * 100 : 0;

  return (
    <div className="quiz-view-wrapper">
      {/* Configuration Header Controls Panel */}
      <div className="quiz-settings-card">
        <div className="settings-grid">
          <div className="setting-control">
            <label>Select Document</label>
            <select value={selectedDocId} onChange={(e) => setSelectedDocId(e.target.value)}>
              {documents.length === 0 ? (
                <option value="">Upload material vectors first...</option>
              ) : (
                documents.map((doc) => <option key={doc.id} value={doc.id}>{doc.name}</option>)
              )}
            </select>
          </div>

          <div className="setting-control">
            <label>Difficulty Level</label>
            <div className="segmented-btn-group">
              {["Easy", "Medium", "Hard"].map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`segment-btn ${difficulty === level ? "active" : ""}`}
                  onClick={() => setDifficulty(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-control">
            <label>Number of Questions</label>
            <div className="segmented-btn-group">
              {[5, 10, 20, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`segment-btn ${questionCount === num ? "active" : ""}`}
                  onClick={() => setQuestionCount(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          className="generate-quiz-btn" 
          onClick={handleGenerateQuiz}
          disabled={loading || documents.length === 0}
        >
          {loading ? "Parsing Parameters..." : "Generate Quiz"}
        </button>
      </div>

      {/* Active Test Execution Workspace */}
      {questions.length > 0 && (
        <div className="quiz-execution-card">
          <div className="execution-header">
            <h3>Conceptual Knowledge Check</h3>
            <span className="question-tracker">Q {currentIdx + 1} of {questions.length}</span>
          </div>

          {/* Progress Tracker Slider Bar */}
          <div className="progress-track-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>

          {/* Card Body Question Component */}
          <div className="question-body-section">
            <span className="question-index-tag">QUESTION {currentIdx + 1} OF {questions.length}</span>
            <p className="question-text">{activeQuestion.question}</p>

            <div className="options-vertical-stack">
              {Object.entries(activeQuestion.options).map(([key, value]) => {
                const isSelected = selectedAnswers[currentIdx] === key;
                const isCorrect = activeQuestion.answer === key;
                
                let optionClass = "";
                if (isSelected) optionClass += " selected";
                if (quizFinished) {
                  if (isCorrect) optionClass += " correct-reveal";
                  if (isSelected && !isCorrect) optionClass += " wrong-reveal";
                }

                return (
                  <button
                    key={key}
                    type="button"
                    className={`option-choice-row${optionClass}`}
                    onClick={() => handleOptionSelect(key)}
                    disabled={quizFinished}
                  >
                    <span className="option-badge">{key}</span>
                    <span className="option-label-text">{value}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Navigation Segment */}
          <div className="execution-footer-navigation">
            <button
              className="nav-arrow-btn"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => i - 1)}
            >
              ◀ Previous
            </button>

            {!quizFinished && currentIdx === questions.length - 1 ? (
              <button 
                className="submit-evaluation-btn"
                disabled={Object.keys(selectedAnswers).length !== questions.length}
                onClick={() => setQuizFinished(true)}
              >
                Submit Quiz
              </button>
            ) : (
              <button
                className="nav-arrow-btn"
                disabled={currentIdx === questions.length - 1}
                onClick={() => setCurrentIdx((i) => i + 1)}
              >
                Next ▶
              </button>
            )}
          </div>
        </div>
      )}

      {/* Post Evaluation Results Summary */}
      {quizFinished && (
        <div className="results-summary-card">
          <h4>Performance Assessment Matrix</h4>
          <div className="score-badge-circle">
            <h2>{calculateScore()} / {questions.length}</h2>
            <p>Correct</p>
          </div>
          <p className="critique-text">
            {calculateScore() / questions.length >= 0.8 
              ? "🎯 Masterclass competency demonstrated! Your core knowledge vectors match perfectly." 
              : "📖 Concept loops need adjustments. Review highlighted mismatches above."}
          </p>
          <button className="reset-quiz-btn" onClick={handleGenerateQuiz}>Retry Evaluation Environment</button>
        </div>
      )}
    </div>
  );
}

export default QuizGenerator;