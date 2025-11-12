import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { Mic } from 'lucide-react';

// Professional Microphone Animation Component
// Clean, minimal design with subtle animations

// Professional Microphone Display - Minimal and elegant
function ProfessionalMicrophone() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!glowRef.current) return;

    // Very subtle glow pulse - barely noticeable
    gsap.to(glowRef.current, {
      opacity: 0.6,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      {/* Single subtle glow ring - very minimal */}
      <div 
        ref={glowRef}
        className="absolute w-72 h-80 md:w-96 md:h-[28rem] rounded-full border border-indigo-400/10"
        style={{ borderRadius: '50%' }}
      />

      {/* Main microphone container - OVAL shape, NO animations */}
      <div
        className="relative flex items-center justify-center shadow-2xl overflow-hidden"
        style={{
          width: '180px',
          height: '220px',
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
          boxShadow: '0 20px 60px rgba(99, 102, 241, 0.4), 0 0 80px rgba(79, 70, 229, 0.2), inset 0 -20px 40px rgba(0, 0, 0, 0.1)',
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

        {/* Central microphone icon - static, no animation */}
        <div className="relative z-10">
          <Mic className="w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 text-white drop-shadow-2xl" strokeWidth={1.5} />
        </div>

        {/* Subtle inner highlight - static */}
        <div 
          className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/15 blur-2xl" 
          style={{ filter: 'blur(40px)' }}
        />
      </div>
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
    <div className="w-full h-full flex items-center justify-center" data-testid="hero-3d-scene">
      <div className="relative w-full max-w-lg md:max-w-xl px-4 py-8">
        <ProfessionalMicrophone />
      </div>
    </div>
  );
}
