import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface GameOverProps {
  score: number;
  userName: string;
  onRestart: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ score, userName, onRestart }) => {
  const [highScores, setHighScores] = useState<Array<{ user_name: string; score: number }>>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    saveScore();
    fetchHighScores();
  }, []);

  const saveScore = async () => {
    if (saved) return;
    
    try {
      const { error } = await supabase
        .from('scores')
        .insert([
          { user_name: userName, score: score }
        ]);

      if (error) throw error;
      setSaved(true);
    } catch (err) {
      console.error('Error saving score:', err);
    }
  };

  const fetchHighScores = async () => {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('user_name, score')
        .order('score', { ascending: false })
        .limit(5);

      if (error) throw error;
      setHighScores(data || []);
    } catch (err) {
      console.error('Error fetching high scores:', err);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '10px',
        maxWidth: '400px',
        width: '90%',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Game Over!</h2>
        
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '5px',
        }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            {userName}'s Score
          </p>
          <p style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold',
            color: '#4CAF50'
          }}>
            {score}
          </p>
        </div>

        {/* High Scores */}
        <div style={{ color: 'black', marginBottom: '2rem' }}>
          <h3 style={{ color: 'black', textAlign: 'center', marginBottom: '1rem' }}>High Scores</h3>
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '1rem',
            borderRadius: '5px'
          }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ color: 'black', textAlign: 'left' }}>Player</th>
                  <th style={{ color: 'black', textAlign: 'right' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {highScores.map((score, index) => (
                  <tr key={index} style={{
                    backgroundColor: score.user_name === userName ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
                  }}>
                    <td style={{ color: 'black', textAlign: 'left' }}>{score.user_name}</td>
                    <td style={{ color: 'black', textAlign: 'right' }}>{score.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={onRestart}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}; 