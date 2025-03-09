import React from 'react'
import { useTexture } from '@react-three/drei'

// Define bullet types
export type BulletType = 'standard' | 'missile' | 'superBomb'

// Define bullet properties
export interface BulletTypeInfo {
  type: BulletType
  name: string
  description: string
  ammo: number | 'unlimited'
  icon: string
  color: string
}

// Bullet type definitions
export const BULLET_TYPES: Record<BulletType, BulletTypeInfo> = {
  standard: {
    type: 'standard',
    name: 'Standard Shell',
    description: 'Basic shell with unlimited ammo',
    ammo: 'unlimited',
    icon: '/textures/bullets/standard.png',
    color: '#f5a742'
  },
  missile: {
    type: 'missile',
    name: 'Cluster Missile',
    description: 'Splits into 5 smaller missiles on impact',
    ammo: 5,
    icon: '/textures/bullets/missile.png',
    color: '#e74c3c'
  },
  superBomb: {
    type: 'superBomb',
    name: 'Super Bomb',
    description: 'Creates 5 explosions in a large area',
    ammo: 3,
    icon: '/textures/bullets/bomb.png',
    color: '#9b59b6'
  }
}

interface BulletSelectorProps {
  selectedBullet: BulletType
  ammo: Record<BulletType, number>
  onSelectBullet: (type: BulletType) => void
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

const BulletSelector: React.FC<BulletSelectorProps> = ({
  selectedBullet,
  ammo,
  onSelectBullet,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1
}) => {
  // Create a UI that appears above the tank
  return (
    <group position={position} rotation={rotation as any} scale={scale}>
      {/* Bullet selection UI will be rendered in the GameUI component */}
    </group>
  )
}

export default BulletSelector 