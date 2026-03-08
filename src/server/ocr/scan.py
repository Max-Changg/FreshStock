"""
Usage: python scan.py <image_path>
Output: JSON array of raw text lines to stdout
Requires: paddleocr>=3.4.0, paddlepaddle>=3.3.0
"""

import sys
import os
import json

os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")


def extract_lines(result):
    """Extract text strings from PaddleOCR 3.x predict() output."""
    lines = []
    if not result:
        return lines

    for page in result:
        if page is None:
            continue

        # ── Primary: rec_texts attribute (PaddleOCR 3.x OCRResult) ────────────
        if hasattr(page, "rec_texts"):
            for text in (page.rec_texts or []):
                t = str(text).strip()
                if t:
                    lines.append(t)
            continue

        # ── Fallback: iterate as list of dicts or tuples ───────────────────────
        try:
            for item in page:
                text = ""
                if isinstance(item, dict):
                    text = item.get("transcription") or item.get("text") or ""
                elif isinstance(item, (list, tuple)) and len(item) >= 2:
                    info = item[1]
                    if isinstance(info, (list, tuple)):
                        text = info[0]
                    elif isinstance(info, str):
                        text = info
                t = str(text).strip()
                if t:
                    lines.append(t)
        except TypeError:
            s = str(page).strip()
            if s and s not in ("None", "[]"):
                lines.append(s)

    return lines


def main():
    if len(sys.argv) < 2:
        print("Usage: python scan.py <image_path>", file=sys.stderr)
        sys.exit(1)

    image_path = sys.argv[1]

    try:
        from paddleocr import PaddleOCR

        ocr = PaddleOCR(use_textline_orientation=True, lang="en")

        # Use predict() — ocr() is deprecated in 3.x and crashes on some builds
        result = list(ocr.predict(image_path))
        lines = extract_lines(result)

        print(f"[scan.py] extracted {len(lines)} lines", file=sys.stderr)
        print(json.dumps(lines))

    except Exception as e:
        print(f"OCR error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
