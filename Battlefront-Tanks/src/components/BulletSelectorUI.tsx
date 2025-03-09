import React from 'react'
import { BulletType, BULLET_TYPES } from './BulletSelector'

interface BulletSelectorUIProps {
  selectedBullet: BulletType
  ammo: Record<BulletType, number>
  onSelectBullet: (type: BulletType) => void
  isVisible: boolean
  playerId: number
}

const BulletSelectorUI: React.FC<BulletSelectorUIProps> = ({
  selectedBullet,
  ammo,
  onSelectBullet,
  isVisible,
  playerId
}) => {
  if (!isVisible) return null

  return (
    <div className="bullet-selector-container" style={{ 
      position: 'absolute', 
      bottom: '100px', 
      left: '50%', 
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '10px',
      padding: '15px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 1000,
      border: `2px solid ${playerId === 1 ? '#3498db' : '#e74c3c'}`
    }}>
      <h3 style={{ color: 'white', margin: '0 0 10px 0', textAlign: 'center' }}>
        Select Ammunition
      </h3>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {Object.values(BULLET_TYPES).map((bulletInfo) => {
          const isSelected = selectedBullet === bulletInfo.type
          const ammoCount = bulletInfo.ammo === 'unlimited' ? '∞' : ammo[bulletInfo.type]
          const isDisabled = bulletInfo.ammo !== 'unlimited' && ammo[bulletInfo.type] <= 0
          
          return (
            <div 
              key={bulletInfo.type}
              onClick={() => !isDisabled && onSelectBullet(bulletInfo.type)}
              style={{
                width: '80px',
                padding: '10px',
                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)',
                borderRadius: '8px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
                border: `2px solid ${bulletInfo.color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: bulletInfo.color,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '5px'
              }}>
                {bulletInfo.type === 'standard' && <span style={{ fontSize: '20px' }}>●</span>}
                {bulletInfo.type === 'missile' && <span style={{ fontSize: '20px' }}>▲</span>}
                {bulletInfo.type === 'superBomb' && <span style={{ fontSize: '20px' }}>✱</span>}
              </div>
              
              <div style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                {bulletInfo.name}
              </div>
              
              <div style={{ 
                color: 'white', 
                fontSize: '10px',
                marginTop: '5px',
                padding: '2px 6px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '10px'
              }}>
                Ammo: {ammoCount}
              </div>
            </div>
          )
        })}
      </div>
      
      <div style={{ 
        color: 'white', 
        fontSize: '12px', 
        marginTop: '5px',
        textAlign: 'center'
      }}>
        {BULLET_TYPES[selectedBullet].description}
      </div>
    </div>
  )
}

export default BulletSelectorUI 