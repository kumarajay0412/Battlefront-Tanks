import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserRegistrationProps {
  onRegister: (userName: string) => void;
}

export const UserRegistration: React.FC<UserRegistrationProps> = ({ onRegister }) => {
  const [userName, setUserName] = useState('');
  const [highScores, setHighScores] = useState<Array<{ user_name: string; score: number }>>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHighScores();
  }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim().length < 2) {
      setError('Username must be at least 2 characters long');
      return;
    }
    onRegister(userName.trim());
  };

  return (
    <div className='text-[#333333]' style={{
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
        <h2 className='text-[#333333]' style={{ color: '#333333', textAlign: 'center', marginBottom: '1.5rem' }}>Welcome to Tank Battle!</h2>
        
        {/* High Scores */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 className='text-[#333333]' style={{ color: '#333333', textAlign: 'center', marginBottom: '1rem' }}>High Scores</h3>
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '1rem',
            borderRadius: '5px'
          }}>
            {highScores.length > 0 ? (
              <table style={{ color: 'black', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ color: 'black', textAlign: 'left' }}>Player</th>
                    <th style={{ color: 'black', textAlign: 'right' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {highScores.map((score, index) => (
                    <tr key={index}>
                      <td style={{ color: 'black', textAlign: 'left' }}>{score.user_name}</td>
                      <td style={{ color: 'black', textAlign: 'right' }}>{score.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className='text-[#333333]' style={{ color: '#333333', textAlign: 'center' }}>No scores yet. Be the first!</p>
            )}
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                borderRadius: '5px',
                border: '1px solid #ccc',
              }}
            />
          </div>
          {error && (
            <p style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
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
            Start Game
          </button>
        </form>
      </div>
    </div>
  );
}; 