import httpx

# Will be initialized in startup event
http_client: httpx.AsyncClient | None = None