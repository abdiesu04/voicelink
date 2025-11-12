import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { Mic } from 'lucide-react';

// Professional Microphone Animation Component
// Showcases real-time voice translation with elegant visual effects

// Professional Microphone Display with 3D effects
function ProfessionalMicrophone() {
  const micRef = useRef<HTMLDivElement>(null);
  const waveRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!micRef.current) return;

    // Create timeline for smooth, continuous animations
    const tl = gsap.timeline({ repeat: -1 });

    // Gentle breathing pulse effect
    tl.to(micRef.current, {
      scale: 1.08,
      duration: 2.5,
      ease: 'sine.inOut',
    })
    .to(micRef.current, {
      scale: 1,
      duration: 2.5,
      ease: 'sine.inOut',
    });

    // Animate sound waves
    waveRefs.current.forEach((wave, index) => {
      if (wave) {
        gsap.fromTo(wave, 
          {
            scale: 0.5,
            opacity: 0.8,
          },
          {
            scale: 1.5,
            opacity: 0,
            duration: 2,
            repeat: -1,
            delay: index * 0.5,
            ease: 'power1.out',
          }
        );
      }
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings - oval shaped */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-72 h-80 md:w-96 md:h-[28rem] rounded-full border-2 border-indigo-400/20 animate-ping" style={{ animationDuration: '3s', borderRadius: '50%' }} />
        <div className="absolute w-64 h-72 md:w-80 md:h-96 rounded-full border-2 border-indigo-300/30 animate-ping" style={{ animationDuration: '2.5s', borderRadius: '50%' }} />
        <div className="absolute w-56 h-64 md:w-72 md:h-80 rounded-full border-2 border-indigo-400/40 animate-ping" style={{ animationDuration: '2s', borderRadius: '50%' }} />
      </div>

      {/* Main microphone container - OVAL shape */}
      <div
        ref={micRef}
        className="relative flex items-center justify-center shadow-2xl overflow-hidden"
        style={{
          width: '180px',
          height: '220px',
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
          transform: 'perspective(1000px) rotateX(5deg)',
          boxShadow: '0 30px 80px rgba(99, 102, 241, 0.6), 0 0 120px rgba(79, 70, 229, 0.4), inset 0 -20px 60px rgba(0, 0, 0, 0.2)',
        }}
        data-testid="hero-microphone"
      >
        {/* Responsive sizing for larger screens */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            [data-testid="hero-microphone"] {
              width: 240px;
              height: 280px;
            }
          }
          @media (min-width: 1024px) {
            [data-testid="hero-microphone"] {
              width: 280px;
              height: 320px;
            }
          }
        `}} />

        {/* Sound waves emanating from mic */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            ref={(el) => (waveRefs.current[i] = el)}
            className="absolute rounded-full border-4 border-white/40"
            style={{
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
            }}
          />
        ))}

        {/* Central microphone icon */}
        <div className="relative z-10">
          <Mic className="w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 text-white drop-shadow-2xl" strokeWidth={1.5} />
        </div>

        {/* Subtle inner highlight */}
        <div 
          className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 blur-2xl" 
          style={{ filter: 'blur(40px)' }}
        />
      </div>

      {/* Floating accent particles */}
      <div className="absolute top-0 left-1/4 w-3 h-3 md:w-4 md:h-4 rounded-full bg-indigo-300/60 animate-float" style={{ animationDelay: '0s', animationDuration: '4s' }} />
      <div className="absolute bottom-8 right-1/4 w-2 h-2 md:w-3 md:h-3 rounded-full bg-indigo-400/60 animate-float" style={{ animationDelay: '1s', animationDuration: '5s' }} />
      <div className="absolute top-1/3 -left-4 w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full bg-indigo-200/60 animate-float" style={{ animationDelay: '2s', animationDuration: '6s' }} />
      <div className="absolute bottom-1/3 -right-4 w-2 h-2 md:w-3 md:h-3 rounded-full bg-indigo-300/60 animate-float" style={{ animationDelay: '1.5s', animationDuration: '5.5s' }} />
    </div>
  );
}

// Static fallback for reduced motion
function StaticFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center" data-testid="hero-static-fallback">
      <div
        className="relative flex items-center justify-center shadow-2xl"
        style={{
          width: '200px',
          height: '240px',
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
          boxShadow: '0 30px 80px rgba(99, 102, 241, 0.6), 0 0 120px rgba(79, 70, 229, 0.4)',
        }}
      >
        <Mic className="w-28 h-28 md:w-32 md:h-32 text-white" strokeWidth={1.5} />
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
