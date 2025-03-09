import React from 'react'

interface Player {
  id: number
  position: [number, number, number]
  rotation: [number, number, number]
  color: string
  health: number
  score: number
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
              <li>Use <strong>Arrow Keys</strong> to move your tank</li>
              <li>Use <strong>WASD</strong> to rotate your turret (2° per click)</li>
              <li>Hold <strong>Right Mouse Button</strong> to see trajectory prediction</li>
              <li>Press <strong>Spacebar</strong> to fire a cannonball</li>
              <li>Destroy enemy tanks to win!</li>
              <li>Burst balloons to earn points!</li>
            </ul>
            <div className="advanced-instructions">
              <h3>Advanced Controls:</h3>
              <ul>
                <li>Use <strong>W/S</strong> to adjust cannon elevation (range: -20° to 90°)</li>
                <li>Use <strong>A/D</strong> to rotate the turret</li>
                <li>Cannonballs are affected by gravity - aim accordingly!</li>
                <li>Use the trajectory prediction to line up perfect shots</li>
                <li>Shoot at balloons to earn bonus points</li>
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
              
              {/* Score display */}
              <div className="score-display">
                <span className="score-label">Score:</span>
                <span className="score-value">{player.score}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Game controls reminder */}
      {gameState.isGameStarted && !gameState.winner && (
        <div className="controls-reminder">
          <p>
            <strong>Arrow Keys</strong>: Move | 
            <strong>WASD</strong>: Rotate Turret | 
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
          <p>Final Scores:</p>
          <div className="final-scores">
            {players.map(player => (
              <div key={player.id} style={{ color: player.color }}>
                Player {player.id}: {player.score} points
              </div>
            ))}
          </div>
          <button className="restart-button" onClick={onStartGame}>
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}

export default GameUI 