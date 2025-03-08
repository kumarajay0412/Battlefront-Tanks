import { useState, useCallback } from 'react'

export interface Player {
  id: number
  position: [number, number, number]
  rotation: [number, number, number]
  color: string
  health: number
}

export interface GameState {
  isGameStarted: boolean
  winner: number | null
  currentPlayer: number
}

export const useGameState = () => {
  // Initialize players
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, position: [0, 0.5, 5], rotation: [0, 0, 0], color: 'red', health: 100 },
    { id: 2, position: [5, 0.5, 0], rotation: [0, -Math.PI / 2, 0], color: 'blue', health: 100 }
  ])
  
  // Initialize game state
  const [gameState, setGameState] = useState<GameState>({
    isGameStarted: false,
    winner: null,
    currentPlayer: 1
  })
  
  // Start or restart the game
  const startGame = useCallback(() => {
    setPlayers([
      { id: 1, position: [0, 0.5, 5], rotation: [0, 0, 0], color: 'red', health: 100 },
      { id: 2, position: [5, 0.5, 0], rotation: [0, -Math.PI / 2, 0], color: 'blue', health: 100 }
    ])
    
    setGameState({
      isGameStarted: true,
      winner: null,
      currentPlayer: 1
    })
  }, [])
  
  // Switch to the next player's turn
  const nextTurn = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentPlayer: prev.currentPlayer === 1 ? 2 : 1
    }))
  }, [])
  
  // Apply damage to a player
  const applyDamage = useCallback((playerId: number, damage: number) => {
    setPlayers(prev => 
      prev.map(player => {
        if (player.id === playerId) {
          const newHealth = Math.max(0, player.health - damage)
          return { ...player, health: newHealth }
        }
        return player
      })
    )
    
    // Check if a player has been defeated
    const updatedPlayers = players.map(player => {
      if (player.id === playerId) {
        return { ...player, health: Math.max(0, player.health - damage) }
      }
      return player
    })
    
    const defeatedPlayer = updatedPlayers.find(player => player.health <= 0)
    
    if (defeatedPlayer) {
      // Set the winner as the other player
      const winnerId = defeatedPlayer.id === 1 ? 2 : 1
      setGameState(prev => ({
        ...prev,
        winner: winnerId
      }))
    } else {
      // Switch turns after damage is applied
      nextTurn()
    }
  }, [players, nextTurn])
  
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
  
  return {
    players,
    gameState,
    startGame,
    nextTurn,
    applyDamage,
    updatePlayerPosition
  }
} 