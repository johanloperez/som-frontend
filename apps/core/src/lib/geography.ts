export const regionsByCountry: Record<string, string[]> = {
  Perú: ["Lima", "Arequipa", "Cusco", "La Libertad", "Piura"],
  Colombia: ["Antioquia", "Cundinamarca", "Valle del Cauca", "Atlántico"],
  Chile: ["Metropolitana", "Valparaíso", "Biobío", "Maule"],
  Argentina: ["Buenos Aires", "Córdoba", "Santa Fe", "Mendoza"],
  México: ["CDMX", "Nuevo León", "Jalisco", "Puebla"],
  Ecuador: ["Pichincha", "Guayas", "Azuay"],
  Bolivia: ["La Paz", "Santa Cruz", "Cochabamba"],
};

export function regionsFor(country: string): string[] {
  return regionsByCountry[country] ?? [];
}
