import { useState, useCallback, useEffect } from 'react'

export interface Player {
  id: number
  position: [number, number, number]
  rotation: [number, number, number]
  color: string
  health: number
  score: number
  name: string
}

export interface GameState {
  isGameStarted: boolean
  winner: number | null
  currentPlayer: number
  timeRemaining: number
  isGameOver: boolean
}

export const useGameState = () => {
  // Initialize single player
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, position: [0, 0.5, 5], rotation: [0, 0, 0], color: 'red', health: 100, score: 0, name: '' }
  ])
  
  // Initialize game state with timer
  const [gameState, setGameState] = useState<GameState>({
    isGameStarted: false,
    winner: null,
    currentPlayer: 1,
    timeRemaining: 120, // 2 minutes in seconds
    isGameOver: false
  })

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (gameState.isGameStarted && !gameState.isGameOver) {
      timer = setInterval(() => {
        setGameState(prev => {
          const newTime = prev.timeRemaining - 1;
          if (newTime <= 0) {
            // Game over when time runs out
            return {
              ...prev,
              timeRemaining: 0,
              isGameOver: true
            };
          }
          return {
            ...prev,
            timeRemaining: newTime
          };
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [gameState.isGameStarted, gameState.isGameOver]);
  
  // Start or restart the game
  const startGame = useCallback((playerName: string) => {
    setPlayers([
      { id: 1, position: [0, 0.5, 5], rotation: [0, 0, 0], color: 'red', health: 100, score: 0, name: playerName }
    ])
    
    setGameState({
      isGameStarted: true,
      winner: null,
      currentPlayer: 1,
      timeRemaining: 120,
      isGameOver: false
    })
  }, [])
  
  // Update player position
  const updatePlayerPosition = useCallback((playerId: number, position: [number, number, number], rotation: [number, number, number]) => {
    setPlayers(prev => 
      prev.map(player => {
        if (player.id === playerId) {
          return { ...player, position, rotation }
        }
        return player
      })
    )
  }, [])
  
  // Add points to the player's score
  const addPoints = useCallback((points: number) => {
    setPlayers(prev => 
      prev.map(player => {
        if (player.id === 1) {
          return { ...player, score: player.score + points }
        }
        return player
      })
    )
  }, [])
  
  return {
    players,
    gameState,
    startGame,
    updatePlayerPosition,
    addPoints
  }
} 