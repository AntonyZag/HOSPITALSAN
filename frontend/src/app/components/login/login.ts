import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { SesionService } from '../../auth/sesion.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  // Los campos empiezan vacíos y no muestran las credenciales de demostración.
  protected readonly modelo = signal({ correo: '', clave: '' });
  protected readonly mostrarClave = signal(false);
  protected readonly error = signal('');
  protected readonly entrando = signal(false);
  protected readonly formulario = form(this.modelo, (campo) => {
    required(campo.correo, { message: 'Ingresa tu correo electrónico.' });
    email(campo.correo, { message: 'Ingresa un correo electrónico válido.' });
    required(campo.clave, { message: 'Ingresa tu contraseña.' });
  });

  protected alternarClave(): void {
    this.mostrarClave.update((visible) => !visible);
  }

  // Una entrada válida abre Indicadores; un error mantiene el formulario disponible.
  protected async ingresar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (this.entrando()) return;
    this.error.set('');
    await submit(this.formulario, {
      action: async () => {
        const { correo, clave } = this.modelo();
        if (!this.sesion.iniciar(correo, clave)) {
          this.error.set('Correo o contraseña incorrectos. Revisa tus datos e intenta otra vez.');
          return;
        }
        this.entrando.set(true);
        try {
          await this.router.navigate(['/indicadores'], { replaceUrl: true });
        } finally {
          this.entrando.set(false);
        }
      },
    });
  }
}
