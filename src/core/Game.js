// Core Game class - manages game state and loop
export class Game {
  constructor({ config, fighter1, fighter2, stage, inputManager, renderer, physicsEngine, combatSystem }) {
    this.config = config;
    this.fighter1 = fighter1;
    this.fighter2 = fighter2;
    this.stage = stage;
    this.inputManager = inputManager;
    this.renderer = renderer;
    this.physicsEngine = physicsEngine;
    this.combatSystem = combatSystem;
    
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.deltaTime = 0;
    
    // Game state
    this.round = 1;
    this.roundTimer = config.roundTime;
    this.roundWins = { 1: 0, 2: 0 };
    this.matchOver = false;
    this.roundOver = false;
    this.roundEndTimer = 0;
    
    // UI elements
    this.p1HealthFill = document.getElementById('p1-health-fill');
    this.p2HealthFill = document.getElementById('p2-health-fill');
    this.p1StaminaFill = document.getElementById('p1-stamina-fill');
    this.p2StaminaFill = document.getElementById('p2-stamina-fill');
    this.timerEl = document.getElementById('timer');
    this.roundCounter = document.getElementById('round-counter');
    this.matchOverEl = document.getElementById('match-over');
    this.winnerText = document.getElementById('winner-text');
    this.restartBtn = document.getElementById('restart-btn');
    this.comboCounter = document.getElementById('combo-counter');
    
    this.comboTimer = 0;
    this.lastHitTime = 0;
    this.currentCombo = 0;
    
    this.setupEventListeners();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }
  
  setupEventListeners() {
    this.restartBtn.addEventListener('click', () => this.restartMatch());
  }
  
  resizeCanvas() {
    this.renderer.resize(this.config.width, this.config.height);
  }
  
  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }
  
  gameLoop(currentTime) {
    if (!this.running) return;
    
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    if (!this.paused && !this.matchOver) {
      this.update(this.deltaTime);
    }
    
    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(dt) {
    // Update input FIRST - store previous frame state
    this.inputManager.update();
    
    // Update camera and renderer effects
    this.renderer.updateCamera(dt);
    this.renderer.updateParticles(dt);
    
    // Update fighters
    this.fighter1.update(dt, this.inputManager, this.fighter2, this.config);
    this.fighter2.update(dt, this.inputManager, this.fighter1, this.config);
    
    // Physics
    this.physicsEngine.update(this.fighter1, dt);
    this.physicsEngine.update(this.fighter2, dt);
    this.physicsEngine.resolveCollision(this.fighter1, this.fighter2);
    
    // Combat
    this.combatSystem.update(this.fighter1, this.fighter2, dt);
    
    // Update combo display
    this.updateComboDisplay(dt);
    
    // Round timer
    if (!this.roundOver) {
      this.roundTimer -= dt;
      this.timerEl.textContent = Math.ceil(this.roundTimer);
      
      if (this.roundTimer <= 0) {
        this.endRound(0); // Time out - no winner
      }
    }
    
    // Check win conditions
    if (!this.roundOver) {
      if (this.fighter1.health <= 0 && this.fighter2.health <= 0) {
        this.endRound(0); // Double KO
      } else if (this.fighter1.health <= 0) {
        this.endRound(2);
      } else if (this.fighter2.health <= 0) {
        this.endRound(1);
      }
    }
    
    // Round end delay
    if (this.roundOver) {
      this.roundEndTimer -= dt;
      if (this.roundEndTimer <= 0) {
        this.startNextRound();
      }
    }
    
    // Update UI
    this.updateHealthBars();
  }
  
  updateComboDisplay(dt) {
    if (this.currentCombo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.currentCombo = 0;
        this.comboCounter.classList.remove('visible');
      }
    }
  }
  
  registerHit(attackerId, damage, hitType = 'normal') {
    const now = performance.now();
    if (now - this.lastHitTime < 1000) {
      this.currentCombo++;
    } else {
      this.currentCombo = 1;
    }
    this.lastHitTime = now;
    this.comboTimer = 2.0;
    
    if (this.currentCombo > 1) {
      this.comboCounter.textContent = `${this.currentCombo} HIT COMBO!`;
      this.comboCounter.classList.add('visible');
    }
  }
  
  updateHealthBars() {
    const p1Percent = Math.max(0, (this.fighter1.health / this.fighter1.maxHealth) * 100);
    const p2Percent = Math.max(0, (this.fighter2.health / this.fighter2.maxHealth) * 100);
    this.p1HealthFill.style.width = `${p1Percent}%`;
    this.p2HealthFill.style.width = `${p2Percent}%`;

    const p1StaminaPercent = Math.max(0, (this.fighter1.stamina / this.fighter1.maxStamina) * 100);
    const p2StaminaPercent = Math.max(0, (this.fighter2.stamina / this.fighter2.maxStamina) * 100);
    this.p1StaminaFill.style.width = `${p1StaminaPercent}%`;
    this.p2StaminaFill.style.width = `${p2StaminaPercent}%`;
  }
  
  endRound(winner) {
    this.roundOver = true;
    this.roundEndTimer = 2.0;
    
    if (winner === 1) {
      this.roundWins[1]++;
      this.updateRoundDots(1);
    } else if (winner === 2) {
      this.roundWins[2]++;
      this.updateRoundDots(2);
    }
    // winner === 0 means draw/timeout - no round win awarded
    
    // Check match win
    if (this.roundWins[1] >= 2 || this.roundWins[2] >= 2) {
      this.endMatch(winner || (this.roundWins[1] > this.roundWins[2] ? 1 : 2));
    }
  }
  
  updateRoundDots(winner) {
    const dots = this.roundCounter.querySelectorAll('.round-dot');
    const playerDots = winner === 1 ? [0, 1] : [2, 3];
    const winIndex = winner === 1 ? this.roundWins[1] - 1 : this.roundWins[2] - 1;
    if (dots[playerDots[winIndex]]) {
      dots[playerDots[winIndex]].classList.add('won');
    }
  }
  
  startNextRound() {
    this.round++;
    this.roundTimer = this.config.roundTime;
    this.roundOver = false;
    
    // Reset fighters
    this.fighter1.reset(200, this.config.groundY - this.config.fighterHeight, 1);
    this.fighter2.reset(
      this.config.width - 200 - this.config.fighterWidth, 
      this.config.groundY - this.config.fighterHeight, 
      -1
    );
  }
  
  endMatch(winner) {
    this.matchOver = true;
    this.winnerText.textContent = `PLAYER ${winner} WINS!`;
    this.matchOverEl.classList.add('visible');
  }
  
  restartMatch() {
    this.matchOver = false;
    this.round = 1;
    this.roundWins = { 1: 0, 2: 0 };
    this.roundTimer = this.config.roundTime;
    this.matchOverEl.classList.remove('visible');
    
    // Reset round dots
    this.roundCounter.querySelectorAll('.round-dot').forEach(dot => dot.classList.remove('won'));
    
    // Reset fighters
    this.fighter1.reset(200, this.config.groundY - this.config.fighterHeight, 1);
    this.fighter2.reset(
      this.config.width - 200 - this.config.fighterWidth, 
      this.config.groundY - this.config.fighterHeight, 
      -1
    );
  }
  
  render() {
    // Update 3D model positions to match fighter state
    this.renderer.updateFighterAnimation(this.fighter1, this.deltaTime);
    this.renderer.updateFighterAnimation(this.fighter2, this.deltaTime);
    
    // Render 3D scene
    this.renderer.render();
  }
  
  renderHitboxes() {
    // Hitboxes are now handled in 3D space
  }
}