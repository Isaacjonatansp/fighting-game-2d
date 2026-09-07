// ========================================================================
// GAME 2: "SHADOW OF DESTINY" (CHALLENGING BUT BEATABLE TROLL EDITION)
// ========================================================================
// Gameplay panjang (~3-5 menit), penuh tantangan mekanik & rintangan kocak,
// namun adil dan bisa ditamatkan berkat sistem Checkpoint per Fase!
// ========================================================================

export class Game2 {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.lastTime = 0;
    this.animationId = null;

    this.width = 1280;
    this.height = 720;

    // Web Audio Synthesizer
    this.audioCtx = null;

    // Checkpoint System (Anti-Frustrasi)
    this.checkpointPhase = 1;

    // Alur Permainan (Fase 1 s.d 6)
    this.phase = 1;
    this.phaseTimer = 0;

    // Entitas
    this.player = null;
    this.boss = null;
    this.projectiles = [];
    this.particles = [];
    this.rainDrops = [];
    this.sakuraPetals = [];
    this.slashTrails = [];
    this.bananaPeels = [];

    // Tahu Bulat Truck Hazard
    this.tahuBulat = {
      active: false,
      timer: 10,
      x: -350,
      y: 520,
      vx: 420,
      warning: false,
      warningTimer: 0
    };

    // Fake YouTube Ad Troll (Fase 4)
    this.fakeAd = {
      active: false,
      timer: 5,
      btnX: 840,
      btnY: 260,
      btnW: 160,
      btnH: 42,
      taunt: '',
      clicksNeeded: 3,
      clicksDone: 0
    };

    // Rhythm Kerokan Bar (Fase 5)
    this.rhythmBar = {
      cursor: 0,
      speed: 2.2,
      dir: 1,
      sweetSpotMin: 0.4,
      sweetSpotMax: 0.6,
      progress: 0, // 0 to 100%
      combo: 0
    };

    // Objektif per Fase
    this.phaseObjectives = {
      phase2SandalHits: 0,
      phase2SandalTarget: 10,
      phase3GayungHits: 0,
      phase3GayungTarget: 8,
      phase4SurvivalTimer: 25
    };

    // UI & Dialog State
    this.dialog = null;
    this.dialogTimer = 0;
    this.checkpointBanner = null;
    this.checkpointBannerTimer = 0;
    this.screenFlash = 0;
    this.screenShake = 0;
    this.slowMo = 1.0;
    this.slowMoTimer = 0;
    this.gameOver = false;
    this.victory = false;

    // Input listeners
    this.keys = {};
    this.mousePos = { x: 0, y: 0 };
    this._onKeyDown = (e) => this.handleKeyDown(e);
    this._onKeyUp = (e) => this.handleKeyUp(e);
    this._onMouseMove = (e) => this.handleMouseMove(e);
    this._onClick = (e) => this.handleClick(e);
    this._onResize = () => this.resize();

