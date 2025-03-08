import { useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSphere } from '@react-three/cannon'
import { Vector3 } from 'three'

interface ProjectileProps {
  position: [number, number, number]
  direction: [number, number, number]
  playerId: number
  onHit?: (targetId: number) => void
}

const Projectile: React.FC<ProjectileProps> = ({ position, direction, playerId, onHit }) => {
  const [isActive, setIsActive] = useState(true)
  
  // Create a physics-enabled sphere for the projectile
  const [ref, api] = useSphere(() => ({
    mass: 5,
    position,
    args: [0.2], // radius
    type: 'Dynamic',
    collisionFilterGroup: 2, // projectile group
    collisionFilterMask: 1, // collide with tanks and terrain
    onCollide: (e) => {
      // Check if we hit a tank
      if (e.body && e.body.userData && e.body.userData.type === 'tank') {
        const targetId = e.body.userData.playerId
        // Don't damage your own tank
        if (targetId !== playerId && onHit) {
          onHit(targetId)
        }
      }
      
      // Deactivate projectile on any collision
      setIsActive(false)
    },
  }))
  
  // Apply initial velocity to the projectile
  useEffect(() => {
    const velocity = new Vector3(
      direction[0] * 30,
      direction[1] * 30,
      direction[2] * 30
    )
    api.velocity.set(velocity.x, velocity.y, velocity.z)
    
    // Deactivate projectile after a certain time
    const timeout = setTimeout(() => {
      setIsActive(false)
    }, 3000)
    
    return () => clearTimeout(timeout)
  }, [api, direction])
  
  // Remove projectile when it's no longer active
  if (!isActive) return null
  
  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial color="yellow" emissive="orange" emissiveIntensity={0.5} />
    </mesh>
  )
}

export default Projectile 