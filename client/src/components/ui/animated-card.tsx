import { useState, HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { useSoundEffects } from '@/hooks/use-sound-effects';

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  hoverEffect?: 'lift' | 'glow' | 'scale' | 'tilt' | 'none';
  clickEffect?: boolean;
  delayed?: boolean;
  index?: number;
  children?: React.ReactNode;
}

export const AnimatedCard = ({
  children,
  hoverEffect = 'lift',
  clickEffect = true,
  delayed = false,
  index = 0,
  className,
  ...props
}: AnimatedCardProps) => {
  const { playSound } = useSoundEffects();
  const [isHovered, setIsHovered] = useState(false);

  // Definir efectos de hover
  const hoverVariants = {
    lift: {
      y: -10,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
    },
    glow: {
      boxShadow: "0 0 15px 2px rgba(130, 87, 230, 0.5)"
    },
    scale: {
      scale: 1.05
    },
    tilt: {
      rotateY: 5,
      rotateX: -5
    },
    none: {}
  };

  // Agregar un retraso basado en el índice para crear un efecto de cascada
  const delayFactor = delayed ? index * 0.1 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: delayFactor,
        type: "spring", 
        stiffness: 100 
      }}
      whileHover={hoverEffect !== 'none' ? hoverVariants[hoverEffect] : undefined}
      whileTap={clickEffect ? { scale: 0.97 } : undefined}
      onMouseEnter={() => {
        setIsHovered(true);
        playSound('hover');
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
      onClick={() => clickEffect && playSound('click')}
      className="transition-all duration-300"
    >
      <Card 
        className={`${className || ''} ${isHovered ? 'border-primary/50' : ''}`} 
        {...props}
      >
        {children}
      </Card>
    </motion.div>
  );
};