import { useState, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSphere } from '@react-three/cannon'
import * as THREE from 'three'
import FireEffect from './FireEffect'
import { playSound } from '../utils/audio'

// Define battlefield dimensions as constants for reuse
const BATTLEFIELD_SIZE = 100
const BATTLEFIELD_HALF_SIZE = BATTLEFIELD_SIZE / 2

interface SuperBombProps {
  position: [number, number, number]
  direction: [number, number, number]
  playerId: number
  onHit?: (targetId: number) => void
}

const SuperBomb: React.FC<SuperBombProps> = ({ position, direction, playerId, onHit }) => {
  const [isActive, setIsActive] = useState(true)
  const [collisionPosition, setCollisionPosition] = useState<[number, number, number] | null>(null)
  const [secondaryExplosions, setSecondaryExplosions] = useState<{
    position: [number, number, number];
    scale: number;
    delay: number;
    id: number;
  }[]>([])
  
  const currentPositionRef = useRef<[number, number, number]>(position)
  const bombRef = useRef<THREE.Group>(null)
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const lastUpdateTimeRef = useRef<number>(Date.now())
  const rotationSpeedRef = useRef<THREE.Vector3>(new THREE.Vector3(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  ).normalize().multiplyScalar(3)) // Random rotation speed
  
  // Create a physics-enabled sphere for the bomb
  const [ref, api] = useSphere(() => ({
    mass: 80, // Heavy bomb
    position,
    args: [0.6], // Larger radius for the bomb
    type: 'Dynamic',
    collisionFilterGroup: 2, // projectile group
    collisionFilterMask: 7, // collide with tanks (1), balloons (2), and houses (4)
    linearDamping: 0.1,
    angularDamping: 0.1,
    material: {
      friction: 0.5,
      restitution: 0.2,
    },
    onCollide: (e) => {
      // Check if we hit a tank
      if (e.body && e.body.userData && e.body.userData.type === 'tank') {
        const targetId = e.body.userData.playerId
        // Don't damage your own tank
        if (targetId !== playerId && onHit) {
          onHit(targetId)
        }
      }
      
      // Use the current tracked position for the fire effect
      setCollisionPosition([...currentPositionRef.current])
      
      // Create 5 secondary explosions in a pattern around the impact point
      const explosionPositions: [number, number, number][] = [
        // Center explosion (at impact point)
        [...currentPositionRef.current] as [number, number, number],
        // Four explosions in a cross pattern around the center
        [currentPositionRef.current[0] + 5, currentPositionRef.current[1], currentPositionRef.current[2]],
        [currentPositionRef.current[0] - 5, currentPositionRef.current[1], currentPositionRef.current[2]],
        [currentPositionRef.current[0], currentPositionRef.current[1], currentPositionRef.current[2] + 5],
        [currentPositionRef.current[0], currentPositionRef.current[1], currentPositionRef.current[2] - 5],
      ]
      
      // Add secondary explosions with different delays
      setSecondaryExplosions(
        explosionPositions.map((pos, index) => ({
          position: pos,
          scale: index === 0 ? 3.0 : 2.5, // Center explosion is larger
          delay: index * 200, // Stagger explosions
          id: Date.now() + index
        }))
      )
      
      // Play main explosion sound
      playSound('explosion', 1.0)
      
      // Deactivate bomb on any collision
      setIsActive(false)
    },
  }))
  
  // Track the current position of the bomb
  useEffect(() => {
    // Subscribe to position updates
    const unsubscribe = api.position.subscribe((pos) => {
      currentPositionRef.current = [pos[0], pos[1], pos[2]]
      
      // Check if the bomb has gone outside the battlefield boundaries
      if (
        Math.abs(pos[0]) > BATTLEFIELD_HALF_SIZE || 
        Math.abs(pos[2]) > BATTLEFIELD_HALF_SIZE ||
        pos[1] < -5 || // If it falls below the ground
        pos[1] > 50    // If it goes too high
      ) {
        // Deactivate the bomb if it's outside the battlefield
        setIsActive(false)
      }
    })
    
    return unsubscribe
  }, [api])
  
  // Apply initial velocity to the bomb
  useEffect(() => {
    // Set initial velocity based on direction and power
    const initialSpeed = 25 // Balanced speed for the bomb
    velocityRef.current.set(
      direction[0] * initialSpeed,
      direction[1] * initialSpeed,
      direction[2] * initialSpeed
    )
    
    // Apply initial velocity
    api.velocity.set(
      velocityRef.current.x,
      velocityRef.current.y,
      velocityRef.current.z
    )
    
    // Apply initial angular velocity for rotation
    api.angularVelocity.set(
      rotationSpeedRef.current.x,
      rotationSpeedRef.current.y,
      rotationSpeedRef.current.z
    )
    
    // Reset the timer
    lastUpdateTimeRef.current = Date.now()
    
    // Deactivate bomb after a certain time
    const timeout = setTimeout(() => {
      setIsActive(false)
    }, 10000) // Long lifetime
    
    return () => clearTimeout(timeout)
  }, [api, direction])
  
  // Apply gravity and update trajectory
  useFrame(() => {
    if (!isActive) return
    
    // The physics engine will handle gravity and trajectory
    // We just need to update the visual rotation if needed
    if (bombRef.current) {
      // Apply some rotation for visual effect
      bombRef.current.rotation.x += rotationSpeedRef.current.x * 0.01
      bombRef.current.rotation.y += rotationSpeedRef.current.y * 0.01
      bombRef.current.rotation.z += rotationSpeedRef.current.z * 0.01
    }
  })
  
  // Handle secondary explosions with delays
  useEffect(() => {
    // Set up timers for each secondary explosion
    const timers = secondaryExplosions.map(explosion => {
      return setTimeout(() => {
        // Play explosion sound for each secondary explosion
        playSound('explosion', 0.7)
        
        // Check for tanks in the blast radius of each secondary explosion
        // This would require a more complex collision detection system
        // For simplicity, we'll just use the onHit callback for direct hits
      }, explosion.delay)
    })
    
    // Clean up timers
    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [secondaryExplosions])
  
  return (
    <>
      {/* Only render the bomb if it's active */}
      {isActive && (
        <group ref={ref}>
          {/* Invisible physics sphere - needed for collision detection */}
          <mesh visible={false}>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshStandardMaterial opacity={0} transparent />
          </mesh>
          
          {/* Visible bomb model */}
          <group ref={bombRef} scale={[0.6, 0.6, 0.6]}>
            {/* Bomb body */}
            <mesh castShadow>
              <sphereGeometry args={[1, 32, 32]} />
              <meshStandardMaterial 
                color="#9b59b6" 
                metalness={0.7} 
                roughness={0.3}
              />
            </mesh>
            
            {/* Bomb details */}
            <mesh castShadow position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.4, 16]} />
              <meshStandardMaterial color="#7d3c98" />
            </mesh>
            
            {/* Fuse */}
            <mesh castShadow position={[0, 1.1, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
              <meshStandardMaterial color="#34495e" />
            </mesh>
            
            {/* Fuse spark */}
            <pointLight 
              position={[0, 1.4, 0]} 
              color="#ff7700" 
              intensity={2} 
              distance={2}
            />
            
            <mesh position={[0, 1.4, 0]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial 
                color="#ff7700" 
                emissive="#ff5500"
                emissiveIntensity={2}
              />
            </mesh>
            
            {/* Warning stripes */}
            {Array.from({ length: 3 }).map((_, i) => (
              <mesh 
                key={`stripe-${i}`} 
                position={[0, -0.5 + i * 0.5, 0]}
                castShadow
              >
                <torusGeometry args={[1.01, 0.1, 16, 32]} />
                <meshStandardMaterial color="#f1c40f" />
              </mesh>
            ))}
          </group>
        </group>
      )}
      
      {/* Show fire effects for all explosions */}
      {secondaryExplosions.map(explosion => (
        <FireEffect 
          key={explosion.id}
          position={explosion.position} 
          scale={explosion.scale}
          duration={2000} // Longer duration for super bomb explosions
          delay={explosion.delay}
        />
      ))}
    </>
  )
}

export default SuperBomb 