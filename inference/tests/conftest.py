from io import BytesIO
import pytest
from PIL import Image, ImageDraw

@pytest.fixture
def sample_image():
    image = Image.new("RGB", (96, 64), "#8ca0b8")
    draw = ImageDraw.Draw(image)
    draw.text((20, 25), "SAMPLE", fill=(245, 245, 245))
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()

@pytest.fixture
def mask_bytes():
    image = Image.new("L", (96, 64), 0)
    ImageDraw.Draw(image).rectangle((18, 20, 78, 44), fill=255)
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()

