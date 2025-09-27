import { useEffect, useRef } from "react";

export const ThreeDShapes = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shapesRef = useRef<NodeListOf<HTMLElement> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    shapesRef.current = container.querySelectorAll('.shape-3d');

    const handleMouseMove = (e: MouseEvent) => {
      if (!shapesRef.current) return;
      
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const moveX = (clientX - centerX) / centerX;
      const moveY = (clientY - centerY) / centerY;

      shapesRef.current.forEach((shape, index) => {
        const speed = (index + 1) * 0.5;
        const rotateX = moveY * 30 * speed;
        const rotateY = moveX * 30 * speed;
        const translateZ = Math.abs(moveX) * 50 + Math.abs(moveY) * 50;
        
        shape.style.transform = `
          rotateX(${rotateX}deg) 
          rotateY(${rotateY}deg) 
          translateZ(${translateZ}px)
        `;
      });
    };

    const handleScroll = () => {
      if (!shapesRef.current) return;
      
      const scrollY = window.scrollY;
      shapesRef.current.forEach((shape, index) => {
        const rotation = scrollY * 0.5 * (index + 1);
        shape.style.transform = `
          rotateX(${rotation}deg) 
          rotateY(${rotation * 1.5}deg) 
          rotateZ(${rotation * 0.5}deg)
        `;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Cosmic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
      
      {/* 3D Shapes */}
      <div className="shape-3d absolute top-20 left-20 w-32 h-32 preserve-3d transition-transform duration-300 ease-out">
        <div className="absolute inset-0 glass rounded-lg border border-primary/20 shadow-[0_0_40px_hsl(271_91%_65%/0.3)]" />
      </div>
      
      <div className="shape-3d absolute top-40 right-32 w-24 h-48 preserve-3d transition-transform duration-300 ease-out">
        <div className="absolute inset-0 glass rounded-lg border border-accent/20 shadow-[0_0_40px_hsl(300_100%_60%/0.3)]" />
      </div>
      
      <div className="shape-3d absolute bottom-32 left-1/4 w-40 h-16 preserve-3d transition-transform duration-300 ease-out">
        <div className="absolute inset-0 glass rounded-lg border border-secondary/20 shadow-[0_0_40px_hsl(280_100%_70%/0.3)]" />
      </div>
      
      <div className="shape-3d absolute top-1/2 right-20 w-20 h-20 preserve-3d transition-transform duration-300 ease-out">
        <div className="absolute inset-0 glass rounded-lg border border-primary/20 shadow-[0_0_40px_hsl(271_91%_65%/0.3)]" />
      </div>
      
      <div className="shape-3d absolute bottom-20 right-1/3 w-36 h-24 preserve-3d transition-transform duration-300 ease-out">
        <div className="absolute inset-0 glass rounded-lg border border-accent/20 shadow-[0_0_40px_hsl(300_100%_60%/0.3)]" />
      </div>
      
      {/* Floating particles */}
      <div className="absolute top-1/3 left-1/2 w-2 h-2 rounded-full bg-primary animate-float" 
           style={{ animationDelay: '0s' }} />
      <div className="absolute top-2/3 left-1/3 w-3 h-3 rounded-full bg-accent animate-float" 
           style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-secondary animate-float" 
           style={{ animationDelay: '4s' }} />
    </div>
  );
};