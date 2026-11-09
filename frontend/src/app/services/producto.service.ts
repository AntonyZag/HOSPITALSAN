import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Lote } from '../interfaces/lote';
import { LoteVigente } from '../interfaces/inventario';
import { Producto, ProductoFiltro, ProductoPayload } from '../interfaces/producto';
import { ProximoVencer } from '../interfaces/proximo-vencer';

type ProductoApi = Omit<
  Producto,
  | 'idProducto'
  | 'idCategoria'
  | 'nombreCategoria'
  | 'unidadMedida'
  | 'precioUnitario'
  | 'stockMinimo'
  | 'stockActual'
  | 'proximoVencimiento'
> & {
  id_producto: number;
  id_categoria: number;
  nombre_categoria: string;
  unidad_medida: string;
  precio_unitario: string;
  stock_minimo: number;
  stock_actual: number;
  proximo_vencimiento: string | null;
};

// Adapta los nombres de la API a los que usan los formularios y las listas.
function leerProducto(producto: ProductoApi): Producto {
  return {
    idProducto: producto.id_producto,
    codigo: producto.codigo,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    idCategoria: producto.id_categoria,
    nombreCategoria: producto.nombre_categoria,
    unidadMedida: producto.unidad_medida,
    precioUnitario: producto.precio_unitario,
    stockMinimo: producto.stock_minimo,
    activo: producto.activo,
    stockActual: producto.stock_actual,
    proximoVencimiento: producto.proximo_vencimiento,
  };
}

// Usa los nombres que FastAPI valida al guardar.
function enviarProducto(payload: ProductoPayload) {
  return {
    codigo: payload.codigo,
    nombre: payload.nombre,
    descripcion: payload.descripcion,
    id_categoria: payload.idCategoria,
    unidad_medida: payload.unidadMedida,
    precio_unitario: payload.precioUnitario,
    stock_minimo: payload.stockMinimo,
  };
}

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

    return this.http
      .get<ProductoApi[]>(this.baseUrl, { params })
      .pipe(map((productos) => productos.map(leerProducto)));
  }

  obtener(idProducto: number): Observable<Producto> {
    return this.http.get<ProductoApi>(`${this.baseUrl}/${idProducto}`).pipe(map(leerProducto));
  }

  crear(payload: ProductoPayload): Observable<Producto> {
    return this.http
      .post<ProductoApi>(this.baseUrl, enviarProducto(payload))
      .pipe(map(leerProducto));
  }

  actualizar(idProducto: number, payload: ProductoPayload): Observable<Producto> {
    return this.http
      .put<ProductoApi>(`${this.baseUrl}/${idProducto}`, enviarProducto(payload))
      .pipe(map(leerProducto));
  }

  cambiarEstado(idProducto: number, activo: boolean): Observable<Producto> {
    return this.http
      .patch<ProductoApi>(`${this.baseUrl}/${idProducto}/estado`, { activo })
      .pipe(map(leerProducto));
  }

  proximosVencer(dias = 30): Observable<ProximoVencer[]> {
    const params = new HttpParams().set('dias', dias);
    return this.http.get<ProximoVencer[]>(`${this.baseUrl}/proximos-vencer`, {
      params,
    });
  }

  listarLotes(idProducto: number): Observable<Lote[]> {
    // Adapta los lotes que se muestran al registrar una entrada.
    return this.http.get<LoteVigente[]>(`${this.baseUrl}/${idProducto}/lotes`).pipe(
      map((lotes) =>
        lotes.map((lote) => ({
          idLote: lote.id_lote,
          idProducto: lote.id_producto,
          numeroLote: lote.numero_lote,
          fechaVencimiento: lote.fecha_vencimiento,
          cantidadDisponible: lote.cantidad_disponible,
        })),
      ),
    );
  }
}
