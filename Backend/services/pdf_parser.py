"""
Extract plain text from a PDF given its raw bytes.
Uses PyMuPDF (fitz) — fast and dependency-light.
"""
import fitz  # PyMuPDF


def extract_text_from_pdf(raw_bytes: bytes) -> str:
    """
    Parses a stream of raw bytes into plain un-formatted structural strings.
    """
    pages = []
    
    try:
        # Open the PDF directly from the in-memory byte array stream
        doc = fitz.open(stream=raw_bytes, filetype="pdf")
        
        for page in doc:
            # "text" layout extraction preserves natural reading orders beautifully
            text = page.get_text("text")
            if text and text.strip():
                pages.append(text.strip())
                
        doc.close()
        
    except Exception as e:
        # Graceful exception routing to prevent silent failures
        raise ValueError(f"PyMuPDF structural parsing exception: {str(e)}")

    # Join the pages cleanly with structured spacing
    return "\n\n".join(pages)