import os
import tempfile
from io import BytesIO

os.environ["STORAGE_DIR"] = tempfile.mkdtemp()
os.environ["MAX_UPLOAD_SIZE_MB"] = "1"
os.environ["MAX_IMAGE_DIMENSION"] = "2000"

import pytest
from fastapi.testclient import TestClient
from PIL import Image

import app.main as main_module
from app.main import app
from app.services import image_service


def fake_remove(image):
    # Stand-in for rembg: make the left half transparent.
    out = image.convert("RGBA")
    for x in range(out.width // 2):
        for y in range(out.height):
            out.putpixel((x, y), (0, 0, 0, 0))
    return out


@pytest.fixture(autouse=True)
def stub_ai(monkeypatch):
    monkeypatch.setattr(image_service, "remove_background", fake_remove)
    monkeypatch.setattr(main_module, "get_session", lambda: None)  # skip model preload


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def make_image(fmt: str, size=(40, 30)) -> bytes:
    buf = BytesIO()
    Image.new("RGB", size, (200, 50, 50)).save(buf, format=fmt)
    return buf.getvalue()


def upload(client, data: bytes, name="photo.jpg", mime="image/jpeg"):
    return client.post("/api/v1/images/remove-bg", files={"file": (name, data, mime)})


def test_health(client):
    assert client.get("/api/v1/health").json() == {"status": "ok", "service": "background-remover"}


@pytest.mark.parametrize("fmt", ["JPEG", "PNG", "WEBP"])
def test_valid_upload_returns_transparent_png(client, fmt):
    res = upload(client, make_image(fmt))
    assert res.status_code == 200
    data = res.json()["data"]
    assert (data["width"], data["height"], data["format"]) == (40, 30, "PNG")

    img_res = client.get(data["processed_url"])
    assert img_res.headers["content-type"] == "image/png"
    out = Image.open(BytesIO(img_res.content))
    assert out.mode == "RGBA" and out.getpixel((0, 0))[3] == 0 and out.getpixel((39, 0))[3] == 255
    assert client.get(data["original_url"]).status_code == 200


def test_client_filename_and_mime_are_ignored(client):
    # Real PNG content disguised as .exe still works; storage uses the UUID, not the name.
    res = upload(client, make_image("PNG"), name="../../evil.exe", mime="application/octet-stream")
    assert res.status_code == 200
    assert "evil" not in res.json()["data"]["processed_url"]


def test_invalid_file(client):
    res = upload(client, b"not an image at all", name="x.png", mime="image/png")
    assert res.status_code == 415
    assert res.json() == {"success": False, "message": "Unsupported or corrupted image", "error": {"code": "INVALID_IMAGE_FORMAT"}}


def test_unsupported_format(client):
    res = upload(client, make_image("GIF"), name="x.gif", mime="image/gif")
    assert res.status_code == 415


def test_corrupted_image(client):
    data = make_image("PNG", (200, 200))
    res = upload(client, data[: len(data) // 2])
    assert res.status_code == 415


def test_oversized_file(client):
    res = upload(client, b"\0" * (1024 * 1024 + 10))
    assert res.status_code == 413
    assert res.json()["error"]["code"] == "FILE_TOO_LARGE"


def test_dimension_limit(client):
    res = upload(client, make_image("PNG", (2001, 10)))
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "IMAGE_TOO_LARGE"


def test_get_and_delete(client):
    image_id = upload(client, make_image("PNG")).json()["data"]["image_id"]
    assert client.get(f"/api/v1/images/{image_id}").json()["data"]["width"] == 40
    assert client.delete(f"/api/v1/images/{image_id}").status_code == 200
    assert client.get(f"/media/processed/{image_id}.png").status_code == 404
    assert client.delete(f"/api/v1/images/{image_id}").status_code == 404


def test_ai_failure(client, monkeypatch):
    def boom(_):
        raise RuntimeError("model crashed at C:/secret/path")

    monkeypatch.setattr(image_service, "remove_background", boom)
    res = upload(client, make_image("PNG"))
    assert res.status_code == 500
    assert "secret" not in res.text and res.json()["error"]["code"] == "PROCESSING_FAILED"


@pytest.mark.parametrize("path", ["/media/processed/..%2F..%2Fapp%2Fmain.png", "/media/processed/abc.png", "/media/secret/x.png"])
def test_path_traversal_blocked(client, path):
    assert client.get(path).status_code == 404
