import json
from pathlib import Path
from typing import Any, Dict

# This is a simple “JSON repository” instead of a DB.
BASE_DIR = Path(__file__).resolve().parent.parent  # app/
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

STORE_PATH = DATA_DIR / "quiz_store.json"


def _default_store() -> Dict[str, Any]:
    return {
        "quizzes": {},          # old student chat quizzes
        "attempts": [],         # old student attempts
        "templates": {},        # new reusable teacher templates
        "template_attempts": []
    }


def load_store() -> Dict[str, Any]:
    if not STORE_PATH.exists():
        data = _default_store()
        save_store(data)
        return data

    data = json.loads(STORE_PATH.read_text(encoding="utf-8"))

    if "quizzes" not in data:
        data["quizzes"] = {}

    if "attempts" not in data:
        data["attempts"] = []

    if "templates" not in data:
        data["templates"] = {}

    if "template_attempts" not in data:
        data["template_attempts"] = []

    return data


def save_store(data: Dict[str, Any]) -> None:
    STORE_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    

# def _default_store() -> Dict[str, Any]:
#     return {
#         "quizzes": {},      # quiz_id -> quiz object (includes correct answers)
#         "attempts": []      # list of attempts
#     }

# def load_store() -> Dict[str, Any]:
#     if not STORE_PATH.exists():
#         data = _default_store()
#         save_store(data)
#         return data
#     return json.loads(STORE_PATH.read_text(encoding="utf-8"))

# def save_store(data: Dict[str, Any]) -> None:
#     STORE_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
