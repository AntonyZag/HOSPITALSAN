import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormField, form, maxLength, min, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Categoria } from '../../interfaces/categoria';
import { ProductoPayload } from '../../interfaces/producto';
import { CategoriaService } from '../../services/categoria.service';
import { ProductoService } from '../../services/producto.service';
import { mensajeError } from '../../shared/error-message';

interface ProductoFormModel {
  codigo: string;
  nombre: string;
  descripcion: string;
  idCategoria: string;
  unidadMedida: string;
  precioUnitario: number | null;
  stockMinimo: number | null;
}

const MODELO_INICIAL: ProductoFormModel = {
  codigo: '',
  nombre: '',
  descripcion: '',
  idCategoria: '',
  unidadMedida: '',
  precioUnitario: null,
  stockMinimo: null,
};

@Component({
  selector: 'app-producto-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, RouterLink],
  templateUrl: './producto-form.html',
})
export class ProductoForm implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly idProducto = signal<number | null>(null);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal('');

  protected readonly model = signal<ProductoFormModel>({ ...MODELO_INICIAL });

  protected readonly form = form(this.model, (path) => {
    required(path.codigo, { message: 'El código es obligatorio.' });
    maxLength(path.codigo, 30, { message: 'El código no puede superar 30 caracteres.' });

    required(path.nombre, { message: 'El nombre es obligatorio.' });
    maxLength(path.nombre, 120, { message: 'El nombre no puede superar 120 caracteres.' });

    maxLength(path.descripcion, 500, {
      message: 'La descripción no puede superar 500 caracteres.',
    });

    required(path.idCategoria, { message: 'Selecciona una categoría.' });

    required(path.unidadMedida, { message: 'La unidad de medida es obligatoria.' });
    maxLength(path.unidadMedida, 20, {
      message: 'La unidad de medida no puede superar 20 caracteres.',
    });

    required(path.precioUnitario, { message: 'El precio unitario es obligatorio.' });
    min(path.precioUnitario, 0.01, { message: 'El precio debe ser mayor que cero.' });

    required(path.stockMinimo, { message: 'El stock mínimo es obligatorio.' });
    min(path.stockMinimo, 1, { message: 'El stock mínimo debe ser mayor que cero.' });
  });

  ngOnInit(): void {
    this.cargarCategorias();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const idNumerico = Number(id);
      if (Number.isFinite(idNumerico) && idNumerico > 0) {
        this.idProducto.set(idNumerico);
        this.cargarProducto(idNumerico);
      } else {
        this.error.set('El identificador del producto no es válido.');
      }
    }
  }

  protected esEdicion(): boolean {
    return this.idProducto() !== null;
  }

  protected async guardar(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set('');

    await submit(this.form, {
      action: async () => {
        const valor = this.model();
        if (
          valor.idCategoria === '' ||
          valor.precioUnitario === null ||
          valor.stockMinimo === null
        ) {
          return;
        }

        const payload: ProductoPayload = {
          codigo: valor.codigo.trim(),
          nombre: valor.nombre.trim(),
          descripcion: valor.descripcion.trim() || null,
          idCategoria: Number(valor.idCategoria),
          unidadMedida: valor.unidadMedida.trim(),
          precioUnitario: valor.precioUnitario,
          stockMinimo: valor.stockMinimo,
        };

        this.guardando.set(true);
        try {
          const id = this.idProducto();
          if (id !== null) {
            await firstValueFrom(this.productoService.actualizar(id, payload));
          } else {
            await firstValueFrom(this.productoService.crear(payload));
          }
          await this.router.navigate(['/productos']);
        } catch (error) {
          this.error.set(mensajeError(error));
        } finally {
          this.guardando.set(false);
        }
      },
    });
  }

  private cargarCategorias(): void {
    this.categoriaService.listar(true).subscribe({
      next: (categorias) => this.categorias.set(categorias),
      error: (error) => this.error.set(mensajeError(error)),
    });
  }

  private cargarProducto(idProducto: number): void {
    this.cargando.set(true);
    this.productoService.obtener(idProducto).subscribe({
      next: (producto) => {
        this.model.set({
          codigo: producto.codigo,
          nombre: producto.nombre,
          descripcion: producto.descripcion ?? '',
          idCategoria: String(producto.idCategoria),
          unidadMedida: producto.unidadMedida,
          precioUnitario: Number(producto.precioUnitario),
          stockMinimo: producto.stockMinimo,
        });
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }
}
