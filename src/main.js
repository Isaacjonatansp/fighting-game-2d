// ========================================================================
// ARCADE PORTAL & GAME ROUTER (Main App Controller)
// ========================================================================
import { startFightingGame, stopFightingGame } from './games/fighting/index.js';
import { startGame2, stopGame2 } from './games/game2/index.js';

let currentScreen = 'hub';

const views = {
  hub: document.getElementById('game-hub-view'),
  fighting: document.getElementById('fighting-game-view'),
  game2: document.getElementById('game2-view')
};

export async function switchView(target) {
  if (currentScreen === target) return;

  // 1. Hentikan game yang sedang berjalan & bersihkan listener
  if (currentScreen === 'fighting') {
    stopFightingGame();
  } else if (currentScreen === 'game2') {
    stopGame2();
  }

  // 2. Sembunyikan semua layar
  Object.values(views).forEach(el => {
    if (el) el.classList.remove('active');
  });

  // 3. Tampilkan layar tujuan
  const targetEl = views[target];
  if (targetEl) {
    targetEl.classList.add('active');
  }
  currentScreen = target;

  // 4. Inisialisasi game yang dipilih
  if (target === 'fighting') {
    try {
      await startFightingGame();
    } catch (err) {
      console.error('Error saat memulai Fighting Game:', err);
    }
  } else if (target === 'game2') {
    try {
      startGame2();
    } catch (err) {
      console.error('Error saat memulai Game 2:', err);
    }
  }
}

// Inisialisasi Tombol Navigasi
document.addEventListener('DOMContentLoaded', () => {
  const btnLaunchFighting = document.getElementById('btn-launch-fighting');
  const btnLaunchGame2 = document.getElementById('btn-launch-game2');
  const btnBackFromFighting = document.getElementById('back-from-fighting');
  const btnBackFromGame2 = document.getElementById('back-from-game2');

  if (btnLaunchFighting) {
    btnLaunchFighting.addEventListener('click', () => switchView('fighting'));
  }
  if (btnLaunchGame2) {
    btnLaunchGame2.addEventListener('click', () => switchView('game2'));
  }
  if (btnBackFromFighting) {
    btnBackFromFighting.addEventListener('click', () => switchView('hub'));
  }
  if (btnBackFromGame2) {
    btnBackFromGame2.addEventListener('click', () => switchView('hub'));
  }
});

// Jalankan jika DOM sudah siap
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  const btnLaunchFighting = document.getElementById('btn-launch-fighting');
  const btnLaunchGame2 = document.getElementById('btn-launch-game2');
  const btnBackFromFighting = document.getElementById('back-from-fighting');
  const btnBackFromGame2 = document.getElementById('back-from-game2');

  if (btnLaunchFighting) {
    btnLaunchFighting.addEventListener('click', () => switchView('fighting'));
  }
  if (btnLaunchGame2) {
    btnLaunchGame2.addEventListener('click', () => switchView('game2'));
  }
  if (btnBackFromFighting) {
    btnBackFromFighting.addEventListener('click', () => switchView('hub'));
  }
  if (btnBackFromGame2) {
    btnBackFromGame2.addEventListener('click', () => switchView('hub'));
  }
}

// Global router helper for debugging/console access
window.arcadePortal = {
  switchView,
  getCurrentScreen: () => currentScreen
};