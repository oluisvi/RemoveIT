from functools import lru_cache
import os

import cv2
import numpy as np
from PIL import Image

class MaskSizeMismatch(ValueError):
    pass

class EmptyMask(ValueError):
    pass

def normalize_mask(mask: Image.Image) -> np.ndarray:
    grayscale = np.asarray(mask.convert("L"))
    binary = np.where(grayscale >= 128, 255, 0).astype(np.uint8)
    return cv2.morphologyEx(binary, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))


@lru_cache(maxsize=1)
def _load_lama():
    from simple_lama_inpainting import SimpleLama
    return SimpleLama()


def _opencv_inpaint(image: Image.Image, binary: np.ndarray) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"))
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    restored = cv2.inpaint(bgr, binary, 3, cv2.INPAINT_NS)
    return Image.fromarray(cv2.cvtColor(restored, cv2.COLOR_BGR2RGB))


def _compose_inside_mask(original: Image.Image, generated: Image.Image, binary: np.ndarray) -> Image.Image:
    source = np.asarray(original.convert("RGB"))
    replacement = np.asarray(generated.convert("RGB").resize(original.size, Image.Resampling.LANCZOS))
    result = source.copy()
    selected = binary > 0
    result[selected] = replacement[selected]
    return Image.fromarray(result)


def inpaint(image: Image.Image, mask: Image.Image, engine: str | None = None) -> Image.Image:
    if image.size != mask.size:
        raise MaskSizeMismatch("A máscara deve ter as mesmas dimensões da imagem.")
    binary = normalize_mask(mask)
    if cv2.countNonZero(binary) == 0:
        raise EmptyMask("A máscara está vazia.")
    selected_engine = (engine or os.getenv("INPAINT_ENGINE", "auto")).lower()
    if selected_engine not in {"auto", "lama", "opencv"}:
        raise ValueError("INPAINT_ENGINE deve ser auto, lama ou opencv.")
    if selected_engine in {"auto", "lama"}:
        try:
            generated = _load_lama()(image.convert("RGB"), Image.fromarray(binary))
            return _compose_inside_mask(image, generated, binary)
        except Exception:
            if selected_engine == "lama":
                raise
    return _compose_inside_mask(image, _opencv_inpaint(image, binary), binary)
