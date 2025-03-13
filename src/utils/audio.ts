// Audio files
import bulletHitSound from '../assets/audio/bullet_hit.mp3';
import explosionSound from '../assets/audio/explosion.mp3';
import powerupSound from '../assets/audio/powerup.mp3';
import bgmSound from '../assets/audio/bgm.mp3';

// Cache audio instances to avoid creating new ones each time
const audioCache: Record<string, HTMLAudioElement> = {};

// Function to play a sound
export const playSound = (soundName: 'bullet_hit' | 'explosion' | 'powerup' | 'bgm', volume = 1.0) => {
  let sound: HTMLAudioElement;
  
  // Get the sound file path
  let soundPath = '';
  switch (soundName) {
    case 'bullet_hit':
      soundPath = bulletHitSound;
      break;
    case 'explosion':
      soundPath = bulletHitSound;
      break;
    case 'powerup':
      soundPath = powerupSound;
      break;
    case 'bgm':
      soundPath = bgmSound;
      break;
  }
  
  // Check if we already have this sound in the cache
  if (audioCache[soundName]) {
    sound = audioCache[soundName];
    
    // Reset the sound if it's already playing
    sound.currentTime = 0;
  } else {
    // Create a new audio element
    sound = new Audio(soundPath);
    
    // Store in cache for future use
    audioCache[soundName] = sound;
  }
  
  // Set volume
  sound.volume = volume;
  
  // Play the sound
  sound.play().catch(error => {
    console.error(`Error playing sound ${soundName}:`, error);
  });
  
  return sound;
};

// Function to stop a sound
export const stopSound = (soundName: 'bullet_hit' | 'explosion' | 'powerup' | 'bgm') => {
  if (audioCache[soundName]) {
    audioCache[soundName].pause();
    audioCache[soundName].currentTime = 0;
  }
};

// Function to play background music (looped)
export const playBackgroundMusic = (volume = 0.3) => {
  const bgm = playSound('bgm', volume);
  bgm.loop = true;
  return bgm;
}; 