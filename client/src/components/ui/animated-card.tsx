import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useSoundEffects } from "@/hooks/use-sound-effects";

type AnimatedCardProps = React.ComponentProps<typeof Card> & {
  hoverEffect?: "lift" | "glow" | "scale" | "tilt" | "neon" | "shine" | "pulse" | "borderglow" | "none";
  soundEffect?: "hover" | "click" | "none";
  index?: number;
  delayed?: boolean;
  glowColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  intensity?: "low" | "medium" | "high";
};

const cardEffects = {
  lift: {
    hoverStyles: "transition-all duration-300 hover:-translate-y-2 hover:shadow-xl",
    motionProps: {
      whileHover: { y: -12, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.2)" },
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
    hoverStyles: "transition-all duration-300 hover:scale-[1.03] origin-bottom hover:shadow-xl",
    motionProps: {
      whileHover: { scale: 1.03, originY: 1, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.2)" },
      transition: { type: "spring", stiffness: 300, damping: 15 }
    }
  },
  tilt: {
    hoverStyles: "transition-all duration-300 hover:shadow-xl perspective-1000",
    motionProps: {
      whileHover: { rotateX: -5, rotateY: 5, boxShadow: "0 20px 40px -5px rgba(0, 0, 0, 0.2)" },
      transition: { type: "spring", stiffness: 400, damping: 17 }
    }
  },
  neon: {
    hoverStyles: "transition-all duration-300 relative before:absolute before:inset-0 before:z-[-1] before:rounded-lg before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
    motionProps: {
      whileHover: { scale: 1.02 },
      transition: { type: "spring", stiffness: 400, damping: 17 }
    }
  },
  shine: {
    hoverStyles: "transition-all duration-300 overflow-hidden relative before:absolute before:inset-0 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
    motionProps: {
      whileHover: {},
      transition: { type: "spring", stiffness: 400, damping: 17 }
    }
  },
  pulse: {
    hoverStyles: "transition-all duration-300",
    motionProps: {
      whileHover: { scale: [1, 1.02, 1] },
      transition: { 
        repeat: Infinity, 
        repeatType: "reverse", 
        duration: 1.5,
        ease: "easeInOut"
      }
    }
  },
  borderglow: {
    hoverStyles: "transition-all duration-300 relative before:absolute before:inset-0 before:rounded-lg before:p-[2px] before:bg-gradient-to-r before:from-primary/0 before:via-primary/70 before:to-primary/0 before:z-[-1] hover:before:animate-gradient-x",
    motionProps: {
      whileHover: {},
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
      glowColor = "rgba(var(--primary), 0.3)",
      gradientFrom = "rgba(var(--primary), 0.1)",
      gradientTo = "rgba(var(--primary), 0.4)",
      intensity = "medium",
      ...props
    },
    ref
  ) => {
    const { playSound } = useSoundEffects();
    const effect = cardEffects[hoverEffect];
    
    // For 3D tilt effect with mouse tracking
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    
    // For spotlight/glow effect
    const mouseXGlow = useMotionValue(0);
    const mouseYGlow = useMotionValue(0);
    
    // Intensity multipliers
    const intensityMap = {
      low: 0.5,
      medium: 1,
      high: 1.5
    };
    const intensityFactor = intensityMap[intensity];
    
    // Spotlight/glow effect that follows cursor
    const glowRadius = useMotionTemplate`
      radial-gradient(
        ${200 * intensityFactor}px circle at ${mouseXGlow}px ${mouseYGlow}px,
        ${glowColor},
        transparent 70%
      )
    `;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hoverEffect === "tilt") {
        const rect = e.currentTarget.getBoundingClientRect();
        
        // Calculate center point of the card
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate distance from center (-1 to 1)
        const percentX = (e.clientX - centerX) / (rect.width / 2);
        const percentY = (e.clientY - centerY) / (rect.height / 2);
        
        // Apply rotation based on mouse position (with intensity factor)
        rotateX.set(-percentY * 7 * intensityFactor); 
        rotateY.set(percentX * 7 * intensityFactor);
        
        // For smoother animation
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }
      
      // For spotlight/glow effect
      if (hoverEffect === "neon" || hoverEffect === "glow") {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseXGlow.set(e.clientX - rect.left);
        mouseYGlow.set(e.clientY - rect.top);
      }
      
      props.onMouseMove?.(e);
    };
    
    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hoverEffect === "tilt") {
        // Reset rotations with spring animation
        rotateX.set(0);
        rotateY.set(0);
      }
      
      props.onMouseLeave?.(e);
    };

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
    
    // Extra styling based on specific effects
    const getNeonStyle = () => {
      if (hoverEffect === "neon") {
        return {
          boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`,
          background: useMotionTemplate`${glowRadius}`,
        };
      }
      if (hoverEffect === "glow") {
        return {
          background: useMotionTemplate`${glowRadius}`,
        };
      }
      if (hoverEffect === "borderglow") {
        return {
          boxShadow: `0 0 10px ${glowColor}`,
        };
      }
      return {};
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
        style={{
          ...(hoverEffect === "tilt" ? { rotateX, rotateY, transformPerspective: "1000px" } : {}),
          ...(hoverEffect === "neon" || hoverEffect === "glow" ? getNeonStyle() : {}),
        }}
        {...effect.motionProps}
        className={cn(effect.hoverStyles)}
      >
        <Card
          className={cn(
            "relative transform transition-all",
            hoverEffect === "shine" && "overflow-hidden",
            className
          )}
          ref={ref}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          {...props}
        >
          {hoverEffect === "glow" && (
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
              style={{ 
                background: `radial-gradient(circle at 50% 50%, ${gradientFrom}, ${gradientTo}, transparent 70%)` 
              }}
            />
          )}
          {children}
        </Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";