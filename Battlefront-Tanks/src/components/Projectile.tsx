import { useState, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSphere } from '@react-three/cannon'
import { Vector3 } from 'three'
import FireEffect from './FireEffect'
import * as THREE from 'three'

// Define battlefield dimensions as constants for reuse
const BATTLEFIELD_SIZE = 100
const BATTLEFIELD_HALF_SIZE = BATTLEFIELD_SIZE / 2

interface ProjectileProps {
  position: [number, number, number]
  direction: [number, number, number]
  playerId: number
  onHit?: (targetId: number) => void
}

const Projectile: React.FC<ProjectileProps> = ({ position, direction, playerId, onHit }) => {
  const [isActive, setIsActive] = useState(true)
  const [collisionPosition, setCollisionPosition] = useState<[number, number, number] | null>(null)
  const currentPositionRef = useRef<[number, number, number]>(position)
  const projectileRef = useRef<THREE.Group>(null)
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const lastUpdateTimeRef = useRef<number>(Date.now())
  const launchPhaseRef = useRef<boolean>(true)
  const launchTimeRef = useRef<number>(Date.now())
  
  // Create a physics-enabled sphere for the projectile (collision detection)
  const [ref, api] = useSphere(() => ({
    mass: 5,
    position,
    args: [0.2], // radius - keep this for physics, but visual will be different
    type: 'Dynamic',
    collisionFilterGroup: 2, // projectile group
    collisionFilterMask: 1, // collide with tanks and terrain
    // Turn off gravity in the physics engine - we'll handle it manually
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
      
      // Deactivate projectile on any collision
      setIsActive(false)
    },
  }))
  
  // Track the current position of the projectile
  useEffect(() => {
    // Subscribe to position updates
    const unsubscribe = api.position.subscribe((pos) => {
      currentPositionRef.current = [pos[0], pos[1], pos[2]]
      
      // Check if the projectile has gone outside the battlefield boundaries
      if (
        Math.abs(pos[0]) > BATTLEFIELD_HALF_SIZE || 
        Math.abs(pos[2]) > BATTLEFIELD_HALF_SIZE ||
        pos[1] < -5 || // If it falls below the ground
        pos[1] > 50    // If it goes too high
      ) {
        // Deactivate the projectile if it's outside the battlefield
        setIsActive(false)
      }
    })
    
    return unsubscribe
  }, [api])
  
  // Apply initial velocity to the projectile
  useEffect(() => {
    // Set initial velocity (lower for launch phase)
    const initialSpeed = 20
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
    
    // Deactivate projectile after a certain time
    const timeout = setTimeout(() => {
      setIsActive(false)
    }, 6000) // Increased time to see the full trajectory
    
    return () => clearTimeout(timeout)
  }, [api, direction])
  
  // Apply gravity and update trajectory
  useFrame(() => {
    if (!isActive) return
    
    // Calculate time delta
    const now = Date.now()
    const deltaTime = (now - lastUpdateTimeRef.current) / 1000 // in seconds
    lastUpdateTimeRef.current = now
    
    // Check if we're still in the launch phase (first 0.5 seconds)
    const launchDuration = 0.5 // seconds
    const timeSinceLaunch = (now - launchTimeRef.current) / 1000
    
    if (launchPhaseRef.current && timeSinceLaunch < launchDuration) {
      // During launch phase, accelerate the missile
      const acceleration = 40 // units per second squared
      
      // Accelerate in the direction of travel
      velocityRef.current.x += direction[0] * acceleration * deltaTime
      velocityRef.current.y += direction[1] * acceleration * deltaTime
      velocityRef.current.z += direction[2] * acceleration * deltaTime
      
      // Add a slight upward boost during launch
      velocityRef.current.y += 5 * deltaTime
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
    
    // Orient the projectile in the direction of travel
    if (projectileRef.current) {
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
      projectileRef.current.quaternion.copy(quaternion)
      
      // Rotate to align with direction of travel
      projectileRef.current.rotateX(Math.PI / 2)
    }
  })
  
  return (
    <>
      {/* Only render the projectile if it's active */}
      {isActive && (
        <group ref={ref}>
          {/* Invisible physics sphere - needed for collision detection */}
          <mesh visible={false}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial opacity={0} transparent />
          </mesh>
          
          {/* Visible missile model based on reference image */}
          <group ref={projectileRef} scale={[0.15, 0.15, 0.7]}>
            {/* Missile body (long cylinder with grid lines) */}
            <mesh castShadow position={[0, 0, 0]}>
              <cylinderGeometry args={[0.8, 0.8, 5, 16]} />
              <meshStandardMaterial color="white" metalness={0.3} roughness={0.7} />
            </mesh>
            
            {/* Grid lines on body */}
            {Array.from({ length: 6 }).map((_, i) => (
              <mesh key={`ring-${i}`} position={[0, -1 + i * 0.8, 0]} castShadow>
                <torusGeometry args={[0.81, 0.02, 8, 24]} />
                <meshStandardMaterial color="black" />
              </mesh>
            ))}
            
            {/* Vertical grid lines */}
            {Array.from({ length: 8 }).map((_, i) => (
              <group 
                key={`line-${i}`} 
                position={[0, 0, 0]} 
                rotation={[0, (Math.PI / 4) * i, 0]}
              >
                <mesh castShadow>
                  <boxGeometry args={[0.02, 5, 0.02]} />
                  <meshStandardMaterial color="black" />
                </mesh>
                <mesh position={[0.81, 0, 0]} castShadow>
                  <boxGeometry args={[0.02, 5, 0.02]} />
                  <meshStandardMaterial color="black" />
                </mesh>
              </group>
            ))}
            
            {/* Pointed nose cone with checkered pattern */}
            <group position={[0, 2.5, 0]}>
              <mesh castShadow>
                <coneGeometry args={[0.8, 2, 16]} />
                <meshStandardMaterial color="white" metalness={0.3} roughness={0.7} />
              </mesh>
              
              {/* Checkered pattern on nose */}
              {Array.from({ length: 4 }).map((_, i) => (
                <mesh 
                  key={`checker-${i}`} 
                  position={[0, 0, 0]} 
                  rotation={[0, (Math.PI / 2) * i, 0]}
                >
                  <cylinderGeometry 
                    args={[0.801, 0.401, 1, 4, 1, true]} 
                    onUpdate={(geometry) => {
                      // Only keep two opposite segments for checkered pattern
                      const posAttr = geometry.getAttribute('position');
                      const normAttr = geometry.getAttribute('normal');
                      const uvAttr = geometry.getAttribute('uv');
                      
                      for (let j = 0; j < posAttr.count; j++) {
                        const u = uvAttr.getX(j);
                        if (u > 0.25 && u < 0.75) {
                          // Hide these segments
                          posAttr.setXYZ(j, 0, 0, 0);
                          normAttr.setXYZ(j, 0, 0, 0);
                        }
                      }
                      
                      posAttr.needsUpdate = true;
                      normAttr.needsUpdate = true;
                    }}
                  />
                  <meshStandardMaterial color="black" side={THREE.DoubleSide} />
                </mesh>
              ))}
            </group>
            
            {/* X-shaped fins at bottom */}
            <group position={[0, -2.5, 0]}>
              {/* Horizontal fins (X-shape) */}
              <mesh rotation={[0, Math.PI/4, 0]} castShadow>
                <boxGeometry args={[3, 0.1, 0.6]} />
                <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.5} />
              </mesh>
              
              <mesh rotation={[0, -Math.PI/4, 0]} castShadow>
                <boxGeometry args={[3, 0.1, 0.6]} />
                <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.5} />
              </mesh>
            </group>
            
            {/* Enhanced rocket exhaust effect - larger during launch phase */}
            <pointLight 
              position={[0, -2.7, 0]} 
              color="orange" 
              intensity={launchPhaseRef.current ? 4 : 2} 
              distance={launchPhaseRef.current ? 5 : 3} 
            />
            
            {/* Main exhaust glow */}
            <mesh position={[0, -2.7, 0]}>
              <sphereGeometry args={[launchPhaseRef.current ? 0.5 : 0.3, 16, 16]} />
              <meshStandardMaterial 
                color="orange" 
                emissive="orange" 
                emissiveIntensity={launchPhaseRef.current ? 3 : 2} 
                transparent={true} 
                opacity={0.8} 
              />
            </mesh>
            
            {/* Additional exhaust particles during launch phase */}
            {launchPhaseRef.current && Array.from({ length: 5 }).map((_, i) => (
              <mesh 
                key={`exhaust-${i}`} 
                position={[
                  (Math.random() - 0.5) * 0.3,
                  -2.9 - i * 0.2,
                  (Math.random() - 0.5) * 0.3
                ]}
              >
                <sphereGeometry args={[0.2 - i * 0.03, 8, 8]} />
                <meshStandardMaterial 
                  color={i < 2 ? "yellow" : "orange"} 
                  emissive={i < 2 ? "yellow" : "orange"} 
                  emissiveIntensity={2.5 - i * 0.4} 
                  transparent={true} 
                  opacity={0.9 - i * 0.15} 
                />
              </mesh>
            ))}
          </group>
        </group>
      )}
      
      {/* Show fire effect at collision position */}
      {collisionPosition && (
        <FireEffect 
          position={collisionPosition} 
          scale={1.5}
          duration={1000}
        />
      )}
    </>
  )
}

export default Projectile 