// Fighting Game module entrypoint
import { Game } from '../../core/Game.js';
import { InputManager } from '../../systems/InputManager.js';
import { TwoDRenderer } from '../../systems/TwoDRenderer.js';
import { PhysicsEngine } from '../../systems/PhysicsEngine.js';
import { CombatSystem } from '../../systems/CombatSystem.js';
import { Fighter } from '../../entities/Fighter.js';
import { Stage } from '../../entities/Stage.js';

let activeGame = null;

export async function startFightingGame() {
  if (activeGame) {
    stopFightingGame();
  }

  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Canvas #game-canvas not found!');
    return null;
  }

  const CONFIG = {
    canvas,
    width: 1280,
    height: 720,
    gravity: 1.2,
    groundY: 580,
    roundTime: 99,
    maxRounds: 3,
    fighterWidth: 56,
    fighterHeight: 112
  };

  const inputManager = new InputManager();
  const renderer = new TwoDRenderer(CONFIG);
  const physicsEngine = new PhysicsEngine(CONFIG);
  const combatSystem = new CombatSystem(CONFIG);

  const fighter1 = new Fighter({
    id: 1,
    x: 200,
    y: CONFIG.groundY - CONFIG.fighterHeight,
    width: CONFIG.fighterWidth,
    height: CONFIG.fighterHeight,
    color: '#00E5FF',
    facing: 1,
    character: 'Shinobi',
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
    color: '#FF3D00',
    facing: -1,
    character: 'Samurai',
    controls: {
      left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
      light: 'Digit1', heavy: 'Digit2', special: 'Digit3', dash: 'Numpad0', block: 'ShiftRight'
    }
  });

  const stage = new Stage(CONFIG);

  // Load shinobi sprites
  await renderer.loadShinobiSprites();

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

  fighter1.game = game;
  fighter2.game = game;
  renderer.game = game;
  stage.setRenderer(renderer);
  renderer.syncArenaBounds(stage);

  game.start();
  activeGame = game;
  window.fightingGame = game;

  return game;
}

export function stopFightingGame() {
  if (activeGame) {
    activeGame.stop();
    activeGame = null;
    window.fightingGame = null;
  }
}

