import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:5002';

function App() {
  const [username, setUsername] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        setServerStatus('connected');
        setError(null);
      } else {
        setServerStatus('error');
        setError('Server is not responding properly');
      }
    } catch (err) {
      console.error('Server connection error:', err);
      setServerStatus('error');
      setError('Cannot connect to server. Please make sure the server is running.');
    }
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const analyzeUser = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    if (serverStatus !== 'connected') {
      await checkServerStatus();
      if (serverStatus !== 'connected') return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.replace('@', '') }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze user');
      }
      
      setResult(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze user. Please try again.');
      if (err.message === 'Failed to fetch') {
        setServerStatus('error');
        setError('Lost connection to server. Please check if the server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score <= 3) return '#4CAF50';
    if (score <= 6) return '#FFC107';
    return '#F44336';
  };

  const getScoreLabel = (score) => {
    if (score <= 3) return 'Low Risk';
    if (score <= 6) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Skepticism Score</h1>
        <p className="subtitle">Analyze X.com accounts for potential misinformation</p>
      </header>
      
      <main>
        {serverStatus === 'checking' && (
          <div className="status-message">
            <span role="status">Connecting to server...</span>
          </div>
        )}
        
        {serverStatus === 'error' && (
          <div className="connection-error">
            <p>{error}</p>
            <button onClick={checkServerStatus} className="retry-button">
              Retry Connection
            </button>
          </div>
        )}

        <form onSubmit={analyzeUser} className="search-form">
          <div className="input-group">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter X.com username"
              required
              disabled={loading || serverStatus !== 'connected'}
              aria-label="X.com username"
            />
            <button 
              type="submit" 
              disabled={loading || serverStatus !== 'connected' || !username.trim()}
              aria-busy={loading}
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
          <div className="info-text">
            Analysis based on recent tweets and engagement patterns
          </div>
        </form>

        {error && !loading && <div className="error" role="alert">{error}</div>}

        {result && (
          <div className="result" role="region" aria-label="Analysis Results">
            <h2>Analysis Results</h2>
            <div className="score-card">
              <div 
                className="score" 
                style={{ backgroundColor: getScoreColor(result.score) }}
                role="meter"
                aria-valuenow={result.score}
                aria-valuemin="1"
                aria-valuemax="10"
              >
                {result.score}/10
              </div>
              <p className="score-label">{getScoreLabel(result.score)}</p>
              <p className="analyzed-tweets">
                Based on analysis of {result.analyzedTweets} tweets
              </p>
              {result.lastAnalyzed && (
                <p className="last-analyzed">
                  Last analyzed: {formatTime(result.lastAnalyzed)}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
