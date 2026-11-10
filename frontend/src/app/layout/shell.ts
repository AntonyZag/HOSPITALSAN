import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SesionService } from '../auth/sesion.service';
import { AlertasService } from '../shared/alertas.service';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.html',
})
export class Shell {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  private readonly alertas = inject(AlertasService);

  // Conserva las rutas y asigna un color reconocible a cada icono del menú.
  protected readonly enlaces = [
    { ruta: '/indicadores', texto: 'Indicadores', icono: 'bi-grid-1x2', color: 'indicadores' },
    { ruta: '/productos', texto: 'Productos', icono: 'bi-box-seam-fill', color: 'neutral' },
    { ruta: '/categorias', texto: 'Categorías', icono: 'bi-tags-fill', color: 'neutral' },
    {
      ruta: '/entradas',
      texto: 'Entradas',
      icono: 'bi-arrow-down-right-square-fill',
      color: 'entradas',
    },
    { ruta: '/salidas', texto: 'Salidas', icono: 'bi-arrow-up-left-square-fill', color: 'salidas' },
    { ruta: '/historial', texto: 'Historial', icono: 'bi-clock-history', color: 'neutral' },
  ];

  // El menú móvil se cierra al navegar o al pulsar Escape.
  protected readonly menuAbierto = signal(false);

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  // Pide confirmación antes de cerrar la sesión y volver al acceso.
  protected async cerrarSesion(): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      '¿Cerrar sesión?',
      'Volverás a la pantalla de acceso.',
      'Sí, cerrar sesión',
    );
    if (!confirmado) return;
    this.sesion.cerrar();
    this.menuAbierto.set(false);
    await this.router.navigate(['/login'], { replaceUrl: true });
  }
}
