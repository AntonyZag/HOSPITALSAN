"""Comprobacion previa de solo lectura. Nunca imprime las credenciales de conexion."""
from __future__ import annotations

import argparse
import importlib
import importlib.metadata
from contextlib import closing
import platform
import re
import socket
import struct
import sys
import tomllib
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE / "src"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", action="store_true", help="Comprueba tambien conexion y procedimientos.")
    argumentos = parser.parse_args()
    fallos = 0

    def mostrar(ok: bool, mensaje: str, *, obligatorio: bool = True) -> None:
        nonlocal fallos
        print(f"[{'OK' if ok else 'REVISAR'}] {mensaje}")
        if not ok and obligatorio:
            fallos += 1

    print("Hospital San Gabriel - revision previa (sin modificar el sistema)")
    mostrar(sys.version_info >= (3, 15), f"Python {platform.python_version()}; el proyecto requiere 3.15 o superior.")
    mostrar(struct.calcsize("P") == 8, "Python de 64 bits.")
    # Compara el entorno instalado con las versiones fijadas por el proyecto.
    lock = tomllib.loads((BASE / "uv.lock").read_text(encoding="utf-8"))
    pendientes = []
    for paquete in lock["package"]:
        if paquete["name"] == "backend":
            continue
        try:
            instalado = importlib.metadata.version(paquete["name"])
        except importlib.metadata.PackageNotFoundError:
            pendientes.append(paquete["name"] + ": falta")
        else:
            if instalado != paquete["version"]:
                pendientes.append(paquete["name"] + ": version diferente")
    mostrar(not pendientes, "Dependencias coinciden con uv.lock." if not pendientes else ", ".join(pendientes))
    if pendientes:
        print("  Desde backend/: uv sync --locked")

    # Importar el modulo verifica si Windows permite cargar el binario, no solo si esta instalado.
    modulos = {}
    for nombre in ("pyodbc", "uvicorn", "fastapi"):
        try:
            modulos[nombre] = importlib.import_module(nombre)
            mostrar(True, f"Importacion de {nombre}.")
        except Exception:
            mostrar(False, f"No carga {nombre}. Revisa el error original y los eventos de Windows.")
    try:
        from backend.config import settings, CORS_ORIGINS
    except Exception:
        mostrar(False, "No se pudo leer la configuracion. Ejecuta primero uv sync --locked.")
        return 1

    requeridos = ("DB_SERVER", "DB_NAME", "DB_USER", "DB_PASSWORD", "DB_DRIVER")
    faltantes = [clave for clave in requeridos if not settings.get(clave)]
    mostrar(not faltantes, "Configuracion SQL completa." if not faltantes else "Faltan claves: " + ", ".join(faltantes))
    mostrar("http://localhost:4200" in CORS_ORIGINS, "CORS permite http://localhost:4200.")
    if "pyodbc" in modulos:
        mostrar(settings.get("DB_DRIVER") in modulos["pyodbc"].drivers(), "El controlador ODBC configurado esta instalado.")

    # Un puerto ocupado puede ser un servidor que ya funciona, no un problema de dependencias.
    for puerto in (8000, 4200):
        ocupado = False
        for host, familia in (("127.0.0.1", socket.AF_INET), ("::1", socket.AF_INET6)):
            with socket.socket(familia, socket.SOCK_STREAM) as prueba:
                prueba.settimeout(0.3)
                try:
                    ocupado = ocupado or prueba.connect_ex((host, puerto)) == 0
                except OSError:
                    pass
        mostrar(not ocupado, f"Puerto {puerto}: " + ("ocupado; no inicies otra copia del servidor." if ocupado else "disponible."), obligatorio=False)

    if argumentos.db and not faltantes and "pyodbc" in modulos:
        # Comprueba los procedimientos usados por los repositorios sin cambiar datos.
        try:
            from backend.repositories.db import get_connection
            with closing(get_connection()) as conexion:
                nombres = {fila[0] for fila in conexion.cursor().execute("SELECT name FROM sys.procedures")}
                repositorios = BASE / "src" / "backend" / "repositories"
                usados = set()
                for archivo in repositorios.glob("*.py"):
                    usados.update(re.findall(r"['\"](usp_\w+)['\"]", archivo.read_text(encoding="utf-8")))
                ausentes = sorted(usados - nombres)
                mostrar(True, "Conexion a SQL Server.")
                mostrar(not ausentes, "Procedimientos RF01-RF06 completos." if not ausentes else "Faltan procedimientos: " + ", ".join(ausentes))
                if ausentes:
                    print("  Desde backend/: uv run python ../database/preparar_bd.py")
        except Exception as error:
            estado = str(error.args[0]) if error.args else ""
            estado = estado if re.fullmatch(r"[A-Z0-9]{5}", estado) else "no disponible"
            mostrar(False, f"No conecta con SQL Server (SQLSTATE: {estado}). Revisa servicio, instancia y acceso.")
    print("Revision terminada. " + ("Corrige los puntos REVISAR obligatorios." if fallos else "Entorno listo."))
    return 1 if fallos else 0


if __name__ == "__main__":
    raise SystemExit(main())
