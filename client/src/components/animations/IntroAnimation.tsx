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
  logoPath = "/images/logo.png", 
  showTagline = true 
}: IntroAnimationProps) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const { playSound } = useSoundEffects();
  
  useEffect(() => {
    // Reproducir sonido de intro cuando el componente se monta
    playSound('intro');
    
    // Configurar un temporizador para la animación completa
    const timer = setTimeout(() => {
      setAnimationComplete(true);
      onComplete?.();
    }, 3000); // La animación dura 3 segundos
    
    return () => clearTimeout(timer);
  }, [onComplete, playSound]);

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50"
      initial={{ opacity: 1 }}
      animate={animationComplete ? { opacity: 0, display: 'none' } : { opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <motion.div
        className="flex flex-col items-center space-y-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.img
          src={logoPath}
          alt="Red Creativa Pro"
          className="w-40 h-40 object-contain"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ 
            duration: 0.8, 
            ease: 'easeOut',
            delay: 0.3
          }}
        />
        
        {showTagline && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">
              Red Creativa Pro
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Potencia tu creatividad con inteligencia artificial
            </p>
          </motion.div>
        )}
      </motion.div>
      
      <motion.div
        className="absolute bottom-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <p className="text-sm text-muted-foreground">Cargando experiencia creativa...</p>
        <motion.div 
          className="h-1 bg-primary rounded-full mt-2"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ 
            duration: 2.5,
            ease: 'easeInOut',
            delay: 0.2
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default IntroAnimation;