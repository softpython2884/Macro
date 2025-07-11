
'use client';

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

interface GlareHoverProps {
  width?: string;
  height?: string;
  background?: string;
  borderRadius?: string;
  borderColor?: string;
  children?: React.ReactNode;
  glareColor?: string;
  glareOpacity?: number;
  glareAngle?: number;
  glareSize?: number;
  transitionDuration?: number;
  playOnce?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const GlareHover: React.FC<GlareHoverProps> = ({
  width = "100%",
  height = "100%",
  background = "transparent",
  borderRadius = "0",
  borderColor = "transparent",
  children,
  glareColor = "#ffffff",
  glareOpacity = 0.1,
  glareAngle = -45,
  glareSize = 500,
  transitionDuration = 650,
  playOnce = false,
  className = "",
  style = {},
}) => {
  const hex = glareColor.replace("#", "");
  let rgba = glareColor;
  if (/^[\dA-Fa-f]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  } else if (/^[\dA-Fa-f]{3}$/.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  }

  const overlayRef = useRef<HTMLDivElement | null>(null);

  const animateIn = () => {
    const el = overlayRef.current;
    if (!el) return;

    el.style.transition = "none";
    el.style.backgroundPosition = "-100% -100%";
    el.offsetHeight; // Trigger reflow
    el.style.transition = `${transitionDuration}ms ease-out`;
    el.style.backgroundPosition = "100% 100%";
  };

  const animateOut = () => {
    const el = overlayRef.current;
    if (!el) return;

    if (playOnce) {
      el.style.transition = "none";
      el.style.backgroundPosition = "-100% -100%";
    } else {
      el.style.transition = `${transitionDuration}ms ease-out`;
      el.style.backgroundPosition = "-100% -100%";
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: `linear-gradient(${glareAngle}deg,
        hsla(0,0%,0%,0) 40%,
        ${rgba} 50%,
        hsla(0,0%,0%,0) 60%)`,
    backgroundSize: `${glareSize}% 100%`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "-100% -100%",
    pointerEvents: "none",
    borderRadius: 'inherit'
  };

  return (
    <div
      className={cn("relative grid place-items-center overflow-hidden cursor-pointer", className)}
      style={{
        width,
        height,
        background,
        borderRadius,
        borderColor,
        ...style,
      }}
      onMouseEnter={animateIn}
      onMouseLeave={animateOut}
      onFocus={animateIn}
      onBlur={animateOut}
    >
      <div ref={overlayRef} style={overlayStyle} />
      {children}
    </div>
  );
};

    