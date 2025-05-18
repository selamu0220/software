import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSoundEffects } from '@/hooks/use-sound-effects';

interface IntroAnimationProps {
  onComplete?: () => void;
  logoPath?: string;
  showTagline?: boolean;
}

const IntroAnimation = ({ 
  onComplete, 
  logoPath = '/assets/logo.svg', 
  showTagline = true 
}: IntroAnimationProps) => {
  const { playSound } = useSoundEffects();
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Iniciar sonido de intro cuando el componente se carga
  useEffect(() => {
    playSound('intro');
  }, [playSound]);
  
  // Callback cuando la animación se completa
  const handleAnimationComplete = () => {
    setAnimationComplete(true);
    if (onComplete) {
      setTimeout(() => {
        onComplete();
      }, 500); // pequeño retraso antes de llamar a onComplete
    }
  };
  
  // Variantes de animación para el logo
  const logoVariants = {
    hidden: { scale: 0.3, opacity: 0, y: 50 },
    visible: { 
      scale: 1,
      opacity: 1,
      y: 0,
      transition: { 
        type: "spring",
        damping: 15,
        stiffness: 100,
        delay: 0.2,
        duration: 1.2
      }
    },
    exit: {
      scale: 1.2,
      opacity: 0,
      transition: { duration: 0.5 }
    }
  };
  
  // Variantes para el texto
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1,
      y: 0,
      transition: { 
        delay: 1.2,
        duration: 0.8,
        ease: "easeOut" 
      } 
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };
  
  // Variantes para el fondo
  const backgroundVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.8, delay: 0.3 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={backgroundVariants}
      onAnimationComplete={handleAnimationComplete}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
    >
      <motion.div 
        variants={logoVariants}
        className="relative w-72 h-72 mb-8 flex items-center justify-center"
      >
        {/* Logo principal */}
        <img src={logoPath} alt="Red Creativa Pro" className="w-full h-full object-contain" />
        
        {/* Elementos decorativos animados alrededor del logo */}
        <motion.div 
          className="absolute inset-0"
          animate={{ 
            rotate: 360,
            transition: { repeat: Infinity, duration: 20, ease: "linear" }
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute top-1/3 right-0 w-1 h-1 bg-purple-400 rounded-full" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-500 rounded-full" />
          <div className="absolute top-1/2 left-0 w-2 h-2 bg-blue-400 rounded-full" />
        </motion.div>
      </motion.div>
      
      {showTagline && (
        <motion.div variants={textVariants} className="text-center">
          <h1 className="text-3xl font-bold text-white">Red Creativa Pro</h1>
          <p className="text-lg text-gray-300 mt-2">Tu asistente IA para creación de contenido</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default IntroAnimation;