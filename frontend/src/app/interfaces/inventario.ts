// Usa los mismos nombres de campos que devuelve FastAPI.
export interface ProductoOpcion {
  id_producto: number;
  codigo: string;
  nombre: string;
}

export interface AreaHospitalaria {
  id_area: number;
  nombre_area: string;
}

export interface LoteVigente {
  id_lote: number;
  id_producto: number;
  numero_lote: string;
  fecha_vencimiento: string;
  cantidad_disponible: number;
}

// Datos enviados al registrar una salida y filtros para consultar el historial.
export interface SalidaPayload {
  id_producto: number;
  id_lote: number;
  cantidad: number;
  fecha: string;
  motivo: string;
  id_area_destino: number;
}

export type TipoMovimiento = 'ENTRADA' | 'SALIDA';

export interface RangoFechas {
  desde: string;
  hasta: string;
}

export interface HistorialFiltros extends Partial<RangoFechas> {
  id_producto?: string;
  tipo_movimiento?: TipoMovimiento | '';
  id_area_destino?: string;
}

export interface Movimiento {
  id_movimiento: number;
  id_producto: number;
  nombre_producto: string;
  id_lote: number | null;
  numero_lote: string | null;
  tipo_movimiento: TipoMovimiento;
  cantidad: number;
  fecha_movimiento: string | null;
  motivo: string;
  id_area_destino: number | null;
  nombre_area: string | null;
  stock_anterior: number;
  stock_posterior: number;
}

// Resultados de las consultas del panel de inventario.
export interface ResumenInventario {
  productos_activos: number;
  valor_inventario: string;
}

export interface StockBajo {
  id_producto: number;
  codigo: string;
  nombre_producto: string;
  activo: boolean;
  stock_minimo: number;
  stock_actual: number;
}

export interface Vencimiento {
  id_lote: number;
  codigo: string;
  nombre_producto: string;
  numero_lote: string;
  fecha_vencimiento: string;
  cantidad_disponible: number;
  estado: 'VENCIDO' | 'PROXIMO';
}

export interface MayorSalida {
  id_producto: number;
  codigo: string;
  nombre_producto: string;
  unidades_retiradas: number;
}
