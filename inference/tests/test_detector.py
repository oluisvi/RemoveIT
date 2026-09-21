from io import BytesIO
import numpy as np
from PIL import Image
from PIL import ImageDraw
from app.detector import detect_watermark

def test_detector_returns_same_size_mask(sample_image):
    mask, confidence, warnings = detect_watermark(Image.open(BytesIO(sample_image)))
    assert Image.open(BytesIO(mask)).size == (96, 64)
    assert 0 <= confidence <= 1
    assert isinstance(warnings, list)


def _mask_coverage(image: Image.Image) -> float:
    encoded, _, _ = detect_watermark(image)
    mask = np.asarray(Image.open(BytesIO(encoded)).convert("L"))
    return float(np.count_nonzero(mask)) / float(mask.size)


def test_detector_suppresses_large_skin_and_body_features():
    image = Image.new("RGB", (256, 192), (55, 75, 100))
    draw = ImageDraw.Draw(image)
    draw.ellipse((45, 15, 205, 230), fill=(211, 157, 130))
    draw.ellipse((85, 55, 102, 70), fill=(60, 40, 35))
    draw.ellipse((150, 55, 167, 70), fill=(60, 40, 35))
    draw.arc((95, 70, 160, 125), 0, 180, fill=(130, 65, 60), width=4)

    assert _mask_coverage(image) < 0.005


def test_detector_keeps_repeated_overlay_text_strokes():
    image = Image.new("RGB", (256, 192), (80, 120, 160))
    ImageDraw.Draw(image).text(
        (70, 80),
        "WATERMARK",
        fill=(245, 245, 245),
        stroke_width=1,
    )

    assert _mask_coverage(image) > 0.006

