import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Categoria, CategoriaPayload } from '../interfaces/categoria';

type CategoriaApi = Omit<Categoria, 'idCategoria' | 'cantidadProductos'> & {
  id_categoria: number;
  cantidad_productos: number;
};

// Conserva el ID de la categoría que se usa para registrar el producto.
function leerCategoria(categoria: CategoriaApi): Categoria {
  return {
    idCategoria: categoria.id_categoria,
    nombre: categoria.nombre,
    descripcion: categoria.descripcion,
    activo: categoria.activo,
    cantidadProductos: categoria.cantidad_productos,
  };
}

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/categorias`;

  listar(soloActivas = false): Observable<Categoria[]> {
    const params = new HttpParams().set('solo_activas', soloActivas);
    return this.http
      .get<CategoriaApi[]>(this.baseUrl, { params })
      .pipe(map((categorias) => categorias.map(leerCategoria)));
  }

  registrar(payload: CategoriaPayload): Observable<Categoria> {
    return this.http.post<CategoriaApi>(this.baseUrl, payload).pipe(map(leerCategoria));
  }

  actualizar(idCategoria: number, payload: CategoriaPayload): Observable<Categoria> {
    return this.http
      .put<CategoriaApi>(`${this.baseUrl}/${idCategoria}`, payload)
      .pipe(map(leerCategoria));
  }

  cambiarEstado(idCategoria: number, activo: boolean): Observable<Categoria> {
    return this.http
      .patch<CategoriaApi>(`${this.baseUrl}/${idCategoria}/estado`, { activo })
      .pipe(map(leerCategoria));
  }
}
