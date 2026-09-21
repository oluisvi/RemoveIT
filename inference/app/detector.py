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
    _, candidate = cv2.threshold(overlay_signal, threshold, 255, cv2.THRESH_BINARY)

    # High-contrast facial details are a common false positive for a purely
    # edge-based detector. Suppress a padded skin neighbourhood, including
    # eyes and mouth contained by that region, before grouping text strokes.
    ycrcb = cv2.cvtColor(rgb, cv2.COLOR_RGB2YCrCb)
    skin = cv2.inRange(ycrcb, np.array((0, 133, 77)), np.array((255, 180, 135)))
    skin_padding = max(3, int(short_side * 0.04) | 1)
    skin = cv2.dilate(skin, np.ones((skin_padding, skin_padding), np.uint8))
    candidate[skin > 0] = 0

    component_count, labels, stats, _ = cv2.connectedComponentsWithStats(candidate, 8)
    mask = np.zeros_like(candidate)
    max_component_area = max(12, int(mask.size * 0.025))
    max_component_width = max(12, int(short_side * 0.70))
    max_component_height = max(8, int(short_side * 0.28))
    for label in range(1, component_count):
        x, y, width, height, area = stats[label]
        if 2 <= area <= max_component_area and width <= max_component_width and height <= max_component_height:
            mask[labels == label] = 255

    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((2, 3), np.uint8))
    mask = cv2.dilate(mask, np.ones((2, 2), np.uint8), iterations=1)

    coverage = float(np.count_nonzero(mask)) / float(mask.size)
    if coverage < 0.0004 or coverage > 0.30:
        mask.fill(0)
        return _encode_mask(mask), 0.2, ["manual-review-required"]
    confidence = min(0.82, 0.38 + coverage * 3.2)
    return _encode_mask(mask), round(confidence, 3), ["review-detected-edges"]
