import React from 'react'

interface Player {
  id: number
  position: [number, number, number]
  rotation: [number, number, number]
  color: string
  health: number
}

interface GameState {
  isGameStarted: boolean
  winner: number | null
  currentPlayer: number
}

interface GameUIProps {
  players: Player[]
  gameState: GameState
  onStartGame: () => void
}

const GameUI: React.FC<GameUIProps> = ({ players, gameState, onStartGame }) => {
  return (
    <div className="game-ui">
      {/* Game title and instructions */}
      <div className="game-header">
        <h1>Battlefront Tanks</h1>
        {!gameState.isGameStarted && (
          <div className="game-instructions">
            <h2>Instructions:</h2>
            <ul>
              <li>Use <strong>W, A, S, D</strong> to move your tank</li>
              <li>Press <strong>Spacebar</strong> to shoot</li>
              <li>Destroy enemy tanks to win!</li>
            </ul>
            <button className="start-button" onClick={onStartGame}>
              Start Game
            </button>
          </div>
        )}
      </div>
      
      {/* Player stats */}
      {gameState.isGameStarted && (
        <div className="player-stats">
          {players.map(player => (
            <div 
              key={player.id} 
              className={`player-stat ${gameState.currentPlayer === player.id ? 'active-player' : ''}`}
              style={{ borderColor: player.color }}
            >
              <div className="player-name" style={{ color: player.color }}>
                Player {player.id}
                {gameState.currentPlayer === player.id && <span> (Your Turn)</span>}
              </div>
              <div className="health-bar-container">
                <div 
                  className="health-bar" 
                  style={{ 
                    width: `${player.health}%`,
                    backgroundColor: player.health > 50 ? 'green' : player.health > 25 ? 'orange' : 'red'
                  }}
                />
              </div>
              <div className="health-text">{player.health}%</div>
            </div>
          ))}
        </div>
      )}
      
      {/* Game over message */}
      {gameState.winner !== null && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Player {gameState.winner} wins!</p>
          <button className="restart-button" onClick={onStartGame}>
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}

export default GameUI 