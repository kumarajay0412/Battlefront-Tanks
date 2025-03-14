import { useRef, useState, useEffect, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useBox } from '@react-three/cannon'
import { Html } from '@react-three/drei'
import { useKeyboardControls } from '../hooks/useKeyboardControls'
import Projectile from './Projectile'
import CannonBall from './CannonBall'
import Missile from './Missile'
import SuperBomb from './SuperBomb'
import TrajectoryPredictor from './TrajectoryPredictor'
import * as THREE from 'three'
import { playSound } from '../utils/audio'
import { BulletType, BULLET_TYPES } from './BulletSelector'

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
  const [projectiles, setProjectiles] = useState<{ 
    id: number; 
    position: [number, number, number]; 
    direction: [number, number, number]; 
    type: 'missile' | 'cannonball' | 'superbomb';
  }[]>([])
  
  // Add state for bullet selection
  const [selectedBulletType, setSelectedBulletType] = useState<BulletType>('standard')
  const [bulletAmmo, setBulletAmmo] = useState<Record<BulletType, number>>({
    standard: Infinity,
    missile: 5,
    superBomb: 3
  })
  const [showBulletSelector, setShowBulletSelector] = useState(false)
  
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
    mass: 2000, // Reduced mass for better movement
    position,
    rotation,
    args: [2, 0.8, 3], // width, height, depth - lower height for better stability
    type: 'Dynamic',
    allowSleep: false,
    linearDamping: 0.5, // Reduced damping for better movement
    angularDamping: 0.9, // High damping to prevent tipping
    friction: 0.5, // Reduced friction for better movement
    restitution: 0.1, // Very low bounciness
    fixedRotation: true, // Prevent rotation on X and Z axes (only allow Y rotation)
    userData: {
      type: 'tank',
      playerId
    }
  }))
  
  // Set up keyboard controls for the current player
  const { moveForward, moveBackward, turnLeft, turnRight, shoot } = useKeyboardControls(isCurrentPlayer)
  
  // Additional keyboard state for turret control
  const [turretKeys, setTurretKeys] = useState({
    up: false,
    down: false,
    left: false,
    right: false
  })
  
  // Set up direct keyboard controls for movement
  const [directControls, setDirectControls] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false
  });
  
  // Set up turret controls with WASD
  useEffect(() => {
    if (!isCurrentPlayer) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent handling the same keypress multiple times
      if (e.repeat) return;
      
      switch (e.key) {
        case 'w': // Use W for turret up
          // Apply immediate 2 degree rotation instead of setting key state
          setTurretElevation(prev => {
            const maxElevation = 90 * Math.PI / 180; // Changed from 70 to 90 degrees in radians
            const rotationStep = 2 * Math.PI / 180; // 2 degrees in radians
            return Math.min(prev + rotationStep, maxElevation);
          });
          e.preventDefault();
          break;
        case 's': // Use S for turret down
          // Apply immediate 2 degree rotation instead of setting key state
          setTurretElevation(prev => {
            const minElevation = -20 * Math.PI / 180; // Changed from -10 to -20 degrees in radians
            const rotationStep = 2 * Math.PI / 180; // 2 degrees in radians
            return Math.max(prev - rotationStep, minElevation);
          });
          e.preventDefault();
          break;
        case 'a': // Use A for turret left
          // Apply immediate 2 degree rotation instead of setting key state
          setTurretRotation(prev => prev + (2 * Math.PI / 180)); // 2 degrees in radians
          e.preventDefault();
          break;
        case 'd': // Use D for turret right
          // Apply immediate 2 degree rotation instead of setting key state
          setTurretRotation(prev => prev - (2 * Math.PI / 180)); // 2 degrees in radians
          e.preventDefault();
          break;
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // We don't need to handle key up events for discrete movements
      // But we keep this for compatibility with other controls
      switch (e.key) {
        case 'w': // Use W for turret up
        case 's': // Use S for turret down
        case 'a': // Use A for turret left
        case 'd': // Use D for turret right
          // No action needed for key up with discrete movements
          break;
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
    turretUp: turretKeys.up,
    turretDown: turretKeys.down,
    turretLeft: turretKeys.left,
    turretRight: turretKeys.right
  })
  
  // Update debug state when controls change
  useEffect(() => {
    setDebugControls({ 
      moveForward: directControls.forward, 
      moveBackward: directControls.backward, 
      turnLeft: directControls.left, 
      turnRight: directControls.right, 
      shoot,
      turretUp: turretKeys.up,
      turretDown: turretKeys.down,
      turretLeft: turretKeys.left,
      turretRight: turretKeys.right
    })
  }, [directControls, shoot, turretKeys])
  
  // Direct keyboard handling for movement with arrow keys
  useEffect(() => {
    if (!isCurrentPlayer) return;
    
    console.log("Setting up DIRECT keyboard controls for tank movement with arrow keys");
    
    const handleDirectKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      console.log("Direct key down:", key);
      
      switch (key) {
        case 'arrowup':
          setDirectControls(prev => ({ ...prev, forward: true }));
          console.log("DIRECT FORWARD: TRUE");
          e.preventDefault();
          break;
        case 'arrowdown':
          setDirectControls(prev => ({ ...prev, backward: true }));
          console.log("DIRECT BACKWARD: TRUE");
          e.preventDefault();
          break;
        case 'arrowleft':
          setDirectControls(prev => ({ ...prev, left: true }));
          console.log("DIRECT LEFT: TRUE");
          e.preventDefault();
          break;
        case 'arrowright':
          setDirectControls(prev => ({ ...prev, right: true }));
          console.log("DIRECT RIGHT: TRUE");
          e.preventDefault();
          break;
      }
    };
    
    const handleDirectKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      console.log("Direct key up:", key);
      
      switch (key) {
        case 'arrowup':
          setDirectControls(prev => ({ ...prev, forward: false }));
          console.log("DIRECT FORWARD: FALSE");
          break;
        case 'arrowdown':
          setDirectControls(prev => ({ ...prev, backward: false }));
          console.log("DIRECT BACKWARD: FALSE");
          break;
        case 'arrowleft':
          setDirectControls(prev => ({ ...prev, left: false }));
          console.log("DIRECT LEFT: FALSE");
          break;
        case 'arrowright':
          setDirectControls(prev => ({ ...prev, right: false }));
          console.log("DIRECT RIGHT: FALSE");
          break;
      }
    };
    
    // Add event listeners with capture to ensure they get priority
    window.addEventListener('keydown', handleDirectKeyDown, { capture: true });
    window.addEventListener('keyup', handleDirectKeyUp, { capture: true });
    
    return () => {
      window.removeEventListener('keydown', handleDirectKeyDown, { capture: true });
      window.removeEventListener('keyup', handleDirectKeyUp, { capture: true });
    };
  }, [isCurrentPlayer]);
  
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
    
    // Debug logging for movement controls
    if (directControls.forward || directControls.backward || directControls.left || directControls.right) {
      console.log('DIRECT CONTROLS:', directControls);
    }
    
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
    
    // Get current rotation
    let currentRotation = new THREE.Euler();
    physicsApi.rotation.subscribe((r) => {
      currentRotation.set(r[0], r[1], r[2]);
    });
    
    // Prevent tank from tipping over by constraining rotation on X and Z axes
    if (Math.abs(currentRotation.x) > 0.1 || Math.abs(currentRotation.z) > 0.1) {
      console.log('Correcting tank tilt');
      physicsApi.rotation.set(0, currentRotation.y, 0);
      
      // Get current angular velocity
      let angularVel = [0, 0, 0];
      physicsApi.angularVelocity.subscribe((v) => {
        angularVel = v;
      });
      
      // Only keep the Y component of angular velocity
      physicsApi.angularVelocity.set(0, angularVel[1], 0);
    }
    
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
    
    // Forward/backward movement with direct controls
    if (directControls.forward) {
      console.log('DIRECT: Attempting to move forward');
      
      // Calculate the next position if we move forward
      const potentialNextPos: [number, number, number] = [
        tankPosition[0] + forward.x * delta * maxSpeed,
        tankPosition[1],
        tankPosition[2] + forward.z * delta * maxSpeed
      ];
      
      // Only move forward if it won't take us outside the boundary
      if (isWithinBoundaries(potentialNextPos)) {
        console.log('DIRECT: Moving forward within boundaries');
        
        // Apply velocity in the forward direction only - with acceleration
        const targetSpeed = maxSpeed * accelerationFactor;
        const newVelocity = forward.clone().multiplyScalar(targetSpeed);
        
        // Apply impulse for immediate response - use a stronger impulse
        const impulse = forward.clone().multiplyScalar(1500 * delta);
        physicsApi.applyImpulse([impulse.x, 0, impulse.z], [0, 0, 0]);
        
        // Also set velocity directly for consistent speed
        physicsApi.velocity.set(newVelocity.x, currentVelocity.y, newVelocity.z);
        
        // Ensure the physics body is awake
        physicsApi.wakeUp();
      } else {
        console.log('DIRECT: Cannot move forward - boundary reached');
        // We're trying to move outside the boundary, stop the tank
        physicsApi.velocity.set(0, currentVelocity.y, 0);
      }
    } else if (directControls.backward) {
      console.log('DIRECT: Attempting to move backward');
      
      // Calculate the next position if we move backward
      const potentialNextPos: [number, number, number] = [
        tankPosition[0] - forward.x * delta * maxSpeed * 0.8,
        tankPosition[1],
        tankPosition[2] - forward.z * delta * maxSpeed * 0.8
      ];
      
      // Only move backward if it won't take us outside the boundary
      if (isWithinBoundaries(potentialNextPos)) {
        console.log('DIRECT: Moving backward within boundaries');
        
        // Apply velocity in the backward direction only - with acceleration
        const targetSpeed = maxSpeed * 0.8; // Backward is slightly slower
        const newVelocity = forward.clone().multiplyScalar(-targetSpeed);
        
        // Apply impulse for immediate response - use a stronger impulse
        const impulse = forward.clone().multiplyScalar(-1200 * delta);
        physicsApi.applyImpulse([impulse.x, 0, impulse.z], [0, 0, 0]);
        
        // Also set velocity directly for consistent speed
        physicsApi.velocity.set(newVelocity.x, currentVelocity.y, newVelocity.z);
        
        // Ensure the physics body is awake
        physicsApi.wakeUp();
      } else {
        console.log('DIRECT: Cannot move backward - boundary reached');
        // We're trying to move outside the boundary, stop the tank
        physicsApi.velocity.set(0, currentVelocity.y, 0);
      }
    } else {
      // Stop horizontal movement when not pressing forward/backward
      // Apply stronger braking force for quicker stops
      if (currentSpeed > 0.5) {
        const brakingForce = currentVelocity.clone().normalize().multiplyScalar(-currentSpeed * 20); // Increased braking force
        physicsApi.applyForce([brakingForce.x, 0, brakingForce.z], [0, 0, 0]);
      } else {
        physicsApi.velocity.set(0, currentVelocity.y, 0);
      }
    }
    
    // Left/right rotation with direct controls
    if (directControls.left) {
      console.log('DIRECT: Turning left');
      // Apply stronger rotation for faster turning
      physicsApi.angularVelocity.set(0, turnSpeed, 0);
      
      // Apply additional torque for immediate response
      physicsApi.applyTorque([0, 100 * delta, 0]);
      
      // Ensure the physics body is awake
      physicsApi.wakeUp();
    } else if (directControls.right) {
      console.log('DIRECT: Turning right');
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
  
  // Add a click handler for the tank to show bullet selector
  const handleTankClick = () => {
    if (isCurrentPlayer) {
      setShowBulletSelector(prev => !prev)
    }
  }
  
  // Handle bullet selection
  const handleBulletSelection = (type: BulletType) => {
    // Only allow selection if there's ammo available
    if (type === 'standard' || bulletAmmo[type] > 0) {
      setSelectedBulletType(type)
      setShowBulletSelector(false)
    }
  }
  
  // Handle shooting
  useEffect(() => {
    // Only shoot if:
    // 1. The shoot button is pressed
    // 2. The tank can shoot (cooldown is over)
    // 3. The player is the current player
    // 4. The shoot state has changed from false to true (to detect a new click)
    // 5. There's ammo available for the selected bullet type
    if (shoot && canShoot && isCurrentPlayer && !lastShootState.current && 
        (selectedBulletType === 'standard' || bulletAmmo[selectedBulletType] > 0)) {
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
      
      // Determine projectile type based on selected bullet
      const projectileType = selectedBulletType === 'standard' 
        ? 'cannonball' 
        : selectedBulletType === 'missile' 
          ? 'missile' 
          : 'superbomb'
      
      // Add a new projectile
      setProjectiles(prev => [
        ...prev, 
        { 
          id: Date.now(), 
          position: cannonTipPosition, 
          direction,
          type: projectileType as 'cannonball' | 'missile' | 'superbomb'
        }
      ])
      
      // Decrease ammo for special bullets
      if (selectedBulletType !== 'standard') {
        setBulletAmmo(prev => ({
          ...prev,
          [selectedBulletType]: prev[selectedBulletType] - 1
        }))
      }
      
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
  }, [shoot, canShoot, isCurrentPlayer, tankPosition, tankRotation, turretRotation, turretElevation, selectedBulletType, bulletAmmo])
  
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
      <group 
        ref={physicsRef} 
        onClick={handleTankClick}
      >
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
      
      {/* Bullet type indicator on top of the tank */}
      <Html position={[tankPosition[0], tankPosition[1] + 3, tankPosition[2]]}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          pointerEvents: 'none'
        }}>
          {isCurrentPlayer && (
            <div style={{ 
              backgroundColor: BULLET_TYPES[selectedBulletType].color,
              color: 'white',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '5px',
              opacity: 0.8
            }}>
              {selectedBulletType !== 'standard' && bulletAmmo[selectedBulletType] > 0 
                ? `${BULLET_TYPES[selectedBulletType].name}: ${bulletAmmo[selectedBulletType]}`
                : BULLET_TYPES[selectedBulletType].name
              }
            </div>
          )}
          
          {isCurrentPlayer && showBulletSelector && (
            <div style={{ 
              display: 'flex', 
              gap: '5px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '5px',
              borderRadius: '5px',
              pointerEvents: 'auto'
            }}>
              {Object.values(BULLET_TYPES).map(bulletInfo => {
                const isSelected = selectedBulletType === bulletInfo.type
                const ammoCount = bulletInfo.ammo === 'unlimited' ? '∞' : bulletAmmo[bulletInfo.type]
                const isDisabled = bulletInfo.ammo !== 'unlimited' && bulletAmmo[bulletInfo.type] <= 0
                
                return (
                  <div 
                    key={bulletInfo.type}
                    onClick={() => !isDisabled && handleBulletSelection(bulletInfo.type)}
                    style={{
                      width: '30px',
                      height: '30px',
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '50%',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.5 : 1,
                      border: `2px solid ${bulletInfo.color}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    {bulletInfo.type === 'standard' && <span style={{ fontSize: '16px', color: 'white' }}>●</span>}
                    {bulletInfo.type === 'missile' && <span style={{ fontSize: '16px', color: 'white' }}>▲</span>}
                    {bulletInfo.type === 'superBomb' && <span style={{ fontSize: '16px', color: 'white' }}>✱</span>}
                    
                    {bulletInfo.ammo !== 'unlimited' && (
                      <div style={{ 
                        position: 'absolute', 
                        bottom: '-8px', 
                        right: '-8px',
                        backgroundColor: 'black',
                        color: 'white',
                        fontSize: '10px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {ammoCount}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Html>
      
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
      
      {/* Render projectiles based on their type */}
      {projectiles.map(projectile => {
        if (projectile.type === 'cannonball') {
          return (
            <CannonBall
              key={projectile.id}
              position={projectile.position}
              direction={projectile.direction}
              playerId={playerId}
              onHit={onHit}
            />
          )
        } else if (projectile.type === 'missile') {
          return (
            <Missile
              key={projectile.id}
              position={projectile.position}
              direction={projectile.direction}
              playerId={playerId}
              onHit={onHit}
            />
          )
        } else if (projectile.type === 'superbomb') {
          return (
            <SuperBomb
              key={projectile.id}
              position={projectile.position}
              direction={projectile.direction}
              playerId={playerId}
              onHit={onHit}
            />
          )
        }
        return null
      })}
    </>
  )
}

// Memoize the Tank component with a custom comparison function
export default memo(Tank, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.position[0] === nextProps.position[0] &&
    prevProps.position[1] === nextProps.position[1] &&
    prevProps.position[2] === nextProps.position[2] &&
    prevProps.rotation[0] === nextProps.rotation[0] &&
    prevProps.rotation[1] === nextProps.rotation[1] &&
    prevProps.rotation[2] === nextProps.rotation[2] &&
    prevProps.health === nextProps.health &&
    prevProps.isCurrentPlayer === nextProps.isCurrentPlayer &&
    prevProps.color === nextProps.color
  );
}); 