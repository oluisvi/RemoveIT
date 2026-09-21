from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_detect_returns_normalized_mask_and_confidence(monkeypatch, sample_image, mask_bytes):
    monkeypatch.setattr("app.main.detect_watermark", lambda _: (mask_bytes, 0.94, ["overlay-text"]))
    response = client.post("/v1/detect", files={"image": ("input.png", sample_image, "image/png")})
    assert response.status_code == 200
    body = response.json()
    assert body["confidence"] == 0.94
    assert body["maskDataUrl"].startswith("data:image/png;base64,")

def test_health():
    assert client.get("/health").json() == {"status": "ok"}

