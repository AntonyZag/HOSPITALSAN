import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormField, form, maxLength, min, minDate, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Entrada, EntradaPayload } from '../../interfaces/entrada';
import { Lote } from '../../interfaces/lote';
import { Producto } from '../../interfaces/producto';
import { EntradaService } from '../../services/entrada.service';
import { ProductoService } from '../../services/producto.service';
import { mensajeError } from '../../shared/error-message';

interface EntradaFormModel {
  idProducto: string;
  numeroLote: string;
  fechaVencimiento: Date | null;
  cantidad: number | null;
  motivo: string;
}

const MODELO_INICIAL: EntradaFormModel = {
  idProducto: '',
  numeroLote: '',
  fechaVencimiento: null,
  cantidad: null,
  motivo: '',
};

function hoyUtc(): Date {
  const hoy = new Date();
  return new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
}

@Component({
  selector: 'app-entrada-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, RouterLink, DatePipe],
  templateUrl: './entrada-form.html',
})
export class EntradaForm implements OnInit {
  private readonly entradaService = inject(EntradaService);
  private readonly productoService = inject(ProductoService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly lotes = signal<Lote[]>([]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal('');
  protected readonly exito = signal('');
  protected readonly ultimaEntrada = signal<Entrada | null>(null);

  protected readonly model = signal<EntradaFormModel>({ ...MODELO_INICIAL });

  protected readonly form = form(this.model, (path) => {
    required(path.idProducto, { message: 'Selecciona un producto.' });

    required(path.numeroLote, { message: 'El número de lote es obligatorio.' });
    maxLength(path.numeroLote, 50, {
      message: 'El número de lote no puede superar 50 caracteres.',
    });

    required(path.fechaVencimiento, { message: 'La fecha de vencimiento es obligatoria.' });
    minDate(path.fechaVencimiento, hoyUtc(), {
      message: 'La fecha de vencimiento no puede ser anterior a hoy.',
    });

    required(path.cantidad, { message: 'La cantidad es obligatoria.' });
    min(path.cantidad, 1, { message: 'La cantidad debe ser mayor que cero.' });

    required(path.motivo, { message: 'El motivo es obligatorio.' });
    maxLength(path.motivo, 50, { message: 'El motivo no puede superar 50 caracteres.' });
  });

  ngOnInit(): void {
    this.cargarProductos();
  }

  protected onProductoChange(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    if (Number.isFinite(id) && id > 0) {
      this.cargarLotes(id);
    } else {
      this.lotes.set([]);
    }
  }

  protected async guardar(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set('');
    this.exito.set('');
    this.ultimaEntrada.set(null);

    await submit(this.form, {
      action: async () => {
        const valor = this.model();
        if (valor.fechaVencimiento === null || valor.cantidad === null) {
          return;
        }

        const payload: EntradaPayload = {
          idProducto: Number(valor.idProducto),
          numeroLote: valor.numeroLote.trim(),
          fechaVencimiento: this.formatearFecha(valor.fechaVencimiento),
          cantidad: valor.cantidad,
          motivo: valor.motivo.trim(),
        };

        this.guardando.set(true);
        try {
          const entrada = await firstValueFrom(this.entradaService.registrar(payload));
          this.ultimaEntrada.set(entrada);
          this.exito.set(
            `Entrada registrada para ${entrada.nombreProducto}. ` +
              `Stock anterior: ${entrada.stockAnterior}, stock posterior: ${entrada.stockPosterior}.`,
          );
          this.form().reset({ ...MODELO_INICIAL });
          this.lotes.set([]);
        } catch (error) {
          this.error.set(mensajeError(error));
        } finally {
          this.guardando.set(false);
        }
      },
    });
  }

  protected fechaVencimientoLote(lote: Lote): string {
    return lote.fechaVencimiento;
  }

  private cargarProductos(): void {
    this.cargando.set(true);
    this.productoService.listar({ activo: true }).subscribe({
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

  private cargarLotes(idProducto: number): void {
    this.productoService.listarLotes(idProducto).subscribe({
      next: (lotes) => this.lotes.set(lotes),
      error: (error) => {
        this.error.set(mensajeError(error));
        this.lotes.set([]);
      },
    });
  }

  private formatearFecha(fecha: Date): string {
    const anio = fecha.getUTCFullYear();
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
}
