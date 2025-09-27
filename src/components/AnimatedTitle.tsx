import { useEffect, useState } from "react";

interface Fragment {
  id: number;
  char: string;
  x: number;
  y: number;
  rotation: number;
}

export const AnimatedTitle = () => {
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [assembled, setAssembled] = useState(false);
  const title = "КЛИЕНТЫ";

  useEffect(() => {
    // Create fragments with random positions
    const newFragments = title.split("").map((char, index) => ({
      id: index,
      char,
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400,
      rotation: Math.random() * 720 - 360,
    }));
    setFragments(newFragments);

    // Trigger assembly animation
    setTimeout(() => {
      setAssembled(true);
    }, 500);
  }, []);

  return (
    <div className="relative h-40 flex items-center justify-center perspective-1000">
      <h1 className="text-6xl md:text-8xl font-bold tracking-widest">
        {fragments.map((fragment) => (
          <span
            key={fragment.id}
            className={`inline-block transition-all duration-1500 ${
              assembled ? "animate-float" : ""
            }`}
            style={{
              transform: assembled
                ? "translate(0, 0) rotate(0deg) scale(1)"
                : `translate(${fragment.x}px, ${fragment.y}px) rotate(${fragment.rotation}deg) scale(0.3)`,
              opacity: assembled ? 1 : 0,
              transitionDelay: `${fragment.id * 100}ms`,
              textShadow: "0 0 40px hsl(271 91% 65% / 0.8)",
              WebkitTextStroke: "2px hsl(271 91% 65%)",
              WebkitTextFillColor: "transparent",
              letterSpacing: "0.1em",
            }}
          >
            {fragment.char}
          </span>
        ))}
      </h1>
    </div>
  );
};