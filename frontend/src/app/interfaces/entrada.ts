export interface EntradaPayload {
  idProducto: number;
  numeroLote: string;
  fechaVencimiento: string;
  cantidad: number;
  motivo: string;
}

export interface Entrada {
  idMovimiento: number;
  idProducto: number;
  nombreProducto: string;
  idLote: number;
  numeroLote: string;
  tipoMovimiento: string;
  cantidad: number;
  fechaMovimiento: string;
  motivo: string;
  stockAnterior: number;
  stockPosterior: number;
}

export interface EntradaFiltro {
  idProducto?: number | null;
  desde?: string | null;
  hasta?: string | null;
}
