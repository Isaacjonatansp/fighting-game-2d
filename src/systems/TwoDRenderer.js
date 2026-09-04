// 2D Pixel Art Renderer for Fighting Game
export class TwoDRenderer {
  constructor(config) {
    this.config = config;
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.width = config.width;
    this.height = config.height;

    this.referenceWidth = 1280;
    this.referenceHeight = 720;
    this.scaleX = 1;
    this.scaleY = 1;

    this.cameraX = 0;
    this.cameraY = 0;
    this.viewportWidth = this.referenceWidth;
    this.viewportHeight = this.referenceHeight;

    this.arenaLeft = 0;
    this.arenaRight = this.referenceWidth;
    this.groundY = config.groundY;

    this.fighterAnimationState = { 1: 'idle', 2: 'idle' };
    this.fighterAnimationFrame = { 1: 0, 2: 0 };
    this.fighterAnimationTimer = { 1: 0, 2: 0 };

    this.shinobiSprites = { 1: {}, 2: {} };
    this.spritesLoaded = { 1: false, 2: false };

    // Real frame counts derived from PNG dimensions (128px per frame)
    // Shinobi:    Attack_1=5 Attack_2=3 Attack_3=4 Idle=6 Jump=12 Run=8 Walk=8 Shield=4 Hurt=2 Dead=4
    // Samurai:    Attack_1=6 Attack_2=4 Attack_3=3 Idle=6 Jump=12 Run=8 Walk=8 Shield=2 Hurt=2 Dead=3
    this.sheetConfig = {
      // Shinobi
      1: {
        idle: { file: 'Idle.png', frames: 6, fps: 8 },
        walk: { file: 'Walk.png', frames: 8, fps: 12 },
        run: { file: 'Run.png', frames: 8, fps: 14 },
        jump: { file: 'Jump.png', frames: 12, fps: 10 },
        fall: { file: 'Jump.png', frames: 12, fps: 10 },
        attack: { file: 'Attack_1.png', frames: 5, fps: 18 },
        attack2: { file: 'Attack_2.png', frames: 3, fps: 18 },
        attack3: { file: 'Attack_3.png', frames: 4, fps: 18 },
        heavyAttack: { file: 'Attack_2.png', frames: 3, fps: 12 },
        heavyAttack2: { file: 'Attack_2.png', frames: 3, fps: 12 },
        special: { file: 'Attack_3.png', frames: 4, fps: 10 },
        airAttack: { file: 'Attack_1.png', frames: 5, fps: 16 },
        crouch: { file: 'Idle.png', frames: 6, fps: 8 },
        crouchAttack: { file: 'Attack_1.png', frames: 5, fps: 14 },
        block: { file: 'Shield.png', frames: 4, fps: 10 },
        hit: { file: 'Hurt.png', frames: 2, fps: 12 },
        dash: { file: 'Run.png', frames: 8, fps: 16 },
        die: { file: 'Dead.png', frames: 4, fps: 6 }
      },
      // Samurai
      2: {
        idle: { file: 'Idle.png', frames: 6, fps: 8 },
        walk: { file: 'Walk.png', frames: 8, fps: 12 },
        run: { file: 'Run.png', frames: 8, fps: 14 },
        jump: { file: 'Jump.png', frames: 12, fps: 10 },
        fall: { file: 'Jump.png', frames: 12, fps: 10 },
        attack: { file: 'Attack_1.png', frames: 6, fps: 18 },
        attack2: { file: 'Attack_2.png', frames: 4, fps: 18 },
        attack3: { file: 'Attack_3.png', frames: 3, fps: 18 },
        heavyAttack: { file: 'Attack_2.png', frames: 4, fps: 12 },
        heavyAttack2: { file: 'Attack_2.png', frames: 4, fps: 12 },
        special: { file: 'Attack_3.png', frames: 3, fps: 10 },
        airAttack: { file: 'Attack_1.png', frames: 6, fps: 16 },
        crouch: { file: 'Idle.png', frames: 6, fps: 8 },
        crouchAttack: { file: 'Attack_1.png', frames: 6, fps: 14 },
        block: { file: 'Shield.png', frames: 2, fps: 10 },
        hit: { file: 'Hurt.png', frames: 2, fps: 12 },
        dash: { file: 'Run.png', frames: 8, fps: 16 },
        die: { file: 'Dead.png', frames: 3, fps: 6 }
      }
    };

    this.particles = [];
    this.screenFlash = { active: false, alpha: 0, color: '#ffffff', duration: 0, timer: 0 };
    this.screenShake = { intensity: 0, duration: 0, elapsed: 0, x: 0, y: 0 };
    this.maxParticles = 300;

    this.setupCanvas();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    this.resize(window.innerWidth, window.innerHeight);

    this.debugHitboxes = false;
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyH') {
        this.debugHitboxes = !this.debugHitboxes;
      }
    });
  }

  async loadShinobiSprites() {
    try {
      await Promise.all([
        this.loadCharacterSheet(1, '/assets/shinobi-sprites/Shinobi/'),
        this.loadCharacterSheet(2, '/assets/shinobi-sprites/Samurai/')
      ]);
      this.spritesLoaded[1] = true;
      this.spritesLoaded[2] = true;
      console.log('[Renderer] Spritesheets loaded successfully');
    } catch (e) {
      console.warn('[Renderer] Failed to load spritesheets:', e);
    }
  }

  async loadCharacterSheet(fighterId, basePath) {
    const loadedFiles = {};
    const fileList = ['Idle.png', 'Walk.png', 'Run.png', 'Jump.png', 'Attack_1.png', 'Attack_2.png', 'Attack_3.png', 'Shield.png', 'Hurt.png', 'Dead.png'];

    await Promise.all(fileList.map(fileName => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = `${basePath}${fileName}`;
        img.onload = () => {
          loadedFiles[fileName] = img;
          resolve();
        };
        img.onerror = () => {
          console.warn(`[Renderer] Could not load ${basePath}${fileName}`);
          resolve();
        };
      });
    }));

    this.shinobiSprites[fighterId] = loadedFiles;
  }

  setupCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;

    this.scaleX = width / this.referenceWidth;
    this.scaleY = height / this.referenceHeight;
    this.viewportWidth = this.referenceWidth;
    this.viewportHeight = this.referenceHeight;
  }

  handleResize() {
    this.resize(window.innerWidth, window.innerHeight);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  render() {
    this.clear();

    this.ctx.save();
    this.ctx.translate(-this.cameraX + this.screenShake.x, -this.cameraY + this.screenShake.y);
    this.ctx.scale(this.scaleX, this.scaleY);

    if (this.game?.stage) {
      this.game.stage.render(this.ctx, this);
    }

    this.drawFighter(1);
    this.drawFighter(2);
    this.drawParticles();
    this.ctx.restore();

    this.drawScreenFlash();
  }

  updateFighterAnimation(fighter, dt) {
    if (!fighter) return;

    const fighterId = fighter.id;
    const state = fighter.state || 'idle';

    // Reset timer when state changes
    if (this.fighterAnimationState[fighterId] !== state) {
      this.fighterAnimationState[fighterId] = state;
      this.fighterAnimationTimer[fighterId] = 0;
    }

    const charConfig = this.sheetConfig[fighterId] || this.sheetConfig[1];
    const conf = charConfig[state] || charConfig.idle;
    const cycleTime = 1 / conf.fps;

    this.fighterAnimationTimer[fighterId] += dt;
    if (this.fighterAnimationTimer[fighterId] >= cycleTime * conf.frames) {
      this.fighterAnimationTimer[fighterId] = 0;
    }
  }

  updateCamera(dt) {
    if (!this.game) return;

    const f1 = this.game.fighter1;
    const f2 = this.game.fighter2;
    if (!f1 || !f2) return;

    const midpoint = (f1.x + f1.width / 2 + f2.x + f2.width / 2) / 2;
    const targetX = midpoint - this.referenceWidth / 2;
    this.cameraX += (targetX - this.cameraX) * Math.min(1, dt * 8);
    this.cameraX = Math.max(0, Math.min(this.cameraX, 2000));
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.type === 'damage_number') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 80 * dt;
        p.life -= dt;
        p.alpha = Math.max(0, p.life / p.maxLife);
        if (p.life <= 0) this.particles.splice(i, 1);
        continue;
      }

      // Slash fades in place
      if (p.type === 'slash') {
        p.life -= dt;
        p.alpha = Math.max(0, p.life / p.maxLife);
        if (p.life <= 0) this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.97;
      p.vy *= 0.97;
      if (p.gravity) p.vy += p.gravity * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / (p.maxLife || 1));

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  shakeCamera(intensity, duration) {
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
    this.screenShake.elapsed = 0;
    this.screenShake.x = (Math.random() - 0.5) * intensity;
    this.screenShake.y = (Math.random() - 0.5) * intensity;
  }

  flashScreen(color, duration) {
    this.screenFlash = {
      active: true,
      alpha: 0.8,
      color,
      duration,
      timer: duration
    };
  }

  triggerScreenFlash(color, duration) {
    this.flashScreen(color, duration);
  }

  addParticle(x, y, color, velocity, life, size, type = 'circle', extra = {}) {
    if (this.particles.length >= this.maxParticles) {
      // Remove oldest non-damage-number particle
      const idx = this.particles.findIndex(p => p.type !== 'damage_number');
      if (idx >= 0) this.particles.splice(idx, 1);
      else this.particles.shift();
    }
    this.particles.push({
      x,
      y,
      color,
      vx: velocity?.x ?? 0,
      vy: velocity?.y ?? 0,
      life,
      maxLife: life,
      size,
      alpha: 1,
      type,
      ...extra
    });
  }

  addSlash(x, y, angle, length, color, thickness = 6, life = 0.25) {
    this.particles.push({
      type: 'slash',
      x,
      y,
      angle,
      length,
      color,
      thickness,
      life,
      maxLife: life,
      alpha: 1
    });
  }

  addDamageNumber(x, y, damage, isCrit = false) {
    this.particles.push({
      type: 'damage_number',
      x: x + (Math.random() - 0.5) * 20,
      y: y - 20,
      vx: (Math.random() - 0.5) * 40,
      vy: -120,
      text: damage.toString(),
      isCrit,
      life: 0.8,
      maxLife: 0.8,
      alpha: 1
    });
  }

  drawFighter(fighterId) {
    const fighter = this.game?.['fighter' + fighterId];
    if (!fighter) return;

    const state = fighter.state || 'idle';
    const charConfig = this.sheetConfig[fighterId] || this.sheetConfig[1];
    const conf = charConfig[state] || charConfig.idle;
    const facing = fighter.facing || 1;
    const centerX = fighter.x + fighter.width / 2;
    const bottomY = fighter.y + fighter.height;

    this.updateFighterAnimation(fighter, 1/60);

    const sheetImg = this.shinobiSprites[fighterId]?.[conf.file];

    if (sheetImg && sheetImg.complete && sheetImg.naturalWidth > 0) {
      const frameIndex = Math.floor(this.fighterAnimationTimer[fighterId] * conf.fps) % conf.frames;
      const frameWidth = sheetImg.naturalWidth / conf.frames;
      const frameHeight = sheetImg.naturalHeight;

      const drawH = 128;
      const drawW = (frameWidth / frameHeight) * drawH;

      this.ctx.save();
      this.ctx.translate(centerX, bottomY);
      if (facing < 0) this.ctx.scale(-1, 1);

      this.ctx.drawImage(
        sheetImg,
        frameIndex * frameWidth, 0, frameWidth, frameHeight,
        -drawW / 2, -drawH, drawW, drawH
      );

      this.ctx.restore();

      // Debug hitboxes
      if (this.debugHitboxes) {
        if (fighter.hurtbox) this.drawHurtbox(fighter.hurtbox);
        if (fighter.hitboxActive && fighter.hitbox) this.drawHitbox(fighter.hitbox);
      }
      return;
    }

    // Fallback: draw colored rectangle
    this.ctx.save();
    this.ctx.fillStyle = fighter.color || (fighterId === 1 ? '#00E5FF' : '#FF3D00');
    this.ctx.fillRect(fighter.x, fighter.y, fighter.width, fighter.height);
    
    this.ctx.fillStyle = '#FFFFFF';
    const eyeX = facing === 1 ? fighter.x + fighter.width - 10 : fighter.x + 10;
    this.ctx.fillRect(eyeX, fighter.y + 10, 8, 8);
    this.ctx.restore();

    if (this.debugHitboxes) {
      if (fighter.hurtbox) this.drawHurtbox(fighter.hurtbox);
      if (fighter.hitboxActive && fighter.hitbox) this.drawHitbox(fighter.hitbox);
    }
  }

  drawParticles() {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      if (p.type === 'damage_number') continue;

      this.ctx.globalAlpha = p.alpha;

      if (p.type === 'slash') {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.angle);

        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = p.thickness;
        this.ctx.lineCap = 'round';

        const startAngle = -Math.PI / 4;
        const endAngle = Math.PI / 4;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.length, startAngle, endAngle);
        this.ctx.stroke();

        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = Math.max(1, p.thickness * 0.4);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.length, startAngle, endAngle);
        this.ctx.stroke();

        this.ctx.restore();
        continue;
      }

      if (p.type === 'shockwave') {
        const t = 1 - (p.life / p.maxLife);
        const radius = p.size + t * p.maxRadius;
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = Math.max(1, p.thickness * (1 - t * 0.7));
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, radius * 0.85, 0, Math.PI * 2);
        this.ctx.stroke();
        continue;
      }

      if (p.type === 'spark') {
        this.ctx.save();
        const trailLen = Math.min(25, Math.hypot(p.vx, p.vy) * 0.012);
        const angle = Math.atan2(p.vy, p.vx);
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(angle);

        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, Math.max(2, trailLen), Math.max(1, p.size * 0.5), 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, Math.max(0.5, p.size * 0.3), 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
        continue;
      }

      if (p.type === 'flare') {
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        continue;
      }

      // Default circle
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();

    // Damage numbers (drawn without composite lighter)
    for (const p of this.particles) {
      if (p.type !== 'damage_number') continue;
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.font = (p.isCrit ? 'bold 30px ' : 'bold 20px ') + 'sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(p.text, p.x, p.y);

      this.ctx.fillStyle = p.isCrit ? '#FFD700' : '#FFFFFF';
      this.ctx.fillText(p.text, p.x, p.y);
      this.ctx.restore();
    }
  }

  drawScreenFlash() {
    if (this.screenFlash.active) {
      const dt = 1 / 60;
      this.screenFlash.timer -= dt * 1000;
      this.screenFlash.alpha = 0.6 * Math.max(0, this.screenFlash.timer / this.screenFlash.duration);

      if (this.screenFlash.timer <= 0) {
        this.screenFlash.active = false;
      }

      if (this.screenFlash.active) {
        this.ctx.save();
        this.ctx.globalAlpha = this.screenFlash.alpha;
        this.ctx.fillStyle = this.screenFlash.color;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.restore();
      }
    }
  }

  drawHitbox(hitbox) {
    if (!hitbox) return;
    this.ctx.save();
    this.ctx.strokeStyle = '#FF0000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    this.ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    this.ctx.restore();
  }

  drawHurtbox(hurtbox) {
    if (!hurtbox) return;
    this.ctx.save();
    this.ctx.strokeStyle = '#00FF00';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(hurtbox.x, hurtbox.y, hurtbox.width, hurtbox.height);
    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
    this.ctx.fillRect(hurtbox.x, hurtbox.y, hurtbox.width, hurtbox.height);
    this.ctx.restore();
  }
}
