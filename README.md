# Battlefront Tanks

A 3D multiplayer tank battle game built with React, Three.js, and React Three Fiber.

## Features

- 3D tank battle game with physics
- Multiple players with turn-based gameplay
- Tank movement and shooting mechanics
- Health system and game state management
- Responsive UI with game instructions

## Technologies Used

- React
- TypeScript
- Three.js
- React Three Fiber
- React Three Drei
- React Three Cannon (physics)
- Vite

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/battlefront-tanks.git
cd battlefront-tanks
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## How to Play

- Use **W, A, S, D** keys to move your tank:
  - **W**: Move forward
  - **S**: Move backward
  - **A**: Turn left
  - **D**: Turn right
- Press **Spacebar** to shoot
- Destroy enemy tanks to win!

## Game Controls

| Key       | Action       |
|-----------|--------------|
| W         | Move forward |
| S         | Move backward|
| A         | Turn left    |
| D         | Turn right   |
| Spacebar  | Shoot        |

## Project Structure

```
battlefront-tanks/
├── public/
│   └── textures/        # Game textures
├── src/
│   ├── components/      # React components
│   │   ├── Battlefield.tsx
│   │   ├── GameUI.tsx
│   │   ├── Projectile.tsx
│   │   └── Tank.tsx
│   ├── hooks/           # Custom React hooks
│   │   └── useKeyboardControls.ts
│   ├── App.css          # Main styles
│   ├── App.tsx          # Main component
│   └── main.tsx         # Entry point
└── package.json         # Dependencies and scripts
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js for 3D rendering
- React Three Fiber for React integration
- React Three Cannon for physics
