import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface TrajectoryPredictorProps {
  startPosition: [number, number, number]
  direction: [number, number, number]
  visible: boolean
  steps?: number
  maxTime?: number
}

const TrajectoryPredictor: React.FC<TrajectoryPredictorProps> = ({
  startPosition,
  direction,
  visible,
  steps = 50,
  maxTime = 3.0
}) => {
  const lineRef = useRef<THREE.Line>(null)
  const pointsRef = useRef<THREE.Vector3[]>([])
  
  // Calculate trajectory points
  const points = useMemo(() => {
    if (!visible) return []
    
    const gravity = 9.8 // m/s²
    const initialSpeed = 30 // Same as in CannonBall component
    const timeStep = maxTime / steps
    
    // Create a new array of points
    const trajectoryPoints: THREE.Vector3[] = []
    
    // Initial velocity vector
    const velocity = new THREE.Vector3(
      direction[0] * initialSpeed,
      direction[1] * initialSpeed,
      direction[2] * initialSpeed
    )
    
    // Start position
    const position = new THREE.Vector3(
      startPosition[0],
      startPosition[1],
      startPosition[2]
    )
    
    // Add starting point
    trajectoryPoints.push(position.clone())
    
    // Calculate trajectory points using physics simulation
    for (let i = 1; i <= steps; i++) {
      const time = i * timeStep
      
      // Calculate new position using physics equations
      // x = x₀ + v₀ₓ * t
      // y = y₀ + v₀ᵧ * t - 0.5 * g * t²
      // z = z₀ + v₀ᵦ * t
      const newPosition = new THREE.Vector3(
        startPosition[0] + velocity.x * time,
        startPosition[1] + velocity.y * time - 0.5 * gravity * time * time,
        startPosition[2] + velocity.z * time
      )
      
      trajectoryPoints.push(newPosition)
    }
    
    pointsRef.current = trajectoryPoints
    return trajectoryPoints
  }, [startPosition, direction, visible, steps, maxTime])
  
  // Update line geometry when points change
  useFrame(() => {
    if (lineRef.current && visible) {
      // Update line geometry if needed
      const geometry = lineRef.current.geometry as THREE.BufferGeometry
      geometry.setFromPoints(pointsRef.current)
    }
  })
  
  if (!visible) return null
  
  return (
    <group>
      <lineSegments ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#ffffff" opacity={0.6} transparent={true} />
      </lineSegments>
    </group>
  )
}

export default TrajectoryPredictor 