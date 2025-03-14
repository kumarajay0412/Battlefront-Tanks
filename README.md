# 🎮 Battlefront Tanks

A thrilling 3D tank game where you shoot colorful balloons in a beautiful environment within a time limit. Built with React Three Fiber and Supabase for score tracking.

![Battlefront Tanks Game](./screenshot.png)

## 🎯 Game Overview

Battlefront Tanks is a fast-paced, arcade-style tank game where players aim to score as many points as possible by shooting balloons of different shapes, colors, and point values within a 60-second time limit.

### 🎈 Balloon Types & Points

- Classic Pink Balloon: 10 points
- Teardrop Green Balloon: 15 points
- Tiered Blue Balloon: 20 points
- Heart Yellow Balloon: 25 points
- Elongated Purple Balloon: 30 points
- Special Orange Balloon: 50 points

## 🎲 How to Play

1. **Start Game**
   - Enter your username to begin
   - The game starts immediately with a 60-second timer

2. **Controls**
   - WASD: Move the tank
   - Mouse: Aim the turret
   - Left Click: Shoot
   - Mouse Wheel: Zoom in/out
   - Right Click + Mouse: Rotate camera

3. **Scoring**
   - Shoot balloons to score points
   - Different balloon types give different points
   - Try to get the highest score before time runs out
   - Your score is saved to the global leaderboard

## 🚀 Features

- Beautiful 3D environment with dynamic lighting
- Ghibli-style clouds and atmospheric effects
- Physics-based tank movement and shooting
- Global leaderboard system
- Different balloon types with varying point values
- Real-time score tracking
- Countdown timer with visual warnings
- Background music and sound effects

## 🛠️ Technical Stack

- React + TypeScript
- Three.js with React Three Fiber
- @react-three/cannon for physics
- @react-three/drei for 3D utilities
- Supabase for backend and leaderboard
- Vite for build tooling

## 📥 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Battlefront-Tanks.git
```

2. Install dependencies:
```bash
cd Battlefront-Tanks
npm install
```

3. Create a Supabase project and update the configuration in `src/lib/supabase.ts` with your project URL and anon key.

4. Start the development server:
```bash
npm run dev
```

## 🌐 Deployment

To build for production:
```bash
npm run build
```

Or to build without linting:
```bash
npm run build-no-lint
```

## 📝 Database Schema

The game uses a Supabase table with the following structure:

```sql
CREATE TABLE scores (
  id SERIAL PRIMARY KEY,
  user_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
```

## 🎨 Environment

The game features:
- Dynamic sky with stars
- Animated water
- Ghibli-style clouds
- Realistic tank physics
- Particle effects for explosions
- Ambient and directional lighting

## 🔧 Performance Optimization

- Memoized components for better performance
- Efficient physics calculations
- Optimized 3D models and textures
- FPS counter for monitoring performance

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Three.js community
- React Three Fiber team
- Supabase team
- All contributors and testers

---
Made with ❤️ by [Your Name]
