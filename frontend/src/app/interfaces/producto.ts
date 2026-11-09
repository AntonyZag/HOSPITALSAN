export interface Producto {
  idProducto: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  idCategoria: number;
  nombreCategoria: string;
  unidadMedida: string;
  precioUnitario: string;
  stockMinimo: number;
  activo: boolean;
  stockActual: number;
  proximoVencimiento: string | null;
}

export interface ProductoPayload {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  idCategoria: number;
  unidadMedida: string;
  precioUnitario: number;
  stockMinimo: number;
}

export interface ProductoFiltro {
  busqueda?: string | null;
  idCategoria?: number | null;
  activo?: boolean | null;
  soloStockBajo?: boolean;
  diasVencimiento?: number | null;
}
