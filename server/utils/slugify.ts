/**
 * Convierte un texto en un slug URL-friendly
 * - Convierte a minúsculas
 * - Reemplaza caracteres especiales con guiones
 * - Elimina caracteres no alfanuméricos
 * - Elimina guiones duplicados
 * @param text Texto a convertir en slug
 * @returns Slug generado
 */
export function slugify(text: string): string {
  return text
    .toString()                   // Asegurarse de que es un string
    .normalize('NFD')             // Normalizar acentos
    .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
    .toLowerCase()                // Convertir a minúsculas
    .trim()                       // Eliminar espacios al inicio y final
    .replace(/\s+/g, '-')         // Reemplazar espacios con guiones
    .replace(/[^\w\-]+/g, '')     // Eliminar caracteres no palabra
    .replace(/\-\-+/g, '-')       // Reemplazar múltiples guiones con uno solo
    .replace(/^-+/, '')           // Eliminar guiones al inicio
    .replace(/-+$/, '');          // Eliminar guiones al final
}

/**
 * Genera un slug único añadiendo un número aleatorio si es necesario
 * @param text Texto base para el slug
 * @returns Slug único
 */
export function generateSlug(text: string): string {
  let slug = slugify(text);
  
  // Si el slug está vacío (porque el texto solo contenía caracteres especiales)
  // generamos uno aleatorio
  if (!slug) {
    slug = 'idea-' + Math.floor(Math.random() * 10000);
  }
  
  return slug;
}