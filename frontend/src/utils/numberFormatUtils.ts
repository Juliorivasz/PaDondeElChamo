
// Formatea un número como moneda en pesos argentinos (ARS).

export const formatCurrency = (value: number | null | undefined): string => {
  // Maneja el caso de que el valor sea nulo o indefinido
  if (value === null || value === undefined) {
    return '$ 0';
  }

  // Crea el formateador para español de Argentina
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    // Estas dos líneas eliminan los centavos, como se usa en Argentina
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(value);
};