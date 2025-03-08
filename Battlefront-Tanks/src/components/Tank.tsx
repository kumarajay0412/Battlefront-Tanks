import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useBox } from '@react-three/cannon'
import { Html } from '@react-three/drei'
import { useKeyboardControls } from '../hooks/useKeyboardControls'
import Projectile from './Projectile'
import * as THREE from 'three'

interface TankProps {
  position: [number, number, number]
  rotation: [number, number, number]
  color: string
  playerId: number
  health: number
  isCurrentPlayer: boolean
  onHit?: (targetId: number) => void
}

const Tank: React.FC<TankProps> = ({ 
  position, 
  rotation, 
  color, 
  playerId, 
  health, 
  isCurrentPlayer, 
  onHit
}) => {
  const [tankPosition, setTankPosition] = useState(position)
  const [tankRotation, setTankRotation] = useState(rotation)
  const [projectiles, setProjectiles] = useState<{ id: number; position: [number, number, number]; direction: [number, number, number] }[]>([])
  
  // Turret rotation and elevation state
  const [turretRotation, setTurretRotation] = useState(0)
  // Set default elevation to 10 degrees (convert to radians)
  const [turretElevation, setTurretElevation] = useState(10 * Math.PI / 180)
  const [wheelRotation, setWheelRotation] = useState(0)
  
  // References for tank parts
  const bodyRef = useRef<THREE.Mesh>(null)
  const turretRef = useRef<THREE.Group>(null)
  const cannonRef = useRef<THREE.Mesh>(null)
  const wheelsRef = useRef<THREE.Group>(null)
  
  // Create a physics-enabled box for the tank body
  const [physicsRef, physicsApi] = useBox(() => ({
    mass: 1000, // Increased mass for better stability
    position,
    rotation,
    args: [2, 1, 3], // width, height, depth
    type: 'Dynamic',
    allowSleep: false,
    linearDamping: 0.8, // Reduced damping for better movement
    angularDamping: 0.8, // Reduced damping for better rotation
    userData: {
      type: 'tank',
      playerId
    }
  }))
  
  // Set up keyboard controls for the current player
  const { moveForward, moveBackward, turnLeft, turnRight, shoot } = useKeyboardControls(isCurrentPlayer)
  
  // Additional keyboard state for arrow keys
  const [arrowKeys, setArrowKeys] = useState({
    up: false,
    down: false,
    left: false,
    right: false
  })
  
  // Set up arrow key controls
  useEffect(() => {
    if (!isCurrentPlayer) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setArrowKeys(prev => ({ ...prev, up: true }))
          e.preventDefault()
          break
        case 'ArrowDown':
          setArrowKeys(prev => ({ ...prev, down: true }))
          e.preventDefault()
          break
        case 'ArrowLeft':
          setArrowKeys(prev => ({ ...prev, left: true }))
          e.preventDefault()
          break
        case 'ArrowRight':
          setArrowKeys(prev => ({ ...prev, right: true }))
          e.preventDefault()
          break
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setArrowKeys(prev => ({ ...prev, up: false }))
          break
        case 'ArrowDown':
          setArrowKeys(prev => ({ ...prev, down: false }))
          break
        case 'ArrowLeft':
          setArrowKeys(prev => ({ ...prev, left: false }))
          break
        case 'ArrowRight':
          setArrowKeys(prev => ({ ...prev, right: false }))
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isCurrentPlayer])
  
  // Debug state to check if controls are working
  const [debugControls, setDebugControls] = useState({ 
    moveForward, 
    moveBackward, 
    turnLeft, 
    turnRight, 
    shoot,
    arrowUp: arrowKeys.up,
    arrowDown: arrowKeys.down,
    arrowLeft: arrowKeys.left,
    arrowRight: arrowKeys.right
  })
  
  // Update debug state when controls change
  useEffect(() => {
    setDebugControls({ 
      moveForward, 
      moveBackward, 
      turnLeft, 
      turnRight, 
      shoot,
      arrowUp: arrowKeys.up,
      arrowDown: arrowKeys.down,
      arrowLeft: arrowKeys.left,
      arrowRight: arrowKeys.right
    })
  }, [moveForward, moveBackward, turnLeft, turnRight, shoot, arrowKeys])
  
  // Handle tank movement, rotation, and turret controls
  useFrame((state, delta) => {
    if (!isCurrentPlayer || !physicsApi) return
    
    const speed = 80 // Increased speed significantly more
    const turnSpeed = 8.0 // Increased turn speed significantly more
    const turretRotationSpeed = 1.5 * delta
    const turretElevationSpeed = 1.0 * delta
    
    // Forward/backward movement with WASD
    if (moveForward) {
      // Get the tank's forward direction based on its rotation
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), tankRotation[1])
      // Apply impulse in that direction
      const impulse: [number, number, number] = [forward.x * speed * 100 * delta, 0, forward.z * speed * 100 * delta]
      physicsApi.applyImpulse(impulse, [0, 0, 0])
      // Rotate wheels forward
      setWheelRotation(prev => prev - 0.1)
      
      // Ensure the physics body is awake
      physicsApi.wakeUp()
    } else if (moveBackward) {
      // Get the tank's backward direction based on its rotation
      const backward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), tankRotation[1])
      // Apply impulse in that direction
      const impulse: [number, number, number] = [backward.x * speed * 100 * delta, 0, backward.z * speed * 100 * delta]
      physicsApi.applyImpulse(impulse, [0, 0, 0])
      // Rotate wheels backward
      setWheelRotation(prev => prev + 0.1)
      
      // Ensure the physics body is awake
      physicsApi.wakeUp()
    }
    
    // Left/right rotation with WASD
    if (turnLeft) {
      const torque: [number, number, number] = [0, turnSpeed * 100 * delta, 0]
      physicsApi.applyTorque(torque)
      
      // Ensure the physics body is awake
      physicsApi.wakeUp()
    } else if (turnRight) {
      const torque: [number, number, number] = [0, -turnSpeed * 100 * delta, 0]
      physicsApi.applyTorque(torque)
      
      // Ensure the physics body is awake
      physicsApi.wakeUp()
    }
    
    // Turret rotation with arrow keys
    if (arrowKeys.left) {
      setTurretRotation(prev => prev + turretRotationSpeed)
    } else if (arrowKeys.right) {
      setTurretRotation(prev => prev - turretRotationSpeed)
    }
    
    // Turret elevation with arrow keys - with new limits
    if (arrowKeys.up) {
      // Elevate the cannon (with limit of 70 degrees)
      const maxElevation = 70 * Math.PI / 180 // 70 degrees in radians
      setTurretElevation(prev => Math.min(prev + turretElevationSpeed, maxElevation))
    } else if (arrowKeys.down) {
      // Lower the cannon (with limit of -10 degrees)
      const minElevation = -10 * Math.PI / 180 // -10 degrees in radians
      setTurretElevation(prev => Math.max(prev - turretElevationSpeed, minElevation))
    }
    
    // Update position and rotation state for UI and other calculations
    physicsApi.position.subscribe((p) => setTankPosition([p[0], p[1], p[2]]))
    physicsApi.rotation.subscribe((r) => setTankRotation([r[0], r[1], r[2]]))
    
    // Apply turret rotation and elevation
    if (turretRef.current) {
      turretRef.current.rotation.y = turretRotation
    }
    
    if (cannonRef.current) {
      cannonRef.current.rotation.x = turretElevation
    }
  })
  
  // Handle shooting
  useEffect(() => {
    if (shoot && isCurrentPlayer) {
      // Calculate projectile direction based on tank rotation and turret rotation
      const tankYaw = tankRotation[1]
      const combinedYaw = tankYaw + turretRotation
      
      const direction: [number, number, number] = [
        -Math.sin(combinedYaw), 
        Math.sin(turretElevation), 
        -Math.cos(combinedYaw)
      ]
      
      // Calculate projectile starting position (from the cannon tip)
      const cannonLength = 1.5
      const projectilePosition: [number, number, number] = [
        tankPosition[0] + direction[0] * cannonLength,
        tankPosition[1] + 1 + direction[1] * cannonLength,
        tankPosition[2] + direction[2] * cannonLength
      ]
      
      // Add new projectile
      setProjectiles(prev => [
        ...prev, 
        { 
          id: Date.now(), 
          position: projectilePosition, 
          direction 
        }
      ])
    }
  }, [shoot, isCurrentPlayer, tankPosition, tankRotation, turretRotation, turretElevation])
  
  // Ensure turret always faces the firing direction
  useEffect(() => {
    // Calculate the direction vector based on turret rotation and elevation
    const directionVector = new THREE.Vector3(
      -Math.sin(turretRotation),
      Math.sin(turretElevation),
      -Math.cos(turretRotation)
    ).normalize();
    
    // Apply the rotation to the turret
    if (turretRef.current) {
      turretRef.current.rotation.y = turretRotation;
    }
    
    // Apply the elevation to the cannon
    if (cannonRef.current) {
      cannonRef.current.rotation.x = turretElevation;
    }
  }, [turretRotation, turretElevation]);
  
  // Remove projectiles that have traveled too far
  useEffect(() => {
    const timer = setTimeout(() => {
      if (projectiles.length > 0) {
        setProjectiles(prev => prev.slice(1))
      }
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [projectiles])

  return (
    <>
      {/* Tank body with physics - make it visible */}
      <group ref={physicsRef}>
        {/* Invisible physics box - needed for collision detection */}
        <mesh castShadow receiveShadow visible={false}>
          <boxGeometry args={[2, 1, 3]} />
          <meshStandardMaterial color={color} opacity={0} transparent />
        </mesh>
        
        {/* Tank body made of shapes */}
        <group position={[0, 0, 0]}>
          {/* Tank base/chassis */}
          <mesh ref={bodyRef} castShadow receiveShadow>
            <boxGeometry args={[2, 0.5, 3]} />
            <meshStandardMaterial color={color} />
          </mesh>
          
          {/* Tank upper body */}
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.8, 0.4, 2.5]} />
            <meshStandardMaterial color={color} />
          </mesh>
          
          {/* Tank wheels */}
          <group ref={wheelsRef}>
            {/* Left wheels */}
            <group position={[-1.1, -0.3, 0]}>
              <mesh position={[0, 0, -1.2]} rotation={[wheelRotation, 0, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color="darkgray" />
              </mesh>
              <mesh position={[0, 0, 0]} rotation={[wheelRotation, 0, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color="darkgray" />
              </mesh>
              <mesh position={[0, 0, 1.2]} rotation={[wheelRotation, 0, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color="darkgray" />
              </mesh>
            </group>
            
            {/* Right wheels */}
            <group position={[1.1, -0.3, 0]}>
              <mesh position={[0, 0, -1.2]} rotation={[wheelRotation, 0, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color="darkgray" />
              </mesh>
              <mesh position={[0, 0, 0]} rotation={[wheelRotation, 0, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color="darkgray" />
              </mesh>
              <mesh position={[0, 0, 1.2]} rotation={[wheelRotation, 0, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color="darkgray" />
              </mesh>
            </group>
            
            {/* Tank tracks (simplified as boxes) */}
            <mesh position={[-1.1, -0.3, 0]} castShadow>
              <boxGeometry args={[0.2, 0.1, 3]} />
              <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[1.1, -0.3, 0]} castShadow>
              <boxGeometry args={[0.2, 0.1, 3]} />
              <meshStandardMaterial color="black" />
            </mesh>
          </group>
          
          {/* Tank turret (can rotate 360 degrees) */}
          <group ref={turretRef} position={[0, 0.9, 0]}>
            {/* Turret base */}
            <mesh castShadow>
              <cylinderGeometry args={[0.8, 0.9, 0.5, 16]} />
              <meshStandardMaterial color={color} />
            </mesh>
            
            {/* Turret top */}
            <mesh position={[0, 0.3, 0]} castShadow>
              <sphereGeometry args={[0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={color} />
            </mesh>
            
            {/* Tank cannon (can move up and down) */}
            <group position={[0, 0.2, 0]}>
              <group ref={cannonRef}>
                <mesh position={[0, 0, -0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.15, 0.15, 1.5, 16]} />
                  <meshStandardMaterial color="darkgray" />
                </mesh>
                
                {/* Cannon tip (visual indicator of firing direction) */}
                <mesh position={[0, 0, -1.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.17, 0.1, 0.2, 16]} />
                  <meshStandardMaterial color="black" />
                </mesh>
              </group>
            </group>
          </group>
        </group>
        
        {/* Health bar */}
        <Html position={[0, 1.5, 0]} center>
          <div style={{ 
            width: '50px', 
            height: '5px', 
            background: 'gray',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${health}%`, 
              height: '100%', 
              background: health > 50 ? 'green' : health > 25 ? 'orange' : 'red',
              transition: 'width 0.3s ease'
            }} />
          </div>
          
          {/* Debug controls display (only visible for current player) */}
          {isCurrentPlayer && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '-75px',
              width: '150px',
              background: 'rgba(0,0,0,0.5)',
              color: 'white',
              padding: '5px',
              borderRadius: '3px',
              fontSize: '10px',
              textAlign: 'center'
            }}>
              <div>W: {debugControls.moveForward ? 'ON' : 'OFF'}</div>
              <div>S: {debugControls.moveBackward ? 'ON' : 'OFF'}</div>
              <div>A: {debugControls.turnLeft ? 'ON' : 'OFF'}</div>
              <div>D: {debugControls.turnRight ? 'ON' : 'OFF'}</div>
              <div>SPACE: {debugControls.shoot ? 'ON' : 'OFF'}</div>
              <div>↑: {debugControls.arrowUp ? 'ON' : 'OFF'}</div>
              <div>↓: {debugControls.arrowDown ? 'ON' : 'OFF'}</div>
              <div>←: {debugControls.arrowLeft ? 'ON' : 'OFF'}</div>
              <div>→: {debugControls.arrowRight ? 'ON' : 'OFF'}</div>
              <div>Turret: {(turretRotation * 180 / Math.PI).toFixed(0)}°</div>
              <div>Elevation: {(turretElevation * 180 / Math.PI).toFixed(0)}°</div>
            </div>
          )}
        </Html>
      </group>
      
      {/* Render projectiles */}
      {projectiles.map(projectile => (
        <Projectile 
          key={projectile.id}
          position={projectile.position}
          direction={projectile.direction}
          playerId={playerId}
          onHit={onHit}
        />
      ))}
    </>
  )
}

export default Tank 