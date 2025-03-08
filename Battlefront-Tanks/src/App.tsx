import { Canvas } from '@react-three/fiber'
import { Sky, OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/cannon'
import './App.css'

// Components
import Battlefield from './components/Battlefield'
import Tank from './components/Tank'
import GameUI from './components/GameUI'

// Hooks
import { useGameState } from './hooks/useGameState'

function App() {
  const { players, gameState, startGame, applyDamage } = useGameState()

  return (
    <div className="app-container">
      <Canvas shadows camera={{ position: [0, 10, 20], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[10, 10, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[2048, 2048]} 
        />
        
        <Physics>
          <Battlefield />
          {players.map(player => (
            <Tank 
              key={player.id}
              position={player.position}
              rotation={player.rotation}
              color={player.color}
              playerId={player.id}
              health={player.health}
              isCurrentPlayer={player.id === gameState.currentPlayer}
              onHit={(targetId) => applyDamage(targetId, 20)}
            />
          ))}
        </Physics>
        
        <Sky sunPosition={[100, 20, 100]} />
        <OrbitControls />
      </Canvas>
      
      <GameUI 
        players={players}
        gameState={gameState}
        onStartGame={startGame}
      />
    </div>
  )
}

export default App
