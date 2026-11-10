import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Categoria } from '../../interfaces/categoria';
import { CategoriaService } from '../../services/categoria.service';
import { AlertasService } from '../../shared/alertas.service';
import { firstValueFrom } from 'rxjs';
import { mensajeError } from '../../shared/error-message';

@Component({
  selector: 'app-categoria-lista',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './categoria-lista.html',
})
export class CategoriaLista implements OnInit {
  private readonly categoriaService = inject(CategoriaService);
  private readonly alertas = inject(AlertasService);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly soloActivas = signal(false);

  protected readonly cambiandoEstado = signal(false);

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

  // Las reglas sobre categorías con productos siguen siendo validadas por la API.
  protected async solicitarCambioEstado(categoria: Categoria): Promise<void> {
    if (this.cambiandoEstado()) return;
    this.cambiandoEstado.set(true);
    const accion = categoria.activo ? 'Desactivar' : 'Activar';
    try {
      const confirmado = await this.alertas.confirmar(
        `${accion} categoría`,
        `${categoria.nombre}. ` +
          (categoria.activo
            ? 'No se eliminará. Las categorías con productos asociados no pueden desactivarse.'
            : 'Volverá a estar disponible para los productos.'),
        `Sí, ${accion.toLowerCase()}`,
        categoria.activo,
      );
      if (!confirmado) return;
      await firstValueFrom(
        this.categoriaService.cambiarEstado(categoria.idCategoria, !categoria.activo),
      );
      this.cargar();
      this.alertas.exito(
        categoria.activo ? 'Categoría desactivada' : 'Categoría activada',
        categoria.nombre,
      );
    } catch (error) {
      this.error.set(mensajeError(error));
      this.alertas.fallo('No se pudo cambiar el estado', this.error());
    } finally {
      this.cambiandoEstado.set(false);
    }
  }
}
