import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type AnimatedTextProps = {
  text: string;
  className?: string;
  effect?: "typewriter" | "fadeIn" | "slideUp" | "glitch" | "gradient" | "highlight" | "bounce" | "scramble" | "none";
  delay?: number;
  duration?: number;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  staggerChildren?: number;
  repeat?: boolean;
  color?: string;
  gradient?: {
    from: string;
    to: string;
    speed?: "slow" | "medium" | "fast";
  };
  trailColor?: string;
};

const effects = {
  typewriter: {
    container: {},
    character: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.05 }
    },
    classNames: {
      container: "relative font-mono",
      character: "inline-block"
    },
  },
  fadeIn: {
    container: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    character: {},
    classNames: {
      container: "",
      character: "inline-block"
    },
  },
  slideUp: {
    container: {},
    character: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -20, opacity: 0 },
    },
    classNames: {
      container: "",
      character: "inline-block"
    },
  },
  glitch: {
    container: {},
    character: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    classNames: {
      container: "relative",
      character: "inline-block hover:animate-glitch"
    },
  },
  gradient: {
    container: {},
    character: {},
    classNames: {
      container: "relative bg-clip-text text-transparent",
      character: "inline-block"
    },
  },
  highlight: {
    container: {},
    character: {
      initial: { backgroundColor: "rgba(var(--primary), 0)" },
      animate: { backgroundColor: "rgba(var(--primary), 0.2)" },
      exit: { backgroundColor: "rgba(var(--primary), 0)" },
    },
    classNames: {
      container: "",
      character: "inline-block"
    },
  },
  bounce: {
    container: {},
    character: {
      initial: { y: 0 },
      animate: { y: [0, -10, 0] },
    },
    classNames: {
      container: "",
      character: "inline-block"
    },
  },
  scramble: {
    container: {},
    character: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    classNames: {
      container: "",
      character: "inline-block"
    },
  },
  none: {
    container: {},
    character: {},
    classNames: {
      container: "",
      character: "inline-block"
    },
  },
};

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className,
  effect = "none",
  delay = 0,
  duration = 1,
  tag = "p",
  staggerChildren = 0.02,
  repeat = false,
  color,
  gradient,
  trailColor,
}) => {
  const chosenEffect = effects[effect];
  const chars = text.split("");
  
  // Custom styles based on effects
  const getGradientStyle = () => {
    if (effect === "gradient" && gradient) {
      const speedMap = {
        slow: "10s",
        medium: "5s",
        fast: "2s"
      };
      const animationDuration = speedMap[gradient.speed || "medium"];
      
      return {
        backgroundImage: `linear-gradient(to right, ${gradient.from}, ${gradient.to}, ${gradient.from})`,
        backgroundSize: "200% auto",
        animation: `gradient-x ${animationDuration} linear infinite`,
      };
    }
    return {};
  };
  
  // For scramble effect
  const [displayText, setDisplayText] = React.useState(text);
  const scrambleTimer = React.useRef<ReturnType<typeof setTimeout>>();
  
  React.useEffect(() => {
    if (effect === "scramble") {
      const originalText = text;
      let iterations = 0;
      const maxIterations = 10;
      
      const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
      
      const scrambleText = () => {
        if (iterations > maxIterations) {
          setDisplayText(originalText);
          return;
        }
        
        iterations++;
        
        // Create a partially scrambled text
        const progress = iterations / maxIterations;
        const newText = originalText.split("").map((char, idx) => {
          // More characters become "unscrambled" as iterations progress
          if (Math.random() < progress || char === " ") {
            return char;
          }
          return randomChars[Math.floor(Math.random() * randomChars.length)];
        }).join("");
        
        setDisplayText(newText);
        scrambleTimer.current = setTimeout(scrambleText, 50);
      };
      
      setTimeout(() => scrambleText(), delay * 1000);
      
      return () => {
        if (scrambleTimer.current) clearTimeout(scrambleTimer.current);
      };
    }
  }, [text, effect, delay]);
  
  // Create a variant for staggered animations
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { 
        staggerChildren, 
        delayChildren: delay, 
        duration,
        ...(repeat && { 
          repeat: Infinity, 
          repeatType: "reverse" as const,
          repeatDelay: 2,
        })
      },
    }),
  };
  
  const renderText = () => {
    // For effects that don't animate individual characters
    if (effect === "fadeIn") {
      return (
        <motion.span
          initial="initial"
          animate="animate"
          exit="exit"
          variants={chosenEffect.container}
          transition={{ duration, delay }}
          style={{ color }}
          className={cn(chosenEffect.classNames.container, className)}
        >
          {text}
        </motion.span>
      );
    }
    
    // For scramble effect
    if (effect === "scramble") {
      return displayText;
    }
    
    // For gradient and typewriter effects
    if (effect === "gradient") {
      return (
        <motion.span
          style={{
            ...getGradientStyle(),
            color
          }}
          className={cn(chosenEffect.classNames.container, className)}
        >
          {chars.map((char, i) => (
            <motion.span
              key={`${char}-${i}`}
              className={chosenEffect.classNames.character}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.span>
      );
    }
    
    // For typewriter effect
    if (effect === "typewriter") {
      return (
        <motion.span
          className={cn(chosenEffect.classNames.container, className)}
          style={{ color }}
        >
          <motion.span
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ 
              duration: duration * 1.5, 
              delay, 
              ease: "easeInOut",
              ...(repeat && { 
                repeat: Infinity, 
                repeatType: "reverse" as const,
                repeatDelay: 1,
              })
            }}
            className="absolute bottom-0 left-0 h-[2px] bg-primary"
            style={{ backgroundColor: trailColor }}
          />
          {chars.map((char, i) => (
            <motion.span
              key={`${char}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ 
                duration: 0.05, 
                delay: delay + (i * staggerChildren),
                ...(repeat && { 
                  repeat: Infinity, 
                  repeatType: "reverse" as const,
                  repeatDelay: 2,
                })
              }}
              className={chosenEffect.classNames.character}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.span>
      );
    }
    
    // For effects that animate each character individually
    return (
      <motion.span
        variants={container}
        initial="hidden"
        animate="visible"
        className={cn(chosenEffect.classNames.container, className)}
        style={{ color, ...getGradientStyle() }}
      >
        {chars.map((char, i) => (
          <motion.span
            key={`${char}-${i}`}
            variants={chosenEffect.character}
            className={chosenEffect.classNames.character}
            style={effect === "highlight" ? { display: "inline-block", padding: "0 2px" } : {}}
            transition={{ 
              duration: effect === "bounce" ? 0.5 : 0.2, 
              ...(effect === "bounce" && { 
                repeat: Infinity, 
                repeatType: "reverse" as const,
                repeatDelay: 5,
              })
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.span>
    );
  };
  
  const Component = tag as keyof JSX.IntrinsicElements;
  
  return <Component className={className}>{renderText()}</Component>;
};

export default AnimatedText;