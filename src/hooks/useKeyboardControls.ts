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
        case 'arrowup': // Add arrow up as an alternative for forward
          setKeys(prev => {
            console.log('Setting moveForward to true');
            return { ...prev, moveForward: true };
          });
          break
        case 's':
        case 'arrowdown': // Add arrow down as an alternative for backward
          setKeys(prev => {
            console.log('Setting moveBackward to true');
            return { ...prev, moveBackward: true };
          });
          break
        case 'a':
        case 'arrowleft': // Add arrow left as an alternative for turning left
          setKeys(prev => {
            console.log('Setting turnLeft to true');
            return { ...prev, turnLeft: true };
          });
          break
        case 'd':
        case 'arrowright': // Add arrow right as an alternative for turning right
          setKeys(prev => {
            console.log('Setting turnRight to true');
            return { ...prev, turnRight: true };
          });
          break
        case ' ':
          setKeys(prev => {
            console.log('Setting shoot to true');
            return { ...prev, shoot: true };
          });
          break
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Log key releases for debugging
      console.log('Key up:', e.key.toLowerCase())
      
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup': // Add arrow up as an alternative for forward
          setKeys(prev => {
            console.log('Setting moveForward to false');
            return { ...prev, moveForward: false };
          });
          break
        case 's':
        case 'arrowdown': // Add arrow down as an alternative for backward
          setKeys(prev => {
            console.log('Setting moveBackward to false');
            return { ...prev, moveBackward: false };
          });
          break
        case 'a':
        case 'arrowleft': // Add arrow left as an alternative for turning left
          setKeys(prev => {
            console.log('Setting turnLeft to false');
            return { ...prev, turnLeft: false };
          });
          break
        case 'd':
        case 'arrowright': // Add arrow right as an alternative for turning right
          setKeys(prev => {
            console.log('Setting turnRight to false');
            return { ...prev, turnRight: false };
          });
          break
        case ' ':
          setKeys(prev => {
            console.log('Setting shoot to false');
            return { ...prev, shoot: false };
          });
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