    this.init();
  }

  // ========================================================================
  // AUDIO SYNTHESIZER
  // ========================================================================
  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.audioCtx = new AudioContext();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playSwordSlashSound() {
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  playParryClangSound() {
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      [1400, 2100, 2800].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.5 + i * 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.1);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      });
    } catch (e) {}
  }

  playSqueakSound() {
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.linearRampToValueAtTime(980, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.26);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.26);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  playBonkSound() {
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  playTeloletSound() {
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.18, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * 0.14);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + (idx + 1) * 0.14);
      });
    } catch (e) {}
  }

  playKerokanSound() {
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(310, now + 0.08);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  playDangdutEnding() {
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      [330, 392, 440, 523, 659].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        gain.gain.setValueAtTime(0.15, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.25);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + (i + 1) * 0.25);
      });
    } catch (e) {}
  }

  // ========================================================================
  // INIT & CHECKPOINT
  // ========================================================================
  init() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.rainDrops = [];
    for (let i = 0; i < 90; i++) {
      this.rainDrops.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        len: Math.random() * 25 + 12,
        speed: Math.random() * 14 + 18
      });
    }

    this.sakuraPetals = [];
    for (let i = 0; i < 30; i++) {
      this.sakuraPetals.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 6 + 4,
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 1.5 + 1,
        rot: Math.random() * Math.PI,
        rotSpeed: Math.random() * 0.05
      });
    }

    this.resetToCheckpoint(1);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('click', this._onClick);
    window.addEventListener('resize', this._onResize);
    this.resize();
  }

  resetToCheckpoint(phaseNum) {
    this.phase = phaseNum;
    this.phaseTimer = 0;
    this.dialog = null;
    this.dialogTimer = 0;
    this.screenFlash = 0;
    this.screenShake = 0;
    this.slowMo = 1.0;
    this.slowMoTimer = 0;
    this.gameOver = false;
    this.victory = false;
    this.projectiles = [];
    this.particles = [];
    this.slashTrails = [];
    this.bananaPeels = [];

    // Reset Player
    this.player = {
      x: 240,
      y: 520,
      w: 60,
      h: 96,
      vx: 0,
      vy: 0,
      isGrounded: true,
      facing: 1,
      hp: 100,
      maxHp: 100,
      isParrying: false,
      isAttacking: false,
      attackCooldown: 0,
      dashTimer: 0,
      weapon: phaseNum === 1 ? 'katana' : 'kangkung',
      stunTimer: 0,
      slipTimer: 0
    };

    // Reset Boss
    this.boss = {
      x: 940,
      y: 490,
      w: 90,
      h: 130,
      vx: 0,
      facing: -1,
      hp: phaseNum === 1 ? 1000 : (phaseNum === 2 ? 700 : (phaseNum === 3 ? 500 : 300)),
      maxHp: 1000,
      state: 'idle',
      attackTimer: 1.8,
      attackPattern: 0,
      isStaggered: false,
      holdsHealthBar: phaseNum >= 3
    };

    // Reset Fase Objek
    this.phaseObjectives.phase2SandalHits = 0;
    this.phaseObjectives.phase3GayungHits = 0;
    this.phaseObjectives.phase4SurvivalTimer = 25;

    this.rhythmBar.progress = 0;
    this.rhythmBar.combo = 0;

    this.fakeAd.active = phaseNum === 4;
    this.fakeAd.timer = 5;
    this.fakeAd.clicksDone = 0;

    this.tahuBulat.active = phaseNum >= 3;
    this.tahuBulat.timer = 8;
    this.tahuBulat.x = -350;

    if (phaseNum === 1) {
      this.setDialog('MALAKOR: "Hanya satu yang akan bertahan hidup malam ini..."', 'boss', 3.5);
    } else {
      this.showCheckpointBanner(`🚩 CHECKPOINT FASE ${phaseNum} DIMULAI!`);
    }
  }

  showCheckpointBanner(text) {
    this.checkpointBanner = text;
    this.checkpointBannerTimer = 3.0;
  }

  setDialog(text, sender = 'boss', duration = 3.2) {
    this.dialog = { text, sender };
    this.dialogTimer = duration;
  }

  // ========================================================================
  // INPUT HANDLERS
  // ========================================================================
  handleKeyDown(e) {
    this.initAudio();
    this.keys[e.code] = true;

    // Respawn dari Checkpoint saat kalah
    if (this.gameOver && (e.code === 'Space' || e.code === 'Enter')) {
      this.resetToCheckpoint(this.checkpointPhase);
      return;
    }

    // Restart total saat menang
    if (this.victory && (e.code === 'Space' || e.code === 'Enter')) {
      this.checkpointPhase = 1;
      this.resetToCheckpoint(1);
      return;
    }

    if (this.gameOver || this.victory) return;

    // Lompat (W / ArrowUp / Space)
    if ((e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') && 
        this.player.isGrounded && this.player.stunTimer <= 0 && this.player.slipTimer <= 0) {
      this.player.vy = -760;
      this.player.isGrounded = false;
      this.playSwordSlashSound();
    }

    // Serang / Lempar (J)
    if (e.code === 'KeyJ' && this.player.attackCooldown <= 0 && this.player.stunTimer <= 0 && this.player.slipTimer <= 0) {
      this.actionPlayerAttack();
    }

    // Parry (L)
    if (e.code === 'KeyL' && !this.player.isParrying && this.player.stunTimer <= 0) {
      this.actionPlayerParry();
    }

    // Dash (ShiftLeft / KeyK)
    if ((e.code === 'ShiftLeft' || e.code === 'KeyK') && this.player.dashTimer <= 0 && this.player.stunTimer <= 0) {
      if (this.phase === 5) {
        // Di Fase 5, tombol K adalah Rhythm Kerokan!
        this.actionRhythmKerokan();
      } else {
        this.actionPlayerDash();
      }
    }
  }

  handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    this.mousePos.x = (e.clientX - rect.left) * scaleX;
    this.mousePos.y = (e.clientY - rect.top) * scaleY;

    // Troll Iklan: Tombol kabur jika mouse mendekat
    if (this.fakeAd.active) {
      const adDist = Math.hypot(
        this.mousePos.x - (this.fakeAd.btnX + this.fakeAd.btnW / 2),
        this.mousePos.y - (this.fakeAd.btnY + this.fakeAd.btnH / 2)
      );

      if (adDist < 75) {
        this.fakeAd.btnX = Math.random() * (this.width - 350) + 100;
        this.fakeAd.btnY = Math.random() * 260 + 120;
        this.fakeAd.taunt = 'Eits kabur! Nonton dulu iklannya! 📺';
        this.playSqueakSound();
      }
    }
  }

  handleClick(e) {
    if (this.fakeAd.active) {
      if (this.mousePos.x >= this.fakeAd.btnX && this.mousePos.x <= this.fakeAd.btnX + this.fakeAd.btnW &&
          this.mousePos.y >= this.fakeAd.btnY && this.mousePos.y <= this.fakeAd.btnY + this.fakeAd.btnH) {
        this.fakeAd.clicksDone++;
        this.playBonkSound();
        if (this.fakeAd.clicksDone >= this.fakeAd.clicksNeeded) {
          this.fakeAd.active = false;
          this.showCheckpointBanner('🎉 IKLAN BERHASIL DITUTUP!');
        } else {
          this.fakeAd.timer = 10;
          this.fakeAd.taunt = `Baru ${this.fakeAd.clicksDone}/${this.fakeAd.clicksNeeded} kali klik! Klik lagi! 😂`;
        }
      }
    }
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.canvas.style.width = `${parent.clientWidth}px`;
    this.canvas.style.height = `${parent.clientHeight}px`;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('click', this._onClick);
    window.removeEventListener('resize', this._onResize);
    this.keys = {};
  }

  loop(time) {
    if (!this.running) return;
    const rawDt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    let dt = rawDt;
    if (this.slowMoTimer > 0) {
      dt *= this.slowMo;
      this.slowMoTimer -= rawDt;
      if (this.slowMoTimer <= 0) this.slowMo = 1.0;
    }

    this.update(dt);
    this.render();

    this.animationId = requestAnimationFrame((t) => this.loop(t));
  }

  // ========================================================================
  // PLAYER COMBAT ACTIONS
  // ========================================================================
  actionPlayerAttack() {
    this.player.isAttacking = true;
    this.player.attackCooldown = 0.32;

    // FASE 1: TEBASAN KATANA
    if (this.phase === 1) {
      this.playSwordSlashSound();
      this.slashTrails.push({
        x: this.player.facing === 1 ? this.player.x + 40 : this.player.x - 40,
        y: this.player.y + 40,
        facing: this.player.facing,
        life: 0.18,
        maxLife: 0.18
      });

      const dist = Math.abs((this.player.x + 30) - (this.boss.x + 45));
      if (dist < 130) {
        const damage = this.boss.isStaggered ? 90 : 45;
        this.boss.hp = Math.max(0, this.boss.hp - damage);
        this.spawnSparks(this.boss.x + 45, this.boss.y + 50, '#FFD700', 16);
        this.screenShake = 6;

        if (this.boss.hp <= 700) {
          this.advanceToPhase(2);
        }
      }
    }

    // FASE 2: SANDAL HOMING MISSILE
    else if (this.phase === 2) {
      this.playSqueakSound();
      this.projectiles.push({
        type: 'sandal_homing',
        x: this.player.x + 30,
        y: this.player.y + 20,
        vx: 380,
        vy: -160,
        rot: 0,
        rotSpeed: 16
      });
    }

    // FASE 3 & 4: LEMPAR GAYUNG AIR
    else if (this.phase === 3 || this.phase === 4) {
      this.playBonkSound();
      this.projectiles.push({
        type: 'gayung',
        x: this.player.x + 30,
        y: this.player.y + 20,
        vx: 580 * this.player.facing,
        vy: -220,
        rot: 0,
        rotSpeed: 14
      });
    }

    setTimeout(() => {
      this.player.isAttacking = false;
    }, 220);
  }

  actionPlayerParry() {
    this.player.isParrying = true;
    this.playSwordSlashSound();
    setTimeout(() => {
      this.player.isParrying = false;
    }, 320);
  }

  actionPlayerDash() {
    this.player.dashTimer = 0.7;
    this.player.vx = this.player.facing * 620;
    this.playSwordSlashSound();
  }

  // MINIGAME RHYTHM KEROKAN (Fase 5)
  actionRhythmKerokan() {
    const r = this.rhythmBar;
    // Cek apakah kursor berada di Sweet-Spot hijau (0.4 s.d 0.6)
    if (r.cursor >= r.sweetSpotMin && r.cursor <= r.sweetSpotMax) {
      // PERFECT KEROKAN!
      r.progress = Math.min(100, r.progress + 14);
      r.combo++;
      this.playKerokanSound();
      this.screenShake = 4;
      this.showCheckpointBanner(`🔥 KEROKAN MANTAP! (${Math.floor(r.progress)}%)`);

      if (r.progress >= 100) {
        this.advanceToPhase(6);
      }
    } else {
      // MISS: Kursor meleset
      r.combo = 0;
      this.playBonkSound();
      this.player.vx = -300;
      this.screenShake = 6;
      this.setDialog('MALAKOR: "ADUH KEGELIAN BANG! Agak ke tengah dikit kerokannya!"', 'boss', 2.0);
    }
  }

  // ========================================================================
  // ADVANCE PHASE (DENGAN CHECKPOINT OTOMATIS)
  // ========================================================================
  advanceToPhase(nextPhase) {
    this.phase = nextPhase;
    this.checkpointPhase = nextPhase;
    this.screenFlash = 0.8;
    this.screenShake = 14;

    if (nextPhase === 2) {
      this.player.weapon = 'kangkung';
      this.playBonkSound();
      this.setDialog('KAMU: "LHO?! Pedang patah jadi kangkung?! Sandal Swallow... aktifkan!"', 'player', 4);
      this.showCheckpointBanner('🚩 CHECKPOINT FASE 2: Hantam Boss 10x dengan Sandal!');
    } else if (nextPhase === 3) {
      this.boss.holdsHealthBar = true;
      this.tahuBulat.active = true;
      this.playTeloletSound();
      this.setDialog('MALAKOR: "GUA CABUT BAR DARAH GUA SENDIRI BUAT MUKUL LU!"', 'boss', 4.5);
      this.showCheckpointBanner('🚩 CHECKPOINT FASE 3: Siram Boss dengan 8 Gayung Air!');
    } else if (nextPhase === 4) {
      this.fakeAd.active = true;
      this.fakeAd.timer = 5;
      this.setDialog('MALAKOR: "TERIMA BULLET-HELL TAGIHAN PAYLATER JATUH TEMPO!"', 'boss', 4.5);
      this.showCheckpointBanner('🚩 CHECKPOINT FASE 4: Bertahan 25 Detik / Tutup Iklan!');
    } else if (nextPhase === 5) {
      this.boss.state = 'sitting_encok';
      this.fakeAd.active = false;
      this.playBonkSound();
      this.setDialog('MALAKOR: "ADUHHH PINGGANG GUA! Masuk angin... Tolong kerokin dong!"', 'boss', 5);
      this.showCheckpointBanner('🚩 CHECKPOINT FASE 5: Tekan [K] Tepat di Area Hijau!');
    } else if (nextPhase === 6) {
      this.victory = true;
      this.playDangdutEnding();
      this.setDialog('EMAK MALAKOR: "MALAKOR! PULANG KAU, CUCI PIRING DI DAPUR!"', 'boss', 8);
    }
  }

  // ========================================================================
  // UPDATE LOOP & COMBAT TIMING
  // ========================================================================
  update(dt) {
    this.phaseTimer += dt;

    if (this.dialogTimer > 0) {
      this.dialogTimer -= dt;
      if (this.dialogTimer <= 0) this.dialog = null;
    }

    if (this.checkpointBannerTimer > 0) {
      this.checkpointBannerTimer -= dt;
      if (this.checkpointBannerTimer <= 0) this.checkpointBanner = null;
    }

    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 25);
    if (this.screenFlash > 0) this.screenFlash = Math.max(0, this.screenFlash - dt * 2);

    // Weather particles
    if (this.phase < 6) {
      for (const r of this.rainDrops) {
        r.y += r.speed * 60 * dt;
        if (r.y > this.height) { r.y = -20; r.x = Math.random() * this.width; }
      }
      for (const p of this.sakuraPetals) {
        p.y += p.speedY * 60 * dt;
        p.rot += p.rotSpeed;
        if (p.y > this.height) { p.y = -10; p.x = Math.random() * this.width; }
      }
    }

    // Slash Trail Decay
    for (let i = this.slashTrails.length - 1; i >= 0; i--) {
      this.slashTrails[i].life -= dt;
      if (this.slashTrails[i].life <= 0) this.slashTrails.splice(i, 1);
    }

    // Rhythm Bar Animation (Fase 5)
    if (this.phase === 5) {
      this.rhythmBar.cursor += this.rhythmBar.speed * this.rhythmBar.dir * dt;
      if (this.rhythmBar.cursor >= 1) {
        this.rhythmBar.cursor = 1;
        this.rhythmBar.dir = -1;
      } else if (this.rhythmBar.cursor <= 0) {
        this.rhythmBar.cursor = 0;
        this.rhythmBar.dir = 1;
      }
    }

    // Player Status Effects (Slip on Banana / Stun)
    if (this.player.slipTimer > 0) {
      this.player.slipTimer -= dt;
      this.player.vx = this.player.facing * -250;
    } else if (this.player.stunTimer > 0) {
      this.player.stunTimer -= dt;
      this.player.vx = 0;
    } else if (this.phase < 6) {
      // Normal Controls
      const moveLeft = this.keys['KeyA'] || this.keys['ArrowLeft'];
      const moveRight = this.keys['KeyD'] || this.keys['ArrowRight'];

      if (this.player.dashTimer > 0) {
        this.player.dashTimer -= dt;
      } else {
        if (moveLeft) { this.player.vx = -300; this.player.facing = -1; }
        else if (moveRight) { this.player.vx = 300; this.player.facing = 1; }
        else { this.player.vx = 0; }
      }

      if (this.player.attackCooldown > 0) this.player.attackCooldown -= dt;

      // Gravitasi Player (Responsive Platformer Jump)
      this.player.vy += 1750 * dt;
      this.player.x += this.player.vx * dt;
      this.player.y += this.player.vy * dt;

      if (this.player.y >= 520) {
        this.player.y = 520;
        this.player.vy = 0;
        this.player.isGrounded = true;
      }
      this.player.x = Math.max(80, Math.min(this.width - 120, this.player.x));
    }

    // CEK TABRAKAN KULIT PISANG (Fase 2 & 3)
    for (let i = this.bananaPeels.length - 1; i >= 0; i--) {
      const peel = this.bananaPeels[i];
      if (Math.abs((this.player.x + 30) - peel.x) < 30 && this.player.isGrounded) {
        this.player.slipTimer = 1.0; // Terpeleset 1 detik!
        this.player.vy = -350;
        this.playSqueakSound();
        this.setDialog('KAMU: "ADUH! Siapa yang buang kulit pisang di arena?!"', 'player', 2);
        this.bananaPeels.splice(i, 1);
      }
    }

    // TAHU BULAT TRUCK PATROL (Fase >= 3)
    if (this.tahuBulat.active && this.phase < 6) {
      this.tahuBulat.timer -= dt;

      if (this.tahuBulat.timer <= 2.5 && !this.tahuBulat.warning) {
        this.tahuBulat.warning = true;
        this.playTeloletSound();
      }

      if (this.tahuBulat.timer <= 0) {
        this.tahuBulat.x += this.tahuBulat.vx * dt;

        // Tabrak Player (Bisa dilompati!)
        if (Math.abs((this.tahuBulat.x + 70) - (this.player.x + 30)) < 70 && this.player.y > 450) {
          this.player.hp = Math.max(0, this.player.hp - 20);
          this.player.vy = -550;
          this.screenShake = 10;
          if (this.player.hp <= 0) this.triggerGameOver('Tertabrak mobil tahu bulat yang sedang buru-buru digoreng dadakan.');
        }

        // Tabrak Boss (Pemain bisa memancing Boss kena mobil!)
        if (Math.abs((this.tahuBulat.x + 70) - (this.boss.x + 45)) < 70) {
          this.boss.isStaggered = true;
          this.boss.attackTimer = 3.0; // Boss pusing 3 detik
          this.playBonkSound();
        }

        if (this.tahuBulat.x > this.width + 300) {
          this.tahuBulat.x = -350;
          this.tahuBulat.timer = Math.random() * 6 + 10; // Lewat lagi 10-16 detik
          this.tahuBulat.warning = false;
        }
      }
    }

    // FASE 4 SURVIVAL TIMER
    if (this.phase === 4 && !this.gameOver) {
      this.phaseObjectives.phase4SurvivalTimer -= dt;
      if (this.phaseObjectives.phase4SurvivalTimer <= 0) {
        this.advanceToPhase(5);
      }
    }

    // UPDATE BOSS AI BERDASARKAN FASE
    if (!this.gameOver && this.phase < 5) {
      this.updateBossBehavior(dt);
    }

    // UPDATE PROYEKTIL
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      // Proyektil Sandal Homing (Fase 2)
      if (p.type === 'sandal_homing') {
        const dx = (this.boss.x + 45) - p.x;
        const dy = (this.boss.y + 50) - p.y;
        p.vx += dx * 5 * dt;
        p.vy += dy * 5 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.rotSpeed * dt;

        if (Math.abs(p.x - (this.boss.x + 45)) < 45 && Math.abs(p.y - (this.boss.y + 50)) < 50) {
          this.playSqueakSound();
          this.spawnSparks(this.boss.x + 45, this.boss.y + 50, '#00E676', 15);
          this.projectiles.splice(i, 1);

          this.phaseObjectives.phase2SandalHits++;
          if (this.phaseObjectives.phase2SandalHits >= this.phaseObjectives.phase2SandalTarget) {
            this.advanceToPhase(3);
          }
          continue;
        }
      }

      // Proyektil Gayung Air (Fase 3)
      else if (p.type === 'gayung') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 450 * dt;
        p.rot += p.rotSpeed * dt;

        if (Math.abs(p.x - (this.boss.x + 45)) < 55 && Math.abs(p.y - (this.boss.y + 50)) < 60) {
          this.playBonkSound();
          this.spawnSparks(this.boss.x + 45, this.boss.y + 50, '#00E5FF', 15);
          this.projectiles.splice(i, 1);

          this.phaseObjectives.phase3GayungHits++;
          if (this.phaseObjectives.phase3GayungHits >= this.phaseObjectives.phase3GayungTarget) {
            this.advanceToPhase(4);
          }
          continue;
        }
      }

      // Proyektil Tagihan Paylater (Fase 4 Bullet-Hell)
      else if (p.type === 'tagihan_paylater') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.rotSpeed * dt;

        if (Math.abs(p.x - (this.player.x + 30)) < 35 && Math.abs(p.y - (this.player.y + 45)) < 45) {
          this.player.stunTimer = 1.5;
          this.player.hp = Math.max(0, this.player.hp - 15);
          this.playBonkSound();
          this.projectiles.splice(i, 1);
          if (this.player.hp <= 0) this.triggerGameOver('Gagal melunasi tagihan paylater tepat waktu.');
          continue;
        }
      }

      // Proyektil Serangan Boss (Dark Wave / Shuriken)
      else if (p.type === 'dark_wave' || p.type === 'shuriken') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (Math.abs(p.x - (this.player.x + 30)) < 35 && Math.abs(p.y - (this.player.y + 45)) < 45) {
          if (this.player.isParrying) {
            this.playParryClangSound();
            this.spawnSparks(this.player.x + 30, this.player.y + 40, '#00E5FF', 25);
            this.projectiles.splice(i, 1);
            this.boss.isStaggered = true;
            this.boss.attackTimer = 2.0;
          } else {
            this.player.hp = Math.max(0, this.player.hp - 20);
            this.screenShake = 10;
            this.projectiles.splice(i, 1);
            if (this.player.hp <= 0) this.triggerGameOver('Tebasan kegelapan menembus pertahananmu.');
          }
          continue;
        }
      }

      if (p.x > this.width + 200 || p.x < -200 || p.y > this.height + 100) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  // BOSS COMBAT AI PATTERNS
  updateBossBehavior(dt) {
    const b = this.boss;
    const dist = Math.abs((b.x + 45) - (this.player.x + 30));

    if (b.isStaggered) {
      b.attackTimer -= dt;
      if (b.attackTimer <= 0) b.isStaggered = false;
      return;
    }

    // Gerak mendekat jika terlalu jauh
    if (dist > 180) {
      b.facing = this.player.x < b.x ? -1 : 1;
      b.x += b.facing * 180 * dt;
    }

    b.attackTimer -= dt;
    if (b.attackTimer <= 0) {
      b.attackTimer = Math.random() * 1.4 + 1.8;
      b.attackPattern = (b.attackPattern + 1) % 3;

      // Pola Serangan Fase 1 (Serious Souls-like)
      if (this.phase === 1) {
        if (b.attackPattern === 0) {
          // 1. Triple Dark Wave (Lompati!)
          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              this.projectiles.push({
                type: 'dark_wave',
                x: b.x + (b.facing * 30),
                y: b.y + 65,
                vx: b.facing * 480,
                vy: 0,
                rot: 0, rotSpeed: 0
              });
              this.playSwordSlashSound();
            }, i * 280);
          }
        } else if (b.attackPattern === 1) {
          // 2. Heavy Overhead Strike (Harus di-parry!)
          this.setDialog('MALAKOR: "TEBASAN PENGHANCUR JIWA!"', 'boss', 1.5);
          setTimeout(() => {
            this.playSwordSlashSound();
            const curDist = Math.abs((b.x + 45) - (this.player.x + 30));
            if (curDist < 140) {
              if (this.player.isParrying) {
                this.playParryClangSound();
                b.isStaggered = true;
                b.attackTimer = 2.5;
                this.spawnSparks(this.player.x + 30, this.player.y + 40, '#FFD700', 30);
              } else {
                this.player.hp = Math.max(0, this.player.hp - 35);
                this.screenShake = 14;
                if (this.player.hp <= 0) this.triggerGameOver('Gagal menangkis tebasan berat sang Warlord.');
              }
            }
          }, 450);
        } else {
          // 3. Shadow Teleport Strike
          b.x = this.player.facing === 1 ? this.player.x - 120 : this.player.x + 120;
          b.facing = this.player.x < b.x ? -1 : 1;
          this.playSwordSlashSound();
        }
      }

      // Pola Serangan Fase 2 (Shuriken + Kulit Pisang)
      else if (this.phase === 2) {
        // Lempar Shuriken
        this.projectiles.push({
          type: 'shuriken',
          x: b.x + (b.facing * 30),
          y: b.y + 45,
          vx: b.facing * 520,
          vy: 0,
          rot: 0, rotSpeed: 20
        });
        // Jatuhkan Kulit Pisang di Lantai
        if (this.bananaPeels.length < 3) {
          this.bananaPeels.push({ x: Math.random() * (this.width - 300) + 150, y: 590 });
        }
      }

      // Pola Serangan Fase 3 (Ayunan Bar Darah Baseball)
      else if (this.phase === 3) {
        this.playSwordSlashSound();
        this.screenShake = 8;
        const curDist = Math.abs((b.x + 45) - (this.player.x + 30));
        if (curDist < 170 && this.player.y > 440) {
          this.player.hp = Math.max(0, this.player.hp - 25);
          this.player.vy = -450;
          this.player.vx = b.facing * 350;
          if (this.player.hp <= 0) this.triggerGameOver('Terhantam telak oleh bar darah 999 juta HP.');
        }
      }

      // Pola Serangan Fase 4 (Hujan Tagihan Paylater)
      else if (this.phase === 4) {
        for (let i = 0; i < 3; i++) {
          this.projectiles.push({
            type: 'tagihan_paylater',
            x: b.x - 20,
            y: b.y + 20 + (i * 25),
            vx: -450,
            vy: (Math.random() - 0.5) * 120,
            rot: 0, rotSpeed: 6
          });
        }
      }
    }
  }

  spawnSparks(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 220 + 60;
      this.particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color, life: 0.35
      });
    }
  }

  triggerGameOver(reason) {
    this.gameOver = true;
    this.screenShake = 18;
    this.playBonkSound();
    this.deathReason = reason || 'Ksatria gugur dalam pertempuran.';
  }

  // ========================================================================
  // RENDER MASTER
  // ========================================================================
  render() {
    const ctx = this.ctx;
    ctx.save();

    if (this.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }

    if (this.phase === 6) {
      this.renderDangdutHajatanEnding(ctx);
      ctx.restore();
      return;
    }

    // 1. Background Kuil Serius
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#0a0612');
    grad.addColorStop(0.6, '#180a22');
    grad.addColorStop(1, '#08030d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Bulan Merah Darah
    ctx.save();
    ctx.shadowColor = '#FF1744'; ctx.shadowBlur = 35;
    ctx.fillStyle = 'rgba(255, 23, 68, 0.35)';
    ctx.beginPath(); ctx.arc(this.width / 2, 210, 150, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Siluet Atap Kuil
    ctx.fillStyle = '#07030a';
    ctx.beginPath();
    ctx.moveTo(0, 480); ctx.lineTo(240, 360); ctx.lineTo(480, 480);
    ctx.lineTo(760, 330); ctx.lineTo(1050, 480); ctx.lineTo(this.width, 360);
    ctx.lineTo(this.width, this.height); ctx.lineTo(0, this.height);
    ctx.closePath(); ctx.fill();

    // Lantai Kayu Kuil
    ctx.fillStyle = '#1c1224';
    ctx.fillRect(0, 610, this.width, this.height - 610);
    ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 610); ctx.lineTo(this.width, 610); ctx.stroke();

    // Hujan & Sakura
    ctx.strokeStyle = 'rgba(128, 222, 234, 0.3)'; ctx.lineWidth = 1.5;
    for (const r of this.rainDrops) {
      ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - 2, r.y + r.len); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 128, 171, 0.65)';
    for (const p of this.sakuraPetals) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // RENDER KULIT PISANG (Fase 2 & 3)
    ctx.fillStyle = '#FFEB3B';
    for (const peel of this.bananaPeels) {
      ctx.beginPath();
      ctx.ellipse(peel.x, peel.y, 14, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // RENDER MOBIL TAHU BULAT
    if (this.tahuBulat.active) {
      this.renderTahuBulatTruck(ctx);
    }

    // RENDER ENTITAS
    this.renderPlayer(ctx);
    this.renderBoss(ctx);
    this.renderProjectiles(ctx);
    this.renderSlashTrails(ctx);

    // RENDER HUD SERIUS / ABSURD
    this.renderHUD(ctx);

    // RENDER MINIGAME RHYTHM KEROKAN (Fase 5)
    if (this.phase === 5) {
      this.renderRhythmMinigame(ctx);
    }

    // FAKE YOUTUBE AD (Fase 4)
    if (this.fakeAd.active) {
      this.renderFakeAd(ctx);
    }

    // DIALOG & BANNER
    this.renderDialog(ctx);

    if (this.checkpointBanner) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = "bold 22px 'Inter', sans-serif";
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 15;
      ctx.fillText(this.checkpointBanner, this.width / 2, 180);
      ctx.restore();
    }

    // FLASH & GAME OVER
    if (this.screenFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.screenFlash})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    if (this.gameOver) {
      this.renderGameOver(ctx);
    }

    ctx.restore();
  }

  // ========================================================================
  // RENDER DETAILS
  // ========================================================================
  renderTahuBulatTruck(ctx) {
    const tb = this.tahuBulat;
    ctx.save();

    // Peringatan Klakson Telolet sebelum mobil lewat
    if (tb.warning && tb.timer <= 2.5) {
      ctx.textAlign = 'center';
      ctx.font = "900 24px 'Inter', sans-serif";
      ctx.fillStyle = '#FF1744';
      ctx.fillText("⚠️ AWAS! PICK-UP TAHU BULAT MENDEKAT (SIAP-SIAP LOMPAT!) ⚠️", this.width / 2, 230);
    }

    ctx.translate(tb.x, tb.y);

    // Badan Pick-up
    ctx.fillStyle = '#212121';
    ctx.fillRect(0, -35, 140, 45);
    ctx.fillStyle = '#424242';
    ctx.fillRect(90, -60, 45, 30);
    ctx.fillStyle = '#80DEEA';
    ctx.fillRect(105, -55, 25, 18);

    // Wajan Tahu Bulat
    ctx.fillStyle = '#FFB300';
    ctx.beginPath(); ctx.ellipse(45, -40, 35, 12, 0, 0, Math.PI * 2); ctx.fill();

    // Ban Mobil
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(30, 10, 14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(110, 10, 14, 0, Math.PI * 2); ctx.fill();

    // Spanduk Banner
    ctx.fillStyle = '#D50000';
    ctx.fillRect(-20, -95, 180, 26);
    ctx.font = "bold 11px 'Inter', sans-serif";
    ctx.fillStyle = '#FFEB3B';
    ctx.textAlign = 'center';
    ctx.fillText("TAHU BULAT 500-AN", 70, -78);

    ctx.restore();
  }

  // Minigame Kerokan Rhythm Bar
  renderRhythmMinigame(ctx) {
    const r = this.rhythmBar;
    ctx.save();

    // Container Bar di Tengah Layar
    const barW = 540;
    const barH = 34;
    const barX = (this.width - barW) / 2;
    const barY = 240;

    ctx.fillStyle = 'rgba(10, 5, 24, 0.9)';
    ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 3;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeRect(barX, barY, barW, barH);

    // Area Hijau (Sweet-Spot)
    const greenX = barX + (barW * r.sweetSpotMin);
    const greenW = barW * (r.sweetSpotMax - r.sweetSpotMin);
    ctx.fillStyle = '#00E676';
    ctx.fillRect(greenX, barY + 2, greenW, barH - 4);

    // Kursor Bergerak
    const curX = barX + (barW * r.cursor);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 12;
    ctx.fillRect(curX - 4, barY - 6, 8, barH + 12);
    ctx.shadowBlur = 0;

    // Instruksi & Progress
    ctx.textAlign = 'center';
    ctx.font = "900 24px 'Cinzel', serif";
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`TEKAN [K] SAAT KURSOR DI AREA HIJAU!`, this.width / 2, barY - 20);

    ctx.font = "bold 16px 'Inter', sans-serif";
    ctx.fillStyle = '#80DEEA';
    ctx.fillText(`ANGIN DALAM TUBUH BOSS KELUAR: ${Math.floor(r.progress)}% / 100%`, this.width / 2, barY + 65);

    ctx.restore();
  }

  renderFakeAd(ctx) {
    const ad = this.fakeAd;
    ctx.save();
    ctx.fillStyle = 'rgba(10, 5, 20, 0.88)';
    ctx.fillRect(180, 160, 920, 320);
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3;
    ctx.strokeRect(180, 160, 920, 320);

    ctx.textAlign = 'center';
    ctx.font = "900 26px 'Inter', sans-serif";
    ctx.fillStyle = '#FFD700';
    ctx.fillText("📺 IKLAN: MINYAK ANGIN CAP KAPAK SANG PENDEKAR", this.width / 2, 220);

    ctx.font = "16px 'Inter', sans-serif";
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Klik tombol lewati iklan (${ad.clicksDone}/${ad.clicksNeeded}) sambil menghindari tagihan paylater!`, this.width / 2, 260);

    // Tombol Lewati Iklan
    ctx.fillStyle = '#D50000';
    ctx.fillRect(ad.btnX, ad.btnY, ad.btnW, ad.btnH);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
    ctx.strokeRect(ad.btnX, ad.btnY, ad.btnW, ad.btnH);

    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText("Lewati Iklan ▶", ad.btnX + ad.btnW / 2, ad.btnY + 26);

    if (ad.taunt) {
      ctx.font = "bold 15px 'Inter', sans-serif";
      ctx.fillStyle = '#FFEB3B';
      ctx.fillText(ad.taunt, this.width / 2, 420);
    }

    ctx.restore();
  }

  renderPlayer(ctx) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);

    const isAirborne = !p.isGrounded;
    const sway = isAirborne ? 0 : Math.sin(this.phaseTimer * 6) * 1.5;

    // Bayangan
    if (!isAirborne) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath(); ctx.ellipse(30, 94, 32, 8, 0, 0, Math.PI * 2); ctx.fill();
    }

    // Selendang Merah
    ctx.fillStyle = '#D50000';
    ctx.beginPath();
    ctx.moveTo(30, 22 + sway);
    ctx.lineTo(p.facing === 1 ? -15 : 75, 30);
    ctx.lineTo(30, 32 + sway);
    ctx.fill();

    // Tubuh & Hakama
    ctx.fillStyle = '#0A1122';
    ctx.fillRect(16, 62 + sway, 13, 26);
    ctx.fillRect(32, 62 + sway, 13, 26);

    // Haori
    ctx.fillStyle = '#101D38';
    ctx.fillRect(14, 24 + sway, 34, 40);

    // Kepala & Wajah
    ctx.fillStyle = '#F0D5BA';
    ctx.fillRect(20, 12 + sway, 22, 14);

    // Topi Kasa Bambu
    ctx.fillStyle = '#5D4037';
    ctx.beginPath(); ctx.ellipse(31, 8 + sway, 28, 8, 0, 0, Math.PI * 2); ctx.fill();

    // Senjata di Tangan: Katana vs Kangkung
    const handX = p.facing === 1 ? 40 : 22;
    const handY = 38 + sway;

    if (p.weapon === 'katana') {
      ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 10;
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.lineTo(p.facing === 1 ? handX + 50 : handX - 50, handY - 4);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = '#4CAF50'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.quadraticCurveTo(p.facing === 1 ? handX + 25 : handX - 25, handY + 20, p.facing === 1 ? handX + 35 : handX - 35, handY + 12);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderBoss(ctx) {
    const b = this.boss;
    ctx.save();
    ctx.translate(b.x, b.y);

    const bSway = Math.sin(this.phaseTimer * 4) * 2;

    // Bayangan
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath(); ctx.ellipse(45, 124, 52, 14, 0, 0, Math.PI * 2); ctx.fill();

    // Zirah Obsidian
    ctx.fillStyle = '#12071E';
    ctx.strokeStyle = b.isStaggered ? '#FFD700' : '#7C4DFF'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(4, 26 + bSway, 82, 85, 8); ctx.fill(); ctx.stroke();

    // Helm Kabuto
    ctx.fillStyle = '#210936';
    ctx.beginPath(); ctx.arc(45, 12 + bSway, 24, 0, Math.PI * 2); ctx.fill();

    // Tanduk Bulan Sabit
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(45, 4 + bSway);
    ctx.quadraticCurveTo(15, -34 + bSway, -15, -18 + bSway);
    ctx.quadraticCurveTo(18, -20 + bSway, 45, -6 + bSway);
    ctx.quadraticCurveTo(72, -20 + bSway, 105, -18 + bSway);
    ctx.quadraticCurveTo(75, -34 + bSway, 45, 4 + bSway);
    ctx.closePath(); ctx.fill();

    // Mata Merah
    ctx.fillStyle = '#FF1744';
    ctx.fillRect(36, 11 + bSway, 4, 3);
    ctx.fillRect(50, 11 + bSway, 4, 3);

    // Memegang Bar Darah Baseball
    if (b.holdsHealthBar) {
      ctx.fillStyle = '#D500F9';
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(b.facing === -1 ? -90 : 80, 20, 130, 22, 6);
      ctx.fill(); ctx.stroke();
    }

    ctx.restore();
  }

  renderProjectiles(ctx) {
    for (const p of this.projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      if (p.type === 'sandal_homing') {
        ctx.fillStyle = '#00E676'; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(-20, -10, 40, 20, 6); ctx.fill(); ctx.stroke();
      } else if (p.type === 'tagihan_paylater') {
        ctx.fillStyle = '#FFF8E1'; ctx.strokeStyle = '#D50000'; ctx.lineWidth = 2;
        ctx.fillRect(-25, -15, 50, 30); ctx.strokeRect(-25, -15, 50, 30);
      } else if (p.type === 'gayung') {
        ctx.fillStyle = '#FF1744';
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI); ctx.fill();
        ctx.fillRect(-4, -14, 8, 14);
      } else if (p.type === 'dark_wave') {
        ctx.fillStyle = '#7C4DFF';
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
      } else if (p.type === 'shuriken') {
        ctx.fillStyle = '#B0BEC5';
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
      }

      ctx.restore();
    }
  }

  renderSlashTrails(ctx) {
    for (const trail of this.slashTrails) {
      ctx.save();
      const alpha = trail.life / trail.maxLife;
      ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`; ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, 55, trail.facing === 1 ? -Math.PI * 0.4 : Math.PI * 0.6, trail.facing === 1 ? Math.PI * 0.3 : Math.PI * 1.3);
      ctx.stroke();
      ctx.restore();
    }
  }

  renderHUD(ctx) {
    ctx.save();

    // Bar Player
    ctx.fillStyle = 'rgba(10, 5, 20, 0.8)';
    ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 2;
    ctx.strokeRect(40, 32, 240, 18);
    ctx.fillRect(40, 32, 240, 18);
    ctx.fillStyle = '#00E5FF';
    ctx.fillRect(42, 34, 236 * (this.player.hp / this.player.maxHp), 14);
    ctx.font = "bold 11px 'Cinzel', serif";
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`VIGOR: ${this.player.hp} / 100`, 42, 24);

    // Bar Boss
    const bossBarW = 760;
    const bossBarX = (this.width - bossBarW) / 2;
    const bossBarY = 64;

    if (!this.boss.holdsHealthBar) {
      ctx.fillStyle = 'rgba(10, 5, 20, 0.85)';
      ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 2;
      ctx.strokeRect(bossBarX, bossBarY, bossBarW, 22);
      ctx.fillRect(bossBarX, bossBarY, bossBarW, 22);
      ctx.fillStyle = '#7C4DFF';
      ctx.fillRect(bossBarX + 2, bossBarY + 2, (bossBarW - 4) * (this.boss.hp / this.boss.maxHp), 18);

      ctx.textAlign = 'center';
      ctx.font = "bold 13px 'Cinzel', serif";
      ctx.fillStyle = '#FFD700';
      ctx.fillText("LORD MALAKOR — THE ABYSSAL WARLORD", this.width / 2, bossBarY - 8);
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(bossBarX, bossBarY, bossBarW, 22);
      ctx.setLineDash([]);
      ctx.textAlign = 'center';
      ctx.font = "bold 12px 'Inter', sans-serif";
      ctx.fillStyle = '#FFEB3B';
      ctx.fillText("⚠️ [BAR DARAH SEDANG DICOPOT BOSS BUAT MUKUL LU] ⚠️", this.width / 2, bossBarY + 16);
    }

    // Status Objektif Fase
    ctx.textAlign = 'center';
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.fillStyle = '#00E5FF';

    if (this.phase === 1) {
      ctx.fillText(`Fase 1: Kuras Darah Boss hingga 700 HP (Sisa: ${this.boss.hp})`, this.width / 2, 120);
    } else if (this.phase === 2) {
      ctx.fillText(`Fase 2: Lempar Sandal Swallow ke Boss (${this.phaseObjectives.phase2SandalHits}/${this.phaseObjectives.phase2SandalTarget})`, this.width / 2, 120);
    } else if (this.phase === 3) {
      ctx.fillText(`Fase 3: Siram Boss dengan Gayung Air (${this.phaseObjectives.phase3GayungHits}/${this.phaseObjectives.phase3GayungTarget})`, this.width / 2, 120);
    } else if (this.phase === 4) {
      ctx.fillText(`Fase 4: Hindari Tagihan Paylater! Bertahan: ${Math.ceil(this.phaseObjectives.phase4SurvivalTimer)}s`, this.width / 2, 120);
    }

    // Controls Hint
    ctx.font = "12px 'Inter', sans-serif";
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText("[A/D] Gerak  •  [W / Spasi] Lompat  •  [J] Serang / Lempar  •  [L] Parry  •  [Shift / K] Dash / Minigame", this.width / 2, this.height - 24);

    ctx.restore();
  }

  renderDialog(ctx) {
    if (!this.dialog) return;
    ctx.save();
    const boxW = 900;
    const boxH = 50;
    const boxX = (this.width - boxW) / 2;
    const boxY = 140;

    ctx.fillStyle = 'rgba(10, 5, 24, 0.9)';
    ctx.strokeStyle = this.dialog.sender === 'boss' ? '#FF1744' : '#00E5FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.fillRect(boxX, boxY, boxW, boxH);

    ctx.font = "600 14px 'Inter', sans-serif";
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(this.dialog.text, this.width / 2, boxY + 31);
    ctx.restore();
  }

  renderGameOver(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 5, 20, 0.92)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.shadowColor = '#FF1744'; ctx.shadowBlur = 30;
    ctx.font = "900 64px 'Cinzel', serif";
    ctx.fillStyle = '#FF1744';
    ctx.fillText("YOU DIED", this.width / 2, this.height / 2 - 50);

    ctx.shadowBlur = 0;
    ctx.font = "600 20px 'Inter', sans-serif";
    ctx.fillStyle = '#FFE082';
    ctx.fillText(this.deathReason || 'Pertarungan berakhir tragis.', this.width / 2, this.height / 2 + 10);

    ctx.font = "bold 16px 'Inter', sans-serif";
    ctx.fillStyle = '#00E5FF';
    ctx.fillText(`Tekan [SPASI] untuk Mengulang dari Checkpoint Fase ${this.checkpointPhase} 🚩`, this.width / 2, this.height / 2 + 70);

    ctx.restore();
  }

  renderDangdutHajatanEnding(ctx) {
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(0, 0, this.width, 180);
    ctx.fillStyle = '#1976D2';
    for (let x = 0; x < this.width; x += 80) ctx.fillRect(x, 0, 40, 180);

    ctx.fillStyle = '#5D4037'; ctx.fillRect(0, 480, this.width, this.height - 480);
    ctx.fillStyle = '#D32F2F'; ctx.fillRect(100, 480, this.width - 200, this.height - 480);

    // Sound System
    ctx.fillStyle = '#212121';
    ctx.fillRect(60, 260, 110, 220);
    ctx.fillRect(this.width - 170, 260, 110, 220);

    ctx.font = "64px 'Inter', sans-serif";
    ctx.fillText("🥷🎤", 430, 470);
    ctx.fillText("🎤👹", 730, 470);

    ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FF1744'; ctx.shadowBlur = 20;
    ctx.font = "900 42px 'Cinzel', serif";
    ctx.textAlign = 'center';
    ctx.fillText("🎪 HAJATAN DANGDUT AKBAR RT 04 🎪", this.width / 2, 220);

    ctx.shadowBlur = 0;
    ctx.font = "bold 20px 'Inter', sans-serif";
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText("Lord Malakor batal hancurin dunia karena disuruh mamaknya pulang cuci piring!", this.width / 2, 265);

    ctx.font = "bold 16px 'Inter', sans-serif";
    ctx.fillStyle = '#FFE082';
    ctx.fillText("Gelar: Pemenang Duel Berdarah & Juara 1 Dangdutan Tenda Biru 👑", this.width / 2, 305);

    ctx.font = "14px 'Inter', sans-serif";
    ctx.fillStyle = '#80DEEA';
    ctx.fillText("Tekan [SPASI] untuk Mengulang Seluruh Permainan dari Awal", this.width / 2, 350);
  }
}
