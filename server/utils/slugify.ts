/**
 * Genera un slug a partir de un string (para URLs amigables)
 * @param text El texto para convertir en slug
 * @returns Slug generado
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Normaliza acentos
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos
    .trim()
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/[^\w\-]+/g, '') // Elimina caracteres no palabra
    .replace(/\-\-+/g, '-') // Elimina múltiples guiones
    .replace(/^-+/, '') // Elimina guiones iniciales
    .replace(/-+$/, ''); // Elimina guiones finales
}