def split_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    """Split text into overlapping chunks for embedding.

    Uses a simple character-based splitter that respects sentence boundaries.
    """
    if len(text) <= chunk_size:
        return [text]

    chunks: list[str] = []
    start = 0

    while start < len(text):
        end = start + chunk_size

        if end < len(text):
            # Try to break at sentence boundary
            for sep in [". ", ".\n", "\n\n", "\n", " "]:
                last_sep = text.rfind(sep, start, end)
                if last_sep > start:
                    end = last_sep + len(sep)
                    break

        chunks.append(text[start:end].strip())
        start = end - chunk_overlap

    return [c for c in chunks if c]
