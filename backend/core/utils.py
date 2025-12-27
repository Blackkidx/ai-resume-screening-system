import uuid
from datetime import datetime
import os


def generate_unique_id(prefix: str = "ID") -> str:
    year = datetime.utcnow().year
    random_part = str(uuid.uuid4())[:8].upper()
    return f"{prefix}-{year}-{random_part}"


def validate_file_type(filename: str, allowed_extensions: list) -> bool:
    file_extension = os.path.splitext(filename)[1].lower()
    return file_extension in allowed_extensions