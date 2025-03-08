import { useState, useEffect } from 'react'

interface KeyboardControls {
  moveForward: boolean
  moveBackward: boolean
  turnLeft: boolean
  turnRight: boolean
  shoot: boolean
}

export const useKeyboardControls = (isActive: boolean = true): KeyboardControls => {
  const [keys, setKeys] = useState<KeyboardControls>({
    moveForward: false,
    moveBackward: false,
    turnLeft: false,
    turnRight: false,
    shoot: false,
  })

  useEffect(() => {
    if (!isActive) {
      console.log('Keyboard controls not active for this player')
      return
    }
    
    console.log('Initializing keyboard controls for active player')
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for game controls
      if (['w', 's', 'a', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
      
      // Log key presses for debugging
      console.log('Key down:', e.key.toLowerCase())
      
      switch (e.key.toLowerCase()) {
        case 'w':
          setKeys(prev => ({ ...prev, moveForward: true }))
          console.log('Move forward: true')
          break
        case 's':
          setKeys(prev => ({ ...prev, moveBackward: true }))
          console.log('Move backward: true')
          break
        case 'a':
          setKeys(prev => ({ ...prev, turnLeft: true }))
          console.log('Turn left: true')
          break
        case 'd':
          setKeys(prev => ({ ...prev, turnRight: true }))
          console.log('Turn right: true')
          break
        case ' ':
          setKeys(prev => ({ ...prev, shoot: true }))
          console.log('Shoot: true')
          break
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Log key releases for debugging
      console.log('Key up:', e.key.toLowerCase())
      
      switch (e.key.toLowerCase()) {
        case 'w':
          setKeys(prev => ({ ...prev, moveForward: false }))
          console.log('Move forward: false')
          break
        case 's':
          setKeys(prev => ({ ...prev, moveBackward: false }))
          console.log('Move backward: false')
          break
        case 'a':
          setKeys(prev => ({ ...prev, turnLeft: false }))
          console.log('Turn left: false')
          break
        case 'd':
          setKeys(prev => ({ ...prev, turnRight: false }))
          console.log('Turn right: false')
          break
        case ' ':
          setKeys(prev => ({ ...prev, shoot: false }))
          console.log('Shoot: false')
          break
      }
    }
    
    // Add event listeners with capture to ensure they get priority
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    window.addEventListener('keyup', handleKeyUp, { capture: true })
    
    console.log('Keyboard controls initialized:', keys)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      window.removeEventListener('keyup', handleKeyUp, { capture: true })
      console.log('Keyboard controls removed')
    }
  }, [isActive])
  
  return keys
} 