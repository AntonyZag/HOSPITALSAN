import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Categoria, CategoriaPayload } from '../interfaces/categoria';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/categorias`;

  listar(soloActivas = false): Observable<Categoria[]> {
    const params = new HttpParams().set('solo_activas', soloActivas);
    return this.http.get<Categoria[]>(this.baseUrl, { params });
  }

  registrar(payload: CategoriaPayload): Observable<Categoria> {
    return this.http.post<Categoria>(this.baseUrl, payload);
  }

  actualizar(idCategoria: number, payload: CategoriaPayload): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.baseUrl}/${idCategoria}`, payload);
  }

  cambiarEstado(idCategoria: number, activo: boolean): Observable<Categoria> {
    return this.http.patch<Categoria>(`${this.baseUrl}/${idCategoria}/estado`, {
      activo,
    });
  }
}
