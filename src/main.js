// Main entry point - Fighting Game 2D (Pixel Art Characters)
import { Game } from './core/Game.js';
import { InputManager } from './systems/InputManager.js';
import { TwoDRenderer } from './systems/TwoDRenderer.js';
import { PhysicsEngine } from './systems/PhysicsEngine.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { Fighter } from './entities/Fighter.js';
import { Stage } from './entities/Stage.js';

// Game configuration
const CONFIG = {
  canvas: document.getElementById('game-canvas'),
  width: 1280,
  height: 720,
  gravity: 1.2,
  groundY: 580,
  roundTime: 99,
  maxRounds: 3,
  fighterWidth: 60,
  fighterHeight: 120
};

// Initialize systems
const inputManager = new InputManager();
const renderer = new TwoDRenderer(CONFIG);
const physicsEngine = new PhysicsEngine(CONFIG);
const combatSystem = new CombatSystem(CONFIG);

// Create fighters with pixel art characters
const fighter1 = new Fighter({
  id: 1,
  x: 200,
  y: CONFIG.groundY - CONFIG.fighterHeight,
  width: CONFIG.fighterWidth,
  height: CONFIG.fighterHeight,
  color: '#D4AF37',
  facing: 1,
  character: 'crimson',
  controls: {
    left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS',
    light: 'KeyJ', heavy: 'KeyK', special: 'KeyL', dash: 'Space', block: 'ShiftLeft'
  }
});

const fighter2 = new Fighter({
  id: 2,
  x: CONFIG.width - 200 - CONFIG.fighterWidth,
  y: CONFIG.groundY - CONFIG.fighterHeight,
  width: CONFIG.fighterWidth,
  height: CONFIG.fighterHeight,
  color: '#C9A961',
  facing: -1,
  character: 'azure',
  controls: {
    left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
    light: 'Digit1', heavy: 'Digit2', special: 'Digit3', dash: 'Numpad0', block: 'ShiftRight'
  }
});

// Create stage
const stage = new Stage(CONFIG);

// Initialize game
const game = new Game({
  config: CONFIG,
  fighter1,
  fighter2,
  stage,
  inputManager,
  renderer,
  physicsEngine,
  combatSystem
});

// Set game reference on fighters for physics access to stage
fighter1.game = game;
fighter2.game = game;

// Set renderer reference for camera
renderer.game = game;

// Assign characters to fighters
renderer.setCharacter(fighter1, 'crimson');
renderer.setCharacter(fighter2, 'azure');

// Set renderer on stage
stage.setRenderer(renderer);

// Start game loop
game.start();

// Global reference for debugging
window.game = game;