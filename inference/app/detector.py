from io import BytesIO
import cv2
import numpy as np
from PIL import Image

def _encode_mask(mask: np.ndarray) -> bytes:
    success, encoded = cv2.imencode(".png", mask)
    if not success:
        raise RuntimeError("Não foi possível codificar a máscara.")
    return encoded.tobytes()

def detect_watermark(image: Image.Image) -> tuple[bytes, float, list[str]]:
    """Find overlay-like strokes and return a conservative editable mask.

    Production containers may replace this implementation with Florence/SAM
    through the same contract. This CPU path remains a deterministic fallback.
    """
    rgb = np.asarray(image.convert("RGB"))
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    short_side = max(3, min(image.size))
    kernel_size = max(3, int(short_side * 0.035) | 1)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
    bright = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, kernel)
    dark = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel)
    overlay_signal = cv2.max(bright, dark)
    threshold = max(16, int(np.percentile(overlay_signal, 92)))
    _, mask = cv2.threshold(overlay_signal, threshold, 255, cv2.THRESH_BINARY)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((3, 5), np.uint8))
    mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=1)

    coverage = float(np.count_nonzero(mask)) / float(mask.size)
    if coverage < 0.002 or coverage > 0.45:
        mask.fill(0)
        return _encode_mask(mask), 0.2, ["manual-review-required"]
    confidence = min(0.82, 0.38 + coverage * 3.2)
    return _encode_mask(mask), round(confidence, 3), ["review-detected-edges"]
