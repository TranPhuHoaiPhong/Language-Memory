import os

from dotenv import load_dotenv


load_dotenv()


class Settings:

    MONGODB_URI = os.getenv("MONGODB_URI", "")

    MONGODB_DATABASE = os.getenv(
        "MONGODB_DATABASE",
        "language_memory"
    )

    GOOGLE_TRANSLATE_TIMEOUT = float(
        os.getenv(
            "GOOGLE_TRANSLATE_TIMEOUT",
            "10"
        )
    )


settings = Settings()