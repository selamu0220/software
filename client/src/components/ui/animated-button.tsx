import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { cva } from "class-variance-authority";

type ButtonProps = React.ComponentProps<typeof Button> & {
  animation?: "pulse" | "bounce" | "grow" | "shake" | "none";
  soundEffect?: "click" | "hover" | "success" | "error" | "none";
  tooltip?: string;
  tooltipPosition?: "top" | "bottom" | "left" | "right";
  tooltipDelay?: number;
  tooltipClass?: string;
};

const animationVariants = {
  pulse: {
    initial: {},
    animate: {},
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 400, damping: 10 },
    hover: { scale: 1.05 },
    className: "transition-transform duration-200",
  },
  bounce: {
    initial: {},
    animate: {},
    whileTap: { y: 3 },
    transition: { type: "spring", stiffness: 400, damping: 10 },
    hover: { y: -3 },
    className: "transition-transform duration-200",
  },
  grow: {
    initial: {},
    animate: {},
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 300, damping: 10 },
    hover: { scale: 1.03 },
    className: "transition-transform duration-200",
  },
  shake: {
    initial: {},
    animate: {},
    whileTap: { x: [0, -5, 5, -5, 5, 0] },
    transition: { duration: 0.4 },
    hover: {},
    className: "transition-transform duration-200",
  },
  none: {
    initial: {},
    animate: {},
    whileTap: {},
    transition: {},
    hover: {},
    className: "",
  },
};

export const AnimatedButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(
  (
    {
      className,
      variant,
      size,
      animation = "pulse",
      soundEffect = "click",
      tooltip,
      tooltipPosition = "top",
      tooltipDelay = 700,
      tooltipClass,
      children,
      ...props
    },
    ref
  ) => {
    const { playSound } = useSoundEffects();
    const animationProps = animationVariants[animation];

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (soundEffect !== "none") {
        playSound(soundEffect);
      }
      props.onClick?.(e);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (soundEffect === "hover") {
        playSound("hover");
      }
      props.onMouseEnter?.(e);
    };

    const button = (
      <motion.div
        initial={animationProps.initial}
        animate={animationProps.animate}
        whileTap={animationProps.whileTap}
        whileHover={animationProps.hover}
        transition={animationProps.transition}
        className={cn(animationProps.className)}
      >
        <Button
          className={className}
          variant={variant}
          size={size}
          ref={ref}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    );

    if (tooltip) {
      return (
        <Tooltip delayDuration={tooltipDelay}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent
            side={tooltipPosition}
            className={tooltipClass}
          >
            {tooltip}
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  }
);

AnimatedButton.displayName = "AnimatedButton";