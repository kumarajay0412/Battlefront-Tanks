import { usePlane, useBox } from '@react-three/cannon'
import { useTexture } from '@react-three/drei'
import { RepeatWrapping } from 'three'
import Tree from './Tree'
import * as THREE from 'three'

// Define battlefield dimensions as constants for reuse
const BATTLEFIELD_SIZE = 100
const BATTLEFIELD_HALF_SIZE = BATTLEFIELD_SIZE / 2
const BOUNDARY_HEIGHT = 10
const BOUNDARY_THICKNESS = 2

// Generate random positions for battlefield elements
const generatePositions = (count: number, mapSize: number, minDistance: number = 5, exclusionRadius: number = 15) => {
  const positions: [number, number, number][] = []
  
  // Helper function to check if a position is too close to existing elements or center
  const isTooClose = (pos: [number, number, number]) => {
    // Check if too close to center (where tanks spawn)
    if (Math.sqrt(pos[0] * pos[0] + pos[2] * pos[2]) < exclusionRadius) {
      return true
    }
    
    // Check if too close to other elements
    return positions.some(existingPos => {
      const dx = existingPos[0] - pos[0]
      const dz = existingPos[2] - pos[2]
      return Math.sqrt(dx * dx + dz * dz) < minDistance
    })
  }
  
  // Try to generate the requested number of positions
  let attempts = 0
  const maxAttempts = count * 10 // Limit attempts to avoid infinite loop
  
  while (positions.length < count && attempts < maxAttempts) {
    attempts++
    
    // Generate random position within map bounds
    // Reduce the area slightly to keep objects away from the boundaries
    const x = (Math.random() * 2 - 1) * (mapSize / 2 - 10)
    const z = (Math.random() * 2 - 1) * (mapSize / 2 - 10)
    const pos: [number, number, number] = [x, 0, z]
    
    // Add position if it's not too close to existing elements
    if (!isTooClose(pos)) {
      positions.push(pos)
    }
  }
  
  return positions
}

// Invisible boundary wall component
const BoundaryWall = ({ position, rotation, size }: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
}) => {
  // Create a physics-enabled box for the boundary wall
  const [ref] = useBox(() => ({
    args: size,
    position,
    rotation,
    type: 'Static',
    collisionFilterGroup: 1, // Same group as terrain
    material: {
      friction: 0.1,
      restitution: 0.2, // Some bounce to push tanks back
    }
  }))
  
  return (
    <mesh ref={ref} visible={false}>
      <boxGeometry args={size} />
      <meshStandardMaterial transparent opacity={0} />
    </mesh>
  )
}

