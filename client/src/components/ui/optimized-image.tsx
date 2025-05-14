import { useState, useEffect } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  lazy?: boolean;
  placeholderColor?: string;
  onClick?: () => void;
}

/**
 * Componente para mostrar imágenes optimizadas con carga diferida
 * Incluye funcionalidades de SEO como alt-text adecuado y loading="lazy"
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  lazy = true,
  placeholderColor = "#1e1e1e",
  onClick
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Creamos un ID único para usar con aria-labelledby si es necesario
  const uniqueId = `img-${Math.random().toString(36).substring(2, 9)}`;
  
  // Función para manejar el evento de carga de la imagen
  const handleLoad = () => {
    setIsLoaded(true);
  };
  
  // Función para manejar errores en la carga de la imagen
  const handleError = () => {
    setError(true);
  };
  
  useEffect(() => {
    // Resetear el estado cuando cambia la src
    setIsLoaded(false);
    setError(false);
  }, [src]);
  
  // Placeholder mientras la imagen carga
  const placeholder = (
    <div 
      className={`bg-muted flex items-center justify-center ${className}`}
      style={{ 
        backgroundColor: placeholderColor,
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "200px"
      }}
      aria-hidden="true"
    >
      <svg className="w-10 h-10 text-muted-foreground animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <circle cx="12" cy="10" r="2" />
        <path d="M4 20l4-4 4 4 4-4 4 4" />
      </svg>
    </div>
  );
  
  // Si hay error al cargar la imagen
  if (error) {
    return (
      <div 
        className={`bg-destructive/10 flex items-center justify-center ${className}`}
        style={{ 
          width: width ? `${width}px` : "100%",
          height: height ? `${height}px` : "200px"
        }}
        aria-label={`Error al cargar la imagen: ${alt}`}
      >
        <div className="text-center p-4">
          <svg 
            className="w-8 h-8 mx-auto mb-2 text-destructive" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p className="text-sm text-muted-foreground">No se pudo cargar la imagen</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {!isLoaded && placeholder}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoaded ? "block" : "hidden"}`}
        loading={lazy ? "lazy" : "eager"}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        style={{
          objectFit: "cover",
          maxWidth: "100%"
        }}
        id={uniqueId}
      />
      {/* Si hay un alt muy largo, se sugiere también incluir un aria-labelledby 
          con una descripción más larga en un elemento oculto */}
      {alt.length > 100 && (
        <span id={uniqueId} className="sr-only">{alt}</span>
      )}
    </>
  );
}