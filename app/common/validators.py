from typing import Optional


def validate_text(value: Optional[str]) -> Optional[str]:
    """
    Common validator for text inputs.

    Rejects:
    - empty strings
    - whitespace only
    - Swagger default value ("string")
    """

    if value is None:
        return value

    value = value.strip()

    if not value:
        raise ValueError("Value cannot be empty.")

    if value.lower() == "string":
        raise ValueError("Please provide a valid value.")

    return value


def validate_subject(value: Optional[str]) -> Optional[str]:
    value = validate_text(value)

    if value is None:
        return value

    valid_subjects = {
        "math",
        "physics",
        "chemistry",
        "english",
        "biology",
    }

    if value.lower() not in valid_subjects:
        raise ValueError(
            f"Subject must be one of {sorted(valid_subjects)}"
        )

    return value.lower()


def validate_grade(value: Optional[int]) -> Optional[int]:
    if value is None:
        return value

    if value < 1 or value > 12:
        raise ValueError("Grade must be between 1 and 12.")

    return value


def validate_score(value: Optional[float]) -> Optional[float]:
    if value is None:
        return value

    if value < 0 or value > 100:
        raise ValueError("Score must be between 0 and 100.")

    return value


def validate_positive_id(value: Optional[int]) -> Optional[int]:
    if value is None:
        return value

    if value <= 0:
        raise ValueError("ID must be greater than zero.")

    return value