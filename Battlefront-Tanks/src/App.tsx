import { Canvas } from '@react-three/fiber'
import { Sky, OrbitControls, Cloud, Stars } from '@react-three/drei'
import { Physics } from '@react-three/cannon'
import './App.css'
import { useEffect } from 'react'

// Components
import Battlefield from './components/Battlefield'
import Tank from './components/Tank'
import GameUI from './components/GameUI'

// Hooks
import { useGameState } from './hooks/useGameState'

// Define battlefield dimensions as constants for reuse
const BATTLEFIELD_SIZE = 100
const BATTLEFIELD_HALF_SIZE = BATTLEFIELD_SIZE / 2
const BOUNDARY_MARGIN = 10 // Keep tanks this far from the edge

function App() {
  const { players, gameState, startGame, applyDamage, updatePlayerPosition } = useGameState()
  
  // Start the game automatically when the component mounts
  useEffect(() => {
    console.log("Starting game automatically")
    startGame()
    
    // Calculate safe positions within the battlefield boundaries
    const safeDistance = BATTLEFIELD_HALF_SIZE - BOUNDARY_MARGIN
    
    // Position players at opposite ends of the map but within boundaries
    // Update each player individually since that's what our hook supports
    updatePlayerPosition(1, [-safeDistance, 0.5, -safeDistance], [0, Math.PI / 4, 0]);
    updatePlayerPosition(2, [safeDistance, 0.5, safeDistance], [0, -Math.PI * 3 / 4, 0]);
  }, [startGame, updatePlayerPosition])
  
  // Debug output for current game state
  useEffect(() => {
    console.log("Current game state:", gameState)
    console.log("Players:", players)
  }, [gameState, players])

  return (
    <div className="app-container">
      <Canvas camera={{ position: [0, 20, 50], fov: 45 }}>
        {/* Enhanced lighting for a more dramatic look */}
        <ambientLight intensity={0.5} /> {/* Increased ambient light since we're removing shadows */}
        <directionalLight 
          position={[50, 50, 20]} 
          intensity={1.0} 
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
        </Physics>
        
        {/* Environment */}
        <Sky 
          distance={450000} 
          sunPosition={[5, 1, 8]} 
          inclination={0.5} 
          azimuth={0.25} 
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
