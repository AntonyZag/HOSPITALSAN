import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Categoria } from '../../interfaces/categoria';
import { Producto } from '../../interfaces/producto';
import { CategoriaService } from '../../services/categoria.service';
import { ProductoService } from '../../services/producto.service';
import { mensajeError } from '../../shared/error-message';
import { AlertasService } from '../../shared/alertas.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-producto-lista',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './producto-lista.html',
})
export class ProductoLista implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly alertas = inject(AlertasService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');

  protected readonly busqueda = signal('');
  protected readonly idCategoria = signal<number | null>(null);
  protected readonly soloActivos = signal(true);
  protected readonly soloStockBajo = signal(false);
  protected readonly diasVencimiento = signal<number | null>(null);

  protected readonly cambiandoEstado = signal(false);

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
  }

  protected cargarCategorias(): void {
    this.categoriaService.listar(true).subscribe({
      next: (categorias) => this.categorias.set(categorias),
      error: (error) => this.error.set(mensajeError(error)),
    });
  }

  protected cargarProductos(): void {
    this.cargando.set(true);
    this.error.set('');

    this.productoService
      .listar({
        busqueda: this.busqueda() || null,
        idCategoria: this.idCategoria(),
        activo: this.soloActivos() ? true : null,
        soloStockBajo: this.soloStockBajo(),
        diasVencimiento: this.diasVencimiento(),
      })
      .subscribe({
        next: (productos) => {
          this.productos.set(productos);
          this.cargando.set(false);
        },
        error: (error) => {
          this.error.set(mensajeError(error));
          this.cargando.set(false);
        },
      });
  }

  protected aplicarFiltros(): void {
    this.cargarProductos();
  }

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.idCategoria.set(null);
    this.soloActivos.set(true);
    this.soloStockBajo.set(false);
    this.diasVencimiento.set(null);
    this.cargarProductos();
  }

  protected onBusquedaInput(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  protected onCategoriaChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.idCategoria.set(value ? Number(value) : null);
  }

  protected onActivosChange(event: Event): void {
    this.soloActivos.set((event.target as HTMLInputElement).checked);
  }

  protected onStockBajoChange(event: Event): void {
    this.soloStockBajo.set((event.target as HTMLInputElement).checked);
  }

  protected onDiasChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.diasVencimiento.set(value ? Number(value) : null);
  }

  // Solo escribe después de confirmar; cancelar conserva el estado y el historial.
  protected async solicitarCambioEstado(producto: Producto): Promise<void> {
    if (this.cambiandoEstado()) return;
    this.cambiandoEstado.set(true);
    const accion = producto.activo ? 'Desactivar' : 'Activar';
    try {
      const confirmado = await this.alertas.confirmar(
        `${accion} producto`,
        `${producto.nombre}. ` +
          (producto.activo
            ? 'No se eliminará su historial y no podrá recibir nuevas entradas.'
            : 'Volverá a estar disponible para nuevas entradas.'),
        `Sí, ${accion.toLowerCase()}`,
        producto.activo,
      );
      if (!confirmado) return;
      await firstValueFrom(
        this.productoService.cambiarEstado(producto.idProducto, !producto.activo),
      );
      this.cargarProductos();
      this.alertas.exito(
        producto.activo ? 'Producto desactivado' : 'Producto activado',
        producto.nombre,
      );
    } catch (error) {
      this.error.set(mensajeError(error));
      this.alertas.fallo('No se pudo cambiar el estado', this.error());
    } finally {
      this.cambiandoEstado.set(false);
    }
  }

  protected estaPorVencer(fecha: string | null): boolean {
    if (!fecha) {
      return false;
    }
    const dias = this.diasParaVencer(fecha);
    return dias >= 0 && dias <= 30;
  }

  protected diasParaVencer(fecha: string): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(`${fecha}T00:00:00`);
    return Math.ceil((vencimiento.getTime() - hoy.getTime()) / 86_400_000);
  }
}
