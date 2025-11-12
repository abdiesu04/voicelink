import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { Mic } from 'lucide-react';

// Professional Microphone Animation Component
// Showcases real-time voice translation with elegant visual effects

// Professional Microphone Display with 3D effects
function ProfessionalMicrophone() {
  const micRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!micRef.current) return;

    // Create timeline for smooth, continuous animations
    const tl = gsap.timeline({ repeat: -1 });

    // Gentle breathing pulse effect
    tl.to(micRef.current, {
      scale: 1.05,
      duration: 2,
      ease: 'sine.inOut',
    })
    .to(micRef.current, {
      scale: 1,
      duration: 2,
      ease: 'sine.inOut',
    });

    // Color morphing effect
    gsap.to(micRef.current, {
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #3b82f6 100%)',
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // Animate orbiting particles
    particlesRef.current.forEach((particle, index) => {
      if (particle) {
        gsap.to(particle, {
          rotation: 360,
          duration: 4 + index,
          repeat: -1,
          ease: 'none',
          transformOrigin: 'center center',
        });
      }
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-indigo-400/20 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute w-56 h-56 md:w-72 md:h-72 rounded-full border-2 border-violet-400/30 animate-ping" style={{ animationDuration: '2.5s' }} />
        <div className="absolute w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-blue-400/40 animate-ping" style={{ animationDuration: '2s' }} />
      </div>

      {/* Main microphone container */}
      <div
        ref={micRef}
        className="relative w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-3xl flex items-center justify-center shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #3b82f6)',
          transform: 'perspective(1000px) rotateX(5deg) rotateY(-5deg)',
          boxShadow: '0 25px 60px rgba(99, 102, 241, 0.5), 0 0 100px rgba(139, 92, 246, 0.3)',
        }}
        data-testid="hero-microphone"
      >
        {/* Orbiting particles */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            ref={(el) => (particlesRef.current[i] = el)}
            className="absolute w-3 h-3 md:w-4 md:h-4 rounded-full bg-white/80 shadow-lg"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 60}deg) translateY(-${80 + i * 5}px)`,
            }}
          />
        ))}

        {/* Central microphone icon */}
        <div className="relative z-10">
          <Mic className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 text-white drop-shadow-2xl" strokeWidth={1.5} />
        </div>

        {/* Inner glow effect */}
        <div className="absolute inset-8 md:inset-12 rounded-full bg-white/10 backdrop-blur-sm" />
      </div>

      {/* Floating accent elements */}
      <div className="absolute top-1/4 -left-8 md:-left-12 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 backdrop-blur-sm animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-1/4 -right-8 md:-right-12 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 backdrop-blur-sm animate-float" style={{ animationDelay: '1s' }} />
    </div>
  );
}

// Static fallback for reduced motion
function StaticFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center" data-testid="hero-static-fallback">
      <div
        className="relative w-48 h-48 md:w-64 md:h-64 rounded-3xl flex items-center justify-center shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #3b82f6)',
          boxShadow: '0 25px 60px rgba(99, 102, 241, 0.4)',
        }}
      >
        <Mic className="w-24 h-24 md:w-32 md:h-32 text-white" strokeWidth={1.5} />
      </div>
    </div>
  );
}

// Main export with motion preference detection
export default function HeroScene3D() {
  const [useStatic, setUseStatic] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setUseStatic(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setUseStatic(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (useStatic) {
    return <StaticFallback />;
  }

  return (
    <div className="w-full h-full flex items-center justify-center perspective-[2000px]" data-testid="hero-3d-scene">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}} />

      <div className="relative w-full max-w-lg md:max-w-xl px-4 py-8">
        <ProfessionalMicrophone />
      </div>
    </div>
  );
}
