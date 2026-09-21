from base64 import b64encode
from io import BytesIO
import os
import secrets
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError
from app.detector import detect_watermark
from app.inpainter import EmptyMask, MaskSizeMismatch, inpaint
from app.schemas import DetectionResponse

app = FastAPI(title="RemoveIT Inference", docs_url=None, redoc_url=None)

def authorize(authorization: str | None = Header(default=None)) -> None:
    expected = f"Bearer {os.getenv('INFERENCE_SERVICE_TOKEN', 'local-development')}"
    if not authorization or not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Não autorizado.")

def read_image(payload: bytes) -> Image.Image:
    try:
        image = Image.open(BytesIO(payload))
        image.load()
        return image
    except (UnidentifiedImageError, OSError) as error:
        raise HTTPException(status_code=422, detail="Imagem inválida.") from error

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/v1/detect", response_model=DetectionResponse)
async def detect(image: UploadFile = File(...), authorization: str | None = Header(default=None)) -> DetectionResponse:
    authorize(authorization)
    mask, confidence, warnings = detect_watermark(read_image(await image.read()))
    return DetectionResponse(confidence=confidence, maskDataUrl=f"data:image/png;base64,{b64encode(mask).decode()}", warnings=warnings)

@app.post("/v1/inpaint", response_class=Response)
async def reconstruct(image: UploadFile = File(...), mask: UploadFile = File(...), authorization: str | None = Header(default=None)) -> Response:
    authorize(authorization)
    try:
        result = inpaint(read_image(await image.read()), read_image(await mask.read()))
    except (MaskSizeMismatch, EmptyMask) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    output = BytesIO()
    result.save(output, format="PNG", optimize=True)
    return Response(output.getvalue(), media_type="image/png")
