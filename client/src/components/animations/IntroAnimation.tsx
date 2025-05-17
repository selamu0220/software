import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Usar una importación estática para el logo
import { useLocalStorage } from '@/hooks/use-local-storage';

interface IntroAnimationProps {
  onComplete?: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [showAnimation, setShowAnimation] = useState(true);
  const [hasSeenIntro, setHasSeenIntro] = useLocalStorage('hasSeenIntro', false);
  const [step, setStep] = useState(0);
  
  // Si el usuario ya ha visto la intro, no la mostramos
  useEffect(() => {
    if (hasSeenIntro) {
      setShowAnimation(false);
      if (onComplete) onComplete();
    }
  }, [hasSeenIntro, onComplete]);
  
  // Control de la animación por pasos
  useEffect(() => {
    if (!showAnimation) return;
    
    const steps = [
      { delay: 500 },  // Logo aparece
      { delay: 1500 }, // Primer texto aparece
      { delay: 1500 }, // Segundo texto aparece
      { delay: 1500 }  // Desaparece todo
    ];
    
    if (step < steps.length - 1) {
      const timer = setTimeout(() => {
        setStep(prev => prev + 1);
      }, steps[step].delay);
      
      return () => clearTimeout(timer);
    } else {
      // Último paso: ocultar animación y marcar como vista
      const timer = setTimeout(() => {
        setHasSeenIntro(true);
        setShowAnimation(false);
        if (onComplete) onComplete();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [step, showAnimation, onComplete, setHasSeenIntro]);
  
  if (!showAnimation) return null;
  
  return (
    <AnimatePresence>
      {showAnimation && (
        <motion.div 
          className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo - Usar un SVG inline para mejor control */}
            <motion.div
              className="w-64 h-64 flex items-center justify-center mb-8 text-primary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M60 10C32.4 10 10 32.4 10 60C10 87.6 32.4 110 60 110C87.6 110 110 87.6 110 60C110 32.4 87.6 10 60 10ZM60 100C37.9 100 20 82.1 20 60C20 37.9 37.9 20 60 20C82.1 20 100 37.9 100 60C100 82.1 82.1 100 60 100Z" fill="currentColor"/>
                <path d="M40 40L80 80" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
                <path d="M40 80L80 40" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
                <circle cx="60" cy="60" r="15" fill="currentColor"/>
              </svg>
            </motion.div>
            
            {/* Línea Animada */}
            <motion.div 
              className="h-0.5 bg-primary w-0"
              animate={{ width: step >= 1 ? "200px" : 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            />
            
            {/* Texto Superior */}
            {step >= 1 && (
              <motion.h1 
                className="text-3xl md:text-4xl font-bold mt-8 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Red Creativa Pro
              </motion.h1>
            )}
            
            {/* Eslogan */}
            {step >= 2 && (
              <motion.p 
                className="text-lg md:text-xl text-gray-300 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                Potencia tu creación de contenido
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroAnimation;