from pathlib import Path
from typing import Optional, TypedDict
from langchain_community.document_loaders import PyPDFLoader
import re

# loader.py: Intelligently reads folders (class and subject)

class Meta(TypedDict):
    grade: Optional[int]
    subject: Optional[str]

# Data Context Management  | Metadata Tagging
# Metadata Filtering with Boolean Operators | Filtered Vector Search
#grade_8_physics_unit1.pdf
#"data/grade_8/math_book.pdf"

def infer_meta_from_path(path_str: str) -> Meta:
    p = Path(path_str)

    meta: Meta = {"grade": None, "subject": None}

    # grade from folder Grade_8
    grade_folder = p.parent.name.lower()
    m = re.search(r"grade[_\-\s]*(\d{1,2})", grade_folder)
    if m:
        meta["grade"] = int(m.group(1))

    # subject from filename math.pdf -> math
    meta["subject"] = p.stem.lower()

    return meta

def load_pdfs(pdf_dir: str):
    pdf_dir_path = Path(pdf_dir)
    if not pdf_dir_path.exists():
        raise FileNotFoundError(f"PDF directory not found: {pdf_dir_path}")

    # search within the row folders
    pdf_files = sorted(pdf_dir_path.rglob("*.pdf"))
    
    if not pdf_files:
        raise FileNotFoundError(f"No PDF files found in: {pdf_dir_path}")

    docs = []
    for pdf_path in pdf_files:
        loader = PyPDFLoader(str(pdf_path))
        pages = loader.load()

        inferred = infer_meta_from_path(str(pdf_path))
        # inferred = infer_meta_from_filename(str(pdf_path))
        
        if inferred['grade'] is None:
            print(f"Warning: No grade found for {pdf_path}")
        
        for d in pages:
            d.metadata = dict(d.metadata or {})
            d.metadata.update({
                "source_file": pdf_path.name,
                "source_path": str(pdf_path),
                "grade": inferred["grade"],
                "subject": inferred["subject"],
            })

        docs.extend(pages)

    return docs




# def infer_meta_from_path(path_str: str) -> Meta:
#     #"data/grade_8/math_book.pdf"
#     path_lower = path_str.lower()

#     # Row map dictionary
#     grades_map = {
#         "grade_4": 4,
#         "grade_5": 5,
#         "grade_6": 6,
#         "grade_7": 7,
#         "grade_8": 8,
#         "grade_9": 9,
#         "grade_10": 10,
#         "grade_11": 11,
#         "grade_12": 12,
#     }

#     # Material map list
#     subjects = ["math", "physics", "science", "english", "chemistry", "biology", "history"]

#     meta: Meta = {"grade": None, "subject": None}

#     # Searching for the class | Searching for the grade
#     for key, val in grades_map.items():
#         if key in path_lower:
#             meta["grade"] = val
#             break

#     # Searching for the material
#     for sub in subjects:
#         if sub in path_lower:
#             meta["subject"] = sub
#             break

#     return meta