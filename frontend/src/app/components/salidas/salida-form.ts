import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormField,
  form,
  max,
  maxDate,
  maxLength,
  min,
  pattern,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import {
  AreaHospitalaria,
  LoteVigente,
  Movimiento,
  ProductoOpcion,
} from '../../interfaces/inventario';
import { InventarioService } from '../../services/inventario.service';
import { mensajeError } from '../../shared/error-message';
import { fechaIso, hoyLima } from '../../shared/fechas-inventario';

interface SalidaFormModel {
  idProducto: string;
  idLote: string;
  idArea: string;
  cantidad: number | null;
  fecha: Date | null;
  motivo: string;
}

@Component({
  selector: 'app-salida-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormField, RouterLink],
  templateUrl: './salida-form.html',
})
export class SalidaForm implements OnInit {
  private readonly inventario = inject(InventarioService);
  private solicitudLotes = 0;

  // Guarda los catálogos, el lote elegido y el estado de cada solicitud.
  protected readonly productos = signal<ProductoOpcion[]>([]);
  protected readonly areas = signal<AreaHospitalaria[]>([]);
  protected readonly lotes = signal<LoteVigente[]>([]);
  protected readonly cargandoCatalogos = signal(false);
  protected readonly cargandoLotes = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorCatalogos = signal('');
  protected readonly errorLotes = signal('');
  protected readonly errorSalida = signal('');
  protected readonly comprobante = signal<Movimiento | null>(null);

  protected readonly modelo = signal<SalidaFormModel>({
    idProducto: '',
    idLote: '',
    idArea: '',
    cantidad: null,
    fecha: hoyLima(),
    motivo: '',
  });

  protected readonly loteSeleccionado = computed(() =>
    this.lotes().find((lote) => String(lote.id_lote) === this.modelo().idLote),
  );

  // Revisa los campos y compara la cantidad con el saldo del lote elegido.
  protected readonly formulario = form(this.modelo, (campo) => {
    required(campo.idProducto, { message: 'Selecciona un producto.' });
    required(campo.idLote, { message: 'Selecciona un lote vigente.' });
    required(campo.idArea, { message: 'Selecciona el área de destino.' });
    required(campo.fecha, { message: 'Indica la fecha de salida.' });
    maxDate(campo.fecha, () => hoyLima(), { message: 'La fecha no puede ser futura.' });
    required(campo.cantidad, { message: 'Ingresa la cantidad.' });
    min(campo.cantidad, 1, { message: 'La cantidad debe ser mayor que cero.' });
    max(campo.cantidad, () => this.loteSeleccionado()?.cantidad_disponible, {
      message: 'La cantidad supera el saldo disponible del lote.',
    });
    validate(campo.cantidad, ({ value }) =>
      value() === null || Number.isInteger(value())
        ? undefined
        : { kind: 'cantidadEntera', message: 'Ingresa un número entero de unidades.' },
    );
    required(campo.motivo, { message: 'Ingresa el motivo.' });
    pattern(campo.motivo, /\S/, { message: 'Ingresa el motivo.' });
    maxLength(campo.motivo, 50, { message: 'Usa hasta 50 caracteres.' });
  });

  ngOnInit(): void {
    void this.cargarCatalogos();
  }

  // Trae los productos activos y las áreas de destino.
  protected async cargarCatalogos(): Promise<void> {
    this.cargandoCatalogos.set(true);
    this.errorCatalogos.set('');
    try {
      const { productos, areas } = await firstValueFrom(
        forkJoin({ productos: this.inventario.productos(true), areas: this.inventario.areas() }),
      );
      this.productos.set(productos);
      this.areas.set(areas);
    } catch (error) {
      this.errorCatalogos.set(mensajeError(error));
    } finally {
      this.cargandoCatalogos.set(false);
    }
  }

  protected cambiarProducto(evento: Event): void {
    const idProducto = (evento.target as HTMLSelectElement).value;
    this.modelo.update((valor) => ({ ...valor, idProducto, idLote: '', cantidad: null }));
    void this.cargarLotes();
  }

  // Si se cambia de producto rápido, solo aplica la última respuesta.
  protected async cargarLotes(): Promise<void> {
    const { idProducto } = this.modelo();
    const solicitud = ++this.solicitudLotes;
    this.lotes.set([]);
    this.errorLotes.set('');
    this.cargandoLotes.set(Boolean(idProducto));
    if (!idProducto) {
      return;
    }

    try {
      const lotes = await firstValueFrom(this.inventario.lotesVigentes(idProducto));
      if (solicitud === this.solicitudLotes) {
        this.lotes.set(lotes);
        if (!this.loteSeleccionado()) {
          this.modelo.update((valor) => ({ ...valor, idLote: '' }));
        }
      }
    } catch (error) {
      if (solicitud === this.solicitudLotes) {
        this.errorLotes.set(mensajeError(error));
      }
    } finally {
      if (solicitud === this.solicitudLotes) {
        this.cargandoLotes.set(false);
      }
    }
  }

  // Envía una salida válida y vuelve a consultar el saldo disponible.
  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (this.guardando() || this.cargandoLotes()) {
      return;
    }
    this.errorSalida.set('');
    this.comprobante.set(null);
    await submit(this.formulario, {
      action: async () => {
        const valor = this.modelo();
        if (!this.loteSeleccionado() || valor.cantidad === null || valor.fecha === null) {
          return;
        }
        this.guardando.set(true);
        try {
          const salida = await firstValueFrom(
            this.inventario.registrarSalida({
              id_producto: Number(valor.idProducto),
              id_lote: Number(valor.idLote),
              id_area_destino: Number(valor.idArea),
              cantidad: valor.cantidad,
              fecha: fechaIso(valor.fecha),
              motivo: valor.motivo.trim(),
            }),
          );
          this.comprobante.set(salida);
          this.formulario().reset({
            ...valor,
            idLote: '',
            cantidad: null,
            fecha: hoyLima(),
            motivo: '',
          });
          await this.cargarLotes();
        } catch (error) {
          this.errorSalida.set(mensajeError(error));
          if (error instanceof HttpErrorResponse && [409, 422].includes(error.status)) {
            await this.cargarLotes();
          }
        } finally {
          this.guardando.set(false);
        }
      },
    });
  }
}
