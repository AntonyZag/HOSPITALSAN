import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormField, form, minDate, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import {
  AreaHospitalaria,
  Movimiento,
  ProductoOpcion,
  TipoMovimiento,
} from '../../interfaces/inventario';
import { InventarioService } from '../../services/inventario.service';
import { mensajeError } from '../../shared/error-message';
import { fechaIso } from '../../shared/fechas-inventario';
import { TablaMovimientos } from './tabla-movimientos';

interface FiltrosForm {
  idProducto: string;
  tipo: TipoMovimiento | '';
  idArea: string;
  desde: Date | null;
  hasta: Date | null;
}

const FILTROS_VACIOS: FiltrosForm = {
  idProducto: '',
  tipo: '',
  idArea: '',
  desde: null,
  hasta: null,
};

@Component({
  selector: 'app-historial',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, RouterLink, TablaMovimientos],
  templateUrl: './historial.html',
})
export class Historial implements OnInit {
  private readonly inventario = inject(InventarioService);

  // Separa el estado de los selectores del estado de la búsqueda.
  protected readonly productos = signal<ProductoOpcion[]>([]);
  protected readonly areas = signal<AreaHospitalaria[]>([]);
  protected readonly movimientos = signal<Movimiento[]>([]);
  protected readonly cargandoCatalogos = signal(false);
  protected readonly cargando = signal(false);
  protected readonly errorCatalogos = signal('');
  protected readonly error = signal('');

  // Los filtros son opcionales. Si se indican ambas fechas, deben estar en orden.
  protected readonly filtros = signal<FiltrosForm>({ ...FILTROS_VACIOS });
  protected readonly formulario = form(this.filtros, (campo) => {
    minDate(campo.hasta, ({ valueOf }) => valueOf(campo.desde) ?? undefined, {
      message: 'La fecha final debe ser igual o posterior a la inicial.',
    });
  });

  ngOnInit(): void {
    void this.cargarCatalogos();
    void this.cargarMovimientos();
  }

  // Incluye los productos inactivos para que sus movimientos se puedan filtrar.
  protected async cargarCatalogos(): Promise<void> {
    this.cargandoCatalogos.set(true);
    this.errorCatalogos.set('');
    try {
      const { productos, areas } = await firstValueFrom(
        forkJoin({ productos: this.inventario.productos(false), areas: this.inventario.areas() }),
      );
      this.productos.set(productos);
      this.areas.set(areas);
    } catch (error) {
      this.errorCatalogos.set(mensajeError(error));
    } finally {
      this.cargandoCatalogos.set(false);
    }
  }

  // Busca con los filtros actuales o vuelve a la consulta completa.
  protected async buscar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (!this.cargando()) {
      await submit(this.formulario, { action: () => this.cargarMovimientos() });
    }
  }

  protected limpiar(): void {
    this.formulario().reset({ ...FILTROS_VACIOS });
    void this.cargarMovimientos();
  }

  private async cargarMovimientos(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    const { idProducto, tipo, idArea, desde, hasta } = this.filtros();
    try {
      const movimientos = await firstValueFrom(
        this.inventario.historial({
          id_producto: idProducto,
          tipo_movimiento: tipo,
          id_area_destino: idArea,
          desde: fechaIso(desde),
          hasta: fechaIso(hasta),
        }),
      );
      this.movimientos.set(movimientos);
    } catch (error) {
      this.error.set(mensajeError(error));
    } finally {
      this.cargando.set(false);
    }
  }
}
