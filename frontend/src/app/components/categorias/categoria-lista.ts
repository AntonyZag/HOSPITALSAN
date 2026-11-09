import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Categoria } from '../../interfaces/categoria';
import { CategoriaService } from '../../services/categoria.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { mensajeError } from '../../shared/error-message';

@Component({
  selector: 'app-categoria-lista',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ConfirmDialog],
  templateUrl: './categoria-lista.html',
})
export class CategoriaLista implements OnInit {
  private readonly categoriaService = inject(CategoriaService);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly soloActivas = signal(false);

  protected readonly confirmando = signal(false);
  protected readonly categoriaSeleccionada = signal<Categoria | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.categoriaService.listar(this.soloActivas()).subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }

  protected onSoloActivasChange(event: Event): void {
    this.soloActivas.set((event.target as HTMLInputElement).checked);
    this.cargar();
  }

  protected solicitarCambioEstado(categoria: Categoria): void {
    this.categoriaSeleccionada.set(categoria);
    this.confirmando.set(true);
  }

  protected cancelarCambioEstado(): void {
    this.confirmando.set(false);
    this.categoriaSeleccionada.set(null);
  }

  protected confirmarCambioEstado(): void {
    const categoria = this.categoriaSeleccionada();
    if (!categoria) {
      return;
    }

    this.categoriaService.cambiarEstado(categoria.idCategoria, !categoria.activo).subscribe({
      next: () => {
        this.cancelarCambioEstado();
        this.cargar();
      },
      error: (error) => {
        this.error.set(mensajeError(error));
        this.cancelarCambioEstado();
      },
    });
  }
}
