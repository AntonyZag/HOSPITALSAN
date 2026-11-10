import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { requiereSesion, soloInvitados } from '../../auth/sesion.guard';
import { SesionService } from '../../auth/sesion.service';
import { Login } from './login';

@Component({ template: '<h1>Panel de inventario</h1>' })
class PanelPrueba {}

describe('Login y sesión de demostración', () => {
  afterEach(() => sessionStorage.removeItem('hospital-san-gabriel.sesion'));

  it('valida las credenciales, conserva la sesión y bloquea el inventario al salir', async () => {
    sessionStorage.removeItem('hospital-san-gabriel.sesion');
    // El panel simulado evita cualquier acceso o cambio en SQL Server durante esta prueba.
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: Login, canActivate: [soloInvitados] },
          { path: 'indicadores', component: PanelPrueba, canActivate: [requiereSesion] },
          { path: 'productos', component: PanelPrueba, canActivate: [requiereSesion] },
        ]),
      ],
    }).compileComponents();
    const harness = await RouterTestingHarness.create('/productos');
    const router = TestBed.inject(Router);
    const sesion = TestBed.inject(SesionService);
    expect(router.url).toBe('/login');
    const element = harness.routeNativeElement!;
    const correo = element.querySelector('#login-correo') as HTMLInputElement;
    const clave = element.querySelector('#login-clave') as HTMLInputElement;
    expect(correo.value).toBe('');
    expect(clave.value).toBe('');
    expect(element.textContent).not.toContain('inventario@sangabriel.local');
    expect(element.textContent).not.toContain('SanGabriel#2026');

    // Usa eventos de los campos reales de Signal Forms para probar el rechazo.
    const escribir = (input: HTMLInputElement, value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      harness.detectChanges();
    };
    escribir(correo, 'inventario@sangabriel.local');
    escribir(clave, 'clave-incorrecta');
    element
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/login');
    expect(element.textContent).toContain('Correo o contraseña incorrectos');
    expect(sesion.correo()).toBeNull();

    // El acceso correcto abre el panel; la contraseña nunca se guarda en la sesión.
    escribir(clave, 'SanGabriel#2026');
    element
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/indicadores');
    expect(sessionStorage.getItem('hospital-san-gabriel.sesion')).toBe(
      'inventario@sangabriel.local',
    );
    expect(new SesionService().correo()).toBe('inventario@sangabriel.local');
    await harness.navigateByUrl('/login');
    expect(router.url).toBe('/indicadores');

    // Al cerrar sesión, una URL interna vuelve al login.
    sesion.cerrar();
    await harness.navigateByUrl('/productos');
    expect(router.url).toBe('/login');
    expect(sessionStorage.getItem('hospital-san-gabriel.sesion')).toBeNull();
  });
});
