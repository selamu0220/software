import { useState, useEffect, useCallback, createContext, useContext } from 'react';

type SoundEffectType = 'click' | 'success' | 'hover' | 'error' | 'intro';

interface SoundContextType {
  playSound: (effect: SoundEffectType) => void;
  toggleMute: () => void;
  muted: boolean;
}

// Creamos un contexto para los efectos de sonido
const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const [audioElements, setAudioElements] = useState<Record<SoundEffectType, HTMLAudioElement | null>>({
    click: null,
    success: null,
    hover: null,
    error: null,
    intro: null
  });
  
  const [muted, setMuted] = useState<boolean>(() => {
    // Intentamos recuperar la preferencia del usuario desde localStorage
    const savedPreference = localStorage.getItem('soundMuted');
    return savedPreference ? JSON.parse(savedPreference) : false;
  });

  // Cargar los archivos de audio cuando el componente se monta
  useEffect(() => {
    const clickSound = new Audio('/sounds/click.mp3');
    const successSound = new Audio('/sounds/success.mp3');
    const hoverSound = new Audio('/sounds/hover.mp3');
    const errorSound = new Audio('/sounds/error.mp3');
    const introSound = new Audio('/sounds/intro.mp3');
    
    // Configurar los volúmenes
    clickSound.volume = 0.3;
    successSound.volume = 0.5;
    hoverSound.volume = 0.15;
    errorSound.volume = 0.4;
    introSound.volume = 0.6;

    // Precargar los sonidos
    Promise.all([
      clickSound.load(),
      successSound.load(),
      hoverSound.load(), 
      errorSound.load(),
      introSound.load()
    ]).then(() => {
      setAudioElements({
        click: clickSound,
        success: successSound,
        hover: hoverSound,
        error: errorSound,
        intro: introSound
      });
    }).catch(err => {
      console.error("Error reproduciendo sonido:", err);
    });
    
    // Limpiar al desmontar
    return () => {
      // No es necesario limpiar AudioElements en la mayoría de casos
      // pero puede ser útil si necesitas detener sonidos en curso
    };
  }, []);

  // Actualiza localStorage cuando cambia la preferencia de mute
  useEffect(() => {
    localStorage.setItem('soundMuted', JSON.stringify(muted));
  }, [muted]);

  const playSound = useCallback((effect: SoundEffectType) => {
    if (muted || !audioElements[effect]) return;
    
    try {
      // Clonamos para poder reproducir el mismo sonido múltiples veces rápidamente
      const sound = audioElements[effect]?.cloneNode() as HTMLAudioElement;
      if (sound) {
        sound.play().catch(err => {
          // Maneja errores silenciosamente para evitar excepciones en consola
          // Común en navegadores que requieren interacción de usuario
        });
      }
    } catch (error) {
      console.error("Error reproduciendo sonido:", error);
    }
  }, [audioElements, muted]);

  const toggleMute = useCallback(() => {
    setMuted(prevMuted => !prevMuted);
  }, []);

  return (
    <SoundContext.Provider value={{ playSound, toggleMute, muted }}>
      {children}
    </SoundContext.Provider>
  );
};

// Hook personalizado para usar los efectos de sonido
export const useSoundEffects = (): SoundContextType => {
  const context = useContext(SoundContext);
  
  if (context === undefined) {
    throw new Error("useSoundEffects debe usarse dentro de un SoundProvider");
  }
  
  return context;
};