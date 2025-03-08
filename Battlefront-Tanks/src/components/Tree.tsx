import React from 'react'
import { useBox } from '@react-three/cannon'
import * as THREE from 'three'

interface TreeProps {
  position: [number, number, number]
  scale?: number
  type?: 'pine' | 'oak' | 'palm'
}

const Tree: React.FC<TreeProps> = ({ position, scale = 1, type = 'pine' }) => {
  // Create a physics-enabled box for the tree trunk (for collision detection)
  const [ref] = useBox(() => ({
    mass: 0, // Static object
    position,
    args: [0.3 * scale, 2 * scale, 0.3 * scale], // width, height, depth
    type: 'Static',
    userData: {
      type: 'tree'
    }
  }))
  
  // Generate a random rotation for variety
  const rotation: [number, number, number] = [0, Math.random() * Math.PI * 2, 0]
  
  // Generate a random color variation for the leaves
  const leafColorVariation = Math.random() * 0.2 - 0.1 // -0.1 to 0.1
  
  // Render different tree types
  const renderTree = () => {
    switch (type) {
      case 'pine':
        return (
          <group ref={ref} position={position} rotation={rotation} scale={[scale, scale, scale]}>
            {/* Tree trunk */}
            <mesh castShadow receiveShadow position={[0, 1, 0]}>
              <cylinderGeometry args={[0.15, 0.2, 2, 8]} />
              <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </mesh>
            
            {/* Pine tree layers */}
            <mesh castShadow position={[0, 2, 0]}>
              <coneGeometry args={[0.8, 1.5, 8]} />
              <meshStandardMaterial 
                color={new THREE.Color(0.0, 0.5 + leafColorVariation, 0.0)} 
                roughness={0.8} 
              />
            </mesh>
            <mesh castShadow position={[0, 2.7, 0]}>
              <coneGeometry args={[0.6, 1.2, 8]} />
              <meshStandardMaterial 
                color={new THREE.Color(0.0, 0.6 + leafColorVariation, 0.0)} 
                roughness={0.8} 
              />
            </mesh>
            <mesh castShadow position={[0, 3.3, 0]}>
              <coneGeometry args={[0.4, 1, 8]} />
              <meshStandardMaterial 
                color={new THREE.Color(0.0, 0.7 + leafColorVariation, 0.0)} 
                roughness={0.8} 
              />
            </mesh>
          </group>
        )
        
      case 'oak':
        return (
          <group ref={ref} position={position} rotation={rotation} scale={[scale, scale, scale]}>
            {/* Tree trunk */}
            <mesh castShadow receiveShadow position={[0, 1, 0]}>
              <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
              <meshStandardMaterial color="#5D4037" roughness={0.9} />
            </mesh>
            
            {/* Oak tree foliage */}
            <mesh castShadow position={[0, 2.5, 0]}>
              <sphereGeometry args={[1.2, 16, 16]} />
              <meshStandardMaterial 
                color={new THREE.Color(0.2, 0.5 + leafColorVariation, 0.1)} 
                roughness={0.8} 
              />
            </mesh>
          </group>
        )
        
      case 'palm':
        return (
          <group ref={ref} position={position} rotation={rotation} scale={[scale, scale, scale]}>
            {/* Tree trunk - curved for palm tree */}
            <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
              <cylinderGeometry args={[0.1, 0.2, 3, 8]} />
              <meshStandardMaterial color="#A0522D" roughness={0.9} />
            </mesh>
            
            {/* Palm tree leaves */}
            {Array.from({ length: 7 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 7
              const tiltAngle = Math.PI / 4 // 45 degrees tilt
              
              return (
                <group 
                  key={`palm-leaf-${i}`} 
                  position={[0, 3, 0]} 
                  rotation={[
                    Math.sin(angle) * tiltAngle, 
                    angle, 
                    Math.cos(angle) * tiltAngle
                  ]}
                >
                  <mesh castShadow>
                    <boxGeometry args={[0.1, 0.05, 1.5]} />
                    <meshStandardMaterial 
                      color={new THREE.Color(0.0, 0.6 + leafColorVariation, 0.0)} 
                      roughness={0.8} 
                    />
                  </mesh>
                  <mesh castShadow position={[0, 0, 0.8]}>
                    <coneGeometry args={[0.4, 1.2, 4]} />
                    <meshStandardMaterial 
                      color={new THREE.Color(0.0, 0.6 + leafColorVariation, 0.0)} 
                      roughness={0.8} 
                    />
                  </mesh>
                </group>
              )
            })}
          </group>
        )
        
      default:
        return null
    }
  }
  
  return renderTree()
}

export default Tree 