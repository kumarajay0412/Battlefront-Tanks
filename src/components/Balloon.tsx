import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useSphere, useBox } from '@react-three/cannon';
import * as THREE from 'three';

// Pastel color palette for balloons
const BALLOON_COLORS = [
  '#FFB6C1', // pastel pink
  '#ADD8E6', // pastel blue
  '#FFFFE0', // pastel yellow
  '#98FB98', // pastel green
  '#D8BFD8', // pastel purple
  '#FFDAB9', // pastel peach
  '#B0E0E6', // pastel powder blue
  '#FFE4E1', // pastel misty rose
  '#E6E6FA', // pastel lavender
  '#F0FFF0'  // pastel honeydew
];

// Balloon shape variants
type BalloonVariant = 'classic' | 'teardrop' | 'tiered' | 'heart' | 'elongated';

interface BalloonProps {
  position: [number, number, number];
  color?: string;
  points: number;
  onBurst: (points: number) => void;
  id: number;
  variant?: BalloonVariant;
  scale?: number;
}

const HotAirBalloon: React.FC<BalloonProps> = ({ 
  position, 
  color, 
  points, 
  onBurst, 
  id, 
  variant = 'classic',
  scale = 1.0
}) => {
  // If no color provided, pick one from our pastel palette
  const balloonColor = color || BALLOON_COLORS[id % BALLOON_COLORS.length];
  const [isBurst, setIsBurst] = useState(false);
  const [showPoints, setShowPoints] = useState(false);
  const [floatOffset, setFloatOffset] = useState(0);
  const initialY = position[1];
  
  // Reference to the balloon mesh
  const balloonRef = useRef<THREE.Group>(null);
  
  // Get balloon size based on variant and scale
  const getBalloonSize = () => {
    const baseSize = 2.5;
    switch (variant) {
      case 'teardrop': return baseSize * 1.0 * scale;
      case 'elongated': return baseSize * 0.8 * scale;
      case 'heart': return baseSize * 0.9 * scale;
      case 'tiered': return baseSize * 1.1 * scale;
      default: return baseSize * scale;
    }
  };
  
  // Add physics to the balloon
  const [sphereRef, api] = useSphere(() => ({
    mass: 0, // Make it static
    position,
    args: [getBalloonSize()], // Collision sphere for the balloon part
    collisionFilterGroup: 2, // Balloon collision group (2)
    collisionFilterMask: 1, // Only collide with projectiles (group 1)
    userData: { type: 'balloon', id },
    onCollide: (e) => {
      // Only burst if hit by a projectile (not a house or other object)
      if (e.body && e.body.userData && e.body.userData.type !== 'house') {
        if (!isBurst) {
          handleBurst();
        }
      }
    },
  }));
  
  // Floating animation
  useFrame((state) => {
    if (isBurst) return;
    
    // Simple floating animation - different balloon types float differently
    const time = state.clock.getElapsedTime();
    let amplitude = 0.7;
    let frequency = 0.5;
    
    // Adjust floating animation based on variant
    switch (variant) {
      case 'teardrop':
        amplitude = 0.6;
        frequency = 0.4;
        break;
      case 'elongated':
        amplitude = 0.9;
        frequency = 0.7;
        break;
      case 'heart':
        amplitude = 0.5;
        frequency = 0.3;
        break;
      case 'tiered':
        amplitude = 0.6;
        frequency = 0.5;
        break;
    }
    
    const newOffset = Math.sin(time * frequency + id * 0.5) * amplitude; 
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
  
  // Get accent color - slightly darker than main color
  const getAccentColor = () => {
    const color = new THREE.Color(balloonColor);
    color.multiplyScalar(0.8); // Darken by 20%
    return color.getStyle();
  };
  
  // Render the Classic shape balloon
  const renderClassicBalloon = () => (
    <group position={[0, 3 * scale, 0]}>
      {/* Main balloon envelope */}
      <mesh onClick={handleBurst}>
        <sphereGeometry args={[2.5 * scale, 32, 32]} />
        <meshStandardMaterial 
          color={balloonColor} 
          emissive={balloonColor} 
          emissiveIntensity={0.2}
          roughness={0.3}
        />
      </mesh>
      
      {/* Decorative stripes on the balloon */}
      {[...Array(8)].map((_, index) => (
        <mesh 
          key={`stripe-${index}`} 
          position={[0, (-2.5 + index * 0.7) * scale, 0]} 
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[2.5 * Math.cos(Math.asin((index * 0.7 - 2.5) / 2.5)) * scale, 0.05 * scale, 16, 32]} />
          <meshStandardMaterial 
            color={index % 2 === 0 ? "#ffffff" : getAccentColor()} 
            emissive={index % 2 === 0 ? "#ffffff" : getAccentColor()}
            emissiveIntensity={0.1}
          />
        </mesh>
      ))}
      
      {/* Top cap of the balloon */}
      <mesh position={[0, 2.5 * scale, 0]}>
        <sphereGeometry args={[0.8 * scale, 16, 16]} />
        <meshStandardMaterial color="#663300" roughness={0.8} />
      </mesh>
      
      {/* Balloon opening at the bottom */}
      <mesh position={[0, -2.5 * scale, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.8 * scale, 0.8 * scale, 0.5 * scale, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Ropes connecting basket to balloon (4 ropes) */}
      {[
        [0.7, 0.7], [0.7, -0.7], [-0.7, 0.7], [-0.7, -0.7]
      ].map(([x, z], index) => (
        <mesh key={`rope-${index}`} position={[x * scale, -2.5 * scale, z * scale]}>
          <cylinderGeometry args={[0.03 * scale, 0.03 * scale, 3 * scale, 8]} />
          <meshStandardMaterial color="#996633" roughness={1} />
        </mesh>
      ))}
    </group>
  );
  
  // Render the Teardrop shaped balloon
  const renderTeardropBalloon = () => (
    <group position={[0, 3 * scale, 0]}>
      {/* Main teardrop body */}
      <mesh onClick={handleBurst}>
        <sphereGeometry args={[2.2 * scale, 32, 32]} />
        <meshStandardMaterial 
          color={balloonColor} 
          emissive={balloonColor} 
          emissiveIntensity={0.2}
          roughness={0.3}
        />
      </mesh>
      
      {/* Bottom tapered part */}
      <mesh position={[0, -1.5 * scale, 0]}>
        <coneGeometry args={[2.2 * scale, 3 * scale, 32, 1, true]} />
        <meshStandardMaterial 
          color={balloonColor} 
          emissive={balloonColor} 
          emissiveIntensity={0.2}
          roughness={0.3}
        />
      </mesh>
      
      {/* Decorative bands */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[2.2 * scale, 0.1 * scale, 16, 32]} />
        <meshStandardMaterial color={getAccentColor()} />
      </mesh>
      
      <mesh position={[0, 1 * scale, 0]} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[1.8 * scale, 0.1 * scale, 16, 32]} />
        <meshStandardMaterial color={getAccentColor()} />
      </mesh>
      
      <mesh position={[0, -1 * scale, 0]} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[1.9 * scale, 0.1 * scale, 16, 32]} />
        <meshStandardMaterial color={getAccentColor()} />
      </mesh>
      
      {/* Top cap */}
      <mesh position={[0, 2.3 * scale, 0]}>
        <sphereGeometry args={[0.6 * scale, 16, 16]} />
        <meshStandardMaterial color="#663300" roughness={0.8} />
      </mesh>
      
      {/* Balloon opening at the bottom */}
      <mesh position={[0, -3 * scale, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.7 * scale, 0.7 * scale, 0.5 * scale, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Ropes */}
      {[
        [0.6, 0.6], [0.6, -0.6], [-0.6, 0.6], [-0.6, -0.6]
      ].map(([x, z], index) => (
        <mesh key={`rope-${index}`} position={[x * scale, -3 * scale, z * scale]}>
          <cylinderGeometry args={[0.03 * scale, 0.03 * scale, 3 * scale, 8]} />
          <meshStandardMaterial color="#996633" roughness={1} />
        </mesh>
      ))}
    </group>
  );
  
  // Render the Multi-tiered balloon
  const renderTieredBalloon = () => (
    <group position={[0, 3.5 * scale, 0]}>
      {/* Bottom tier */}
      <mesh position={[0, -2 * scale, 0]} onClick={handleBurst}>
        <sphereGeometry args={[2.7 * scale, 32, 32]} />
        <meshStandardMaterial 
          color={balloonColor} 
          emissive={balloonColor} 
          emissiveIntensity={0.2}
          roughness={0.3}
        />
      </mesh>
      
      {/* Middle tier */}
      <mesh position={[0, 0, 0]} onClick={handleBurst}>
        <sphereGeometry args={[2.3 * scale, 32, 32]} />
        <meshStandardMaterial 
          color={getAccentColor()} 
          emissive={getAccentColor()} 
          emissiveIntensity={0.2}
          roughness={0.3}
        />
      </mesh>
      
      {/* Top tier */}
      <mesh position={[0, 2 * scale, 0]} onClick={handleBurst}>
        <sphereGeometry args={[1.8 * scale, 32, 32]} />
        <meshStandardMaterial 
          color={balloonColor} 
          emissive={balloonColor} 
          emissiveIntensity={0.2}
          roughness={0.3}
        />
      </mesh>
      
      {/* Connecting rings */}
      <mesh position={[0, -1 * scale, 0]} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[1.5 * scale, 0.1 * scale, 16, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <mesh position={[0, 1 * scale, 0]} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[1.2 * scale, 0.1 * scale, 16, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Top cap */}
      <mesh position={[0, 3.2 * scale, 0]}>
        <sphereGeometry args={[0.6 * scale, 16, 16]} />
        <meshStandardMaterial color="#663300" roughness={0.8} />
      </mesh>
      
      {/* Bottom opening */}
      <mesh position={[0, -3.8 * scale, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.8 * scale, 0.8 * scale, 0.5 * scale, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Ropes */}
      {[
        [0.7, 0.7], [0.7, -0.7], [-0.7, 0.7], [-0.7, -0.7]
      ].map(([x, z], index) => (
        <mesh key={`rope-${index}`} position={[x * scale, -3.8 * scale, z * scale]}>
          <cylinderGeometry args={[0.03 * scale, 0.03 * scale, 3.5 * scale, 8]} />
          <meshStandardMaterial color="#996633" roughness={1} />
        </mesh>
      ))}
    </group>
  );
  
  // Render the Heart shaped balloon
  const renderHeartBalloon = () => (
    <group position={[0, 3 * scale, 0]}>
      {/* Left lobe of heart */}
      <mesh position={[-0.9 * scale, 0.7 * scale, 0]} rotation={[0, 0, Math.PI/4]} onClick={handleBurst}>
        <sphereGeometry args={[1.5 * scale, 32, 32]} />
        <meshStandardMaterial 
          color={balloonColor} 
          emissive={balloonColor} 
          emissiveIntensity={0.2}
          roughness={0.3}
        />
      </mesh>
      
      {/* Right lobe of heart */}
      <mesh position={[0.9 * scale, 0.7 * scale, 0]} rotation={[0, 0, -Math.PI/4]} onClick={handleBurst}>
        <sphereGeometry args={[1.5 * scale, 32, 32]} />
        <meshStandardMaterial 
          color={balloonColor} 
          emissive={balloonColor} 
          emissiveIntensity={0.2}
          roughness={0.3}
        />
      </mesh>
      
      {/* Bottom point of heart */}
      <mesh position={[0, -1.2 * scale, 0]} rotation={[0, 0, Math.PI/4]}>
        <coneGeometry args={[2 * scale, 3 * scale, 32, 1]} />
        <meshStandardMaterial 
          color={balloonColor} 
          emissive={balloonColor} 
          emissiveIntensity={0.2}
          roughness={0.3}
        />
      </mesh>
      
      {/* Decorative trims */}
      <mesh position={[0, -0.5 * scale, 0]} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[1.7 * scale, 0.1 * scale, 16, 32]} />
        <meshStandardMaterial color={getAccentColor()} />
      </mesh>
      
      {/* Opening at bottom */}
      <mesh position={[0, -2.5 * scale, 0]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.7 * scale, 0.7 * scale, 0.5 * scale, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Ropes */}
      {[
        [0.6, 0.6], [0.6, -0.6], [-0.6, 0.6], [-0.6, -0.6]
      ].map(([x, z], index) => (
        <mesh key={`rope-${index}`} position={[x * scale, -2.5 * scale, z * scale]}>
          <cylinderGeometry args={[0.03 * scale, 0.03 * scale, 3 * scale, 8]} />
          <meshStandardMaterial color="#996633" roughness={1} />
        </mesh>
      ))}
    </group>
  );
  
  // Render the Elongated balloon
  const renderElongatedBalloon = () => (
    <group position={[0, 4 * scale, 0]}>
      {/* Main elongated body */}
      <mesh onClick={handleBurst}>
        <capsuleGeometry args={[1.8 * scale, 5 * scale, 16, 32]} />
        <meshStandardMaterial 
          color={balloonColor} 
          emissive={balloonColor} 
          emissiveIntensity={0.2}
          roughness={0.3}
        />
      </mesh>
      
      {/* Spiral decorative pattern */}
      {[...Array(6)].map((_, i) => (
        <mesh 
          key={`spiral-${i}`} 
          position={[0, (-2 + i * 0.8) * scale, 0]} 
          rotation={[Math.PI/2, 0, i * Math.PI/6]}
        >
          <torusGeometry args={[1.8 * scale, 0.08 * scale, 16, 32]} />
          <meshStandardMaterial color={getAccentColor()} />
        </mesh>
      ))}
      
      {/* Top cap */}
      <mesh position={[0, 2.7 * scale, 0]}>
        <sphereGeometry args={[0.6 * scale, 16, 16]} />
        <meshStandardMaterial color="#663300" roughness={0.8} />
      </mesh>
      
      {/* Bottom opening */}
      <mesh position={[0, -4.5 * scale, 0]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.7 * scale, 0.7 * scale, 0.5 * scale, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Ropes */}
      {[
        [0.5, 0.5], [0.5, -0.5], [-0.5, 0.5], [-0.5, -0.5]
      ].map(([x, z], index) => (
        <mesh key={`rope-${index}`} position={[x * scale, -4.5 * scale, z * scale]}>
          <cylinderGeometry args={[0.03 * scale, 0.03 * scale, 4 * scale, 8]} />
          <meshStandardMaterial color="#996633" roughness={1} />
        </mesh>
      ))}
    </group>
  );
  
  // Render the appropriate balloon shape based on variant
  const renderBalloonShape = () => {
    switch (variant) {
      case 'teardrop': return renderTeardropBalloon();
      case 'tiered': return renderTieredBalloon();
      case 'heart': return renderHeartBalloon();
      case 'elongated': return renderElongatedBalloon();
      default: return renderClassicBalloon();
    }
  };
  
  return (
    <group ref={balloonRef} position={[position[0], position[1] + floatOffset, position[2]]}>
      {/* Render the selected balloon shape */}
      {renderBalloonShape()}
      
      {/* Basket is common for all balloon types */}
      <group position={[0, -0.5 * scale, 0]}>
        {/* Basket container */}
        <mesh>
          <boxGeometry args={[1.4 * scale, 1 * scale, 1.4 * scale]} />
          <meshStandardMaterial color="#8B4513" roughness={0.9} />
        </mesh>
        
        {/* Basket interior */}
        <mesh position={[0, 0.1 * scale, 0]}>
          <boxGeometry args={[1.2 * scale, 0.8 * scale, 1.2 * scale]} />
          <meshStandardMaterial color="#A0522D" roughness={0.8} />
        </mesh>
        
        {/* Wicker pattern (simplified) */}
        {[...Array(3)].map((_, idx) => (
          <mesh key={`wicker-h-${idx}`} position={[0, (-0.3 + idx * 0.3) * scale, 0.7 * scale]}>
            <boxGeometry args={[1.4 * scale, 0.05 * scale, 0.02 * scale]} />
            <meshStandardMaterial color="#6B4226" />
          </mesh>
        ))}
        {[...Array(3)].map((_, idx) => (
          <mesh key={`wicker-h-back-${idx}`} position={[0, (-0.3 + idx * 0.3) * scale, -0.7 * scale]}>
            <boxGeometry args={[1.4 * scale, 0.05 * scale, 0.02 * scale]} />
            <meshStandardMaterial color="#6B4226" />
          </mesh>
        ))}
        {[...Array(3)].map((_, idx) => (
          <mesh key={`wicker-v-${idx}`} position={[0.7 * scale, (-0.3 + idx * 0.3) * scale, 0]}>
            <boxGeometry args={[0.02 * scale, 0.05 * scale, 1.4 * scale]} />
            <meshStandardMaterial color="#6B4226" />
          </mesh>
        ))}
        {[...Array(3)].map((_, idx) => (
          <mesh key={`wicker-v-back-${idx}`} position={[-0.7 * scale, (-0.3 + idx * 0.3) * scale, 0]}>
            <boxGeometry args={[0.02 * scale, 0.05 * scale, 1.4 * scale]} />
            <meshStandardMaterial color="#6B4226" />
          </mesh>
        ))}
        
        {/* Burner flame */}
        <mesh position={[0, 0.8 * scale, 0]}>
          <coneGeometry args={[0.2 * scale, 0.4 * scale, 8]} />
          <meshStandardMaterial 
            color="orange" 
            emissive="orange"
            emissiveIntensity={1}
          />
        </mesh>
      </group>
      
      {/* Physics body - invisible but handles collisions */}
      <mesh ref={sphereRef as any} visible={false} position={[0, 3 * scale, 0]}>
        <sphereGeometry args={[getBalloonSize(), 8, 8]} />
        <meshBasicMaterial opacity={0} transparent={true} />
      </mesh>
    </group>
  );
};

export default HotAirBalloon; 