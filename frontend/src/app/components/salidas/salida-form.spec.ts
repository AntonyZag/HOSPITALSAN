import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SalidaForm } from './salida-form';
import { AlertasService } from '../../shared/alertas.service';

describe('SalidaForm: control del saldo', () => {
  it('rechaza el exceso sin enviar la salida y permite corregirla hasta el saldo exacto', async () => {
    // Simula solo la API: el formulario y las validaciones son los reales de Angular.
    const confirmar = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
    const fallo = vi.fn();
    const exito = vi.fn();
    await TestBed.configureTestingModule({
      imports: [SalidaForm],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AlertasService, useValue: { confirmar, fallo, exito } },
      ],
    }).compileComponents();
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(SalidaForm);
    fixture.detectChanges();
    http
      .expectOne('http://localhost:8000/api/productos?activo=true')
      .flush([{ id_producto: 1, codigo: 'P01', nombre: 'Producto de prueba' }]);
    http
      .expectOne('http://localhost:8000/api/salidas/areas')
      .flush([{ id_area: 1, nombre_area: 'Laboratorio' }]);
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    // Completa los campos mediante eventos de la interfaz, sin saltarse Signal Forms.
    const change = (selector: string, value: string, event: string) => {
      const input = element.querySelector(selector) as HTMLInputElement | HTMLSelectElement;
      input.value = value;
      if (event === 'change') input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event(event, { bubbles: true }));
      fixture.detectChanges();
    };
    change('#salida-producto', '1', 'change');
    http.expectOne('http://localhost:8000/api/salidas/lotes-vigentes/1').flush([
      {
        id_lote: 8,
        id_producto: 1,
        numero_lote: 'L08',
        fecha_vencimiento: '2099-12-31',
        cantidad_disponible: 10,
      },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();
    change('#salida-lote', '8', 'change');
    change('#salida-area', '1', 'change');
    change('#salida-motivo', 'Entrega a laboratorio', 'input');
    change('#salida-cantidad', '11', 'input');
    element
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    // El aviso debe verse y ninguna solicitud de escritura debe llegar a la API.
    expect(element.textContent).toContain('Saldo insuficiente');
    expect(element.querySelector('#salida-saldo')?.textContent).toContain('10');
    http.expectNone((request) => request.method === 'POST');
    expect(confirmar).not.toHaveBeenCalled();

    // El límite exacto sigue siendo válido; esta escritura es simulada, sin tocar SQL Server.
    change('#salida-cantidad', '10', 'input');
    element
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    // Cancelar una cantidad válida conserva el formulario y no envía una salida.
    await fixture.whenStable();
    fixture.detectChanges();
    expect(confirmar).toHaveBeenCalledOnce();
    http.expectNone((request) => request.method === 'POST');
    expect((element.querySelector('#salida-cantidad') as HTMLInputElement).value).toBe('10');
    element
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    const request = await vi.waitFor(() => http.expectOne('http://localhost:8000/api/salidas'));
    expect(request.request.body).toMatchObject({ cantidad: 10, id_lote: 8, id_area_destino: 1 });
    request.flush({ detail: 'Respuesta simulada' }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.textContent).not.toContain('Saldo insuficiente');
    expect(fallo).toHaveBeenCalledWith('No se pudo guardar', 'Respuesta simulada');
    expect(exito).not.toHaveBeenCalled();
    http.verify();
  });
});
