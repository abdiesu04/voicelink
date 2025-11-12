import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { Languages, MessageSquare } from 'lucide-react';

// Advanced CSS 3D Hero Animation Component
// Demonstrates real-time voice translation with sophisticated pseudo-3D effects

interface ConversationState {
  phase: 'idle' | 'personA' | 'traveling1' | 'translating' | 'traveling2' | 'personB';
  subtitleA: string;
  subtitleB: string;
  orbColor: string;
}

// Character avatar with 3D perspective
function CharacterAvatar({ 
  isLeft, 
  isActive, 
  subtitle 
}: { 
  isLeft: boolean; 
  isActive: boolean; 
  subtitle: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 md:gap-3 ${isLeft ? 'order-1' : 'order-3'}`}>
      {/* 3D Character Head */}
      <div 
        className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full transition-all duration-500 ${
          isActive 
            ? 'shadow-xl md:shadow-2xl shadow-indigo-500/50 scale-110' 
            : 'shadow-lg md:shadow-xl scale-100'
        }`}
        style={{
          background: isLeft 
            ? 'linear-gradient(135deg, #6366f1, #8b5cf6, #3b82f6)'
            : 'linear-gradient(135deg, #10b981, #3b82f6, #8b5cf6)',
          transform: `perspective(1000px) rotateY(${isLeft ? '15deg' : '-15deg'})`,
        }}
      >
        {/* Voice pulse effect */}
        {isActive && (
          <>
            <div className="absolute -inset-2 md:-inset-3 rounded-full border border-indigo-400/60 animate-ping" />
            <div className="absolute -inset-3 md:-inset-4 rounded-full border border-violet-400/40 animate-ping" style={{ animationDelay: '0.2s' }} />
          </>
        )}
        
        {/* Message icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <MessageSquare className="h-7 w-7 md:h-9 md:w-9 text-white" />
        </div>
      </div>

      {/* Floating subtitle */}
      {subtitle && (
        <div 
          className="px-3 py-1.5 md:px-4 md:py-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-md md:rounded-lg border border-indigo-200 dark:border-indigo-700 shadow-lg animate-in fade-in-0 zoom-in-95 duration-300"
          data-testid={`subtitle-${isLeft ? 'left' : 'right'}`}
        >
          <p className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
            {subtitle}
          </p>
        </div>
      )}
    </div>
  );
}

// Traveling voice wave with 3D arc animation
function TravelingWave({ 
  active, 
  direction 
}: { 
  active: boolean; 
  direction: 'left-to-center' | 'center-to-right';
}) {
  const waveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active && waveRef.current) {
      const startX = direction === 'left-to-center' ? -35 : 0;
      const endX = direction === 'left-to-center' ? 0 : 35;
      
      gsap.fromTo(waveRef.current, 
        {
          x: `${startX}%`,
          y: '0%',
          scale: 0,
          opacity: 0
        },
        {
          x: `${endX}%`,
          y: '-30%',
          scale: 1,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
          keyframes: {
            '50%': { y: '-60%', scale: 1.2 },
            '100%': { y: '0%', scale: 0, opacity: 0 }
          }
        }
      );
    }
  }, [active, direction]);

  if (!active) return null;

  return (
    <div 
      ref={waveRef}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/50"
      style={{
        filter: 'blur(2px)',
      }}
    />
  );
}

// Central translation orb with color morphing
function TranslationOrb({ color, isActive }: { color: string; isActive: boolean }) {
  const orbRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (orbRef.current) {
      tweenRef.current = gsap.to(orbRef.current, {
        rotateY: 360,
        duration: 4,
        ease: 'none',
        repeat: -1
      });
    }

    return () => {
      // Kill tween on unmount to avoid residual animations
      if (tweenRef.current) {
        tweenRef.current.kill();
      }
    };
  }, []);

  return (
    <div className="order-2 flex flex-col items-center relative">
      <div 
        ref={orbRef}
        className={`relative w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl transition-all duration-500 ${
          isActive ? 'scale-125' : 'scale-100'
        }`}
        style={{
          background: color,
          transform: 'perspective(1000px) rotateX(10deg)',
          boxShadow: `0 10px 30px ${color}80`,
        }}
      >
        {/* Orbiting particles - hidden on mobile */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-white hidden md:block"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 120}deg) translateY(-25px)`,
              animation: `orbit-${i} 3s linear infinite`,
            }}
          />
        ))}
        
        {/* Central icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Languages className="h-6 w-6 md:h-8 md:w-8 text-white" />
        </div>
      </div>

      {/* Connection lines - hidden on mobile */}
      <div className="absolute top-1/2 left-0 right-0 -z-10 hidden md:flex items-center justify-center">
        <div className="w-full h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 opacity-30" />
      </div>
    </div>
  );
}

