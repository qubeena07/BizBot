import csv
import io
from pathlib import Path

from PyPDF2 import PdfReader
from docx import Document


async def extract_text_from_file(file_path: str, content_type: str | None = None) -> str:
    """Extract text content from uploaded files."""
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return _extract_pdf(path)
    elif suffix == ".docx":
        return _extract_docx(path)
    elif suffix == ".txt" or suffix == ".md":
        return path.read_text(encoding="utf-8")
    elif suffix == ".csv":
        return _extract_csv(path)
    else:
        raise ValueError(f"Unsupported file type: {suffix}")


def _extract_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n\n".join(pages)


def _extract_docx(path: Path) -> str:
    doc = Document(str(path))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


def _extract_csv(path: Path) -> str:
    text_parts = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            line = ", ".join(f"{k}: {v}" for k, v in row.items() if v)
            if line:
                text_parts.append(line)
    return "\n".join(text_parts)
