import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Html } from '@react-three/drei';
import { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Languages, MessageSquare } from 'lucide-react';

// Character head component with subtle breathing animation
function CharacterHead({ position, isActive, onComplete }: { 
  position: [number, number, number];
  isActive: boolean;
  onComplete?: () => void;
}) {
  const headRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const [pulseScale, setPulseScale] = useState(0);

  // Idle breathing animation
  useFrame((state) => {
    if (headRef.current) {
      headRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  // Voice pulse animation when speaking
  useEffect(() => {
    if (isActive && pulseRef.current) {
      setPulseScale(0);
      const tl = gsap.timeline({
        onComplete: () => {
          setPulseScale(0);
          onComplete?.();
        }
      });
      
      tl.to(pulseRef.current.scale, {
        x: 2,
        y: 2,
        z: 2,
        duration: 1.5,
        ease: 'power2.out'
      });
      
      tl.to(pulseRef.current.material, {
        opacity: 0,
        duration: 1.5,
        ease: 'power2.out'
      }, 0);
    }
  }, [isActive, onComplete]);

  return (
    <group ref={headRef} position={position}>
      {/* Head - sphere */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={isActive ? '#8b5cf6' : '#6366f1'}
          emissive={isActive ? '#8b5cf6' : '#1e293b'}
          emissiveIntensity={isActive ? 0.5 : 0.1}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      
      {/* Neck */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.3, 16]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#1e293b"
          emissiveIntensity={0.1}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Voice pulse ring */}
      {isActive && (
        <mesh ref={pulseRef} position={[0, 0, 0]}>
          <ringGeometry args={[0.6, 0.7, 32]} />
          <meshBasicMaterial
            color="#8b5cf6"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// Traveling voice wave component
function VoiceWave({ 
  start, 
  end, 
  active, 
  color,
  onReachEnd 
}: { 
  start: [number, number, number];
  end: [number, number, number];
  active: boolean;
  color: string;
  onReachEnd?: () => void;
}) {
  const waveRef = useRef<THREE.Mesh>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (active && waveRef.current) {
      setProgress(0);
      gsap.to({ value: 0 }, {
        value: 1,
        duration: 2,
        ease: 'power1.inOut',
        onUpdate: function() {
          setProgress(this.targets()[0].value);
        },
        onComplete: () => {
          onReachEnd?.();
        }
      });
    }
  }, [active, onReachEnd]);

  const position = useMemo(() => {
    return [
      start[0] + (end[0] - start[0]) * progress,
      start[1] + (end[1] - start[1]) * progress + Math.sin(progress * Math.PI) * 0.3,
      start[2] + (end[2] - start[2]) * progress,
    ] as [number, number, number];
  }, [start, end, progress]);

  if (!active || progress === 0) return null;

  return (
    <mesh ref={waveRef} position={position}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

// Central translation orb with color morphing
function TranslationOrb({ active, color }: { active: boolean; color: string }) {
  const orbRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (orbRef.current) {
      orbRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      orbRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      
      // Pulsing scale when active
      if (active) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
        orbRef.current.scale.setScalar(scale);
      }
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={orbRef}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.8 : 0.3}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      
      {/* Orbiting particles */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 3) * Math.PI * 2) * 0.6,
            Math.sin((i / 3) * Math.PI * 2) * 0.3,
            0
          ]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

// Floating subtitle component
function FloatingSubtitle({ 
  position, 
  text, 
  visible 
}: { 
  position: [number, number, number];
  text: string;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <Html position={position} center>
      <div className="bg-background/95 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/20 shadow-lg animate-in fade-in-0 zoom-in-95 duration-300">
        <p className="text-sm font-medium text-foreground whitespace-nowrap">
          {text}
        </p>
      </div>
    </Html>
  );
}

// Main 3D scene with animation orchestration
function Scene() {
  const [conversationState, setConversationState] = useState<
    'idle' | 'personA' | 'traveling1' | 'translating' | 'traveling2' | 'personB'
  >('idle');
  const [orbColor, setOrbColor] = useState('#6366f1');
  const [subtitleA, setSubtitleA] = useState('');
  const [subtitleB, setSubtitleB] = useState('');

  // Conversation loop
  useEffect(() => {
    const sequence = async () => {
      // Wait a bit before starting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Person A speaks
      setConversationState('personA');
      setSubtitleA('Hello!');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Wave travels to orb
      setConversationState('traveling1');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Translation happens
      setConversationState('translating');
      setOrbColor('#8b5cf6'); // Violet
      setSubtitleA('');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOrbColor('#10b981'); // Emerald
      setSubtitleB('¡Hola!');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Wave travels to Person B
      setConversationState('traveling2');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Person B receives
      setConversationState('personB');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Reset and loop
      setSubtitleB('');
      setOrbColor('#6366f1'); // Blue
      setConversationState('idle');
      
      // Restart the sequence
      setTimeout(() => sequence(), 1000);
    };

    sequence();
  }, []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color="#8b5cf6" />

      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />

      {/* Character on the left (Person A - English speaker) */}
      <CharacterHead 
        position={[-2.5, 0, 0]} 
        isActive={conversationState === 'personA'}
        onComplete={() => {}}
      />

      {/* Character on the right (Person B - Spanish speaker) */}
      <CharacterHead 
        position={[2.5, 0, 0]} 
        isActive={conversationState === 'personB'}
        onComplete={() => {}}
      />

      {/* Central translation orb */}
      <TranslationOrb 
        active={conversationState === 'translating'} 
        color={orbColor}
      />

      {/* Voice wave from A to Orb */}
      <VoiceWave
        start={[-2, 0, 0]}
        end={[0, 0, 0]}
        active={conversationState === 'traveling1'}
        color="#6366f1"
        onReachEnd={() => {}}
      />

      {/* Voice wave from Orb to B */}
      <VoiceWave
        start={[0, 0, 0]}
        end={[2.5, 0, 0]}
        active={conversationState === 'traveling2'}
        color="#10b981"
        onReachEnd={() => {}}
      />

      {/* Floating subtitles */}
      <FloatingSubtitle
        position={[-2.5, 1, 0]}
        text={subtitleA}
        visible={!!subtitleA}
      />

      <FloatingSubtitle
        position={[2.5, 1, 0]}
        text={subtitleB}
        visible={!!subtitleB}
      />
    </>
  );
}

// Static 2D fallback for reduced motion or low performance
function StaticFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center" data-testid="hero-static-fallback">
      <div className="relative w-full max-w-md">
        {/* Two conversation bubbles */}
        <div className="flex items-center justify-between gap-8">
          {/* Person A */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-xl">
              <MessageSquare className="h-12 w-12 text-white" />
            </div>
            <div className="px-4 py-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg border border-indigo-200 dark:border-indigo-700 shadow-lg">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Hello!</p>
            </div>
          </div>

          {/* Translation orb */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center shadow-xl">
              <Languages className="h-8 w-8 text-white" />
            </div>
            <div className="mt-2 w-12 h-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500" />
          </div>

          {/* Person B */}
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

// Main exported component with Canvas wrapper
export default function HeroScene3D() {
  const [useStatic, setUseStatic] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setUseStatic(mediaQuery.matches);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => setUseStatic(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Show static fallback for reduced motion
  if (useStatic) {
    return <StaticFallback />;
  }

  return (
    <div className="w-full h-full" data-testid="hero-3d-scene">
      <Canvas
        className="w-full h-full"
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
