import { Type } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CategoriaLista } from '../components/categorias/categoria-lista';
import { ProductoLista } from '../components/productos/producto-lista';
import { EntradaForm } from '../components/entradas/entrada-form';
import { Historial } from '../components/historial/historial';
import { Indicadores } from '../components/indicadores/indicadores';
import { CategoriaService } from '../services/categoria.service';
import { ProductoService } from '../services/producto.service';
import { EntradaService } from '../services/entrada.service';
import { InventarioService } from '../services/inventario.service';
import { AlertasService } from './alertas.service';

// Las APIs y las respuestas del diálogo se simulan; no se modifica la base local.
const producto = {
  idProducto: 1,
  codigo: 'P01',
  nombre: 'Paracetamol',
  descripcion: null,
  activo: true,
  idCategoria: 1,
  nombreCategoria: 'Medicamentos',
  unidadMedida: 'Caja',
  precioUnitario: '1.00',
  stockMinimo: 10,
  stockActual: 10,
  proximoVencimiento: null,
};
const categoria = {
  idCategoria: 1,
  nombre: 'Medicamentos',
  descripcion: null,
  activo: true,
  cantidadProductos: 0,
};
const alertasPrueba = () => ({
  confirmar: vi.fn().mockResolvedValue(false),
  exito: vi.fn(),
  fallo: vi.fn(),
  informacion: vi.fn(),
});

describe('Confirmaciones de cambios de estado', () => {
  for (const caso of [
    { nombre: 'productos', componente: ProductoLista as Type<unknown>, registro: producto },
    { nombre: 'categorías', componente: CategoriaLista as Type<unknown>, registro: categoria },
  ]) {
    it(
      'no cambia ' + caso.nombre + ' al cancelar y comunica el resultado real de la API',
      async () => {
        const alertas = alertasPrueba();
        const cambiarEstado = vi.fn().mockReturnValue(of(caso.registro));
        const servicio = { listar: () => of([caso.registro]), cambiarEstado };
        await TestBed.configureTestingModule({
          imports: [caso.componente],
          providers: [
            provideRouter([]),
            { provide: AlertasService, useValue: alertas },
            { provide: ProductoService, useValue: servicio },
            {
              provide: CategoriaService,
              useValue: caso.nombre === 'productos' ? { listar: () => of([]) } : servicio,
            },
          ],
        }).compileComponents();
        const fixture = TestBed.createComponent(caso.componente);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        const boton = () =>
          (fixture.nativeElement as HTMLElement).querySelector(
            'button[aria-label="Desactivar"]',
          ) as HTMLButtonElement;
        boton().click();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(cambiarEstado).not.toHaveBeenCalled();

        alertas.confirmar.mockResolvedValue(true);
        boton().click();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(cambiarEstado).toHaveBeenCalledExactlyOnceWith(1, false);
        expect(alertas.exito).toHaveBeenCalledOnce();

        // Un rechazo del servidor no se presenta como éxito y permite reintentar.
        cambiarEstado.mockReturnValueOnce(
          throwError(
            () =>
              new HttpErrorResponse({
                status: 409,
                error: { detail: 'La operación no está permitida.' },
              }),
          ),
        );
        boton().click();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(alertas.fallo).toHaveBeenCalledWith(
          'No se pudo cambiar el estado',
          'La operación no está permitida.',
        );
        expect(alertas.exito).toHaveBeenCalledOnce();
        expect(boton().disabled).toBe(false);
      },
    );
  }
});

describe('Consultas sin interrupciones al cargar', () => {
  for (const componente of [Historial, Indicadores] as Type<unknown>[]) {
    it(componente.name + ' avisa solo después de usar los botones de consulta', async () => {
      const alertas = alertasPrueba();
      await TestBed.configureTestingModule({
        imports: [componente],
        providers: [
          provideRouter([]),
          { provide: AlertasService, useValue: alertas },
          {
            provide: InventarioService,
            useValue: {
              productos: () => of([]),
              areas: () => of([]),
              historial: () => of([]),
              resumen: () => of({ productos_activos: 0, valor_inventario: '0.00' }),
              stockBajo: () => of([]),
              vencimientos: () => of([]),
              mayoresSalidas: () => of([]),
            },
          },
        ],
      }).compileComponents();
      const fixture = TestBed.createComponent(componente);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(alertas.informacion).not.toHaveBeenCalled();
      expect(alertas.exito).not.toHaveBeenCalled();

      (fixture.nativeElement as HTMLElement)
        .querySelector('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await fixture.whenStable();
      fixture.detectChanges();
      expect(alertas.informacion).toHaveBeenCalledOnce();
      if (componente === Indicadores) {
        const actualizar = Array.from(
          (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
        ).find((b) => b.textContent?.includes('Actualizar inventario'))!;
        actualizar.click();
        await fixture.whenStable();
        expect(alertas.exito).toHaveBeenCalledWith('Inventario actualizado', expect.any(String));
      }
    });
  }
});

describe('Confirmación de entradas', () => {
  it('valida antes de confirmar, no registra al cancelar y confirma el éxito después de guardar', async () => {
    const alertas = alertasPrueba();
    const registrar = vi.fn().mockReturnValue(
      of({
        idMovimiento: 3,
        idProducto: 1,
        nombreProducto: 'Paracetamol',
        numeroLote: 'L-TEST',
        cantidad: 2,
        stockAnterior: 10,
        stockPosterior: 12,
      }),
    );
    await TestBed.configureTestingModule({
      imports: [EntradaForm],
      providers: [
        provideRouter([]),
        { provide: AlertasService, useValue: alertas },
        {
          provide: ProductoService,
          useValue: { listar: () => of([producto]), listarLotes: () => of([]) },
        },
        { provide: EntradaService, useValue: { registrar } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntradaForm);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const enviar = async () => {
      element
        .querySelector('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await fixture.whenStable();
      fixture.detectChanges();
    };
    await enviar();
    expect(alertas.confirmar).not.toHaveBeenCalled();

    for (const [selector, value] of [
      ['#idProducto', '1'],
      ['#numeroLote', 'L-TEST'],
      ['#fechaVencimiento', '2099-12-31'],
      ['#cantidad', '2'],
      ['#motivo', 'Compra de proveedor'],
    ]) {
      const input = element.querySelector(selector) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      fixture.detectChanges();
    }
    await enviar();
    expect(alertas.confirmar).toHaveBeenCalledOnce();
    expect(registrar).not.toHaveBeenCalled();
    expect((element.querySelector('#cantidad') as HTMLInputElement).value).toBe('2');

    alertas.confirmar.mockResolvedValue(true);
    await enviar();
    expect(registrar).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ cantidad: 2, numeroLote: 'L-TEST' }),
    );
    expect(alertas.exito).toHaveBeenCalledWith(
      'Entrada registrada',
      'Saldo del producto: 10 → 12.',
    );
    expect((element.querySelector('#numeroLote') as HTMLInputElement).value).toBe('');
  });
});
