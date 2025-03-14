import React, { useState } from 'react'

interface Player {
  id: number
  position: [number, number, number]
  rotation: [number, number, number]
  color: string
  health: number
  score: number
  name: string
}

interface GameState {
  isGameStarted: boolean
  winner: number | null
  currentPlayer: number
  timeRemaining: number
  isGameOver: boolean
}

interface GameUIProps {
  players: Player[]
  gameState: GameState
  onStartGame: (playerName: string) => void
}

const GameUI: React.FC<GameUIProps> = ({ players, gameState, onStartGame }) => {
  const [playerName, setPlayerName] = useState('')
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault()
    if (playerName.trim()) {
      onStartGame(playerName.trim())
    }
  }

  return (
    <div className="game-ui">
      {/* Game title and instructions */}
      <div className="game-header">
        <h1>Battlefront Tanks</h1>
        {!gameState.isGameStarted && (
          <div className="game-instructions">
            <h2>Instructions:</h2>
            <ul>
              <li>Use <strong>Arrow Keys</strong> to move your tank</li>
              <li>Use <strong>WASD</strong> to rotate your turret (2° per click)</li>
              <li>Hold <strong>Right Mouse Button</strong> to see trajectory prediction</li>
              <li>Press <strong>Spacebar</strong> to fire a cannonball</li>
              <li><strong>Click on your tank</strong> to select different bullet types</li>
              <li>Burst balloons to earn points!</li>
              <li>You have <strong>2 minutes</strong> to score as many points as possible!</li>
            </ul>
            
            <form onSubmit={handleStartGame} className="player-name-form">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                required
                className="player-name-input"
              />
              <button type="submit" className="start-button" disabled={!playerName.trim()}>
                Start Game
              </button>
            </form>
          </div>
        )}
      </div>
      
      
      {/* Game controls reminder */}
      {gameState.isGameStarted && !gameState.isGameOver && (
        <div className="controls-reminder">
          <p>
            <strong>Arrow Keys</strong>: Move | 
            <strong>WASD</strong>: Rotate Turret | 
            <strong>Right-Click</strong>: Show Trajectory | 
            <strong>Space</strong>: Fire | 
            <strong>Click Tank</strong>: Change Ammo
          </p>
        </div>
      )}
      
      {/* Game over message */}
      {gameState.isGameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Time's up!</p>
          <p style={{ color: 'black' }}>{players[0].name}'s Final Score: {players[0].score} points</p>
          <button className="restart-button" onClick={() => onStartGame(players[0].name)}>
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}

export default GameUI 