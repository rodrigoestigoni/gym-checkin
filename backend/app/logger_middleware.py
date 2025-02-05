import time
import logging
from starlette.types import ASGIApp, Receive, Scope, Send

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("debug.middleware")

class LoggingMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] == "http":
            method = scope.get("method")
            path = scope.get("path")
            logger.debug(f"Incoming request: {method} {path}")
        await self.app(scope, receive, send)
