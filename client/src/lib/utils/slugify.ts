/**
 * Convierte un texto en un slug para URLs.
 * 
 * @param text El texto a convertir en slug
 * @returns El slug generado
 */
export default function slugify(text: string): string {
  return text
    .toString()                   // Convertir a string
    .normalize('NFD')             // Normalizar caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .toLowerCase()                // Convertir a minúsculas
    .trim()                       // Eliminar espacios en blanco al inicio y final
    .replace(/\s+/g, '-')         // Reemplazar espacios con guiones
    .replace(/[^\w\-]+/g, '')     // Eliminar caracteres no alfanuméricos
    .replace(/\-\-+/g, '-')       // Reemplazar múltiples guiones con uno solo
    .replace(/^-+/, '')           // Quitar guiones al inicio
    .replace(/-+$/, '');          // Quitar guiones al final
}