"""Prepara HospitalSanGabriel y, opcionalmente, su catalogo inicial de 12 productos."""
from __future__ import annotations

import argparse
import re
import sys
from contextlib import closing
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend" / "src"))
from backend.config import settings
from backend.repositories.db import get_connection
from apply_stored_procedures import split_batches


def preparar(nombre: str, *, datos: bool = False) -> dict[str, int]:
    # El nombre solo admite identificadores simples, nunca fragmentos de SQL.
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]{0,127}", nombre):
        raise ValueError("DB_NAME debe contener solo letras, numeros y guion bajo.")
    if nombre != "HospitalSanGabriel":
        raise ValueError("Esta entrega se prepara exclusivamente en HospitalSanGabriel.")
    directorio = Path(__file__).resolve().parent
    esquema = (directorio / "script_completo_bd.sql").read_text(encoding="utf-8-sig")
    esquema = esquema.replace("N'HospitalSanGabriel'", f"N'{nombre}'")
    esquema = esquema.replace("CREATE DATABASE HospitalSanGabriel;", f"CREATE DATABASE [{nombre}];")
    esquema = esquema.replace("USE HospitalSanGabriel;", f"USE [{nombre}];")

    # Se abre master porque una instalacion nueva todavia no tiene la base del proyecto.
    with closing(get_connection(database="master")) as conexion:
        conexion.autocommit = True
        cursor = conexion.cursor()
        scripts = [esquema]
        if datos:
            scripts.append((directorio / "datos_iniciales.sql").read_text(encoding="utf-8-sig"))
        for script in scripts:
            for lote in split_batches(script):
                cursor.execute(lote)
                while cursor.nextset():
                    pass
        procedimientos = cursor.execute(
            "SELECT COUNT(*) FROM sys.procedures WHERE schema_id=SCHEMA_ID('dbo')"
        ).fetchval()
        productos = cursor.execute(
            "SELECT COUNT(*) FROM dbo.Productos WHERE Codigo IN "
            "('MED-001','MED-002','MED-003','INS-001','INS-002','INS-003',"
            "'LAB-001','LAB-002','LAB-003','LIM-001','LIM-002','LIM-003')"
        ).fetchval()
    return {"procedimientos": procedimientos, "productos_catalogo": productos}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--datos", "--demo", dest="datos", action="store_true", help="Carga el catalogo inicial sin duplicar stock ni historial.")
    argumentos = parser.parse_args()
    nombre = settings.get("DB_NAME") or ""
    if not nombre:
        print("Falta DB_NAME. Completa backend/.env antes de preparar la base.")
        return 2
    try:
        resultado = preparar(nombre, datos=argumentos.datos)
    except ValueError as error:
        print(str(error))
        return 2
    except Exception as error:
        # Los mensajes ODBC completos pueden contener nombres de acceso; no se imprimen.
        estado = str(error.args[0]) if error.args else ""
        estado = estado if re.fullmatch(r"[A-Z0-9]{5}", estado) else "no disponible"
        print(f"No se pudo preparar la base (SQLSTATE: {estado}).")
        print("Revisa conexion, permisos y categorias activas. No se borraron registros reales.")
        return 1
    print("Esquema unificado preparado.")
    print(f"Procedimientos: {resultado['procedimientos']}. Productos del catalogo: {resultado['productos_catalogo']}.")
    print("Carga terminada sin duplicar existencias. Actualiza los listados en Angular.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
