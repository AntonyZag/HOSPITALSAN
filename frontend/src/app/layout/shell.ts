import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center gap-2" routerLink="/indicadores">
          <i class="bi bi-hospital fs-3"></i>
          <h1 class="h4 mb-0">Hospital San Gabriel</h1>
        </a>

        <button
          class="navbar-toggler"
          type="button"
          aria-label="Abrir menú"
          [attr.aria-expanded]="menuAbierto()"
          (click)="alternarMenu()"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" [class.show]="menuAbierto()">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a
                class="nav-link"
                routerLink="/productos"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: false }"
              >
                <i class="bi bi-box-seam me-1"></i>Productos
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/categorias" routerLinkActive="active">
                <i class="bi bi-tags me-1"></i>Categorías
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/entradas" routerLinkActive="active">
                <i class="bi bi-box-arrow-in-down me-1"></i>Entradas
              </a>
            </li>
            <!-- Enlaces para consultar inventario y registrar retiros. -->
            <li class="nav-item">
              <a class="nav-link" routerLink="/salidas" routerLinkActive="active">
                <i class="bi bi-box-arrow-up me-1"></i>Salidas
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/historial" routerLinkActive="active">
                <i class="bi bi-clock-history me-1"></i>Historial
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/indicadores" routerLinkActive="active">
                <i class="bi bi-bar-chart me-1"></i>Indicadores
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/diagnostico" routerLinkActive="active">
                <i class="bi bi-plug me-1"></i>Diagnóstico
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <main class="container py-4">
      <router-outlet />
    </main>

    <footer class="border-top py-3 mt-4">
      <div class="container text-center text-body-secondary small">
        Hospital San Gabriel · Sistema de inventario
      </div>
    </footer>
  `,
})
export class Shell {
  protected readonly menuAbierto = signal(false);

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }
}
