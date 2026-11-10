import { AlertasService } from '../../shared/alertas.service';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CategoriaPayload } from '../../interfaces/categoria';
import { CategoriaService } from '../../services/categoria.service';
import { mensajeError } from '../../shared/error-message';

interface CategoriaFormModel {
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-categoria-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, RouterLink],
  templateUrl: './categoria-form.html',
})
export class CategoriaForm implements OnInit {
  private readonly alertas = inject(AlertasService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly idCategoria = signal<number | null>(null);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal('');

  protected readonly model = signal<CategoriaFormModel>({ nombre: '', descripcion: '' });

  protected readonly form = form(this.model, (path) => {
    required(path.nombre, { message: 'El nombre es obligatorio.' });
    maxLength(path.nombre, 80, { message: 'El nombre no puede superar 80 caracteres.' });
    maxLength(path.descripcion, 250, {
      message: 'La descripción no puede superar 250 caracteres.',
    });
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const idNumerico = Number(id);
      if (Number.isFinite(idNumerico) && idNumerico > 0) {
        this.idCategoria.set(idNumerico);
        this.cargarCategoria(idNumerico);
      } else {
        this.error.set('El identificador de la categoría no es válido.');
      }
    }
  }

  protected esEdicion(): boolean {
    return this.idCategoria() !== null;
  }

  protected async guardar(event: Event): Promise<void> {
    event.preventDefault();
    if (this.guardando()) return;
    this.error.set('');

    await submit(this.form, {
      action: async () => {
        const valor = this.model();
        const payload: CategoriaPayload = {
          nombre: valor.nombre.trim(),
          descripcion: valor.descripcion.trim() || null,
        };

        this.guardando.set(true);
        try {
          const id = this.idCategoria();
          if (id !== null) {
            await firstValueFrom(this.categoriaService.actualizar(id, payload));
          } else {
            await firstValueFrom(this.categoriaService.registrar(payload));
          }
          await this.router.navigate(['/categorias']);
          // Confirma el resultado después de actualizar el listado.
          this.alertas.exito(
            id !== null ? 'Categoría actualizada' : 'Categoría registrada',
            payload.nombre,
          );
        } catch (error) {
          this.error.set(mensajeError(error));
          this.alertas.fallo('No se pudo guardar', mensajeError(error));
        } finally {
          this.guardando.set(false);
        }
      },
    });
  }

  private cargarCategoria(idCategoria: number): void {
    this.cargando.set(true);
    this.categoriaService.listar(false).subscribe({
      next: (categorias) => {
        const categoria = categorias.find((item) => item.idCategoria === idCategoria);
        if (categoria) {
          this.model.set({
            nombre: categoria.nombre,
            descripcion: categoria.descripcion ?? '',
          });
        } else {
          this.error.set('La categoría no existe.');
        }
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }
}
