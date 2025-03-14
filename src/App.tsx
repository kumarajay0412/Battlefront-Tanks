import { Canvas, useThree } from '@react-three/fiber'
import { Sky, OrbitControls, Cloud, Stars, PerspectiveCamera } from '@react-three/drei'
import { Physics } from '@react-three/cannon'
import './App.css'
import { useEffect, useState, useCallback, memo, useRef } from 'react'
import { Analytics } from "@vercel/analytics/react"
import { UserRegistration } from './components/UserRegistration'
import { GameOver } from './components/GameOver'
import { supabase } from './lib/supabase'

// Components
import Battlefield from './components/Battlefield'
import Tank from './components/Tank'
import GameUI from './components/GameUI'
import Balloon, { BalloonVariant } from './components/Balloon'
import Water from './components/Water'

// Assets
import bgMusic from './assets/audio/modern-war-129016.mp3'

// Hooks
import { useGameState } from './hooks/useGameState'

// Define battlefield dimensions as constants for reuse
const BATTLEFIELD_SIZE = 100
const BATTLEFIELD_HALF_SIZE = BATTLEFIELD_SIZE / 2
const BOUNDARY_MARGIN = 10 // Keep tanks this far from the edge

// Cloud configuration for Ghibli-style clouds
const CLOUD_CONFIGS = [
  { position: [-20, 38, -20] as [number, number, number], scale: 3, opacity: 0.6, segments: 40 },
  { position: [20, 38, 20] as [number, number, number], scale: 4, opacity: 0.7, segments: 50 },
  { position: [0, 38, 0] as [number, number, number], scale: 5, opacity: 0.5, segments: 60 },
  { position: [-30, 38, 10] as [number, number, number], scale: 2.5, opacity: 0.8, segments: 35 },
  { position: [25, 40, -15] as [number, number, number], scale: 3.5, opacity: 0.65, segments: 45 },
  { position: [-15, 45, 25] as [number, number, number], scale: 3.2, opacity: 0.7, segments: 42 },
  { position: [15, 45, -25] as [number, number, number], scale: 4.2, opacity: 0.6, segments: 55 },
  { position: [-25, 40, -5] as [number, number, number], scale: 3.8, opacity: 0.75, segments: 48 },
  { position: [30, 40, 5] as [number, number, number], scale: 2.8, opacity: 0.8, segments: 38 },
  { position: [0, 40, 30] as [number, number, number], scale: 4.5, opacity: 0.55, segments: 52 }
]

// Balloon configurations with pastel colors and different shapes
const BALLOON_CONFIGS = [
  {
    color: '#FFB3BA', // Pastel Pink
    points: 10,
    variant: 'classic' as BalloonVariant,
    scale: 1.0
  },
  {
    color: '#BAFFC9', // Pastel Green
    points: 15,
    variant: 'teardrop' as BalloonVariant,
    scale: 1.2
  },
  {
    color: '#BAE1FF', // Pastel Blue
    points: 20,
    variant: 'tiered' as BalloonVariant,
    scale: 1.1
  },
  {
    color: '#FFFFBA', // Pastel Yellow
    points: 25,
    variant: 'heart' as BalloonVariant,
    scale: 1.3
  },
  {
    color: '#E0BBE4', // Pastel Purple
    points: 30,
    variant: 'elongated' as BalloonVariant,
    scale: 1.15
  },
  {
    color: '#FFD4BA', // Pastel Orange
    points: 50,
    variant: 'classic' as BalloonVariant,
    scale: 1.25
  }
]

