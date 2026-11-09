from contextlib import closing
from logging import getLogger

import pyodbc

from backend.repositories.db import get_connection

logger = getLogger(__name__)


def database_is_available() -> bool:
    try:
        with closing(get_connection()):
            return True
    except pyodbc.Error as error:
        logger.warning("No se pudo conectar a SQL Server (SQLSTATE %s).", error.args[0])
        return False
    except ValueError as error:
        logger.warning("%s", error)
        return False
