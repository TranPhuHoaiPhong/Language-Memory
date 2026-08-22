import re

def sanitize_filename(word: str) -> str:
    return re.sub(r'[^a-zA-Z0-9_]', '_', word.lower())