// Generate random balloon positions
const generateBalloonPositions = (count: number) => {
  const positions: Array<{
    position: [number, number, number];
    color: string;
    points: number;
    id: number;
    variant: BalloonVariant;
    scale: number;
  }> = []

  // Create a grid-like distribution for better visibility
  const gridSize = Math.ceil(Math.sqrt(count))
  const spacing = (BATTLEFIELD_SIZE - BOUNDARY_MARGIN * 2) / gridSize

  for (let i = 0; i < count; i++) {
    // Calculate grid position
    const row = Math.floor(i / gridSize)
    const col = i % gridSize

    // Add some randomness to the grid position
    const x = -BATTLEFIELD_HALF_SIZE + BOUNDARY_MARGIN + col * spacing + (Math.random() - 0.5) * spacing
    const y = 15 + Math.random() * 5 // Height between 15 and 25 units
    const z = -BATTLEFIELD_HALF_SIZE + BOUNDARY_MARGIN + row * spacing + (Math.random() - 0.5) * spacing

    // Randomly select balloon configuration
    const config = BALLOON_CONFIGS[Math.floor(Math.random() * BALLOON_CONFIGS.length)]

    positions.push({
      position: [x, y, z],
      color: config.color,
      points: config.points,
      variant: config.variant,
      scale: config.scale,
      id: i + 1
    })
  }

  return positions
}

// Memoize components
const MemoizedBattlefield = memo(Battlefield)
const MemoizedWater = memo(Water)
const MemoizedTank = memo(Tank)
const MemoizedBalloon = memo(Balloon)

