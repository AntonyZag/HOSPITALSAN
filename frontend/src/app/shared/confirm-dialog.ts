import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="modal d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ titulo() }}</h5>
              <button
                type="button"
                class="btn-close"
                aria-label="Cerrar"
                (click)="cancelar.emit()"
              ></button>
            </div>
            <div class="modal-body">
              <p class="mb-0">{{ mensaje() }}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="cancelar.emit()">
                Cancelar
              </button>
              <button type="button" class="btn btn-danger" (click)="confirmar.emit()">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  readonly visible = input(false);
  readonly titulo = input('Confirmar acción');
  readonly mensaje = input('');
  readonly confirmar = output<void>();
  readonly cancelar = output<void>();
}
