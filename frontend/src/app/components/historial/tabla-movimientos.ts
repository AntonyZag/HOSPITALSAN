import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Movimiento } from '../../interfaces/inventario';

// La misma tabla sirve para el historial y para las consultas por periodo.
@Component({
  selector: 'app-tabla-movimientos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './tabla-movimientos.html',
})
export class TablaMovimientos {
  readonly movimientos = input.required<Movimiento[]>();
}
