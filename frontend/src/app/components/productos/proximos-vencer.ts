import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProximoVencer } from '../../interfaces/proximo-vencer';
import { ProductoService } from '../../services/producto.service';
import { mensajeError } from '../../shared/error-message';

@Component({
  selector: 'app-proximos-vencer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  templateUrl: './proximos-vencer.html',
})
export class ProximosVencer implements OnInit {
  private readonly productoService = inject(ProductoService);

  protected readonly lotes = signal<ProximoVencer[]>([]);
  protected readonly dias = signal(30);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.productoService.proximosVencer(this.dias()).subscribe({
      next: (lotes) => {
        this.lotes.set(lotes);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }

  protected onDiasChange(event: Event): void {
    const valor = Number((event.target as HTMLInputElement).value);
    this.dias.set(Number.isFinite(valor) && valor > 0 ? valor : 30);
    this.cargar();
  }

  protected claseDias(dias: number): string {
    if (dias <= 7) {
      return 'text-bg-danger';
    }
    if (dias <= 15) {
      return 'text-bg-warning';
    }
    return 'text-bg-info';
  }
}
