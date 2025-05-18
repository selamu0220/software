import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSoundEffects } from "@/hooks/use-sound-effects";

type AnimatedCardProps = React.ComponentProps<typeof Card> & {
  hoverEffect?: "lift" | "glow" | "scale" | "tilt" | "none";
  soundEffect?: "hover" | "click" | "none";
  index?: number;
  delayed?: boolean;
};

const cardEffects = {
  lift: {
    hoverStyles: "transition-all duration-300 hover:-translate-y-2",
    motionProps: {
      whileHover: { y: -8 },
      transition: { type: "spring", stiffness: 400, damping: 17 }
    }
  },
  glow: {
    hoverStyles: "transition-all duration-300 hover:shadow-lg hover:shadow-primary/20",
    motionProps: {
      whileHover: { boxShadow: "0 10px 25px -5px rgba(var(--primary), 0.3)" },
      transition: { type: "spring", stiffness: 400, damping: 17 }
    }
  },
  scale: {
    hoverStyles: "transition-all duration-300 hover:scale-[1.02] origin-bottom",
    motionProps: {
      whileHover: { scale: 1.02, originY: 1 },
      transition: { type: "spring", stiffness: 300, damping: 15 }
    }
  },
  tilt: {
    hoverStyles: "transition-all duration-300",
    motionProps: {
      whileHover: { rotateX: 5, rotateY: 5 },
      transition: { type: "spring", stiffness: 400, damping: 17 }
    }
  },
  none: {
    hoverStyles: "",
    motionProps: {}
  }
};

export const AnimatedCard = React.forwardRef<
  HTMLDivElement,
  AnimatedCardProps
>(
  (
    {
      className,
      hoverEffect = "none",
      soundEffect = "none",
      children,
      index = 0,
      delayed = false,
      ...props
    },
    ref
  ) => {
    const { playSound } = useSoundEffects();
    const effect = cardEffects[hoverEffect];

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      if (soundEffect === "hover") {
        playSound("hover");
      }
      props.onMouseEnter?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (soundEffect === "click") {
        playSound("click");
      }
      props.onClick?.(e);
    };

    return (
      <motion.div
        initial={delayed ? { opacity: 0, y: 20 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.3, 
          delay: delayed ? index * 0.1 : 0,
          ease: "easeOut" 
        }}
        {...effect.motionProps}
        className={cn(effect.hoverStyles)}
      >
        <Card
          className={cn(
            "relative transform transition-all",
            className
          )}
          ref={ref}
          onMouseEnter={handleMouseEnter}
          onClick={handleClick}
          {...props}
        >
          {children}
        </Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";