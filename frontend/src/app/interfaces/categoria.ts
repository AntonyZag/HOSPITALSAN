export interface Categoria {
  idCategoria: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  cantidadProductos: number;
}

export interface CategoriaPayload {
  nombre: string;
  descripcion: string | null;
}
