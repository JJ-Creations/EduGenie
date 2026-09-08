import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { showToast } from "./Toast";
import "./Summaries.css";

function Summaries() {
  const { documents } = useOutletContext();

  const [selectedDocId, setSelectedDocId] = useState("");
  const [chapterSection, setChapterSection] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState(null);

  useEffect(() => {
    if (documents && documents.length > 0 && !selectedDocId) {
      const firstId = documents[0]?.id?.toString() || "";
      if (firstId) {
        setSelectedDocId(firstId);
      }
    }
  }, [documents, selectedDocId]);

  const handleGenerateSummary = async (e) => {
    if (e) e.preventDefault();
    if (!selectedDocId) {
      showToast("Please select a document first", "error");
      return;
    }

    const selectedDoc = documents.find((doc) => doc.id?.toString() === selectedDocId);

    if (selectedDoc?.status === "Processing") {
      showToast("This document is still being analyzed. Wait until it says 'Indexed'.", "info");
      return;
    }
    
    setLoading(true);
    setSummaryResult(null);

    try {
      const response = await fetch("http://localhost:8000/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doc_id: selectedDocId,
          chapter_section: chapterSection || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed generating summary content.");
      }

      const serverData = await response.json(); 
      // serverData.summary is now our JSON object containing introduction, core_takeaways, actionable_steps
      const summaryData = serverData.summary || {};

      setSummaryResult({
        title: selectedDoc?.name || "Document Overview",
        tag: selectedDoc?.category || "PDF Study Guide",
        introduction: summaryData.introduction || "No introductory overview provided.",
        coreTakeaways: summaryData.core_takeaways || [],
        actionableSteps: summaryData.actionable_steps || []
      });
      
      showToast("Summary rendered successfully!", "success");
    } catch (error) {
      showToast(`AI Pipeline Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="summaries-page-container">
      <form onSubmit={handleGenerateSummary} className="summary-config-card">
        <div className="config-grid">
          <div className="form-group">
            <label className="config-label">Select Document</label>
            <select
              className="config-select"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
            >
              {documents.length === 0 ? (
                <option value="">No documents uploaded yet. Go to Documents.</option>
              ) : (
                documents.map((doc, idx) => (
                  <option key={doc.id || idx} value={doc.id || ""}>
                    {doc.name || "Unnamed Document"} ({doc.status || "Ready"})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label className="config-label">Chapter / Section (optional)</label>
            <input
              type="text"
              className="config-input"
              placeholder="e.g. Chapter 2: System Architectures"
              value={chapterSection}
              onChange={(e) => setChapterSection(e.target.value)}
            />
          </div>
        </div>

        <div className="summary-actions">
          <button 
            type="submit" 
            className="btn-generate" 
            disabled={loading || documents.length === 0}
          >
            {loading ? "Generating..." : "Generate Summary"}
          </button>
          {summaryResult && (
            <button type="button" className="btn-regenerate" onClick={handleGenerateSummary}>
              🔄 Regenerate
            </button>
          )}
        </div>
      </form>

      {loading && (
        <div className="summary-loading-state">
          <div className="loader-spinner"></div>
          <p>Analyzing document syntax and drafting summary contents...</p>
        </div>
      )}

      {summaryResult && !loading && (
        <div className="summary-result-card">
          <div className="result-header">
            <div className="result-title-group">
              <h3>Generated Summary</h3>
              <span className="result-badge">{summaryResult.tag}</span>
            </div>
            <div className="result-actions">
              <button type="button" className="util-btn" onClick={() => { 
                const fullText = `${summaryResult.title}\n\nIntroduction:\n${summaryResult.introduction}\n\nCore Takeaways:\n${summaryResult.coreTakeaways.join('\n')}\n\nActionable Steps:\n${summaryResult.actionableSteps.join('\n')}`;
                navigator.clipboard.writeText(fullText); 
                showToast("Copied to clipboard!", "success"); 
              }}>📋 Copy Text</button>
              <button type="button" className="util-btn">📄 Export PDF</button>
              <button type="button" className="util-btn save-btn">💾 Save</button>
            </div>
          </div>

          <div className="result-body">
            <h4 className="output-heading">{summaryResult.title}</h4>
            {chapterSection && <p className="output-section-target"><strong>Target Scope:</strong> {chapterSection}</p>}
            
            {/* 1. Introduction Section */}
            <p className="summary-paragraph">{parseInlineBold(summaryResult.introduction)}</p>
            
            {/* 2. Core Highlights / Takeaways Section */}
            {summaryResult.coreTakeaways.length > 0 && (
              <>
                <h5 className="section-subheading">Key Aspects & Core Takeaways</h5>
                <ul className="output-list">
                  {summaryResult.coreTakeaways.map((takeaway, i) => (
                    <li key={i}>{parseInlineBold(takeaway)}</li>
                  ))}
                </ul>
              </>
            )}

            {/* 3. Actionable Mitigation Steps Section */}
            {summaryResult.actionableSteps.length > 0 && (
              <>
                <h5 className="section-subheading">Actionable Steps for Water Conservation</h5>
                <ul className="output-list">
                  {summaryResult.actionableSteps.map((step, i) => (
                    <li key={i}>{parseInlineBold(step)}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function parseInlineBold(text) {
  if (typeof text !== "string") return text;
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

export default Summaries;