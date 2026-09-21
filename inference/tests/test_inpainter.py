from io import BytesIO
import numpy as np
import pytest
from PIL import Image
from app.inpainter import EmptyMask, MaskSizeMismatch, inpaint

def test_inpaint_rejects_empty_mask(sample_image):
    image = Image.open(BytesIO(sample_image))
    with pytest.raises(EmptyMask):
        inpaint(image, Image.new("L", image.size, 0))

def test_inpaint_rejects_different_dimensions(sample_image):
    with pytest.raises(MaskSizeMismatch):
        inpaint(Image.open(BytesIO(sample_image)), Image.new("L", (10, 10), 255))

def test_inpaint_returns_complete_rgb_image(sample_image, mask_bytes):
    result = inpaint(Image.open(BytesIO(sample_image)), Image.open(BytesIO(mask_bytes)))
    assert result.mode == "RGB"
    assert result.size == (96, 64)


def test_inpaint_refines_small_holes_before_reconstruction():
    width, height = 160, 100
    gradient = np.linspace(30, 220, width, dtype=np.uint8)
    clean = np.repeat(gradient[None, :, None], height, axis=0)
    clean = np.repeat(clean, 3, axis=2)
    damaged = clean.copy()
    damaged[42:58, 45:115] = 255
    mask = np.zeros((height, width), dtype=np.uint8)
    mask[42:58, 45:115] = 255
    mask[45:55:3, 50:110:4] = 0

    result = np.asarray(
        inpaint(Image.fromarray(damaged), Image.fromarray(mask), engine="opencv")
    )

    error = np.abs(result.astype(np.int16) - clean.astype(np.int16))
    assert float(error[42:58, 45:115].mean()) < 4.0
    assert int(error[45:55, 50:110].max()) < 35


def test_opencv_engine_does_not_require_lama(monkeypatch, sample_image, mask_bytes):
    def unavailable_lama():
        raise AssertionError("LaMa must stay lazy for the OpenCV engine")

    monkeypatch.setattr("app.inpainter._load_lama", unavailable_lama)
    result = inpaint(
        Image.open(BytesIO(sample_image)),
        Image.open(BytesIO(mask_bytes)),
        engine="opencv",
    )

    assert result.size == (96, 64)


def test_lama_engine_uses_lazy_model_when_available(monkeypatch, sample_image, mask_bytes):
    class FakeLama:
        def __call__(self, image, mask):
            return Image.new("RGB", image.size, (12, 34, 56))

    monkeypatch.setattr("app.inpainter._load_lama", lambda: FakeLama())
    result = inpaint(
        Image.open(BytesIO(sample_image)),
        Image.open(BytesIO(mask_bytes)),
        engine="lama",
    )

    assert result.getpixel((40, 30)) == (12, 34, 56)


def test_auto_engine_falls_back_when_lama_is_unavailable(
    monkeypatch, sample_image, mask_bytes
):
    def unavailable_lama():
        raise ImportError("optional dependency is not installed")

    monkeypatch.setattr("app.inpainter._load_lama", unavailable_lama)
    result = inpaint(
        Image.open(BytesIO(sample_image)),
        Image.open(BytesIO(mask_bytes)),
        engine="auto",
    )

    assert result.mode == "RGB"
    assert result.size == (96, 64)
