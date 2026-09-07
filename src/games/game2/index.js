// Entry point for Game 2 (Cosmic Defender / Custom Game Slot)
import { Game2 } from './Game2.js';

let activeGame2 = null;

export function startGame2() {
  if (activeGame2) {
    stopGame2();
  }

  const canvas = document.getElementById('game2-canvas');
  if (!canvas) {
    console.error('Canvas #game2-canvas not found!');
    return null;
  }

  const game = new Game2(canvas);
  game.start();
  activeGame2 = game;
  window.customGame = game;

  const restartBtn = document.getElementById('game2-restart-btn');
  if (restartBtn) {
    restartBtn.onclick = () => {
      game.resetGame();
    };
  }

  return game;
}

export function stopGame2() {
  if (activeGame2) {
    activeGame2.stop();
    activeGame2 = null;
    window.customGame = null;
  }
}

