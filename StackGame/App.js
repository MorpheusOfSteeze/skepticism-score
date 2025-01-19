import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, TouchableWithoutFeedback, Text } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import { StatusBar } from 'expo-status-bar';
import { MovementSystem, BlockStackSystem } from './src/systems/GameSystems';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;
const BLOCK_SIZE = WIDTH * 0.3;
const BLOCK_HEIGHT = 50;
const INITIAL_HEIGHT = HEIGHT * 0.8;

const Block = ({ position, size }) => {
  return (
    <View
      style={[
        styles.block,
        {
          width: size.width,
          height: size.height,
          left: position.x,
          top: position.y,
        },
      ]}
    />
  );
};

export default function App() {
  const [gameEngine, setGameEngine] = useState(null);
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);

  const setupGame = () => {
    setScore(0);
    setRunning(true);
    return {
      block1: {
        position: { x: 0, y: INITIAL_HEIGHT },
        size: { width: BLOCK_SIZE, height: BLOCK_HEIGHT },
        direction: 1,
        speed: 0.2,
        moving: true,
        stopped: false,
        screenWidth: WIDTH,
        renderer: <Block />
      }
    };
  };

  const handlePress = () => {
    if (gameEngine && running) {
      gameEngine.dispatch({ type: "game-tap" });
      setScore(prev => prev + 1);
    }
  };

  const onEvent = (e) => {
    if (e.type === "game-over") {
      setRunning(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>
      <TouchableWithoutFeedback onPress={handlePress}>
        <View style={styles.gameContainer}>
          <GameEngine
            ref={(ref) => setGameEngine(ref)}
            style={styles.gameEngine}
            systems={[MovementSystem, BlockStackSystem]}
            entities={setupGame()}
            onEvent={onEvent}
            running={running}>
            <StatusBar hidden={true} />
          </GameEngine>
          {!running && (
            <View style={styles.gameOver}>
              <Text style={styles.gameOverText}>Game Over!</Text>
              <TouchableWithoutFeedback onPress={() => {
                setRunning(true);
                gameEngine.swap(setupGame());
              }}>
                <View style={styles.playAgainButton}>
                  <Text style={styles.playAgainText}>Play Again</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gameContainer: {
    flex: 1,
  },
  gameEngine: {
    flex: 1,
  },
  block: {
    position: 'absolute',
    backgroundColor: '#ff0000',
    borderRadius: 5,
  },
  scoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  scoreText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  gameOver: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  gameOverText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  playAgainButton: {
    backgroundColor: '#ff0000',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  playAgainText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
}); 