import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import Swal from 'sweetalert2/dist/sweetalert2.esm.js';
import type { SweetAlertOptions } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AlertasService {
  constructor() {
    // Cambiar de pantalla también cancela una confirmación pendiente.
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((evento) => {
        if (evento instanceof NavigationStart) Swal.close();
      });
  }

  // Unifica idioma, foco y botones Bootstrap; los datos del usuario se muestran como texto.
  private readonly opciones: SweetAlertOptions = {
    heightAuto: false,
    buttonsStyling: false,
    confirmButtonText: 'Entendido',
    cancelButtonText: 'Cancelar',
    closeButtonAriaLabel: 'Cerrar aviso',
    customClass: {
      popup: 'hospital-alert',
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-outline-secondary',
      actions: 'hospital-alert-actions',
    },
  };

  // Cancelar, Escape y clic fuera del diálogo nunca autorizan una operación.
  async confirmar(
    titulo: string,
    mensaje: string,
    boton = 'Sí, continuar',
    peligro = false,
  ): Promise<boolean> {
    const resultado = await Swal.fire({
      ...this.opciones,
      titleText: titulo,
      text: mensaje,
      icon: 'warning',
      iconColor: '#c58a14',
      showCancelButton: true,
      confirmButtonText: boton,
      focusCancel: true,
      reverseButtons: true,
      customClass: {
        ...this.opciones.customClass,
        confirmButton: peligro ? 'btn btn-danger' : 'btn btn-primary',
      },
    });
    return resultado.isConfirmed;
  }

  // Los errores de una operación quedan visibles hasta que se leen y cierran.
  fallo(titulo: string, mensaje: string): void {
    void Swal.fire({
      ...this.opciones,
      titleText: titulo,
      text: mensaje,
      icon: 'error',
      iconColor: '#df3655',
    });
  }

  // Los avisos breves no interrumpen búsquedas ni actualizaciones del panel.
  exito(titulo: string, mensaje = ''): void {
    this.aviso(titulo, mensaje, 'success');
  }

  informacion(titulo: string, mensaje: string): void {
    this.aviso(titulo, mensaje, 'info');
  }

  private aviso(titulo: string, mensaje: string, icono: 'success' | 'info'): void {
    void Swal.fire({
      ...this.opciones,
      titleText: titulo,
      text: mensaje,
      icon: icono,
      iconColor: icono === 'success' ? '#21825c' : '#185fc2',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      showCloseButton: true,
      timer: 5000,
      timerProgressBar: true,
      didOpen: (elemento) => {
        // Da tiempo de leer el aviso al pasar el puntero o usar el teclado.
        elemento.addEventListener('mouseenter', () => Swal.stopTimer());
        elemento.addEventListener('mouseleave', () => Swal.resumeTimer());
        elemento.addEventListener('focusin', () => Swal.stopTimer());
        elemento.addEventListener('focusout', () => Swal.resumeTimer());
      },
    });
  }
}
