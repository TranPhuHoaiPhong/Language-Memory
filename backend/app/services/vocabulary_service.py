from datetime import datetime, timezone

from app.database.mongodb import (
    vocabulary_collection
)


async def save_vocabulary(data):

    print(
        "Saving vocabulary data: ", data
    )

    document = {
        "data": data,
        "createdAt": datetime.now(
            timezone.utc
        )
    }

    result = vocabulary_collection.insert_one(
        document
    )

    return {
        "success": True,
        "id": str(
            result.inserted_id
        )
    }