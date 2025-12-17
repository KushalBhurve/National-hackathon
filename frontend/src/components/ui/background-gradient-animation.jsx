import { cn } from "../../lib/utils";
import { useEffect, useRef, useState } from "react";

export const BackgroundGradientAnimation = ({
  gradientBackgroundStart = "rgb(16, 25, 34)",
  gradientBackgroundEnd = "rgb(10, 15, 20)",
  primaryBlue = "19, 127, 236", // #137fec
  secondaryBlue = "30, 58, 138", // Deep Navy
  size = "80%",
  blendingValue = "hard-light",
  children,
  className,
  interactive = true,
  containerClassName
}) => {
  const containerRef = useRef(null);
  const interactiveRef = useRef(null);
  const [curX, setCurX] = useState(0);
  const [curY, setCurY] = useState(0);
  const [tgX, setTgX] = useState(0);
  const [tgY, setTgY] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--gradient-background-start", gradientBackgroundStart);
    root.style.setProperty("--gradient-background-end", gradientBackgroundEnd);
    root.style.setProperty("--first-color", `rgba(${primaryBlue}, 0.5)`);
    root.style.setProperty("--second-color", `rgba(${secondaryBlue}, 0.3)`);
    root.style.setProperty("--pointer-color", `rgba(${primaryBlue}, 0.4)`);
    root.style.setProperty("--size", size);
    root.style.setProperty("--blending-value", blendingValue);
  }, [gradientBackgroundStart, gradientBackgroundEnd, primaryBlue, secondaryBlue, size, blendingValue]);

  useEffect(() => {
    let animationFrameId;
    const move = () => {
      if (interactiveRef.current) {
        setCurX((prevX) => prevX + (tgX - prevX) / 20);
        setCurY((prevY) => prevY + (tgY - prevY) / 20);
        interactiveRef.current.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
      }
      animationFrameId = requestAnimationFrame(move);
    };
    move();
    return () => cancelAnimationFrame(animationFrameId);
  }, [tgX, tgY, curX, curY]);

  const handleMouseMove = (event) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTgX(event.clientX - rect.left);
      setTgY(event.clientY - rect.top);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn("relative overflow-hidden bg-[var(--gradient-background-start)]", containerClassName)}
      style={{ background: `linear-gradient(40deg, var(--gradient-background-start), var(--gradient-background-end))` }}
    >
      <style>{`
        @keyframes moveVertical { 0% { transform: translateY(-30%); } 50% { transform: translateY(30%); } 100% { transform: translateY(-30%); } }
        @keyframes moveInCircle { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-blob-1 { animation: moveVertical 25s ease infinite; }
        .animate-blob-2 { animation: moveInCircle 35s reverse infinite; }
      `}</style>
      
      <div className={cn("relative z-20 pointer-events-none", className)}>
        <div className="pointer-events-auto">{children}</div>
      </div>
      
      {/* Reduced blobs to eliminate purple color bleed */}
      <div className="gradients-container h-full w-full absolute inset-0 [filter:blur(60px)_brightness(1.1)] opacity-40 z-10">
        <div className="animate-blob-1 absolute [background:radial-gradient(circle_at_center,_var(--first-color)_0,_transparent_50%)_no-repeat] [mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]"></div>
        <div className="animate-blob-2 absolute [background:radial-gradient(circle_at_center,_var(--second-color)_0,_transparent_50%)_no-repeat] [mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)] [transform-origin:calc(50%-200px)]"></div>

        {interactive && (
          <div
            ref={interactiveRef}
            className="absolute [background:radial-gradient(circle_at_center,_var(--pointer-color)_0,_transparent_50%)_no-repeat] [mix-blend-mode:var(--blending-value)] w-[500px] h-[500px] -top-[250px] -left-[250px] opacity-60 pointer-events-none"
          ></div>
        )}
      </div>
    </div>
  );
};