// House component with physics for bullet collision
const House = ({ position, rotation = [0, 0, 0] as [number, number, number], size = 1 }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: number;
}) => {
  // Create a physics-enabled box for the house
  const [houseRef] = useBox(() => ({
    mass: 0, // Static object
    position,
    rotation,
    args: [8 * size, 5 * size, 6 * size], // width, height, depth
    type: 'Static',
    collisionFilterGroup: 4, // House collision group (4), different from balloons (2)
    userData: {
      type: 'house'
    }
  }))
  
  // Random house style
  const isDamaged = Math.random() > 0.3
  const houseColor = Math.random() > 0.5 ? "#c8b7a6" : "#a89078"
  const roofColor = Math.random() > 0.5 ? "#8b4513" : "#654321"
  
  return (
    <group position={position} rotation={rotation as any}>
      {/* House physics body - invisible */}
      <mesh ref={houseRef} visible={false}>
        <boxGeometry args={[8 * size, 5 * size, 6 * size]} />
        <meshStandardMaterial opacity={0} transparent />
      </mesh>
      
      {/* House visible model */}
      <group scale={size}>
        {/* Main house structure */}
        <mesh castShadow receiveShadow position={[0, 2, 0]}>
          <boxGeometry args={[8, 4, 6]} />
          <meshStandardMaterial color={houseColor} roughness={0.9} />
        </mesh>
        
      
        {/* Door */}
        <mesh castShadow receiveShadow position={[0, 1.5, 3.01]}>
          <boxGeometry args={[1.5, 3, 0.1]} />
          <meshStandardMaterial color="#5d4037" roughness={0.9} />
        </mesh>
        
        {/* Windows */}
        {[-2.5, 2.5].map((x, i) => (
          <mesh key={`window-front-${i}`} castShadow receiveShadow position={[x, 2.5, 3.01]}>
            <boxGeometry args={[1.2, 1.2, 0.1]} />
            <meshStandardMaterial color="#87CEEB" roughness={0.4} metalness={0.5} />
          </mesh>
        ))}
        
        {[-2.5, 2.5].map((x, i) => (
          <mesh key={`window-back-${i}`} castShadow receiveShadow position={[x, 2.5, -3.01]}>
            <boxGeometry args={[1.2, 1.2, 0.1]} />
            <meshStandardMaterial color="#87CEEB" roughness={0.4} metalness={0.5} />
          </mesh>
        ))}
        
        {[-3, 0].map((z, i) => (
          <mesh key={`window-side-${i}`} castShadow receiveShadow position={[4.01, 2.5, z]}>
            <boxGeometry args={[0.1, 1.2, 1.2]} />
            <meshStandardMaterial color="#87CEEB" roughness={0.4} metalness={0.5} />
          </mesh>
        ))}
        
        {/* Damage (if damaged) */}
        {isDamaged && (
          <>
           
            
            {/* Debris around the house */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = Math.random() * Math.PI * 2
              const distance = 4 + Math.random() * 2
              return (
                <mesh 
                  key={`debris-${i}`} 
                  castShadow 
                  receiveShadow
                  position={[
                    Math.cos(angle) * distance,
                    0.2 + Math.random() * 0.3,
                    Math.sin(angle) * distance
                  ]}
                  rotation={[
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                  ]}
                >
                  <boxGeometry args={[
                    0.5 + Math.random() * 0.5,
                    0.2 + Math.random() * 0.3,
                    0.4 + Math.random() * 0.4
                  ]} />
                  <meshStandardMaterial color={houseColor} roughness={1} />
                </mesh>
              )
            })}
            
            {/* Roof damage */}
            <mesh castShadow receiveShadow position={[1, 4.5, 1]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[2, 2, 2]} />
              <meshStandardMaterial color="black" roughness={1} transparent opacity={0} />
            </mesh>
          </>
        )}
      </group>
    </group>
  )
}

// Bunker physics - for bullet collision
const BunkerPhysics = ({ position, rotation, args }: { 
  position: [number, number, number]; 
  rotation: [number, number, number]; 
  args: [number, number, number];
}) => {
  useBox(() => ({
    mass: 0,
    position,
    rotation,
    args,
    type: 'Static',
    userData: { type: 'bunker' }
  }))
  return null
}

// Barrier physics - for bullet collision
const BarrierPhysics = ({ position, rotation, args }: { 
  position: [number, number, number]; 
  rotation: [number, number, number]; 
  args: [number, number, number];
}) => {
  useBox(() => ({
    mass: 0,
    position,
    rotation,
    args,
    type: 'Static',
    userData: { type: 'barrier' }
  }))
  return null
}

