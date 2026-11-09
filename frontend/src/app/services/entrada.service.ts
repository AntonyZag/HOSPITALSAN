import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Entrada, EntradaFiltro, EntradaPayload } from '../interfaces/entrada';

@Injectable({ providedIn: 'root' })
export class EntradaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/entradas`;

  registrar(payload: EntradaPayload): Observable<Entrada> {
    return this.http.post<Entrada>(this.baseUrl, payload);
  }

  listar(filtros: EntradaFiltro = {}): Observable<Entrada[]> {
    let params = new HttpParams();

    if (filtros.idProducto != null) {
      params = params.set('id_producto', filtros.idProducto);
    }
    if (filtros.desde) {
      params = params.set('desde', filtros.desde);
    }
    if (filtros.hasta) {
      params = params.set('hasta', filtros.hasta);
    }

    return this.http.get<Entrada[]>(this.baseUrl, { params });
  }
}
