import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Entrada } from '../../interfaces/entrada';
import { Producto } from '../../interfaces/producto';
import { EntradaService } from '../../services/entrada.service';
import { ProductoService } from '../../services/producto.service';
import { mensajeError } from '../../shared/error-message';

@Component({
  selector: 'app-entrada-historial',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './entrada-historial.html',
})
export class EntradaHistorial implements OnInit {
  private readonly entradaService = inject(EntradaService);
  private readonly productoService = inject(ProductoService);

  private readonly formatoLima = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  });

  protected readonly entradas = signal<Entrada[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');

  protected readonly idProducto = signal<number | null>(null);
  protected readonly desde = signal('');
  protected readonly hasta = signal('');

  ngOnInit(): void {
    this.cargarProductos();
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.entradaService
      .listar({
        idProducto: this.idProducto(),
        desde: this.limaAIso(this.desde()),
        hasta: this.limaAIso(this.hasta()),
      })
      .subscribe({
        next: (entradas) => {
          this.entradas.set(entradas);
          this.cargando.set(false);
        },
        error: (error) => {
          this.error.set(mensajeError(error));
          this.cargando.set(false);
        },
      });
  }

  protected limpiarFiltros(): void {
    this.idProducto.set(null);
    this.desde.set('');
    this.hasta.set('');
    this.cargar();
  }

  protected onProductoChange(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.idProducto.set(valor ? Number(valor) : null);
  }

  protected onDesdeChange(event: Event): void {
    this.desde.set((event.target as HTMLInputElement).value);
  }

  protected onHastaChange(event: Event): void {
    this.hasta.set((event.target as HTMLInputElement).value);
  }

  protected fechaLima(fecha: string): string {
    const valor = new Date(fecha);
    return Number.isNaN(valor.getTime()) ? fecha : this.formatoLima.format(valor);
  }

  private cargarProductos(): void {
    this.productoService.listar({}).subscribe({
      next: (productos) => this.productos.set(productos),
      error: (error) => this.error.set(mensajeError(error)),
    });
  }

  private limaAIso(valor: string): string | null {
    if (!valor) {
      return null;
    }

    const normalizado = valor.length === 16 ? `${valor}:00` : valor;
    const fecha = new Date(`${normalizado}-05:00`);
    return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
  }
}
