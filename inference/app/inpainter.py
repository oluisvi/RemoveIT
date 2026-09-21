import cv2
import numpy as np
from PIL import Image

class MaskSizeMismatch(ValueError):
    pass

class EmptyMask(ValueError):
    pass

def normalize_mask(mask: Image.Image) -> np.ndarray:
    grayscale = np.asarray(mask.convert("L"))
    return np.where(grayscale >= 32, 255, 0).astype(np.uint8)

def inpaint(image: Image.Image, mask: Image.Image) -> Image.Image:
    if image.size != mask.size:
        raise MaskSizeMismatch("A máscara deve ter as mesmas dimensões da imagem.")
    binary = normalize_mask(mask)
    if cv2.countNonZero(binary) == 0:
        raise EmptyMask("A máscara está vazia.")
    rgb = np.asarray(image.convert("RGB"))
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    restored = cv2.inpaint(bgr, binary, 5, cv2.INPAINT_TELEA)
    return Image.fromarray(cv2.cvtColor(restored, cv2.COLOR_BGR2RGB))
