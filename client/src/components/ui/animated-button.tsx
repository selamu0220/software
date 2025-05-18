import React from 'react';
import { Button, ButtonProps } from "@/components/ui/button";
import { useSoundEffects } from '@/hooks/use-sound-effects';
import { motion } from 'framer-motion';

interface AnimatedButtonProps extends ButtonProps {
  soundEffect?: 'click' | 'success' | 'hover' | 'error' | 'intro';
  animation?: 'pulse' | 'bounce' | 'grow' | 'shake' | 'none';
  tooltip?: string;
}

export const AnimatedButton = ({
  children,
  soundEffect = 'click',
  animation = 'pulse',
  tooltip,
  ...props
}: AnimatedButtonProps) => {
  const { playSound } = useSoundEffects();

  // Configuración de las animaciones disponibles
  const animations = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: { duration: 0.3 }
    },
    bounce: {
      y: [0, -6, 0],
      transition: { duration: 0.4 }
    },
    grow: {
      scale: [1, 1.1],
      transition: { duration: 0.2 }
    },
    shake: {
      x: [0, -5, 5, -5, 0],
      transition: { duration: 0.4 }
    },
    none: {}
  };

  // Wrapper del botón
  const ButtonWrapper = animation !== 'none' ? motion.div : React.Fragment;

  // Props para el wrapper cuando es motion.div
  const wrapperProps = animation !== 'none' 
    ? { 
        whileHover: animations[animation],
        whileTap: { scale: 0.95 },
        className: "inline-block", // Para que la animación funcione correctamente
      } 
    : {};

  return (
    <ButtonWrapper {...wrapperProps}>
      <Button
        {...props}
        onClick={(e) => {
          playSound(soundEffect);
          if (props.onClick) {
            props.onClick(e);
          }
        }}
        onMouseEnter={() => {
          playSound('hover');
        }}
        title={tooltip}
      >
        {children}
      </Button>
    </ButtonWrapper>
  );
};