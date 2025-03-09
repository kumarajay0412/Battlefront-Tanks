import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import { useSphere } from '@react-three/cannon';
import * as THREE from 'three';

interface BalloonProps {
  position: [number, number, number];
  color: string;
  points: number;
  onBurst: (points: number) => void;
  id: number;
}

const Balloon: React.FC<BalloonProps> = ({ position, color, points, onBurst, id }) => {
  const [isBurst, setIsBurst] = useState(false);
  const [showPoints, setShowPoints] = useState(false);
  const [floatOffset, setFloatOffset] = useState(0);
  const initialY = position[1];
  
  // Reference to the balloon mesh
  const balloonRef = useRef<THREE.Mesh>(null);
  
  // Add physics to the balloon
  const [sphereRef, api] = useSphere(() => ({
    mass: 0, // Make it static
    position,
    args: [2.0], // Increased radius for larger balloons and collision detection
    collisionFilterGroup: 2, // Balloon collision group (2)
    collisionFilterMask: 1, // Only collide with projectiles (group 1)
    userData: { type: 'balloon', id },
    onCollide: (e) => {
      console.log("Balloon collision detected:", id, e.body?.userData);
      
      // Only burst if hit by a projectile (not a house or other object)
      if (e.body && e.body.userData && e.body.userData.type !== 'house') {
        if (!isBurst) {
          console.log("Bursting balloon:", id);
          handleBurst();
        }
      }
    },
  }));
  
  // Floating animation
  useFrame((state) => {
    if (isBurst) return;
    
    // Simple floating animation
    const time = state.clock.getElapsedTime();
    const newOffset = Math.sin(time * 0.8 + id * 0.5) * 0.9; // Increased amplitude from 0.3 to 0.5
    setFloatOffset(newOffset);
    
    if (balloonRef.current) {
      balloonRef.current.position.y = initialY + newOffset;
      
      // Update physics body position to follow the visual balloon
      api.position.set(
        position[0],
        initialY + newOffset,
        position[2]
      );
    }
  });
  
  // Handle balloon burst
  const handleBurst = () => {
    setIsBurst(true);
    setShowPoints(true);
    
    // Call the onBurst callback with points
    onBurst(points);
    
    // Hide points after animation
    setTimeout(() => {
      setShowPoints(false);
    }, 1500);
  };
  
  // If balloon is burst, don't render it
  if (isBurst) return showPoints ? (
    <Html position={[position[0], position[1] + 1, position[2]]} center>
      <div style={{
        color: 'yellow',
        fontWeight: 'bold',
        fontSize: '24px',
        textShadow: '0 0 5px black',
        animation: 'float-up 1.5s forwards',
      }}>
        +{points}
      </div>
    </Html>
  ) : null;
  
  return (
    <group>
      {/* Balloon with physics */}
      <mesh 
        ref={balloonRef} 
        position={[position[0], position[1] + floatOffset, position[2]]}
        onClick={handleBurst}
      >
        <sphereGeometry args={[2.0, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.4}
          roughness={0.2}
        />
        
        {/* Balloon string */}
        <mesh position={[0, -2.5, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 2.0, 8]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </mesh>
      
      {/* Physics body - invisible but handles collisions */}
      <mesh ref={sphereRef as any} visible={false}>
        <sphereGeometry args={[2.0, 8, 8]} />
        <meshBasicMaterial opacity={0} transparent={true} />
      </mesh>
    </group>
  );
};

export default Balloon; 