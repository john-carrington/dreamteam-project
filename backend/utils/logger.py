import sys

from config import settings
from loguru import logger

IS_DEBUG: bool = settings.api.DEBUG
LOG_LEVEL = "DEBUG" if IS_DEBUG else "INFO"

logger.remove()
logger.add(
    sys.stderr,
    level=LOG_LEVEL,
    colorize=True,
)
