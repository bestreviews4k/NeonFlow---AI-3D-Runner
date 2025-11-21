import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { Text, Environment, PerspectiveCamera, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { GameState, LevelTheme } from '../types';

interface GameSceneProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  theme: LevelTheme;
  onScoreUpdate: (score: number) => void;
  onCrash: () => void;
}

// --- Constants ---
const LANE_WIDTH = 2.5;
const OBSTACLE_SPAWN_Z = -50;
const PLAYER_Z = 0;
const SPEED_BASE = 0.4;

// --- Components ---

const Player = ({ position, color, isPlaying }: { position: THREE.Vector3, color: string, isPlaying: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Smooth lerp to target position
    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      position.x,
      10 * delta
    );
    
    // Subtle floating animation
    if (isPlaying) {
      meshRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
      meshRef.current.rotation.z = -meshRef.current.position.x * 0.1; // Tilt
      meshRef.current.rotation.x += delta * 2; // Spin forward
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.5, PLAYER_Z]} castShadow>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color}
        emissiveIntensity={0.8}
        roughness={0.2}
        metalness={0.8}
      />
      <pointLight distance={5} intensity={2} color={color} />
    </mesh>
  );
};

const Obstacle = ({ position, shape, color }: { position: [number, number, number] | THREE.Vector3, shape: string, color: string }) => {
  // Geometry memoization based on shape type
  const geometry = useMemo(() => {
    switch (shape) {
      case 'sphere': return <sphereGeometry args={[0.5, 32, 32]} />;
      case 'cylinder': return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case 'dodecahedron': return <dodecahedronGeometry args={[0.5, 0]} />;
      case 'box': default: return <boxGeometry args={[1, 1, 1]} />;
    }
  }, [shape]);

  return (
    <mesh position={position} castShadow receiveShadow>
      {geometry}
      <meshStandardMaterial color={color} roughness={0.4} />
    </mesh>
  );
};

const Ground = ({ color }: { color: string }) => {
  const textureRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (textureRef.current) {
      // Move texture to simulate speed if we were using a texture
      // For simple geometry grid, we can just let it be static or animate grid lines
    }
  });

  return (
    <group>
      {/* Main Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[100, 200]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Grid Helper for Speed sensation */}
      <gridHelper args={[100, 100, 0xffffff, 0x555555]} position={[0, -0.49, 0]} />
    </group>
  );
};

const SceneContent = ({ gameState, setGameState, theme, onScoreUpdate, onCrash }: GameSceneProps) => {
  // Player state
  const [lane, setLane] = useState(0); // -1, 0, 1
  const [obstacles, setObstacles] = useState<{ id: number, x: number, z: number }[]>([]);
  const scoreRef = useRef(0);
  const speedRef = useRef(0);
  
  // Reset game
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      setObstacles([]);
      setLane(0);
      scoreRef.current = 0;
      speedRef.current = SPEED_BASE * theme.speedModifier;
      onScoreUpdate(0);
    }
  }, [gameState, theme, onScoreUpdate]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setLane(l => Math.max(l - 1, -1));
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setLane(l => Math.min(l + 1, 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Game Loop
  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING) return;

    // Update Speed (accelerate slowly)
    speedRef.current += delta * 0.005;
    const currentSpeed = speedRef.current;

    // Move obstacles
    setObstacles(prev => {
      const next = [];
      let hasCollision = false;
      
      for (const obs of prev) {
        const newZ = obs.z + (currentSpeed * 60 * delta); // Normalized speed
        
        // Collision Check
        // Player is at Z=0. Obstacle is roughly size 1.
        if (newZ > PLAYER_Z - 0.8 && newZ < PLAYER_Z + 0.8) {
          if (obs.x === lane * LANE_WIDTH) {
            hasCollision = true;
          }
        }

        if (newZ < 10) { // Keep if not passed camera too far
          next.push({ ...obs, z: newZ });
        }
      }

      if (hasCollision) {
        onCrash();
      }

      return next;
    });

    // Spawn new obstacles
    // Simple probabilistic spawning
    if (Math.random() < 0.05 * theme.speedModifier) {
      setObstacles(prev => {
        // Don't spawn too close to last one
        const lastZ = prev.length > 0 ? Math.min(...prev.map(o => o.z)) : 0;
        if (lastZ > OBSTACLE_SPAWN_Z + 10) {
           // Pick a random lane
           const spawnLane = Math.floor(Math.random() * 3) - 1;
           return [...prev, { id: Date.now(), x: spawnLane * LANE_WIDTH, z: OBSTACLE_SPAWN_Z }];
        }
        return prev;
      });
    }

    // Update Score
    scoreRef.current += currentSpeed;
    onScoreUpdate(Math.floor(scoreRef.current * 10));

    // Camera Shake or Follow
    // Simple follow for now is static camera, world moves
  });

  const playerTargetPos = new THREE.Vector3(lane * LANE_WIDTH, 0, 0);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, 6]} fov={60} rotation={[-0.3, 0, 0]} />
      
      <ambientLight intensity={theme.lightingIntensity * 0.5} />
      <pointLight position={[10, 10, 10]} intensity={theme.lightingIntensity} color={theme.colors.sun} castShadow />
      <fog attach="fog" args={[theme.colors.fog, 5, 40 / theme.fogDensity]} />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <group>
        <Player position={playerTargetPos} color={theme.colors.player} isPlaying={gameState === GameState.PLAYING} />
        
        {obstacles.map(obs => (
           <Obstacle 
             key={obs.id} 
             position={[obs.x, 0.5, obs.z] as [number, number, number]} 
             shape={theme.shapeType} 
             color={theme.colors.obstacle} 
           />
        ))}
        
        <Ground color={theme.colors.ground} />
      </group>
    </>
  );
};

export const GameScene = (props: GameSceneProps) => {
  return (
    <Canvas shadows dpr={[1, 2]}>
      <SceneContent {...props} />
    </Canvas>
  );
};