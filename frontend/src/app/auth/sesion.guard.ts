import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { SesionService } from './sesion.service';

// Todas las pantallas del inventario comparten la misma comprobación de sesión.
export const requiereSesion: CanActivateFn & CanActivateChildFn = () =>
  inject(SesionService).correo() ? true : inject(Router).createUrlTree(['/login']);

// Una sesión abierta entra directamente al panel, sin volver a mostrar el login.
export const soloInvitados: CanActivateFn = () =>
  inject(SesionService).correo() ? inject(Router).createUrlTree(['/indicadores']) : true;
