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
    if (!isActive) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for game controls
      if (['w', 's', 'a', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
      
      // Only log key presses once during development
      // console.log('Key down:', e.key.toLowerCase())
      
      switch (e.key.toLowerCase()) {
        case 'w':
          setKeys(prev => ({ ...prev, moveForward: true }))
          break
        case 's':
          setKeys(prev => ({ ...prev, moveBackward: true }))
          break
        case 'a':
          setKeys(prev => ({ ...prev, turnLeft: true }))
          break
        case 'd':
          setKeys(prev => ({ ...prev, turnRight: true }))
          break
        case ' ':
          setKeys(prev => ({ ...prev, shoot: true }))
          break
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Only log key releases once during development
      // console.log('Key up:', e.key.toLowerCase())
      
      switch (e.key.toLowerCase()) {
        case 'w':
          setKeys(prev => ({ ...prev, moveForward: false }))
          break
        case 's':
          setKeys(prev => ({ ...prev, moveBackward: false }))
          break
        case 'a':
          setKeys(prev => ({ ...prev, turnLeft: false }))
          break
        case 'd':
          setKeys(prev => ({ ...prev, turnRight: false }))
          break
        case ' ':
          setKeys(prev => ({ ...prev, shoot: false }))
          break
      }
    }
    
    // Add event listeners with capture to ensure they get priority
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    window.addEventListener('keyup', handleKeyUp, { capture: true })
    
    // Only log initialization once during development
    // console.log('Keyboard controls initialized:', keys)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      window.removeEventListener('keyup', handleKeyUp, { capture: true })
    }
  }, [isActive])
  
  return keys
} 