import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useBox } from '@react-three/cannon'
import { Html } from '@react-three/drei'
import { useKeyboardControls } from '../hooks/useKeyboardControls'
import Projectile from './Projectile'
import CannonBall from './CannonBall'
import TrajectoryPredictor from './TrajectoryPredictor'
import * as THREE from 'three'
import { playSound } from '../utils/audio'

// Define battlefield dimensions as constants for reuse
const BATTLEFIELD_SIZE = 100
const BATTLEFIELD_HALF_SIZE = BATTLEFIELD_SIZE / 2
const BOUNDARY_MARGIN = 5 // Keep tanks this far from the edge

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
  const [projectiles, setProjectiles] = useState<{ id: number; position: [number, number, number]; direction: [number, number, number]; type: 'missile' | 'cannonball' }[]>([])
  
  // Turret rotation and elevation state
  const [turretRotation, setTurretRotation] = useState(0)
  // Set default elevation to 10 degrees (convert to radians)
  const [turretElevation, setTurretElevation] = useState(10 * Math.PI / 180)
  const [wheelRotation, setWheelRotation] = useState(0)
  
  // Add a canShoot state to track if the tank can fire
  const [canShoot, setCanShoot] = useState(true)
  // Add a lastShootState to track the previous shoot state
  const lastShootState = useRef(false)
  
  // Add state for trajectory prediction
  const [showTrajectory, setShowTrajectory] = useState(false)
  const [trajectoryDirection, setTrajectoryDirection] = useState<[number, number, number]>([0, 0, 0])
  const [trajectoryStart, setTrajectoryStart] = useState<[number, number, number]>([0, 0, 0])
  
  // Add state for mouse controls
  const [isRightMouseDown, setIsRightMouseDown] = useState(false)
  
  // References for tank parts
  const bodyRef = useRef<THREE.Mesh>(null)
  const turretRef = useRef<THREE.Group>(null)
  const cannonRef = useRef<THREE.Mesh>(null)
  const wheelsRef = useRef<THREE.Group>(null)
  
  // Create a physics-enabled box for the tank body
  const [physicsRef, physicsApi] = useBox(() => ({
    mass: 5000, // Very high mass for better stability
    position,
    rotation,
    args: [2, 0.8, 3], // width, height, depth - lower height for better stability
    type: 'Dynamic',
    allowSleep: false,
    linearDamping: 0.9, // High damping to prevent sliding
    angularDamping: 0.9, // High damping to prevent tipping
    friction: 1.0, // Maximum friction for better traction
    restitution: 0.1, // Very low bounciness
    fixedRotation: true, // Prevent rotation on X and Z axes (only allow Y rotation)
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
  
  // Add mouse event listeners for trajectory prediction
  useEffect(() => {
    if (!isCurrentPlayer) return
    
    const handleMouseDown = (e: MouseEvent) => {
      // Right mouse button (button 2)
      if (e.button === 2) {
        setIsRightMouseDown(true)
        setShowTrajectory(true)
      }
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      // Right mouse button (button 2)
      if (e.button === 2) {
        setIsRightMouseDown(false)
        setShowTrajectory(false)
      }
    }
    
    // Prevent context menu on right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }
    
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('contextmenu', handleContextMenu)
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('contextmenu', handleContextMenu)
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
  
  // Helper function to check if a position is within battlefield boundaries
  const isWithinBoundaries = (position: [number, number, number]): boolean => {
    const [x, y, z] = position
    const maxBound = BATTLEFIELD_HALF_SIZE - BOUNDARY_MARGIN
    
    return (
      x >= -maxBound && 
      x <= maxBound && 
      z >= -maxBound && 
      z <= maxBound
    )
  }
  
  // Handle tank movement, rotation, and turret controls
  useFrame((state, delta) => {
    if (!isCurrentPlayer || !physicsApi) return
    
    // Tank movement parameters - increased speeds
    const maxSpeed = 20; // Increased from 10 to 20 for faster movement
    const accelerationFactor = 1.5; // Additional acceleration factor for more responsive movement
    const turnSpeed = 2.0; // Increased from 1.5 to 2.0 for faster turning
    const turretRotationSpeed = 1.5 * delta;
    const turretElevationSpeed = 1.0 * delta;
    
    // Get current velocity
    let currentVelocity = new THREE.Vector3();
    physicsApi.velocity.subscribe((v) => {
      currentVelocity.set(v[0], v[1], v[2]);
    });
    
    // Calculate current speed (horizontal only)
    const currentSpeed = Math.sqrt(currentVelocity.x * currentVelocity.x + currentVelocity.z * currentVelocity.z);
    
    // Get the tank's forward direction based on its rotation
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), tankRotation[1]);
    
    // Calculate the dot product to determine if we're moving forward or backward
    const dotProduct = forward.dot(new THREE.Vector3(currentVelocity.x, 0, currentVelocity.z).normalize());
    
    // Update wheel rotation based on speed and direction
    // The faster the tank moves, the faster the wheels rotate
    // Wheels rotate in opposite direction when moving backward
    const wheelRotationSpeed = currentSpeed * 0.2; // Scale factor for wheel rotation
    if (currentSpeed > 0.1) { // Only rotate wheels if we're actually moving
      if (dotProduct > 0) { // Moving forward
        setWheelRotation(prev => prev - wheelRotationSpeed * delta * 10);
      } else { // Moving backward
        setWheelRotation(prev => prev + wheelRotationSpeed * delta * 10);
      }
    }
    
    // Check if the tank is near or beyond the boundary
    const nextPosition: [number, number, number] = [
      tankPosition[0] + currentVelocity.x * delta,
      tankPosition[1],
      tankPosition[2] + currentVelocity.z * delta
    ];
    
    const isNearBoundary = !isWithinBoundaries(nextPosition);
    
    // Forward/backward movement with WASD - tank should only move in its forward/backward direction
    if (moveForward) {
      // Calculate the next position if we move forward
      const potentialNextPos: [number, number, number] = [
        tankPosition[0] + forward.x * delta * maxSpeed,
        tankPosition[1],
        tankPosition[2] + forward.z * delta * maxSpeed
      ];
      
      // Only move forward if it won't take us outside the boundary
      if (isWithinBoundaries(potentialNextPos)) {
        // Apply velocity in the forward direction only - with acceleration
        const targetSpeed = maxSpeed * accelerationFactor;
        const newVelocity = forward.clone().multiplyScalar(targetSpeed);
        
        // Apply impulse for immediate response
        const impulse = forward.clone().multiplyScalar(500 * delta);
        physicsApi.applyImpulse([impulse.x, 0, impulse.z], [0, 0, 0]);
        
        // Also set velocity directly for consistent speed
        physicsApi.velocity.set(newVelocity.x, currentVelocity.y, newVelocity.z);
        
        // Ensure the physics body is awake
        physicsApi.wakeUp();
      } else {
        // We're trying to move outside the boundary, stop the tank
        physicsApi.velocity.set(0, currentVelocity.y, 0);
      }
    } else if (moveBackward) {
      // Calculate the next position if we move backward
      const potentialNextPos: [number, number, number] = [
        tankPosition[0] - forward.x * delta * maxSpeed * 0.8,
        tankPosition[1],
        tankPosition[2] - forward.z * delta * maxSpeed * 0.8
      ];
      
      // Only move backward if it won't take us outside the boundary
      if (isWithinBoundaries(potentialNextPos)) {
        // Apply velocity in the backward direction only - with acceleration
        const targetSpeed = maxSpeed * 0.8; // Backward is slightly slower
        const newVelocity = forward.clone().multiplyScalar(-targetSpeed);
        
        // Apply impulse for immediate response
        const impulse = forward.clone().multiplyScalar(-400 * delta);
        physicsApi.applyImpulse([impulse.x, 0, impulse.z], [0, 0, 0]);
        
        // Also set velocity directly for consistent speed
        physicsApi.velocity.set(newVelocity.x, currentVelocity.y, newVelocity.z);
        
        // Ensure the physics body is awake
        physicsApi.wakeUp();
      } else {
        // We're trying to move outside the boundary, stop the tank
        physicsApi.velocity.set(0, currentVelocity.y, 0);
      }
    } else {
      // Stop horizontal movement when not pressing forward/backward
      // Apply stronger braking force for quicker stops
      if (currentSpeed > 0.5) {
        const brakingForce = currentVelocity.clone().normalize().multiplyScalar(-currentSpeed * 10);
        physicsApi.applyForce([brakingForce.x, 0, brakingForce.z], [0, 0, 0]);
      } else {
        physicsApi.velocity.set(0, currentVelocity.y, 0);
      }
    }
    
    // If we're near or beyond the boundary, apply a force to push the tank back
    if (isNearBoundary) {
      // Calculate direction toward center
      const toCenter = new THREE.Vector3(
        -tankPosition[0],
        0,
        -tankPosition[2]
      ).normalize();
      
      // Apply a force to push the tank back toward the center
      const bounceForce = toCenter.multiplyScalar(5000 * delta);
      physicsApi.applyForce([bounceForce.x, 0, bounceForce.z], [0, 0, 0]);
    }
    
    // Left/right rotation with WASD - tank should only rotate in place, not move sideways
    if (turnLeft) {
      // Apply stronger rotation for faster turning
      physicsApi.angularVelocity.set(0, turnSpeed, 0);
      
      // Apply additional torque for immediate response
      physicsApi.applyTorque([0, 100 * delta, 0]);
      
      // Ensure the physics body is awake
      physicsApi.wakeUp();
    } else if (turnRight) {
      // Apply stronger rotation for faster turning
      physicsApi.angularVelocity.set(0, -turnSpeed, 0);
      
      // Apply additional torque for immediate response
      physicsApi.applyTorque([0, -100 * delta, 0]);
      
      // Ensure the physics body is awake
      physicsApi.wakeUp();
    } else {
      // Stop rotation when not turning - apply stronger angular damping
      physicsApi.angularVelocity.set(0, 0, 0);
    }
    
    // Turret rotation with arrow keys
    if (arrowKeys.left) {
      // Move 2 degrees per click (convert to radians)
      const rotationStep = 2 * Math.PI / 180
      setTurretRotation(prev => prev + rotationStep)
    } else if (arrowKeys.right) {
      // Move 2 degrees per click (convert to radians)
      const rotationStep = 2 * Math.PI / 180
      setTurretRotation(prev => prev - rotationStep)
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
    
    // Update trajectory prediction when aiming
    if (isCurrentPlayer && isRightMouseDown) {
      // Calculate the direction based on tank yaw and turret rotation
      const tankYaw = tankRotation[1];
      const combinedRotation = tankYaw + turretRotation;
      
      // Calculate the horizontal direction components
      const dirX = -Math.sin(combinedRotation);
      const dirZ = -Math.cos(combinedRotation);
      
      // Calculate the vertical component based on turret elevation
      const dirY = Math.sin(turretElevation);
      
      // Normalize the direction vector
      const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
      const normalizedDir: [number, number, number] = [
        dirX / length,
        dirY / length,
        dirZ / length
      ];
      
      // Get the position of the cannon tip
      let cannonTipPosition: [number, number, number]
      
      if (cannonRef.current) {
        // Create a vector for the cannon tip position (at the end of the barrel)
        const cannonTip = new THREE.Vector3(0, 0, -1.6); // Position at the cannon tip
        
        // Create a world matrix that includes all transformations
        const worldMatrix = new THREE.Matrix4();
        
        // Get the cannon's world position and rotation
        cannonRef.current.updateWorldMatrix(true, false);
        worldMatrix.copy(cannonRef.current.matrixWorld);
        
        // Apply the transformation to the cannon tip
        cannonTip.applyMatrix4(worldMatrix);
        
        // Use the transformed position
        cannonTipPosition = [cannonTip.x, cannonTip.y, cannonTip.z];
      } else {
        // Fallback calculation if ref is not available
        const cannonLength = 2.5
        const tipOffsetX = -Math.sin(combinedRotation) * cannonLength
        const tipOffsetZ = -Math.cos(combinedRotation) * cannonLength
        const tipOffsetY = Math.sin(turretElevation) * cannonLength
        
        cannonTipPosition = [
          tankPosition[0] + tipOffsetX,
          tankPosition[1] + 1.5 + tipOffsetY, // Adjust for turret height
          tankPosition[2] + tipOffsetZ
        ]
      }
      
      // Update trajectory prediction data
      setTrajectoryDirection(normalizedDir);
      setTrajectoryStart(cannonTipPosition);
    }
  })
  
  // Handle shooting
  useEffect(() => {
    // Only shoot if:
    // 1. The shoot button is pressed
    // 2. The tank can shoot (cooldown is over)
    // 3. The player is the current player
    // 4. The shoot state has changed from false to true (to detect a new click)
    if (shoot && canShoot && isCurrentPlayer && !lastShootState.current) {
      // Calculate projectile direction based on tank rotation and turret rotation
      const tankYaw = tankRotation[1]
      const combinedRotation = tankYaw + turretRotation
      
      // Calculate the horizontal direction components
      const dirX = -Math.sin(combinedRotation)
      const dirZ = -Math.cos(combinedRotation)
      
      // Calculate the vertical component based on turret elevation
      const dirY = Math.sin(turretElevation)
      
      // Normalize the direction vector
      const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ)
      const direction: [number, number, number] = [
        dirX / length,
        dirY / length,
        dirZ / length
      ]
      
      // Get the position of the cannon tip
      let cannonTipPosition: [number, number, number]
      
      if (cannonRef.current) {
        // Create a vector for the cannon tip position (at the end of the barrel)
        const cannonTip = new THREE.Vector3(0, 0, -1.6); // Position at the cannon tip
        
        // Create a world matrix that includes all transformations
        const worldMatrix = new THREE.Matrix4();
        
        // Get the cannon's world position and rotation
        cannonRef.current.updateWorldMatrix(true, false);
        worldMatrix.copy(cannonRef.current.matrixWorld);
        
        // Apply the transformation to the cannon tip
        cannonTip.applyMatrix4(worldMatrix);
        
        // Use the transformed position
        cannonTipPosition = [cannonTip.x, cannonTip.y, cannonTip.z];
      } else {
        // Fallback calculation if ref is not available
        const cannonLength = 2.5
        const tipOffsetX = -Math.sin(combinedRotation) * cannonLength
        const tipOffsetZ = -Math.cos(combinedRotation) * cannonLength
        const tipOffsetY = Math.sin(turretElevation) * cannonLength
        
        cannonTipPosition = [
          tankPosition[0] + tipOffsetX,
          tankPosition[1] + 1.5 + tipOffsetY, // Adjust for turret height
          tankPosition[2] + tipOffsetZ
        ]
      }
      
      // Add a new projectile
      setProjectiles(prev => [
        ...prev, 
        { 
          id: Date.now(), 
          position: cannonTipPosition, 
          direction,
          type: 'cannonball' as const // Use cannonball type
        }
      ])
      
      // Play firing sound
      playSound('bullet_hit', 0.5)
      
      // Prevent rapid firing
      setCanShoot(false)
      setTimeout(() => {
        setCanShoot(true)
      }, 2000) // 2 second cooldown
    }
    
    // Update the lastShootState ref
    lastShootState.current = shoot
  }, [shoot, canShoot, isCurrentPlayer, tankPosition, tankRotation, turretRotation, turretElevation])
  
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
          
          {/* Front indicator - a small triangle/arrow to show the front direction */}
          <group position={[0, 0.5, -1.55]}>
            {/* Triangle pointing forward */}
            <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <coneGeometry args={[0.2, 0.4, 3]} />
              <meshStandardMaterial color="red" />
            </mesh>
            
            {/* Small light/indicator */}
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[0.5, 0.2, 0.1]} />
              <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
            </mesh>
          </group>
          
          {/* Tank wheels */}
          <group ref={wheelsRef}>
            {/* Left wheels */}
            <group position={[-1.1, -0.3, 0]}>
              <mesh position={[0, 0, -1.2]} rotation={[0, Math.PI/2, wheelRotation]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color="darkgray" />
              </mesh>
              <mesh position={[0, 0, 0]} rotation={[0, Math.PI/2, wheelRotation]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color="darkgray" />
              </mesh>
              <mesh position={[0, 0, 1.2]} rotation={[0, Math.PI/2, wheelRotation]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color="darkgray" />
              </mesh>
            </group>
            
            {/* Right wheels */}
            <group position={[1.1, -0.3, 0]}>
              <mesh position={[0, 0, -1.2]} rotation={[0, Math.PI/2, wheelRotation]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color="darkgray" />
              </mesh>
              <mesh position={[0, 0, 0]} rotation={[0, Math.PI/2, wheelRotation]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color="darkgray" />
              </mesh>
              <mesh position={[0, 0, 1.2]} rotation={[0, Math.PI/2, wheelRotation]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color="darkgray" />
              </mesh>
            </group>
            
            {/* Tank tracks (enhanced with segments) */}
            <group position={[-1.1, -0.3, 0]}>
              {/* Bottom track section */}
              {Array.from({ length: 10 }).map((_, i) => (
                <mesh 
                  key={`left-track-bottom-${i}`} 
                  position={[0, -0.2, -1.4 + i * 0.3]} 
                  rotation={[0, 0, Math.PI/2 + wheelRotation * 0.2 + i * 0.05]} 
                  castShadow
                >
                  <boxGeometry args={[0.05, 0.25, 0.2]} />
                  <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.6} />
                </mesh>
              ))}
              
              {/* Top track section */}
              {Array.from({ length: 10 }).map((_, i) => (
                <mesh 
                  key={`left-track-top-${i}`} 
                  position={[0, 0.1, -1.4 + i * 0.3]} 
                  rotation={[0, 0, Math.PI/2 + wheelRotation * 0.2 - i * 0.05]} 
                  castShadow
                >
                  <boxGeometry args={[0.05, 0.25, 0.2]} />
                  <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.6} />
                </mesh>
              ))}
            </group>
            
            <group position={[1.1, -0.3, 0]}>
              {/* Bottom track section */}
              {Array.from({ length: 10 }).map((_, i) => (
                <mesh 
                  key={`right-track-bottom-${i}`} 
                  position={[0, -0.2, -1.4 + i * 0.3]} 
                  rotation={[0, 0, Math.PI/2 + wheelRotation * 0.2 + i * 0.05]} 
                  castShadow
                >
                  <boxGeometry args={[0.05, 0.25, 0.2]} />
                  <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.6} />
                </mesh>
              ))}
              
              {/* Top track section */}
              {Array.from({ length: 10 }).map((_, i) => (
                <mesh 
                  key={`right-track-top-${i}`} 
                  position={[0, 0.1, -1.4 + i * 0.3]} 
                  rotation={[0, 0, Math.PI/2 + wheelRotation * 0.2 - i * 0.05]} 
                  castShadow
                >
                  <boxGeometry args={[0.05, 0.25, 0.2]} />
                  <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.6} />
                </mesh>
              ))}
            </group>
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
        </Html>
      </group>
      
      {/* Add trajectory predictor */}
      {isCurrentPlayer && (
        <TrajectoryPredictor 
          startPosition={trajectoryStart}
          direction={trajectoryDirection}
          visible={showTrajectory}
          steps={50}
          maxTime={3.0}
        />
      )}
      
      {/* Render projectiles */}
      {projectiles.map(projectile => (
        projectile.type === 'missile' ? (
          <Projectile
            key={projectile.id}
            position={projectile.position}
            direction={projectile.direction}
            playerId={playerId}
            onHit={onHit}
          />
        ) : (
          <CannonBall
            key={projectile.id}
            position={projectile.position}
            direction={projectile.direction}
            playerId={playerId}
            onHit={onHit}
          />
        )
      ))}
    </>
  )
}

export default Tank 