function App() {
  const { players, gameState, startGame, updatePlayerPosition, addPoints } = useGameState()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const frameCount = useRef(0)
  const lastLogTime = useRef(Date.now())
  const [fps, setFps] = useState(0)
  const [userName, setUserName] = useState<string>('')
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isSubmittingRef = useRef<boolean>(false); // Flag to prevent duplicate submissions

  // FPS counter
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const currentFps = frameCount.current / ((now - lastLogTime.current) / 1000)
      setFps(Math.round(currentFps))
      frameCount.current = 0
      lastLogTime.current = now
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Increment frame counter on each render
  useEffect(() => {
    frameCount.current++
  })

  // Balloon state with additional properties
  const [balloons, setBalloons] = useState<Array<{
    position: [number, number, number];
    color: string;
    points: number;
    id: number;
    isBurst: boolean;
    variant: BalloonVariant;
    scale: number;
  }>>([])

  // Remove cloud animation state since we don't need it anymore

  // Handle balloon burst
  const handleBalloonBurst = useCallback((points: number, balloonId: number) => {
    console.log("Balloon burst:", balloonId, "Points:", points)

    // Add points to player
    addPoints(points)

    // Update score
    setScore(prevScore => {
      const newScore = prevScore + points;
      return newScore;
    });

    // Mark balloon as burst
    setBalloons(prev =>
      prev.map(balloon =>
        balloon.id === balloonId
          ? { ...balloon, isBurst: true }
          : balloon
      )
    )
  }, [addPoints])

  // Background music effect
  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(bgMusic)
    audioRef.current.loop = true
    audioRef.current.volume = 0.5 // Set volume to 50%
    audioRef.current.play()

    // Stop music when game starts
    if (gameState.isGameStarted) {
      audioRef.current?.pause()
      audioRef.current = null
    }

    return () => {
      // Cleanup
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [gameState.isGameStarted])

  // Start game effect
  useEffect(() => {
    if (gameState.isGameStarted) {
      // Position player at the center of the map
      updatePlayerPosition(1, [1, 0.5, 0], [0, 0, 0])

      // Generate more balloons for better gameplay
      setBalloons(generateBalloonPositions(20).map(balloon => ({
        ...balloon,
        isBurst: false
      })))
    }
  }, [gameState.isGameStarted, updatePlayerPosition])

  // Single timer effect that handles game start and end
  useEffect(() => {
    if (gameStarted && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Clear the interval and end the game
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            handleGameOver('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStarted, gameOver]);

  // Handle game over and score submission
  const handleGameOver = async (reason: string) => {
    // Prevent duplicate submissions
    if (isSubmittingRef.current || gameOver) {
      return;
    }

    isSubmittingRef.current = true;
    setGameOver(true);

    try {
      const { error } = await supabase
        .from('scores')
        .insert([{
          user_name: userName,
          score: score,
        }]);

      if (error) {
        console.error('Error saving score:', error);
      }
    } catch (err) {
      console.error('Error submitting score:', err);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleRestart = () => {
    setGameOver(false);
    setScore(0);
    setTimeLeft(60);
    isSubmittingRef.current = false; // Reset submission flag
    setBalloons(generateBalloonPositions(20).map(balloon => ({
      ...balloon,
      isBurst: false
    })));
    startGame('1');
  };

  const handleRegister = (name: string) => {
    setUserName(name);
    setGameStarted(true);
    startGame('1');
  };

  return (
    <>
      {!gameStarted && (
        <UserRegistration onRegister={handleRegister} />
      )}
      <Analytics />
      {gameOver && (
        <GameOver
          score={score}
          userName={userName}
          onRestart={handleRestart}
        />
      )}

      <div className="app-container">
        <Canvas>
          {/* Default Camera Setup */}
          <PerspectiveCamera makeDefault position={[0, 30, 60]} fov={45} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={10}
            maxDistance={100}
            maxPolarAngle={Math.PI / 2 - 0.1}
          />

          {/* Enhanced lighting for a more dramatic look */}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[50, 50, 20]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={100}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />

          {/* Physics world */}
          <Physics
            gravity={[0, -9.8, 0]}
            defaultContactMaterial={{
              friction: 0.5,
              restitution: 0.1,
            }}
          >
            {/* Battlefield with terrain */}
            <MemoizedBattlefield />

            {/* Ocean water surrounding the battlefield */}
            <MemoizedWater
              position={[0, -1, 0]}
              size={500}
              color="#4a95e6"
              waveSpeed={0.3}
            />

            {/* Player tank */}
            {gameState.isGameStarted && (
              <MemoizedTank
                key={players[0].id}
                position={players[0].position}
                rotation={players[0].rotation}
                color={players[0].color}
                playerId={players[0].id}
                health={players[0].health}
                isCurrentPlayer={true}
                onHit={() => { }}
              />
            )}

            {/* Balloons with different shapes and colors */}
            {balloons.map(balloon => (
              <MemoizedBalloon
                key={balloon.id}
                id={balloon.id}
                position={balloon.position}
                color={balloon.color}
                points={balloon.points}
                onBurst={(points) => handleBalloonBurst(points, balloon.id)}
                isBurst={balloon.isBurst}
                variant={balloon.variant}
                scale={balloon.scale}
              />
            ))}
          </Physics>

          {/* Environment */}
          <Sky
            distance={450000}
            sunPosition={[5, 1, 8]}
            inclination={0.5}
            azimuth={0.25}
            rayleigh={0.5}
          />

          {/* Static clouds */}
          {CLOUD_CONFIGS.map((config, index) => (
            <Cloud
              key={`cloud-${index}`}
              position={config.position}
              opacity={config.opacity}
              speed={0}
              segments={config.segments}
              scale={config.scale}
              color="#ffffff"
              seed={index}
              fade={0}
            />
          ))}

          {/* Add stars for a more dramatic sky */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
        </Canvas>

        {/* FPS Counter */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 1000,
          userSelect: 'none'
        }}>
          {fps} FPS
        </div>

        {/* Game UI */}
        <GameUI
          players={players}
          gameState={gameState}
          onStartGame={startGame}
        />
      </div>

      {/* Single Timer Display with Score */}
      {gameStarted && !gameOver && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20%',
          transform: 'translateX(-50%)',
          backgroundColor: timeLeft <= 10 ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px 30px',
          borderRadius: '10px',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          display: 'flex',
          gap: '30px',
          animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}>
          <span>Score: {score}</span>
          <span>Time: {timeLeft}s</span>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0% { transform: translateX(-50%) scale(1); }
            50% { transform: translateX(-50%) scale(1.05); }
            100% { transform: translateX(-50%) scale(1); }
          }
        `}
      </style>
    </>
  )
}

export default App
