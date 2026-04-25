import json
from pathlib import Path
from typing import Any, Dict


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

STORE_PATH = DATA_DIR / "student_profile_store.json"


def _read() -> Dict[str, Any]:
    if not STORE_PATH.exists():
        return {}
    try:
        return json.loads(STORE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _write(data: Dict[str, Any]) -> None:
    STORE_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def save_profile(student_id: int, profile: Dict[str, Any]) -> None:
    data = _read()
    data[str(student_id)] = profile
    _write(data)


def get_profile(student_id: int) -> Dict[str, Any] | None:
    data = _read()
    return data.get(str(student_id))
