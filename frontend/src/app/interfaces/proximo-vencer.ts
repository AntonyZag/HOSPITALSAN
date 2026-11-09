export interface ProximoVencer {
  idProducto: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  idLote: number;
  numeroLote: string;
  fechaVencimiento: string;
  cantidadDisponible: number;
  diasRestantes: number;
}
