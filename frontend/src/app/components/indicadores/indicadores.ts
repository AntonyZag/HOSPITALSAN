import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormField, form, minDate, required, submit } from '@angular/forms/signals';
import { firstValueFrom, forkJoin } from 'rxjs';
import {
  MayorSalida,
  Movimiento,
  ResumenInventario,
  StockBajo,
  Vencimiento,
} from '../../interfaces/inventario';
import { InventarioService } from '../../services/inventario.service';
import { mensajeError } from '../../shared/error-message';
import { fechaIso, hoyLima } from '../../shared/fechas-inventario';
import { TablaMovimientos } from '../historial/tabla-movimientos';
import { AlertasService } from '../../shared/alertas.service';

interface PeriodoForm {
  desde: Date | null;
  hasta: Date | null;
}

// Empieza con el mes actual para tener un periodo listo al abrir el panel.
function periodoInicial(): PeriodoForm {
  const hoy = hoyLima();
  return {
    desde: new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1)),
    hasta: hoy,
  };
}

@Component({
  selector: 'app-indicadores',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, FormField, TablaMovimientos],
  templateUrl: './indicadores.html',
})
export class Indicadores implements OnInit {
  private readonly inventario = inject(InventarioService);
  private readonly alertas = inject(AlertasService);

  // Separa la foto actual del inventario de los resultados por fechas.
  protected readonly resumen = signal<ResumenInventario | null>(null);
  protected readonly stockBajo = signal<StockBajo[]>([]);
  protected readonly vencimientos = signal<Vencimiento[]>([]);
  protected readonly cargandoInventario = signal(false);
  protected readonly errorInventario = signal('');

  protected readonly mayoresSalidas = signal<MayorSalida[]>([]);
  protected readonly movimientos = signal<Movimiento[]>([]);
  protected readonly cargandoPeriodo = signal(false);
  protected readonly errorPeriodo = signal('');

  protected readonly periodo = signal<PeriodoForm>(periodoInicial());
  protected readonly formulario = form(this.periodo, (campo) => {
    required(campo.desde, { message: 'Indica la fecha inicial.' });
    required(campo.hasta, { message: 'Indica la fecha final.' });
    minDate(campo.hasta, ({ valueOf }) => valueOf(campo.desde) ?? undefined, {
      message: 'La fecha final debe ser igual o posterior a la inicial.',
    });
  });

  ngOnInit(): void {
    void this.cargarInventario();
    void this.cargarPeriodo();
  }

  // Actualiza las cifras, el stock bajo y los vencimientos desde el servidor.
  protected async cargarInventario(notificar = false): Promise<void> {
    if (this.cargandoInventario()) return;
    this.cargandoInventario.set(true);
    this.errorInventario.set('');
    try {
      const datos = await firstValueFrom(
        forkJoin({
          resumen: this.inventario.resumen(),
          stockBajo: this.inventario.stockBajo(),
          vencimientos: this.inventario.vencimientos(),
        }),
      );
      this.resumen.set(datos.resumen);
      this.stockBajo.set(datos.stockBajo);
      this.vencimientos.set(datos.vencimientos);
      // El aviso confirma la actualización manual, sin aparecer en la carga inicial.
      if (notificar)
        this.alertas.exito(
          'Inventario actualizado',
          'Las cifras y alertas ya reflejan los datos de la API.',
        );
    } catch (error) {
      this.errorInventario.set(mensajeError(error));
      if (notificar)
        this.alertas.fallo('No se pudo actualizar el inventario', this.errorInventario());
    } finally {
      this.cargandoInventario.set(false);
    }
  }

  // Usa el mismo periodo para la clasificación por salidas y la lista de movimientos.
  protected async consultar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (!this.cargandoPeriodo()) {
      await submit(this.formulario, { action: () => this.cargarPeriodo(true) });
    }
  }

  private async cargarPeriodo(notificar = false): Promise<void> {
    const { desde, hasta } = this.periodo();
    const rango = { desde: fechaIso(desde), hasta: fechaIso(hasta) };
    this.cargandoPeriodo.set(true);
    this.errorPeriodo.set('');
    try {
      const datos = await firstValueFrom(
        forkJoin({
          mayoresSalidas: this.inventario.mayoresSalidas(rango),
          movimientos: this.inventario.historial(rango),
        }),
      );
      this.mayoresSalidas.set(datos.mayoresSalidas);
      this.movimientos.set(datos.movimientos);
      // El botón de consulta informa el resultado sin pedir confirmaciones para leer datos.
      if (notificar)
        this.alertas.informacion(
          datos.movimientos.length ? 'Periodo consultado' : 'Sin movimientos en el periodo',
          `Movimientos: ${datos.movimientos.length}. Productos con salidas: ${datos.mayoresSalidas.length}.`,
        );
    } catch (error) {
      this.errorPeriodo.set(mensajeError(error));
      if (notificar) this.alertas.fallo('No se pudo consultar el periodo', this.errorPeriodo());
    } finally {
      this.cargandoPeriodo.set(false);
    }
  }
}
