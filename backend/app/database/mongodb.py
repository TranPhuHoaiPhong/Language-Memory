from pymongo import MongoClient

from app.core.config import settings


client = MongoClient(
    settings.MONGODB_URI,
    maxPoolSize=100,
    minPoolSize=5
)


db = client[
    settings.MONGODB_DATABASE
]


subtitle_cache_collection = db[
    "subtitle_cache"
]


vocabulary_collection = db[
    "vocabulary"
]