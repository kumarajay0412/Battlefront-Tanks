import { Canvas } from '@react-three/fiber'
import { Sky, OrbitControls, Cloud, Stars } from '@react-three/drei'
import { Physics } from '@react-three/cannon'
import './App.css'
import { useEffect, useState, useCallback } from 'react'

// Components
import Battlefield from './components/Battlefield'
import Tank from './components/Tank'
import GameUI from './components/GameUI'
import Balloon from './components/Balloon'
import Water from './components/Water'

// Hooks
import { useGameState } from './hooks/useGameState'

// Define battlefield dimensions as constants for reuse
const BATTLEFIELD_SIZE = 100
const BATTLEFIELD_HALF_SIZE = BATTLEFIELD_SIZE / 2
const BOUNDARY_MARGIN = 10 // Keep tanks this far from the edge

// Balloon colors and point values
const BALLOON_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']
const BALLOON_POINTS = [10, 15, 20, 25, 30, 50]

// Generate random balloon positions
const generateBalloonPositions = (count: number) => {
  const positions: Array<{
    position: [number, number, number];
    color: string;
    points: number;
    id: number;
  }> = []
  
  for (let i = 0; i < count; i++) {
    // Generate random position within battlefield
    const x = (Math.random() * 2 - 1) * (BATTLEFIELD_HALF_SIZE - BOUNDARY_MARGIN - 5) // Add extra margin for larger balloons
    const y = 7 + Math.random() * 12 // Height between 7 and 19 units (increased for larger balloons)
    const z = (Math.random() * 2 - 1) * (BATTLEFIELD_HALF_SIZE - BOUNDARY_MARGIN - 5) // Add extra margin for larger balloons
    
    // Randomly select color and points
    const colorIndex = Math.floor(Math.random() * BALLOON_COLORS.length)
    const color = BALLOON_COLORS[colorIndex]
    const points = BALLOON_POINTS[colorIndex]
    
    positions.push({
      position: [x, y, z],
      color,
      points,
      id: i + 1
    })
  }
  
  return positions
}

function App() {
  // Normal game state
  const { players, gameState, startGame, applyDamage, updatePlayerPosition, addPoints } = useGameState()
  
  // Balloon state
  const [balloons, setBalloons] = useState<Array<{
    position: [number, number, number];
    color: string;
    points: number;
    id: number;
    isBurst: boolean;
  }>>([])
  
  // Handle balloon burst
  const handleBalloonBurst = useCallback((points: number, balloonId: number) => {
    console.log("Balloon burst:", balloonId, "Points:", points);
    
    // Add points to current player
    addPoints(points)
    
    // Mark balloon as burst
    setBalloons(prev => 
      prev.map(balloon => 
        balloon.id === balloonId 
          ? { ...balloon, isBurst: true } 
          : balloon
      )
    )
  }, [addPoints])
  
  // Start the normal game automatically when the component mounts
  useEffect(() => {
    console.log("Starting normal game automatically")
    startGame()
    
    // Calculate safe positions within the battlefield boundaries
    const safeDistance = BATTLEFIELD_HALF_SIZE - BOUNDARY_MARGIN
    
    // Position players at opposite ends of the map but within boundaries
    // Update each player individually since that's what our hook supports
    updatePlayerPosition(2, [-safeDistance, 0.5, -safeDistance], [0, Math.PI / 4, 0]);
    updatePlayerPosition(1, [safeDistance, 0.5, safeDistance], [0, -Math.PI * 3 / 4, 0]);
    
    // Generate balloons
    setBalloons(generateBalloonPositions(15).map(balloon => ({
      ...balloon,
      isBurst: false
    })))
  }, [startGame, updatePlayerPosition])

  return (
    <div className="app-container">
      <Canvas camera={{ position: [0, 30, 60], fov: 45 }}>
        {/* Enhanced lighting for a more dramatic look */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[50, 50, 20]} 
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={100}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        
        {/* Physics world */}
        <Physics 
          gravity={[0, -9.8, 0]} 
          defaultContactMaterial={{
            friction: 0.5,
            restitution: 0.1,
          }}
        >
          {/* Battlefield with terrain, trees, and other elements */}
          <Battlefield />
          
          {/* Ocean water surrounding the battlefield */}
          <Water 
            position={[0, -1, 0]} 
            size={500} 
            color="#4a95e6" 
            waveSpeed={0.3}
          />
          
          {/* Player tanks */}
          {players.map(player => (
            <Tank
              key={player.id}
              position={player.position}
              rotation={player.rotation}
              color={player.color}
              playerId={player.id}
              health={player.health}
              isCurrentPlayer={gameState.currentPlayer === player.id}
              onHit={(targetId: number) => applyDamage(targetId, 10)}
            />
          ))}
          
          {/* Balloons */}
          {balloons.filter(balloon => !balloon.isBurst).map(balloon => (
            <Balloon
              key={balloon.id}
              id={balloon.id}
              position={balloon.position}
              color={balloon.color}
              points={balloon.points}
              onBurst={(points) => handleBalloonBurst(points, balloon.id)}
            />
          ))}
        </Physics>
        
        {/* Environment */}
        <Sky 
          distance={450000} 
          sunPosition={[5, 1, 8]} 
          inclination={0.5} 
          azimuth={0.25} 
          rayleigh={0.5}
        />
        
        {/* Add some clouds for atmosphere */}
        <Cloud position={[-10, 15, -10]} />
        <Cloud position={[10, 10, -5]} />
        <Cloud position={[0, 10, 10]} />
        
        {/* Add stars for a more dramatic sky */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
        
        {/* Camera controls */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2 - 0.1} // Prevent camera from going below ground
        />
      </Canvas>
      
      {/* Game UI */}
      <GameUI 
        players={players}
        gameState={gameState}
        onStartGame={startGame}
      />
    </div>
  )
}

export default App
