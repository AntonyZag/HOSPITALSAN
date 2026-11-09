import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Entrada, EntradaFiltro, EntradaPayload } from '../interfaces/entrada';

interface EntradaApi {
  id_movimiento: number;
  id_producto: number;
  nombre_producto: string;
  id_lote: number;
  numero_lote: string;
  tipo_movimiento: string;
  cantidad: number;
  fecha_movimiento: string;
  motivo: string;
  stock_anterior: number;
  stock_posterior: number;
}

// Adapta la respuesta de FastAPI para el formulario y el historial.
function leerEntrada(entrada: EntradaApi): Entrada {
  return {
    idMovimiento: entrada.id_movimiento,
    idProducto: entrada.id_producto,
    nombreProducto: entrada.nombre_producto,
    idLote: entrada.id_lote,
    numeroLote: entrada.numero_lote,
    tipoMovimiento: entrada.tipo_movimiento,
    cantidad: entrada.cantidad,
    fechaMovimiento: entrada.fecha_movimiento,
    motivo: entrada.motivo,
    stockAnterior: entrada.stock_anterior,
    stockPosterior: entrada.stock_posterior,
  };
}

@Injectable({ providedIn: 'root' })
export class EntradaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/entradas`;

  registrar(payload: EntradaPayload): Observable<Entrada> {
    // Envía los nombres que FastAPI espera para guardar el lote.
    return this.http
      .post<EntradaApi>(this.baseUrl, {
        id_producto: payload.idProducto,
        numero_lote: payload.numeroLote,
        fecha_vencimiento: payload.fechaVencimiento,
        cantidad: payload.cantidad,
        motivo: payload.motivo,
      })
      .pipe(map(leerEntrada));
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

    return this.http
      .get<EntradaApi[]>(this.baseUrl, { params })
      .pipe(map((entradas) => entradas.map(leerEntrada)));
  }
}
