import pyodbc

from backend.config import settings


def get_connection() -> pyodbc.Connection:
    connection_settings = {
        "DRIVER": settings.get("DB_DRIVER"),
        "SERVER": settings.get("DB_SERVER"),
        "DATABASE": settings.get("DB_NAME"),
        "UID": settings.get("DB_USER"),
        "PWD": settings.get("DB_PASSWORD"),
    }
    attributes = []
    for key, value in connection_settings.items():
        if not value:
            raise ValueError("La configuración de SQL Server está incompleta.")
        escaped_value = value.replace("}", "}}")
        attributes.append(f"{key}={{{escaped_value}}}")

    return pyodbc.connect(";".join(attributes), timeout=5)
