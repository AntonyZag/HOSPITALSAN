import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  AreaHospitalaria,
  HistorialFiltros,
  LoteVigente,
  MayorSalida,
  Movimiento,
  ProductoOpcion,
  RangoFechas,
  ResumenInventario,
  SalidaPayload,
  StockBajo,
  Vencimiento,
} from '../interfaces/inventario';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  // Carga desde la API los catálogos de los selectores.
  productos(soloActivos: boolean) {
    const params = soloActivos ? new HttpParams().set('activo', true) : new HttpParams();
    return this.http.get<ProductoOpcion[]>(`${this.api}/productos`, { params });
  }

  areas() {
    return this.http.get<AreaHospitalaria[]>(`${this.api}/salidas/areas`);
  }

  lotesVigentes(idProducto: string) {
    return this.http.get<LoteVigente[]>(`${this.api}/salidas/lotes-vigentes/${idProducto}`);
  }

  // Envía la salida y recibe su registro para mostrarlo como comprobante.
  registrarSalida(payload: SalidaPayload) {
    return this.http.post<Movimiento>(`${this.api}/salidas`, payload);
  }

  // Envía solo los filtros que tienen algún valor.
  historial(filtros: HistorialFiltros = {}) {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor) {
        params = params.set(clave, valor);
      }
    }
    return this.http.get<Movimiento[]>(`${this.api}/historial`, { params });
  }

  // Obtiene las cifras y las listas que muestra el panel.
  resumen() {
    return this.http.get<ResumenInventario>(`${this.api}/indicadores/resumen`);
  }

  stockBajo() {
    return this.http.get<StockBajo[]>(`${this.api}/indicadores/stock-bajo`);
  }

  vencimientos() {
    return this.http.get<Vencimiento[]>(`${this.api}/indicadores/vencimientos`);
  }

  mayoresSalidas(rango: RangoFechas) {
    const params = new HttpParams().set('desde', rango.desde).set('hasta', rango.hasta);
    return this.http.get<MayorSalida[]>(`${this.api}/indicadores/mayores-salidas`, { params });
  }
}
