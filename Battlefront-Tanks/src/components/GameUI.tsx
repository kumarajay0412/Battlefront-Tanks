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
              <li>Use <strong>Arrow Keys</strong> to aim your turret</li>
              <li>Hold <strong>Right Mouse Button</strong> to see trajectory prediction</li>
              <li>Press <strong>Spacebar</strong> to fire a cannonball</li>
              <li>Destroy enemy tanks to win!</li>
            </ul>
            <div className="advanced-instructions">
              <h3>Advanced Controls:</h3>
              <ul>
                <li>Use <strong>Up/Down Arrows</strong> to adjust cannon elevation</li>
                <li>Use <strong>Left/Right Arrows</strong> to rotate the turret</li>
                <li>Cannonballs are affected by gravity - aim accordingly!</li>
                <li>Use the trajectory prediction to line up perfect shots</li>
              </ul>
            </div>
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
      
      {/* Game controls reminder */}
      {gameState.isGameStarted && !gameState.winner && (
        <div className="controls-reminder">
          <p>
            <strong>WASD</strong>: Move | 
            <strong>Arrows</strong>: Aim | 
            <strong>Right-Click</strong>: Show Trajectory | 
            <strong>Space</strong>: Fire
          </p>
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