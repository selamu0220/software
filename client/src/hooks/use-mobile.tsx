import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Función para verificar si el ancho de la ventana es menor a 768px (tamaño tablet)
    function checkIfMobile() {
      setIsMobile(window.innerWidth < 768);
    }

    // Verificar inicialmente
    checkIfMobile();

    // Crear un event listener para cuando se redimensione la ventana
    window.addEventListener('resize', checkIfMobile);

    // Limpiar el event listener cuando el componente se desmonte
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
}