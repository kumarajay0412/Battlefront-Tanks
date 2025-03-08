export interface KeyboardControls {
  moveForward: boolean;
  moveBackward: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  shoot: boolean;
}

export function useKeyboardControls(isActive?: boolean): KeyboardControls; 