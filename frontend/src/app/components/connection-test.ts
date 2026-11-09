import { Component, inject, signal } from '@angular/core';
import { TestService } from '../services/test.service';

@Component({
  selector: 'app-connection-test',
  template: `
    <button type="button" (click)="checkConnection()" [disabled]="checking()">
      Probar conexión
    </button>
    <p role="status">{{ message() }}</p>
  `,
})
export class ConnectionTest {
  private readonly testService = inject(TestService);
  protected readonly checking = signal(false);
  protected readonly message = signal('');

  protected checkConnection(): void {
    this.checking.set(true);
    this.message.set('Comprobando conexión…');

    this.testService.checkConnection().subscribe({
      next: ({ message }) => {
        this.message.set(message);
        this.checking.set(false);
      },
      error: (error) => {
        this.message.set(
          error.status === 503
            ? 'FastAPI respondió, pero no pudo conectar a SQL Server.'
            : 'No se pudo completar la solicitud a FastAPI.',
        );
        this.checking.set(false);
      },
    });
  }
}
