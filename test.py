import requests

url = "https://translate.googleapis.com/translate_a/single"

params = {
    "client": "gtx",
    "sl": "en",
    "tl": "vi",
    "dt": "t",
    "q": "Staying in is [[always]] great"
}

r = requests.get(url, params=params)

print(r.json()[0][0][0])