from io import BytesIO
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
