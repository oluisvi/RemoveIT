from pydantic import BaseModel, Field

class DetectionResponse(BaseModel):
    confidence: float = Field(ge=0, le=1)
    maskDataUrl: str
    warnings: list[str]
