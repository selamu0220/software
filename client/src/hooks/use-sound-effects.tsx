import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type SoundEffectType = 'click' | 'hover' | 'success' | 'error' | 'intro';

interface SoundContextType {
  playSound: (effect: SoundEffectType) => void;
  toggleMute: () => void;
  muted: boolean;
}

const SoundContext = createContext<SoundContextType | null>(null);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [muted, setMuted] = useState(() => {
    // Recuperar la preferencia de sonido del localStorage si existe
    const savedPreference = localStorage.getItem('sound-muted');
    return savedPreference ? savedPreference === 'true' : false;
  });
  
  const [audioElements, setAudioElements] = useState<Record<SoundEffectType, HTMLAudioElement | null>>({
    click: null,
    hover: null,
    success: null,
    error: null,
    intro: null
  });

  // Inicializar los elementos de audio cuando el componente se monta
  useEffect(() => {
    const sounds: Record<SoundEffectType, HTMLAudioElement> = {
      click: new Audio('/sounds/click.mp3'),
      hover: new Audio('/sounds/hover.mp3'),
      success: new Audio('/sounds/success.mp3'),
      error: new Audio('/sounds/error.mp3'),
      intro: new Audio('/sounds/intro.mp3')
    };

    // Precargar los sonidos
    Object.values(sounds).forEach(audio => {
      audio.preload = 'auto';
      audio.volume = 0.3; // Volumen predeterminado
    });

    // La intro puede tener un volumen más alto
    sounds.intro.volume = 0.5;

    setAudioElements(sounds);

    // Limpiar cuando el componente se desmonte
    return () => {
      Object.values(sounds).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  // Guardar la preferencia de sonido cuando cambia
  useEffect(() => {
    localStorage.setItem('sound-muted', muted.toString());
  }, [muted]);

  const playSound = useCallback((effect: SoundEffectType) => {
    if (muted || !audioElements[effect]) return;
    
    const audio = audioElements[effect];
    if (!audio) return;

    // Detener el sonido si ya está reproduciéndose y volver a empezar
    audio.pause();
    audio.currentTime = 0;
    
    // Ajustar el volumen según el tipo de efecto
    if (effect === 'hover') {
      audio.volume = 0.15; // Los efectos de hover son más sutiles
    } else if (effect === 'intro') {
      audio.volume = 0.5; // La intro puede ser más prominente
    } else {
      audio.volume = 0.3; // Volumen estándar para otros efectos
    }
    
    audio.play().catch(error => {
      // Algunas navegadores bloquean la reproducción automática
      console.error('Error reproduciendo sonido:', error);
    });
  }, [muted, audioElements]);

  const toggleMute = useCallback(() => {
    setMuted(prev => !prev);
  }, []);

  return (
    <SoundContext.Provider value={{ playSound, toggleMute, muted }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSoundEffects = (): SoundContextType => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSoundEffects debe usarse dentro de un SoundProvider');
  }
  return context;
};