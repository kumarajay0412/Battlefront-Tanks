import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Player {
  id: number;
  position: [number, number, number];
  rotation: [number, number, number];
}

interface PlayerCameraProps {
  playerId: number;
  players: Player[];
}

const PlayerCamera: React.FC<PlayerCameraProps> = ({ playerId, players }) => {
  const { camera } = useThree();
  const targetPlayer = players.find(player => player.id === playerId);
  const cameraPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  
  // Set initial camera position
  useEffect(() => {
    if (targetPlayer) {
      // Position the camera behind and above the player's tank
      const [x, y, z] = targetPlayer.position;
      const [rotX, rotY, rotZ] = targetPlayer.rotation;
      
      // Calculate position behind the tank based on its rotation
      const distance = 15; // Distance behind the tank
      const height = 8;   // Height above the tank
      
      // Calculate the position behind the tank based on its rotation
      const offsetX = Math.sin(rotY) * distance;
      const offsetZ = Math.cos(rotY) * distance;
      
      // Set camera position
      camera.position.set(x - offsetX, y + height, z - offsetZ);
      
      // Look at the tank
      camera.lookAt(new THREE.Vector3(x, y, z));
    }
  }, []);
  
  // Update camera position to follow player 1
  useFrame(() => {
    if (!targetPlayer) return;
    
    const [x, y, z] = targetPlayer.position;
    const [rotX, rotY, rotZ] = targetPlayer.rotation;
    
    // Calculate position behind the tank based on its rotation
    const distance = 15; // Distance behind the tank
    const height = 8;   // Height above the tank
    
    // Calculate the position behind the tank based on its rotation
    const offsetX = Math.sin(rotY) * distance;
    const offsetZ = Math.cos(rotY) * distance;
    
    // Set target position with smooth interpolation
    cameraPositionRef.current.set(x - offsetX, y + height, z - offsetZ);
    cameraTargetRef.current.set(x, y + 2, z);
    
    // Smoothly interpolate camera position
    camera.position.lerp(cameraPositionRef.current, 0.1);
    
    // Create a temporary vector for the camera's target
    const lookTarget = new THREE.Vector3();
    lookTarget.copy(cameraTargetRef.current);
    
    // Make the camera look at the target
    camera.lookAt(lookTarget);
  });
  
  return null; // This component doesn't render anything
};

export default PlayerCamera; 