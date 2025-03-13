import { useState, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSphere } from '@react-three/cannon'
import { Vector3 } from 'three'
import FireEffect from './FireEffect'
import * as THREE from 'three'
import { playSound } from '../utils/audio'

// Define battlefield dimensions as constants for reuse
const BATTLEFIELD_SIZE = 100
const BATTLEFIELD_HALF_SIZE = BATTLEFIELD_SIZE / 2

interface CannonBallProps {
  position: [number, number, number]
  direction: [number, number, number]
  playerId: number
  onHit?: (targetId: number) => void
}

const CannonBall: React.FC<CannonBallProps> = ({ position, direction, playerId, onHit }) => {
  const [isActive, setIsActive] = useState(true)
  const [collisionPosition, setCollisionPosition] = useState<[number, number, number] | null>(null)
  const currentPositionRef = useRef<[number, number, number]>(position)
  const ballRef = useRef<THREE.Mesh>(null)
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const lastUpdateTimeRef = useRef<number>(Date.now())
  const rotationSpeedRef = useRef<THREE.Vector3>(new THREE.Vector3(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  ).normalize().multiplyScalar(5)) // Random rotation speed
  
  // Add a muzzle flash effect at the initial position
  const [showMuzzleFlash, setShowMuzzleFlash] = useState(true)
  
  // Create a physics-enabled sphere for the cannonball with 50kg mass
  const [ref, api] = useSphere(() => ({
    mass: 50, // 50kg as requested
    position,
    args: [0.5], // radius - larger for a cannonball
    type: 'Dynamic',
    collisionFilterGroup: 1, // projectile group (1)
    collisionFilterMask: 7, // collide with tanks (1), balloons (2), and houses (4)
    linearDamping: 0.1, // Some air resistance
    angularDamping: 0.1, // Some rotational damping
    material: {
      friction: 0.5,
      restitution: 0.3, // Some bounce for the cannonball
    },
    onCollide: (e) => {
      // Log collision for debugging
      console.log("Collision detected:", e.body?.userData);
      
      // Check if we hit a tank
      if (e.body && e.body.userData && e.body.userData.type === 'tank') {
        const targetId = e.body.userData.playerId
        // Don't damage your own tank
        if (targetId !== playerId && onHit) {
          onHit(targetId)
        }
      }
      
      // Check if we hit a balloon
      if (e.body && e.body.userData && e.body.userData.type === 'balloon') {
        console.log("Hit balloon with ID:", e.body.userData.id);
        // Balloons handle their own burst logic in their onCollide handler
      }
      
      // Check if we hit a house - no points should be awarded
      if (e.body && e.body.userData && e.body.userData.type === 'house') {
        console.log("Hit house - no points awarded");
        // Do nothing special for houses
      }
      
      // Use the current tracked position for the fire effect
      setCollisionPosition([...currentPositionRef.current])
      
      // Play explosion sound
      playSound('explosion', 0.7)
      
      // Deactivate cannonball on any collision
      setIsActive(false)
    },
  }))
  
  // Track the current position of the cannonball
  useEffect(() => {
    // Subscribe to position updates
    const unsubscribe = api.position.subscribe((pos) => {
      currentPositionRef.current = [pos[0], pos[1], pos[2]]
      
      // Check if the cannonball has gone outside the battlefield boundaries
      if (
        Math.abs(pos[0]) > BATTLEFIELD_HALF_SIZE || 
        Math.abs(pos[2]) > BATTLEFIELD_HALF_SIZE ||
        pos[1] < -5 || // If it falls below the ground
        pos[1] > 50    // If it goes too high
      ) {
        // Deactivate the cannonball if it's outside the battlefield
        setIsActive(false)
      }
    })
    
    return unsubscribe
  }, [api])
  
  // Apply initial velocity to the cannonball
  useEffect(() => {
    // Set initial velocity based on direction and power
    const initialSpeed = 30 // Higher initial speed for a heavy cannonball
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
    
    // Hide muzzle flash after a short time
    setTimeout(() => {
      setShowMuzzleFlash(false)
    }, 150)
    
    // Deactivate cannonball after a certain time
    const timeout = setTimeout(() => {
      setIsActive(false)
    }, 10000) // Longer lifetime for the cannonball
    
    return () => clearTimeout(timeout)
  }, [api, direction])
  
  // Apply gravity and update trajectory
  useFrame(() => {
    if (!isActive) return
    
    // The physics engine will handle gravity and trajectory
    // We just need to update the visual rotation if needed
    if (ballRef.current) {
      // Apply some rotation for visual effect
      ballRef.current.rotation.x += rotationSpeedRef.current.x * 0.01
      ballRef.current.rotation.y += rotationSpeedRef.current.y * 0.01
      ballRef.current.rotation.z += rotationSpeedRef.current.z * 0.01
    }
  })
  
  return (
    <>
      {/* Only render the cannonball if it's active */}
      {isActive && (
        <mesh ref={ref}>
          {/* Cannonball sphere */}
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial 
            color="#333333" 
            metalness={0.8} 
            roughness={0.2}
            emissive="#000000"
          />
          
          {/* Add some details to the cannonball */}
          <group ref={ballRef}>
            {/* Seam line around the cannonball */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.51, 0.03, 16, 32]} />
              <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.3} />
            </mesh>
            
            {/* Fuse hole */}
            <mesh position={[0, 0.4, 0]} rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
              <meshStandardMaterial color="black" />
            </mesh>
          </group>
        </mesh>
      )}
      
      {/* Muzzle flash effect at the initial position */}
      {showMuzzleFlash && (
        <group position={position}>
          {/* Muzzle flash light */}
          <pointLight 
            color="#ff7700" 
            intensity={5} 
            distance={5} 
            decay={2}
          />
          
          {/* Muzzle flash visual */}
          <mesh position={[direction[0] * 0.5, direction[1] * 0.5, direction[2] * 0.5]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial 
              color="#ff7700" 
              emissive="#ff5500"
              emissiveIntensity={2}
              transparent={true}
              opacity={0.8}
            />
          </mesh>
        </group>
      )}
      
      {/* Show fire effect at collision position */}
      {collisionPosition && (
        <FireEffect 
          position={collisionPosition} 
          scale={2.0} // Larger explosion for cannonball
          duration={1500} // Longer explosion
        />
      )}
    </>
  )
}

export default CannonBall 