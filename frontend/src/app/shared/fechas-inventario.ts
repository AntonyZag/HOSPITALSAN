// Signal Forms usa un Date a medianoche UTC para representar un día sin hora.
export function hoyLima(): Date {
  const lima = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return new Date(Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), lima.getUTCDate()));
}

// La API recibe solo el día, en formato año-mes-día.
export function fechaIso(fecha: Date | null): string {
  return fecha?.toISOString().split('T')[0] ?? '';
}
