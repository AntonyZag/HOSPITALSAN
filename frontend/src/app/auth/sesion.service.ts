import { Injectable, signal } from '@angular/core';

// Acceso de demostración: una API con autenticación real debe validar los usuarios en producción.
const CORREO_DEMO = 'inventario@sangabriel.local';
const CLAVE_DEMO = 'SanGabriel#2026';
const CLAVE_SESION = 'hospital-san-gabriel.sesion';

@Injectable({ providedIn: 'root' })
export class SesionService {
  // Conserva la sesión durante las recargas de esta pestaña; nunca guarda la contraseña.
  readonly correo = signal(
    sessionStorage.getItem(CLAVE_SESION) === CORREO_DEMO ? CORREO_DEMO : null,
  );

  iniciar(correo: string, clave: string): boolean {
    if (correo.trim().toLowerCase() !== CORREO_DEMO || clave !== CLAVE_DEMO) {
      return false;
    }
    sessionStorage.setItem(CLAVE_SESION, CORREO_DEMO);
    this.correo.set(CORREO_DEMO);
    return true;
  }

  cerrar(): void {
    sessionStorage.removeItem(CLAVE_SESION);
    this.correo.set(null);
  }
}