// Static 2D fallback for reduced motion
function StaticFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center" data-testid="hero-static-fallback">
      <div className="relative w-full max-w-2xl">
        <div className="flex items-center justify-between gap-8 px-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-xl">
              <MessageSquare className="h-12 w-12 text-white" />
            </div>
            <div className="px-4 py-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg border border-indigo-200 dark:border-indigo-700 shadow-lg">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Hello!</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center shadow-xl">
              <Languages className="h-8 w-8 text-white" />
            </div>
            <div className="mt-2 w-12 h-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500" />
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-xl">
              <MessageSquare className="h-12 w-12 text-white" />
            </div>
            <div className="px-4 py-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-lg">
              <p className="text-sm font-medium text-slate-900 dark:text-white">¡Hola!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main hero scene component
export default function HeroScene3D() {
  const [state, setState] = useState<ConversationState>({
    phase: 'idle',
    subtitleA: '',
    subtitleB: '',
    orbColor: '#6366f1'
  });
  const [useStatic, setUseStatic] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setUseStatic(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setUseStatic(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Conversation loop
  useEffect(() => {
    if (useStatic) return;

    let cancelled = false;
    const timeouts: NodeJS.Timeout[] = [];

    const wait = (ms: number) => new Promise(resolve => {
      const timeout = setTimeout(resolve, ms);
      timeouts.push(timeout);
    });

    const sequence = async () => {
      while (!cancelled) {
        await wait(1000);
        if (cancelled) break;
        
        // Person A speaks
        setState({
          phase: 'personA',
          subtitleA: 'Hello!',
          subtitleB: '',
          orbColor: '#6366f1'
        });
        
        await wait(1500);
        if (cancelled) break;
        
        // Wave travels to orb
        setState(prev => ({ ...prev, phase: 'traveling1' }));
        
        await wait(1000);
        if (cancelled) break;
        
        // Translation happens
        setState(prev => ({
          ...prev,
          phase: 'translating',
          subtitleA: '',
          orbColor: '#8b5cf6'
        }));
        
        await wait(800);
        if (cancelled) break;
        
        setState(prev => ({
          ...prev,
          orbColor: '#10b981',
          subtitleB: '¡Hola!'
        }));
        
        await wait(1000);
        if (cancelled) break;
        
        // Wave travels to Person B
        setState(prev => ({ ...prev, phase: 'traveling2' }));
        
        await wait(1000);
        if (cancelled) break;
        
        // Person B receives
        setState(prev => ({ ...prev, phase: 'personB' }));
        
        await wait(1500);
        if (cancelled) break;
        
        // Reset
        setState({
          phase: 'idle',
          subtitleA: '',
          subtitleB: '',
          orbColor: '#6366f1'
        });
        
        await wait(1000);
      }
    };

    sequence();

    return () => {
      cancelled = true;
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [useStatic]);

  if (useStatic) {
    return <StaticFallback />;
  }

  return (
    <div className="w-full h-full flex items-center justify-center perspective-[2000px]" data-testid="hero-3d-scene">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes orbit-0 {
          from { transform: rotate(0deg) translateY(-25px); }
          to { transform: rotate(360deg) translateY(-25px); }
        }
        @keyframes orbit-1 {
          from { transform: rotate(120deg) translateY(-25px); }
          to { transform: rotate(480deg) translateY(-25px); }
        }
        @keyframes orbit-2 {
          from { transform: rotate(240deg) translateY(-25px); }
          to { transform: rotate(600deg) translateY(-25px); }
        }
      `}} />

      <div className="relative w-full max-w-sm md:max-w-lg px-2 md:px-4">
        <div className="flex items-center justify-between gap-3 md:gap-8 relative">
          {/* Person A (English) */}
          <CharacterAvatar 
            isLeft={true}
            isActive={state.phase === 'personA'}
            subtitle={state.subtitleA}
          />

          {/* Translation Orb */}
          <TranslationOrb 
            color={state.orbColor}
            isActive={state.phase === 'translating'}
          />

          {/* Person B (Spanish) */}
          <CharacterAvatar 
            isLeft={false}
            isActive={state.phase === 'personB'}
            subtitle={state.subtitleB}
          />

          {/* Traveling waves */}
          <TravelingWave 
            active={state.phase === 'traveling1'}
            direction="left-to-center"
          />
          <TravelingWave 
            active={state.phase === 'traveling2'}
            direction="center-to-right"
          />
        </div>
      </div>
    </div>
  );
}
