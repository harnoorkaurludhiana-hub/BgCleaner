from pydantic import BaseModel


class ImageData(BaseModel):
    image_id: str
    original_url: str
    processed_url: str
    width: int
    height: int
    format: str


class ImageResponse(BaseModel):
    success: bool = True
    message: str
    data: ImageData


class MessageResponse(BaseModel):
    success: bool = True
    message: str
