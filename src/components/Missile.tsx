import { useState, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSphere } from '@react-three/cannon'
import * as THREE from 'three'
import FireEffect from './FireEffect'
import { playSound } from '../utils/audio'

// Define battlefield dimensions as constants for reuse
const BATTLEFIELD_SIZE = 100
const BATTLEFIELD_HALF_SIZE = BATTLEFIELD_SIZE / 2

interface MissileProps {
  position: [number, number, number]
  direction: [number, number, number]
  playerId: number
  onHit?: (targetId: number) => void
  isSubmissile?: boolean
  submissileIndex?: number
}

const Missile: React.FC<MissileProps> = ({ 
  position, 
  direction, 
  playerId, 
  onHit,
  isSubmissile = false,
  submissileIndex = 0
}) => {
  const [isActive, setIsActive] = useState(true)
  const [collisionPosition, setCollisionPosition] = useState<[number, number, number] | null>(null)
  const [submissiles, setSubmissiles] = useState<{
    position: [number, number, number];
    direction: [number, number, number];
    index: number;
  }[]>([])
  
  const currentPositionRef = useRef<[number, number, number]>(position)
  const missileRef = useRef<THREE.Group>(null)
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const lastUpdateTimeRef = useRef<number>(Date.now())
  const launchPhaseRef = useRef<boolean>(true)
  const launchTimeRef = useRef<number>(Date.now())
  
  // Add smoke trail effect
  const [smokeTrail, setSmokeTrail] = useState<{
    position: [number, number, number];
    size: number;
    opacity: number;
    id: number;
  }[]>([])
  
  // Create a physics-enabled sphere for the missile
  const [ref, api] = useSphere(() => ({
    mass: isSubmissile ? 10 : 20, // Submissiles are lighter
    position,
    args: [isSubmissile ? 0.15 : 0.25], // Submissiles are smaller
    type: 'Dynamic',
    collisionFilterGroup: 2, // projectile group
    collisionFilterMask: 7, // collide with tanks (1), balloons (2), and houses (4)
    linearDamping: 0.0,
    angularDamping: 0.0,
    allowSleep: false,
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
      
      // If this is the main missile (not a submissile), create submissiles
      if (!isSubmissile) {
        // Create 5 submissiles in different directions
        const submissileDirections: [number, number, number][] = [
          // Slightly forward and to the sides
          [direction[0] + 0.2, direction[1] + 0.1, direction[2] + 0.2],
          [direction[0] - 0.2, direction[1] + 0.1, direction[2] - 0.2],
          [direction[0] + 0.3, direction[1] - 0.1, direction[2] - 0.1],
          [direction[0] - 0.3, direction[1] - 0.1, direction[2] + 0.1],
          [direction[0], direction[1] + 0.3, direction[2]], // One straight up
        ]
        
        // Normalize all directions
        const normalizedDirections = submissileDirections.map(dir => {
          const length = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1] + dir[2] * dir[2])
          return [dir[0] / length, dir[1] / length, dir[2] / length] as [number, number, number]
        })
        
        // Create submissiles
        setSubmissiles(normalizedDirections.map((dir, index) => ({
          position: [...currentPositionRef.current] as [number, number, number],
          direction: dir,
          index
        })))
        
        // Play explosion sound
        playSound('explosion', 0.5)
      } else {
        // Submissile explosion
        playSound('explosion', 0.3)
      }
      
      // Deactivate missile on any collision
      setIsActive(false)
    },
  }))
  
  // Track the current position of the missile
  useEffect(() => {
    // Subscribe to position updates
    const unsubscribe = api.position.subscribe((pos) => {
      currentPositionRef.current = [pos[0], pos[1], pos[2]]
      
      // Check if the missile has gone outside the battlefield boundaries
      if (
        Math.abs(pos[0]) > BATTLEFIELD_HALF_SIZE || 
        Math.abs(pos[2]) > BATTLEFIELD_HALF_SIZE ||
        pos[1] < -5 || // If it falls below the ground
        pos[1] > 50    // If it goes too high
      ) {
        // Deactivate the missile if it's outside the battlefield
        setIsActive(false)
      }
    })
    
    return unsubscribe
  }, [api])
  
  // Apply initial velocity to the missile
  useEffect(() => {
    // Set initial velocity (lower for launch phase)
    const initialSpeed = isSubmissile ? 25 : 20
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
    
    // Reset the timers
    lastUpdateTimeRef.current = Date.now()
    launchTimeRef.current = Date.now()
    
    // Deactivate missile after a certain time
    const timeout = setTimeout(() => {
      setIsActive(false)
    }, isSubmissile ? 3000 : 6000) // Submissiles have shorter lifetime
    
    return () => clearTimeout(timeout)
  }, [api, direction, isSubmissile])
  
  // Apply gravity and update trajectory
  useFrame(() => {
    if (!isActive) return
    
    // Calculate time delta
    const now = Date.now()
    const deltaTime = (now - lastUpdateTimeRef.current) / 1000 // in seconds
    lastUpdateTimeRef.current = now
    
    // Check if we're still in the launch phase (first 0.5 seconds)
    const launchDuration = isSubmissile ? 0.2 : 0.5 // seconds
    const timeSinceLaunch = (now - launchTimeRef.current) / 1000
    
    if (launchPhaseRef.current && timeSinceLaunch < launchDuration) {
      // During launch phase, accelerate the missile
      const acceleration = isSubmissile ? 60 : 40 // units per second squared
      
      // Accelerate in the direction of travel
      velocityRef.current.x += direction[0] * acceleration * deltaTime
      velocityRef.current.y += direction[1] * acceleration * deltaTime
      velocityRef.current.z += direction[2] * acceleration * deltaTime
      
      // Add a slight upward boost during launch
      velocityRef.current.y += (isSubmissile ? 10 : 5) * deltaTime
    } 
    else {
      // End of launch phase
      if (launchPhaseRef.current) {
        launchPhaseRef.current = false
      }
      
      // Apply gravity (9.8 m/s²)
      const gravity = 9.8
      velocityRef.current.y -= gravity * deltaTime
      
      // Add some air resistance
      const airResistance = 0.05
      velocityRef.current.x *= (1 - airResistance * deltaTime)
      velocityRef.current.z *= (1 - airResistance * deltaTime)
    }
    
    // Update velocity
    api.velocity.set(
      velocityRef.current.x,
      velocityRef.current.y,
      velocityRef.current.z
    )
    
    // Orient the missile in the direction of travel
    if (missileRef.current) {
      // Create a direction vector based on current velocity
      const directionVector = velocityRef.current.clone().normalize()
      
      // Create a quaternion from the direction vector
      const quaternion = new THREE.Quaternion()
      const up = new THREE.Vector3(0, 1, 0)
      const axis = new THREE.Vector3()
      
      // If direction is parallel to up, use a different reference vector
      if (Math.abs(directionVector.y) > 0.99) {
        axis.set(1, 0, 0).cross(directionVector).normalize()
      } else {
        axis.copy(up).cross(directionVector).normalize()
      }
      
      const angle = Math.acos(up.dot(directionVector))
      quaternion.setFromAxisAngle(axis, angle)
      
      // Apply the rotation
      missileRef.current.quaternion.copy(quaternion)
      
      // Rotate to align with direction of travel
      missileRef.current.rotateX(Math.PI / 2)
    }
    
    // Add smoke trail particles
    if (Math.random() > 0.7) { // Only add smoke some of the time
      setSmokeTrail(prev => [
        ...prev,
        {
          position: [...currentPositionRef.current] as [number, number, number],
          size: isSubmissile ? 0.2 + Math.random() * 0.2 : 0.3 + Math.random() * 0.3,
          opacity: 0.7 + Math.random() * 0.3,
          id: Date.now() + Math.random()
        }
      ])
    }
    
    // Remove old smoke particles
    setSmokeTrail(prev => prev.filter(particle => {
      particle.opacity -= 0.02
      particle.size += 0.02
      return particle.opacity > 0
    }))
  })
  
  return (
    <>
      {/* Only render the missile if it's active */}
      {isActive && (
        <group ref={ref}>
          {/* Invisible physics sphere - needed for collision detection */}
          <mesh visible={false}>
            <sphereGeometry args={[isSubmissile ? 0.15 : 0.25, 16, 16]} />
            <meshStandardMaterial opacity={0} transparent />
          </mesh>
          
          {/* Visible missile model */}
          <group 
            ref={missileRef} 
            scale={isSubmissile ? [0.1, 0.1, 0.5] : [0.15, 0.15, 0.7]}
          >
            {/* Missile body */}
            <mesh castShadow position={[0, 0, 0]}>
              <cylinderGeometry args={[0.8, 0.8, 5, 16]} />
              <meshStandardMaterial color={isSubmissile ? "#ff4500" : "#e74c3c"} metalness={0.3} roughness={0.7} />
            </mesh>
            
            {/* Pointed nose cone */}
            <mesh castShadow position={[0, 2.5, 0]}>
              <coneGeometry args={[0.8, 2, 16]} />
              <meshStandardMaterial color={isSubmissile ? "#ff4500" : "#e74c3c"} metalness={0.3} roughness={0.7} />
            </mesh>
            
            {/* Fins */}
            {Array.from({ length: 4 }).map((_, i) => (
              <mesh 
                key={`fin-${i}`} 
                position={[0, -1.5, 0]} 
                rotation={[0, (Math.PI / 2) * i, 0]}
                castShadow
              >
                <boxGeometry args={[0.1, 1, 1.5]} />
                <meshStandardMaterial color="#c0392b" metalness={0.3} roughness={0.7} />
              </mesh>
            ))}
            
            {/* Rocket exhaust */}
            <pointLight 
              position={[0, -2.5, 0]} 
              color="#ff7700" 
              intensity={isSubmissile ? 2 : 5} 
              distance={isSubmissile ? 2 : 5}
            />
            
            <mesh position={[0, -2.5, 0]}>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial 
                color="#ff7700" 
                emissive="#ff5500"
                emissiveIntensity={2}
                transparent={true}
                opacity={0.8}
              />
            </mesh>
          </group>
        </group>
      )}
      
      {/* Smoke trail */}
      {smokeTrail.map(particle => (
        <mesh 
          key={particle.id} 
          position={particle.position}
        >
          <sphereGeometry args={[particle.size, 8, 8]} />
          <meshStandardMaterial 
            color="#888888" 
            transparent={true} 
            opacity={particle.opacity}
          />
        </mesh>
      ))}
      
      {/* Show fire effect at collision position */}
      {collisionPosition && (
        <FireEffect 
          position={collisionPosition} 
          scale={isSubmissile ? 1.0 : 1.5} 
          duration={isSubmissile ? 800 : 1200}
        />
      )}
      
      {/* Render submissiles */}
      {submissiles.map(submissile => (
        <Missile
          key={`submissile-${submissile.index}`}
          position={submissile.position}
          direction={submissile.direction}
          playerId={playerId}
          onHit={onHit}
          isSubmissile={true}
          submissileIndex={submissile.index}
        />
      ))}
    </>
  )
}

export default Missile 