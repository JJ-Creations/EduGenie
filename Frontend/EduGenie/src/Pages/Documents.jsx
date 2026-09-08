import { useRef, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom"; // Hook to access shared Layout state
import { showToast } from "./Toast";
import "./Documents.css";

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function Documents() {
  const { documents, setDocuments } = useOutletContext();

  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const fileInputRef = useRef(null);
  const validExtensions = [".pdf"];

  const validateFiles = (fileList) => {
    const valid = [];
    const invalid = [];
    for (const f of fileList) {
      const dotIdx = f.name.lastIndexOf(".");
      const ext = dotIdx >= 0 ? f.name.toLowerCase().slice(dotIdx) : "";
      if (validExtensions.includes(ext)) {
        valid.push(f);
      } else {
        invalid.push(f.name);
      }
    }
    return { valid, invalid };
  };

  const addFiles = useCallback(async (newFileList) => {
    const { valid, invalid } = (() => {
      const v = [];
      const inv = [];
      for (const f of newFileList) {
        if (f.name.toLowerCase().endsWith(".pdf")) {
          v.push(f);
        } else {
          inv.push(f.name);
        }
      }
      return { valid: v, invalid: inv };
    })();

    if (invalid.length > 0) {
      showToast(`${invalid.length} file(s) skipped. Only PDF files are supported.`, "error");
    }

    if (valid.length === 0) return;

    for (const file of valid) {
      const uniqueId = "temp_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const localDocPlaceholder = {
        id: uniqueId,
        name: file.name,
        category: "General Document",
        uploadDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        status: "Processing",
        pages: "--",
        size: formatFileSize(file.size)
      };

      setDocuments((prev) => [localDocPlaceholder, ...prev]);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("http://localhost:8000/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Upload failed");
        }

        const serverData = await response.json();
        setDocuments((currentDocs) =>
          currentDocs.map((doc) =>
            doc.id === uniqueId
              ? { ...doc, id: serverData.doc_id, status: "Indexed", pages: "Calculated" }
              : doc
          )
        );
        showToast(`"${file.name}" uploaded and indexed successfully!`, "success");

      } catch (error) {
        console.error("Upload error details:",error);
        setDocuments((currentDocs) => currentDocs.filter((doc) => doc.id !== uniqueId));
        showToast(`Failed uploading ${file.name}: ${error.message}`, "error");
      }
    }
  }, [setDocuments]);
  const handleFilesChange = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDelete = (id) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    showToast("Document removed from screen view", "info");
  };
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All Status" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  return (
    <div className="study-materials-container">
      <div className="page-header">
        <div>
          <h2>Study Materials</h2>
          <p className="page-desc">Manage and organize your uploaded documents</p>
        </div>
        <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
          <span className="icon">⬆</span> Upload PDF
        </button>
      </div>

      <div
        className={`upload-drop-zone ${isDragging ? "dragging" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
      >
        <div className="folder-icon">📁</div>
        <h3>Drag & Drop PDF Files Here</h3>
        <p className="subtitle">Supports PDF, TXT, DOCX — up to 50MB per file</p>

        <div className="drop-zone-actions">
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            <span className="icon">⬆</span> Upload PDF
          </button>
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <span className="icon">📁</span> Browse Files
          </button>
        </div>

        <input
          type="file"
          multiple
          accept=".pdf,.txt,.docx"
          onChange={handleFilesChange}
          ref={fileInputRef}
          hidden
        />
      </div>

      {/* Uploaded Documents List Section */}
      <div className="documents-card">
        <div className="card-header">
          <div className="card-title-area">
            <h3>Uploaded Documents</h3>
            <span className="count-badge">{filteredDocuments.length} files</span>
          </div>

          <div className="filter-controls">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-dropdown"
            >
              <option value="All Status">All Status</option>
              <option value="Indexed">Indexed</option>
              <option value="Processing">Processing</option>
            </select>
          </div>
        </div>

        <div className="docs-table">
          <div className="table-header grid-row">
            <div>DOCUMENT NAME</div>
            <div>UPLOAD DATE</div>
            <div>STATUS</div>
            <div>PAGES</div>
            <div>SIZE</div>
            <div className="center-text">ACTIONS</div>
          </div>

          <div className="table-body">
            {filteredDocuments.map((doc) => (
              <div className="table-item grid-row" key={doc.id}>
                <div className="doc-meta">
                  <div className="doc-icon">📄</div>
                  <div className="doc-details">
                    <span className="doc-name">{doc.name}</span>
                    <span className="doc-sub">{doc.category}</span>
                  </div>
                </div>
                <div className="vertical-center">{doc.uploadDate}</div>
                <div className="vertical-center">
                  <span className={`status-tag ${doc.status.toLowerCase()}`}>
                    <span className="dot">●</span> {doc.status}
                  </span>
                </div>
                <div className="vertical-center">{doc.pages}</div>
                <div className="vertical-center">{doc.size}</div>
                <div className="action-buttons vertical-center">
                  <button className="action-btn chat-btn">💬 Chat</button>
                  <button className="action-btn icon-btn" title="View">👁</button>
                  <button className="action-btn icon-btn delete" onClick={() => handleDelete(doc.id)} title="Delete">🗑</button>
                </div>
              </div>
            ))}
            {filteredDocuments.length === 0 && (
              <div className="no-data">No documents found matching the criteria.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Documents;