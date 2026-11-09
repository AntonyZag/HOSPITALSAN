import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../interfaces/api-error';

export function mensajeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const apiError = error.error as ApiError | null;
    if (apiError) {
      if (typeof apiError.detail === 'string') {
        return apiError.detail;
      }
      if (Array.isArray(apiError.detail)) {
        const mensajes = apiError.detail
          .map((detalle) => detalle.msg)
          .filter((mensaje): mensaje is string => Boolean(mensaje));
        if (mensajes.length > 0) {
          return mensajes.join(' ');
        }
      }
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    if (error.status === 503) {
      return 'El servidor no pudo conectar con la base de datos.';
    }
    return error.message || 'No se pudo completar la solicitud.';
  }

  return 'Ocurrió un error inesperado.';
}
