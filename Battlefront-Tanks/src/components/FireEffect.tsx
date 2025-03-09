import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FireEffectProps {
  position: [number, number, number]
  scale?: number
  duration?: number
  delay?: number
}

const FireEffect: React.FC<FireEffectProps> = ({ 
  position, 
  scale = 1.0, 
  duration = 1000,
  delay = 0
}) => {
  const [active, setActive] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const groupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const startTimeRef = useRef<number>(0)
  
  // Create particles for the explosion
  const particleCount = 100
  const particlePositions = useRef<Float32Array>(new Float32Array(particleCount * 3))
  const particleVelocities = useRef<Float32Array>(new Float32Array(particleCount * 3))
  const particleSizes = useRef<Float32Array>(new Float32Array(particleCount))
  
  // Initialize particles with delay
  useEffect(() => {
    // Set a timeout to activate the effect after the delay
    const activationTimeout = setTimeout(() => {
      setActive(true)
      startTimeRef.current = Date.now()
      
      // Initialize particle positions, velocities, and sizes
      for (let i = 0; i < particleCount; i++) {
        // Random position within a small sphere
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI
        const r = Math.random() * 0.2
        
        particlePositions.current[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        particlePositions.current[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        particlePositions.current[i * 3 + 2] = r * Math.cos(phi)
        
        // Random velocity outward from center
        const speed = 1 + Math.random() * 2
        particleVelocities.current[i * 3] = particlePositions.current[i * 3] * speed
        particleVelocities.current[i * 3 + 1] = particlePositions.current[i * 3 + 1] * speed + 0.5 // Add upward bias
        particleVelocities.current[i * 3 + 2] = particlePositions.current[i * 3 + 2] * speed
        
        // Random size
        particleSizes.current[i] = 0.1 + Math.random() * 0.3
      }
      
      setInitialized(true)
      
      // Set a timeout to deactivate the effect
      const deactivationTimeout = setTimeout(() => {
        setActive(false)
      }, duration)
      
      return () => clearTimeout(deactivationTimeout)
    }, delay)
    
    return () => clearTimeout(activationTimeout)
  }, [duration, delay])
  
  // Update particles on each frame
  useFrame(() => {
    if (!active || !initialized || !particlesRef.current) return
    
    const elapsedTime = Date.now() - startTimeRef.current
    const progress = Math.min(elapsedTime / duration, 1)
    
    // Update particle positions based on velocities and time
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    const sizes = particlesRef.current.geometry.attributes.size.array as Float32Array
    
    for (let i = 0; i < particleCount; i++) {
      // Update position based on velocity and time
      positions[i * 3] = particlePositions.current[i * 3] + particleVelocities.current[i * 3] * progress
      positions[i * 3 + 1] = particlePositions.current[i * 3 + 1] + particleVelocities.current[i * 3 + 1] * progress
      positions[i * 3 + 2] = particlePositions.current[i * 3 + 2] + particleVelocities.current[i * 3 + 2] * progress
      
      // Fade out size over time
      sizes[i] = particleSizes.current[i] * (1 - progress)
    }
    
    // Mark attributes as needing update
    particlesRef.current.geometry.attributes.position.needsUpdate = true
    particlesRef.current.geometry.attributes.size.needsUpdate = true
    
    // Fade out the light intensity
    if (groupRef.current) {
      const light = groupRef.current.children.find(child => child instanceof THREE.PointLight) as THREE.PointLight
      if (light) {
        light.intensity = 5 * (1 - progress)
      }
    }
  })
  
  if (!active) return null
  
  return (
    <group ref={groupRef} position={position}>
      {/* Explosion light */}
      <pointLight 
        color="#ff7700" 
        intensity={5} 
        distance={10 * scale} 
        decay={2}
      />
      
      {/* Explosion particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions.current}
            itemSize={3}
            args={[particlePositions.current, 3]}
          />
          <bufferAttribute
            attach="attributes-size"
            count={particleCount}
            array={particleSizes.current}
            itemSize={1}
            args={[particleSizes.current, 1]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={scale}
          sizeAttenuation={true}
          color="#ff5500"
          transparent={true}
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Smoke cloud */}
      <mesh>
        <sphereGeometry args={[scale * 0.5, 16, 16]} />
        <meshStandardMaterial
          color="#333333"
          transparent={true}
          opacity={0.6 * (1 - (Date.now() - startTimeRef.current) / duration)}
          emissive="#ff3300"
          emissiveIntensity={0.5 * (1 - (Date.now() - startTimeRef.current) / duration)}
        />
      </mesh>
    </group>
  )
}

export default FireEffect 