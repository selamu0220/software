import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Estado para almacenar nuestro valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Obtener del localStorage por la key
      const item = window.localStorage.getItem(key);
      // Parsear el item almacenado o retornar initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Si hay error, devolver initialValue
      console.error(error);
      return initialValue;
    }
  });

  // Retornar una versión envuelta de la función setStoredValue de useState que ...
  // ... guarda el nuevo valor en localStorage.
  const setValue = (value: T) => {
    try {
      // Permitir que value sea una función para seguir el mismo patrón que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Guardar estado
      setStoredValue(valueToStore);
      // Guardar en localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // Una implementación más avanzada manejaría el caso de error
      console.error(error);
    }
  };

  return [storedValue, setValue];
}