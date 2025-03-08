import { usePlane } from '@react-three/cannon'
import { useTexture } from '@react-three/drei'
import { RepeatWrapping } from 'three'

const Battlefield = () => {
  // Create a physics-enabled ground plane
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    type: 'Static',
  }))

  // Load and configure ground texture
  const texture = useTexture('/textures/ground.jpg')
  
  // Set texture to repeat for a tiled effect
  if (texture) {
    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.repeat.set(20, 20)
  }

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial 
        map={texture}
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  )
}

export default Battlefield 