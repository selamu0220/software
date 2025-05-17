import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoPath from '@assets/logo de red creativa.png';

interface IntroAnimationProps {
  onComplete?: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [showAnimation, setShowAnimation] = useState(true);
  const [step, setStep] = useState(0);
  
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
      // Último paso: ocultar animación
      const timer = setTimeout(() => {
        setShowAnimation(false);
        if (onComplete) onComplete();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [step, showAnimation, onComplete]);
  
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
            {/* Logo */}
            <motion.img 
              src={logoPath} 
              alt="Red Creativa Pro Logo" 
              className="w-64 h-auto mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            />
            
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