import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Lote } from '../interfaces/lote';
import { Producto, ProductoFiltro, ProductoPayload } from '../interfaces/producto';
import { ProximoVencer } from '../interfaces/proximo-vencer';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/productos`;

  listar(filtros: ProductoFiltro = {}): Observable<Producto[]> {
    let params = new HttpParams();

    if (filtros.busqueda) {
      params = params.set('busqueda', filtros.busqueda);
    }
    if (filtros.idCategoria != null) {
      params = params.set('id_categoria', filtros.idCategoria);
    }
    if (filtros.activo != null) {
      params = params.set('activo', filtros.activo);
    }
    if (filtros.soloStockBajo) {
      params = params.set('solo_stock_bajo', true);
    }
    if (filtros.diasVencimiento != null) {
      params = params.set('dias_vencimiento', filtros.diasVencimiento);
    }

    return this.http.get<Producto[]>(this.baseUrl, { params });
  }

  obtener(idProducto: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.baseUrl}/${idProducto}`);
  }

  crear(payload: ProductoPayload): Observable<Producto> {
    return this.http.post<Producto>(this.baseUrl, payload);
  }

  actualizar(idProducto: number, payload: ProductoPayload): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/${idProducto}`, payload);
  }

  cambiarEstado(idProducto: number, activo: boolean): Observable<Producto> {
    return this.http.patch<Producto>(`${this.baseUrl}/${idProducto}/estado`, {
      activo,
    });
  }

  proximosVencer(dias = 30): Observable<ProximoVencer[]> {
    const params = new HttpParams().set('dias', dias);
    return this.http.get<ProximoVencer[]>(`${this.baseUrl}/proximos-vencer`, {
      params,
    });
  }

  listarLotes(idProducto: number): Observable<Lote[]> {
    return this.http.get<Lote[]>(`${this.baseUrl}/${idProducto}/lotes`);
  }
}
