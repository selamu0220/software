import { useEffect, useState, useRef } from 'react';

// Importamos el efecto de sonido
import uiSoundPath from '@/assets/sounds/ui_sound.mp3';

// Tipos de sonidos disponibles
type SoundType = 'intro' | 'click' | 'hover' | 'success' | 'error';

export function useSoundEffects() {
  const [muted, setMuted] = useState<boolean>(() => {
    // Recuperar preferencia guardada en localStorage
    const savedPreference = localStorage.getItem('sound-muted');
    return savedPreference ? JSON.parse(savedPreference) : false;
  });

  // Referencias a los elementos de audio
  const introSoundRef = useRef<HTMLAudioElement | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);
  const hoverSoundRef = useRef<HTMLAudioElement | null>(null);
  const successSoundRef = useRef<HTMLAudioElement | null>(null);
  const errorSoundRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar los elementos de audio
  useEffect(() => {
    // Crear elemento para el sonido de intro
    introSoundRef.current = new Audio(uiSoundPath);
    introSoundRef.current.volume = 0.5;

    // Usar el mismo archivo para otros sonidos pero con diferentes configuraciones
    clickSoundRef.current = new Audio(uiSoundPath);
    clickSoundRef.current.volume = 0.2;
    clickSoundRef.current.playbackRate = 1.5;

    hoverSoundRef.current = new Audio(uiSoundPath);
    hoverSoundRef.current.volume = 0.1;
    hoverSoundRef.current.playbackRate = 1.8;

    successSoundRef.current = new Audio(uiSoundPath);
    successSoundRef.current.volume = 0.3;
    successSoundRef.current.playbackRate = 0.9;

    errorSoundRef.current = new Audio(uiSoundPath);
    errorSoundRef.current.volume = 0.3;
    errorSoundRef.current.playbackRate = 0.7;

    // Limpiar al desmontar
    return () => {
      [introSoundRef, clickSoundRef, hoverSoundRef, successSoundRef, errorSoundRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.src = '';
        }
      });
    };
  }, []);

  // Función para guardar la preferencia de sonido
  useEffect(() => {
    localStorage.setItem('sound-muted', JSON.stringify(muted));
  }, [muted]);

  // Función para reproducir un sonido específico
  const playSound = (soundType: SoundType) => {
    if (muted) return;

    let sound: HTMLAudioElement | null = null;
    
    switch (soundType) {
      case 'intro':
        sound = introSoundRef.current;
        break;
      case 'click':
        sound = clickSoundRef.current;
        break;
      case 'hover':
        sound = hoverSoundRef.current;
        break;
      case 'success':
        sound = successSoundRef.current;
        break;
      case 'error':
        sound = errorSoundRef.current;
        break;
    }

    if (sound) {
      // Reiniciar el sonido para poder reproducirlo múltiples veces
      sound.currentTime = 0;
      sound.play().catch(err => {
        console.error("Error reproduciendo sonido:", err);
      });
    }
  };

  // Función para alternar el estado de silencio
  const toggleMute = () => {
    setMuted(prev => !prev);
  };

  return {
    playSound,
    muted,
    toggleMute
  };
}