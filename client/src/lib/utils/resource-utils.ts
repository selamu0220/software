/**
 * Corrige la ruta de un recurso para asegurarse de que es accesible
 * @param path La ruta original del recurso (puede ser URL, ruta relativa o absoluta)
 * @returns Ruta corregida que es accesible desde el frontend
 */
export function corregirRutaRecurso(path: string | null | undefined): string {
  if (!path) {
    return '/placeholder-image.jpg';
  }

  // Si ya es una URL completa, la devolvemos tal cual
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  // Si es una ruta absoluta del servidor, la convertimos a relativa
  if (path.startsWith('/uploads/')) {
    return path;
  }

  // Si es solo el nombre del archivo, añadimos la ruta de uploads
  if (!path.includes('/')) {
    return `/uploads/${path}`;
  }

  // Si comienza con "uploads/" sin la barra inicial, la añadimos
  if (path.startsWith('uploads/')) {
    return `/${path}`;
  }

  return path;
}

/**
 * Formatea el tamaño de un archivo en un formato legible (KB, MB, etc.)
 * @param bytes Tamaño en bytes
 * @returns Cadena formateada con el tamaño y la unidad correspondiente
 */
export function formatearTamanoArchivo(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Obtiene la extensión de un archivo a partir de su nombre
 * @param filename Nombre del archivo incluyendo su extensión
 * @returns Extensión del archivo en minúsculas
 */
export function obtenerExtensionArchivo(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Determina si un archivo es una imagen basado en su extensión
 * @param filename Nombre del archivo
 * @returns Verdadero si es una imagen, falso en caso contrario
 */
export function esImagen(filename: string): boolean {
  const extension = obtenerExtensionArchivo(filename);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension);
}

/**
 * Determina si un archivo es un documento basado en su extensión
 * @param filename Nombre del archivo
 * @returns Verdadero si es un documento, falso en caso contrario
 */
export function esDocumento(filename: string): boolean {
  const extension = obtenerExtensionArchivo(filename);
  return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(extension);
}

/**
 * Determina si un archivo es un video basado en su extensión
 * @param filename Nombre del archivo
 * @returns Verdadero si es un video, falso en caso contrario
 */
export function esVideo(filename: string): boolean {
  const extension = obtenerExtensionArchivo(filename);
  return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv'].includes(extension);
}

/**
 * Determina si un archivo es un audio basado en su extensión
 * @param filename Nombre del archivo
 * @returns Verdadero si es un audio, falso en caso contrario
 */
export function esAudio(filename: string): boolean {
  const extension = obtenerExtensionArchivo(filename);
  return ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(extension);
}