// Mountain component for the battlefield
const Mountain = ({ position = [0, 0, 0], size = 1, detail = 4 }: {
  position?: [number, number, number];
  size?: number;
  detail?: number;
}) => {
  // Create a physics-enabled mountain
  const [ref] = useBox(() => ({
    mass: 0,
    position,
    args: [size * 20, size * 15, size * 20],
    type: 'Static',
    userData: { type: 'mountain' }
  }))

  // Generate mountain geometry
  const generateMountainGeometry = () => {
    // Create a cone geometry for the mountain base
    const geometry = new THREE.ConeGeometry(size * 10, size * 15, 8, detail);
    
    // Modify vertices to make it look more natural
    const positionAttribute = geometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);
      
      // Skip modifying the top vertex
      if (vertex.y < size * 15 - 0.1) {
        // Add some noise to x and z
        const noise = (Math.random() - 0.5) * size * 2;
        vertex.x += noise;
        vertex.z += noise;
        
        // Add some noise to y based on height
        const heightNoise = Math.random() * size * 1.5 * (1 - vertex.y / (size * 15));
        vertex.y -= heightNoise;
      }
      
      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    geometry.computeVertexNormals();
    return geometry;
  };

  return (
    <group position={position}>
      {/* Mountain physics collider (invisible) */}
      <mesh ref={ref} visible={false}>
        <boxGeometry args={[size * 20, size * 15, size * 20]} />
        <meshStandardMaterial wireframe />
      </mesh>
      
      {/* Mountain visual mesh */}
      <mesh castShadow receiveShadow position={[0, size * 7.5, 0]}>
        <primitive object={generateMountainGeometry()} />
        <meshStandardMaterial 
          color="#6b6b6b" 
          roughness={0.9}
          metalness={0.1}
          flatShading
        />
      </mesh>
      
      {/* Snow cap on top of the mountain */}
      <mesh castShadow receiveShadow position={[0, size * 12, 0]}>
        <coneGeometry args={[size * 4, size * 3, 8, 1]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
};

const Battlefield = () => {
  // Create a physics-enabled ground plane
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    type: 'Static',
    friction: 1.0, // Maximum friction for better tank traction
    restitution: 0.0, // No bounciness
  }))

  // Load and configure ground texture
  const groundTexture = useTexture('/textures/ground.jpg')
  
  // Set texture to repeat for a tiled effect
  if (groundTexture) {
    groundTexture.wrapS = groundTexture.wrapT = RepeatWrapping
    groundTexture.repeat.set(20, 20)
  }
  
  // Generate positions for battlefield elements
  const treePositions = generatePositions(15, BATTLEFIELD_SIZE, 10, 20) // Trees
  const craterPositions = generatePositions(10, BATTLEFIELD_SIZE, 8, 15) // Bomb craters
  const bunkerPositions = generatePositions(3, BATTLEFIELD_SIZE, 25, 30) // Bunkers
  const barricadePositions = generatePositions(6, BATTLEFIELD_SIZE, 15, 20) // Barricades
  const housePositions = generatePositions(5, BATTLEFIELD_SIZE, 30, 35) // Houses
  
  // Create a heightmap for the terrain (simple version)
  const terrainSize = BATTLEFIELD_SIZE
  const terrainResolution = 128
  const terrainHeightMap = new Float32Array(terrainResolution * terrainResolution)
  
  // Generate a simple heightmap with some hills and depressions
  for (let i = 0; i < terrainResolution; i++) {
    for (let j = 0; j < terrainResolution; j++) {
      const index = i * terrainResolution + j
      
      // Calculate position in world space
      const x = (i / terrainResolution - 0.5) * terrainSize
      const z = (j / terrainResolution - 0.5) * terrainSize
      
      // Base height - raised slightly to be above water
      let height = 0.5
      
      // Add some gentle hills
      height += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.5
      
      // Add some noise
      height += (Math.random() * 2 - 1) * 0.1
      
      // Make the edges slope down to the water (island effect)
      const distanceFromCenter = Math.sqrt(x * x + z * z)
      const edgeFactor = Math.max(0, distanceFromCenter - terrainSize * 0.3) / (terrainSize * 0.2)
      
      // Apply island shape - higher in center, sloping down at edges
      height = Math.max(0, height - edgeFactor * 2)
      
      // Store the height
      terrainHeightMap[index] = height
    }
  }
  
  return (
    <>
      {/* Ground plane with texture */}
      <mesh ref={ref}>
        <planeGeometry args={[BATTLEFIELD_SIZE, BATTLEFIELD_SIZE, 64, 64]} />
        <meshStandardMaterial 
          map={groundTexture}
          roughness={1.0}
          metalness={0.0}
          displacementMap={new THREE.DataTexture(
            terrainHeightMap,
            terrainResolution,
            terrainResolution,
            THREE.RedFormat,
            THREE.FloatType
          )}
          displacementScale={2.5}
          displacementBias={0}
        />
      </mesh>
      
      {/* Add a sandy beach around the edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[BATTLEFIELD_SIZE * 0.4, BATTLEFIELD_SIZE * 0.5, 64]} />
        <meshStandardMaterial 
          color="#e6d298" 
          roughness={1.0}
          metalness={0.0}
        />
      </mesh>
      
      {/* Add a mountain to the battlefield */}
      <Mountain 
        position={[-BATTLEFIELD_HALF_SIZE * 0.6, 0, -BATTLEFIELD_HALF_SIZE * 0.6]} 
        size={1.5}
        detail={6}
      />
      
      {/* Invisible boundary walls to keep objects within the battlefield */}
      {/* North wall */}
      <BoundaryWall 
        position={[0, BOUNDARY_HEIGHT / 2, -BATTLEFIELD_HALF_SIZE]} 
        rotation={[0, 0, 0]} 
        size={[BATTLEFIELD_SIZE, BOUNDARY_HEIGHT, BOUNDARY_THICKNESS]} 
      />
      
      {/* South wall */}
      <BoundaryWall 
        position={[0, BOUNDARY_HEIGHT / 2, BATTLEFIELD_HALF_SIZE]} 
        rotation={[0, 0, 0]} 
        size={[BATTLEFIELD_SIZE, BOUNDARY_HEIGHT, BOUNDARY_THICKNESS]} 
      />
      
      {/* East wall */}
      <BoundaryWall 
        position={[BATTLEFIELD_HALF_SIZE, BOUNDARY_HEIGHT / 2, 0]} 
        rotation={[0, Math.PI / 2, 0]} 
        size={[BATTLEFIELD_SIZE, BOUNDARY_HEIGHT, BOUNDARY_THICKNESS]} 
      />
      
      {/* West wall */}
      <BoundaryWall 
        position={[-BATTLEFIELD_HALF_SIZE, BOUNDARY_HEIGHT / 2, 0]} 
        rotation={[0, Math.PI / 2, 0]} 
        size={[BATTLEFIELD_SIZE, BOUNDARY_HEIGHT, BOUNDARY_THICKNESS]} 
      />
      
      {/* Houses with physics for bullet collision */}
      {housePositions.map((position, index) => (
        <House 
          key={`house-${index}`} 
          position={position} 
          rotation={[0, Math.random() * Math.PI * 2, 0]} 
          size={0.8 + Math.random() * 0.4}
        />
      ))}
      
      {/* Bomb craters */}
      {craterPositions.map((position, index) => (
        <group key={`crater-${index}`} position={[position[0], -0.2, position[2]]}>
          <mesh receiveShadow>
            <cylinderGeometry args={[2 + Math.random() * 2, 3 + Math.random() * 2, 0.8, 16]} />
            <meshStandardMaterial 
              color="#3d3d3d" 
              roughness={1} 
              aoMapIntensity={1}
            />
          </mesh>
        </group>
      ))}
      
      {/* Bunkers */}
      {bunkerPositions.map((position, index) => {
        // Random rotation for variety
        const rotation = [0, Math.random() * Math.PI * 2, 0] as [number, number, number]
        
        return (
          <group key={`bunker-${index}`} position={[position[0], 0, position[2]]} rotation={rotation}>
            {/* Bunker physics - for bullet collision */}
            <BunkerPhysics 
              position={[position[0], 1, position[2]]} 
              rotation={rotation} 
              args={[6, 2, 4]} 
            />
            
            <group>
              {/* Main bunker structure */}
              <mesh 
                receiveShadow 
                castShadow
                position={[0, 1, 0]}
              >
                <boxGeometry args={[6, 2, 4]} />
                <meshStandardMaterial color="#5d5d5d" roughness={0.9} />
              </mesh>
              
              {/* Bunker roof */}
              <mesh 
                receiveShadow 
                castShadow
                position={[0, 2.2, 0]}
              >
                <boxGeometry args={[6.5, 0.4, 4.5]} />
                <meshStandardMaterial color="#4d4d4d" roughness={0.9} />
              </mesh>
              
              {/* Bunker entrance */}
              <mesh 
                receiveShadow 
                castShadow
                position={[0, 0.8, 2.1]}
                rotation={[0, 0, 0]}
              >
                <boxGeometry args={[2, 1.6, 0.3]} />
                <meshStandardMaterial color="#333333" roughness={0.9} />
              </mesh>
              
              {/* Sandbags around bunker */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * Math.PI * 2
                const radius = 3.5
                return (
                  <mesh 
                    key={`sandbag-${i}`}
                    position={[
                      Math.cos(angle) * radius,
                      0.4,
                      Math.sin(angle) * radius
                    ]}
                    rotation={[0, angle + Math.PI/2, 0]}
                    castShadow
                    receiveShadow
                  >
                    <boxGeometry args={[0.8, 0.4, 0.4]} />
                    <meshStandardMaterial 
                      color="#a08060" 
                      roughness={1} 
                    />
                  </mesh>
                )
              })}
            </group>
          </group>
        )
      })}
      
      {/* Barricades/Barriers */}
      {barricadePositions.map((position, index) => {
        // Random rotation for variety
        const rotation = [0, Math.random() * Math.PI * 2, 0] as [number, number, number]
        
        return (
          <group key={`barricade-${index}`} position={[position[0], 0, position[2]]} rotation={rotation}>
            {/* Czech hedgehog anti-tank barrier */}
            {Math.random() > 0.5 ? (
              <group>
                {/* Physics for bullet collision */}
                <BarrierPhysics 
                  position={position} 
                  rotation={rotation} 
                  args={[3, 3, 3]} 
                />
                
                {/* Steel beams forming X shapes */}
                <mesh castShadow position={[0, 1, 0]} rotation={[0, 0, Math.PI/4]}>
                  <boxGeometry args={[0.2, 3, 0.2]} />
                  <meshStandardMaterial color="#444444" roughness={0.7} metalness={0.8} />
                </mesh>
                <mesh castShadow position={[0, 1, 0]} rotation={[0, 0, -Math.PI/4]}>
                  <boxGeometry args={[0.2, 3, 0.2]} />
                  <meshStandardMaterial color="#444444" roughness={0.7} metalness={0.8} />
                </mesh>
                <mesh castShadow position={[0, 1, 0]} rotation={[Math.PI/4, 0, 0]}>
                  <boxGeometry args={[0.2, 3, 0.2]} />
                  <meshStandardMaterial color="#444444" roughness={0.7} metalness={0.8} />
                </mesh>
                <mesh castShadow position={[0, 1, 0]} rotation={[-Math.PI/4, 0, 0]}>
                  <boxGeometry args={[0.2, 3, 0.2]} />
                  <meshStandardMaterial color="#444444" roughness={0.7} metalness={0.8} />
                </mesh>
              </group>
            ) : (
              // Sandbag barrier
              <group>
                {/* Physics for bullet collision */}
                <BarrierPhysics 
                  position={[position[0], 0.6, position[2]]} 
                  rotation={rotation} 
                  args={[4, 1.2, 0.8]} 
                />
                
                {/* Bottom row */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <mesh 
                    key={`sandbag-bottom-${i}`}
                    position={[i - 2, 0.2, 0]}
                    castShadow
                  >
                    <boxGeometry args={[0.8, 0.4, 0.4]} />
                    <meshStandardMaterial 
                      color="#a08060" 
                      roughness={1} 
                    />
                  </mesh>
                ))}
                
                {/* Middle row */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <mesh 
                    key={`sandbag-middle-${i}`}
                    position={[i - 1.5, 0.6, 0]}
                    castShadow
                  >
                    <boxGeometry args={[0.8, 0.4, 0.4]} />
                    <meshStandardMaterial 
                      color="#a08060" 
                      roughness={1} 
                    />
                  </mesh>
                ))}
                
                {/* Top row */}
                {Array.from({ length: 3 }).map((_, i) => (
                  <mesh 
                    key={`sandbag-top-${i}`}
                    position={[i - 1, 1.0, 0]}
                    castShadow
                  >
                    <boxGeometry args={[0.8, 0.4, 0.4]} />
                    <meshStandardMaterial 
                      color="#a08060" 
                      roughness={1} 
                    />
                  </mesh>
                ))}
              </group>
            )}
          </group>
        )
      })}
      
      {/* Trees - mix of damaged and intact trees */}
      {treePositions.map((position, index) => {
        const treeType = Math.random() > 0.6 ? 'pine' : 'oak'
        const scale = 0.7 + Math.random() * 0.5
        
        // Some trees should be damaged (broken/burnt)
        const isDamaged = Math.random() > 0.7
        
        if (isDamaged) {
          // Damaged/broken tree
          return (
            <group key={`damaged-tree-${index}`} position={[position[0], 0, position[2]]}>
              {/* Broken trunk */}
              <mesh castShadow position={[0, 1, 0]} rotation={[Math.random() * 0.3, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.3, 2 - Math.random(), 8]} />
                <meshStandardMaterial color="#3d2817" roughness={0.9} />
              </mesh>
              
              {/* Some burnt branches */}
              <mesh castShadow position={[0.3, 1.5, 0]} rotation={[0, 0, Math.PI / 3]}>
                <cylinderGeometry args={[0.05, 0.1, 0.8, 6]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
              </mesh>
            </group>
          )
        } else {
          // Intact tree
          return (
            <Tree 
              key={`tree-${index}`} 
              position={position} 
              scale={scale}
              type={treeType as 'pine' | 'oak'}
            />
          )
        }
      })}
    </>
  )
}

export default Battlefield 