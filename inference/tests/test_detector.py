from io import BytesIO
from PIL import Image
from app.detector import detect_watermark

def test_detector_returns_same_size_mask(sample_image):
    mask, confidence, warnings = detect_watermark(Image.open(BytesIO(sample_image)))
    assert Image.open(BytesIO(mask)).size == (96, 64)
    assert 0 <= confidence <= 1
    assert isinstance(warnings, list)

