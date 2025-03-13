import { FC } from 'react';

export interface ProjectileProps {
  position: [number, number, number];
  direction: [number, number, number];
  playerId: number;
  onHit?: (targetId: number) => void;
}

declare const Projectile: FC<ProjectileProps>;
export default Projectile; 