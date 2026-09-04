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

    // Values below are refined by Stage via syncArenaBounds().
    this.desiredZoomOut = 0;

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
    this.afterimages = [];
    this.maxAfterimages = 20;
    this.screenFlash = { active: false, alpha: 0, color: '#ffffff', duration: 0, timer: 0 };
    this.screenShake = { magnitude: 0, duration: 0, elapsed: 0, x: 0, y: 0, rot: 0 };
    this.maxParticles = 700;

    // Impact juice: zoom punch, radial impact flash, vignette pulse
    this.zoom = { amount: 0, duration: 0, elapsed: 0 };
    this.zoomScale = 1;
    this.impactFlash = { active: false, x: 0, y: 0, maxRadius: 0, duration: 0, timer: 0, color: '#ffffff' };
    this.vignette = { active: false, color: '#ff2d2d', duration: 0, timer: 0, strength: 0, alpha: 0 };

    // Per-fighter body flash when struck
    this.hitFlash = {
      1: { timer: 0, max: 1 },
      2: { timer: 0, max: 1 }
    };

    // 0 = normal, 1 = fully "slow-mo" look (desaturated + darkened edges).
    this.slowMo = 0;

    // Tinted sprite cache for afterimages / hit flash
    this.tintCache = new Map();

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

  syncArenaBounds(stage) {
    if (!stage) return;
    this.arenaLeft = stage.arenaLeft ?? this.arenaLeft;
    this.arenaRight = stage.arenaRight ?? this.arenaRight;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  render() {
    this.clear();

    // Zoom punch is applied around the viewport centre so the camera framing
    // stays predictable while the picture snaps in on impact.
    const zoom = this.zoomScale || 1;
    const cx = this.width / 2;
    const cy = this.height / 2;

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.scale(this.scaleX * zoom, this.scaleY * zoom);
    this.ctx.rotate(this.screenShake.rot);
    this.ctx.translate(-this.referenceWidth / 2, -this.referenceHeight / 2);
    this.ctx.translate(-this.cameraX + this.screenShake.x, -this.cameraY + this.screenShake.y);

    if (this.game?.stage) {
      this.game.stage.render(this.ctx, this);
    }

    // Ghosts sit behind the live fighters
    this.drawAfterimages();

    this.drawFighter(1);
    this.drawFighter(2);
    this.drawParticles();
    this.ctx.restore();

    this.drawImpactFlash();
    this.drawScreenFlash();
    this.drawVignette();
    this.drawSlowMoGrade();
  }

  // Desaturates + darkens the frame during hit pause. Sells "time slowed".
  drawSlowMoGrade() {
    if (!this.slowMo || this.slowMo <= 0.01) return;

    const a = this.slowMo;
    this.ctx.save();

    // Grey wash pulls colour out of the whole picture.
    this.ctx.globalCompositeOperation = 'saturation';
    this.ctx.globalAlpha = a * 0.75;
    this.ctx.fillStyle = '#808080';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Cool tint on top so it reads as "impact", not just "grey".
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = a * 0.16;
    this.ctx.fillStyle = '#0A1030';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.restore();
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
    const f1 = this.game?.fighter1;
    const f2 = this.game?.fighter2;
    if (!f1 || !f2) return;

    // Frame both fighters: track the midpoint, and pull back / push in
    // based on how far apart they are so both stay comfortably in shot.
    const c1x = f1.x + f1.width / 2;
    const c2x = f2.x + f2.width / 2;
    const c1y = f1.y + f1.height / 2;
    const c2y = f2.y + f2.height / 2;

    const midX = (c1x + c2x) / 2;
    const midY = (c1y + c2y) / 2;
    const gap = Math.abs(c1x - c2x);

    const follow = Math.min(1, dt * 6);

    let targetX = midX - this.referenceWidth / 2;
    let targetY = midY - this.referenceHeight / 2 - 40;

    // Clamp so we never scroll past the arena edges.
    const maxX = this.arenaRight - this.referenceWidth;
    targetX = Math.max(this.arenaLeft, Math.min(targetX, maxX));

    // Vertical: mostly fixed, but follow jumps so fighters don't leave frame.
    targetY = Math.max(-260, Math.min(targetY, 120));

    this.cameraX += (targetX - this.cameraX) * follow;
    this.cameraY += (targetY - this.cameraY) * follow;

    // Keep a little extra room when fighters are far apart.
    this.desiredZoomOut = Math.min(0.12, Math.max(0, (gap - 600) / 6000));
  }

  // === FX UPDATE ============================================================
  // Drives every timed visual effect. Called once per gameplay frame.
  updateEffects(dt) {
    this.updateParticles(dt);
    this.updateAfterimages(dt);
    this.updateShake(dt);
    this.updateZoom(dt);
    this.updateImpactFlash(dt);
    this.updateVignette(dt);
    this.updateHitFlash(dt);

    if (this.screenFlash.active) {
      this.screenFlash.timer -= dt * 1000;
      if (this.screenFlash.timer <= 0) this.screenFlash.active = false;
    }
  }

  // Smooth noise-ish oscillation for organic shake / punch motion
  oscillate(seed, freq, t) {
    return Math.sin(t * freq + seed) * Math.sin(t * freq * 0.37 + seed * 2.1);
  }

  updateShake(dt) {
    const s = this.screenShake;
    if (s.duration <= 0) {
      s.x = 0; s.y = 0; s.rot = 0;
      return;
    }

    s.elapsed += dt;
    if (s.elapsed >= s.duration) {
      s.duration = 0;
      s.magnitude = 0;
      s.x = 0; s.y = 0; s.rot = 0;
      return;
    }

    // Decay over the whole duration, with a violent initial spike
    const t = s.elapsed / s.duration;
    const decay = Math.pow(1 - t, 2);
    const amp = s.magnitude * decay;

    const time = s.elapsed * 1000;
    s.x = Math.sin(time * 0.09 + 1.7) * amp;
    s.y = Math.cos(time * 0.13 + 0.4) * amp * 0.8;
    s.rot = Math.sin(time * 0.07 + 2.3) * amp * 0.0016;
  }

  updateZoom(dt) {
    const z = this.zoom;
    if (z.duration <= 0) {
      this.zoomScale = 1;
      return;
    }

    z.elapsed += dt;
    if (z.elapsed >= z.duration) {
      z.duration = 0;
      this.zoomScale = 1;
      return;
    }

    // Fast punch in, smooth ease out
    const t = z.elapsed / z.duration;
    const curve = t < 0.2
      ? (t / 0.2)                       // snap in
      : Math.pow(1 - (t - 0.2) / 0.8, 2); // ease back out
    this.zoomScale = 1 + z.amount * curve;
  }

  updateImpactFlash(dt) {
    const f = this.impactFlash;
    if (!f.active) return;

    f.timer += dt;
    if (f.timer >= f.duration) {
      f.active = false;
      return;
    }

    const t = f.timer / f.duration;
    // Ease-out expansion
    f.radius = f.maxRadius * (1 - Math.pow(1 - t, 3));
    f.alpha = Math.pow(1 - t, 1.6);
  }

  updateVignette(dt) {
    const v = this.vignette;
    if (!v.active) return;

    v.timer += dt;
    if (v.timer >= v.duration) {
      v.active = false;
      return;
    }

    const t = v.timer / v.duration;
    v.alpha = Math.pow(1 - t, 2) * v.strength;
  }

  updateHitFlash(dt) {
    for (const id of [1, 2]) {
      const hf = this.hitFlash[id];
      if (hf.timer <= 0) continue;
      hf.timer = Math.max(0, hf.timer - dt);
    }
  }

  updateAfterimages(dt) {
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      const a = this.afterimages[i];
      a.life -= dt;
      if (a.life <= 0) {
        this.afterimages.splice(i, 1);
        continue;
      }
      a.alpha = (a.life / a.maxLife) * a.strength;
    }
  }

  // === AFTERIMAGES ==========================================================
  // Captures the fighter's current sprite frame as a flat silhouette.
  addAfterimage(fighter, { color = '#FFFFFF', life = 0.22, strength = 0.55, offset = 0 } = {}) {
    if (!fighter) return;
    if (this.afterimages.length >= this.maxAfterimages) this.afterimages.shift();

    const fighterId = fighter.id;
    const state = fighter.state || 'idle';
    const charConfig = this.sheetConfig[fighterId] || this.sheetConfig[1];
    const conf = charConfig[state] || charConfig.idle;
    const sheetImg = this.shinobiSprites[fighterId]?.[conf.file];

    let frame = null;
    if (sheetImg && sheetImg.complete && sheetImg.naturalWidth > 0) {
      const frameWidth = sheetImg.naturalWidth / conf.frames;
      const frameHeight = sheetImg.naturalHeight;
      const frameIndex = Math.floor(this.fighterAnimationTimer[fighterId] * conf.fps) % conf.frames;
      frame = { img: sheetImg, sx: frameIndex * frameWidth, sy: 0, sw: frameWidth, sh: frameHeight };
    }

    this.afterimages.push({
      fighterId,
      facing: fighter.facing || 1,
      x: fighter.x - (fighter.facing === 1 ? offset : -offset),
      y: fighter.y,
      height: fighter.height,
      color,
      life,
      maxLife: life,
      alpha: strength,
      strength,
      frame
    });
  }

  drawAfterimages() {
    if (this.afterimages.length === 0) return;

    this.ctx.save();

    for (const a of this.afterimages) {
      const centerX = a.x + 56 / 2;
      const bottomY = a.y + a.height;

      if (a.frame) {
        const drawH = 128;
        const drawW = (a.frame.sw / a.frame.sh) * drawH;

        const tinted = this.getTintedFrame(
          a.frame.img,
          a.frame.sx, a.frame.sy, a.frame.sw, a.frame.sh,
          a.color,
          0.6
        );

        this.ctx.save();
        this.ctx.globalAlpha = a.alpha;
        this.ctx.translate(centerX, bottomY);
        if (a.facing < 0) this.ctx.scale(-1, 1);

        // Pre-tinted ghost: no source-atop, so the stage underneath is safe.
        const src = tinted || a.frame.img;
        const sx = tinted ? 0 : a.frame.sx;
        const sy = tinted ? 0 : a.frame.sy;
        const sw = tinted ? tinted.width : a.frame.sw;
        const sh = tinted ? tinted.height : a.frame.sh;
        this.ctx.drawImage(src, sx, sy, sw, sh, -drawW / 2, -drawH, drawW, drawH);

        this.ctx.restore();
      } else {
        // Fallback ghost box
        this.ctx.save();
        this.ctx.globalAlpha = a.alpha * 0.7;
        this.ctx.fillStyle = a.color;
        this.ctx.fillRect(a.x, a.y, 56, a.height);
        this.ctx.restore();
      }
    }

    this.ctx.restore();
  }

  // === IMPACT FX TRIGGERS ===================================================
  // One call that fires the full "juice" package for an impact.
  impact({
    x = 0,
    y = 0,
    shake = 6,
    shakeDuration = 0.22,
    zoom = 0,
    zoomDuration = 0.18,
    flashColor = '#FFFFFF',
    flashRadius = 0,
    flashDuration = 0.2,
    vignetteColor = null,
    vignetteStrength = 0,
    vignetteDuration = 0,
    screenFlashColor = null,
    screenFlashDuration = 0
  } = {}) {
    if (shake > 0) this.shake(shake, shakeDuration);

    if (zoom !== 0) {
      this.zoom.amount = zoom;
      this.zoom.duration = zoomDuration;
      this.zoom.elapsed = 0;
    }

    if (flashRadius > 0) {
      this.impactFlash = {
        active: true,
        x,
        y,
        radius: 0,
        maxRadius: flashRadius,
        duration: flashDuration,
        timer: 0,
        alpha: 1,
        color: flashColor
      };
    }

    if (vignetteColor && vignetteDuration > 0) {
      this.vignette = {
        active: true,
        color: vignetteColor,
        duration: vignetteDuration,
        timer: 0,
        strength: vignetteStrength,
        alpha: vignetteStrength
      };
    }

    if (screenFlashColor && screenFlashDuration > 0) {
      this.flashScreen(screenFlashColor, screenFlashDuration);
    }
  }

  // Backwards-compatible alias
  shakeCamera(intensity, duration) {
    this.shake(intensity, duration / 1000);
  }

  shake(magnitude, duration = 0.25) {
    // Blend instead of overwrite so rapid hits stack up
    this.screenShake.magnitude = Math.max(this.screenShake.magnitude * 0.6, magnitude);
    this.screenShake.duration = Math.max(this.screenShake.duration * 0.4, duration);
    this.screenShake.elapsed = 0;
  }

  // Fighter body flash on being hit
  flashFighter(fighterId, duration = 0.16) {
    this.hitFlash[fighterId].timer = duration;
    this.hitFlash[fighterId].max = duration;
  }

  // 0 = real time, 1 = deep slow motion. Drives the colour grade overlay.
  setSlowMo(amount) {
    this.slowMo = Math.max(0, Math.min(1, amount));
  }

  // Returns a cached, pre-tinted copy of a sprite frame.
  //
  // Tinting MUST happen on an offscreen canvas. Doing `source-atop` +
  // `fillRect` directly on the main canvas would recolour every pixel already
  // drawn underneath (i.e. the whole stage), not just the sprite.
  getTintedFrame(img, sx, sy, sw, sh, color, alpha = 1) {
    if (typeof document === 'undefined') return null;

    const a = Math.round(Math.max(0, Math.min(1, alpha)) * 20) / 20;
    const key = `${img.src}|${sx}|${sy}|${sw}|${sh}|${color}|${a}`;

    const cached = this.tintCache.get(key);
    if (cached) return cached;

    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.floor(sw));
    c.height = Math.max(1, Math.floor(sh));

    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = a;
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);

    // Frames x colours x alpha can grow fast; keep the cache bounded.
    if (this.tintCache.size > 240) this.tintCache.clear();
    this.tintCache.set(key, c);
    return c;
  }

  // Central place where all particle types advance.
  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      switch (p.type) {
        case 'damage_number': {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 80 * dt;

          // Pop-in: snap past full size, settle, then shrink out at the end.
          const t = 1 - p.life / p.maxLife;
          const pop = t < 0.18
            ? 0.4 + (t / 0.18) * 1.05          // overshoot to ~1.45x
            : 1.45 - ((t - 0.18) / 0.82) * 0.45; // ease down to ~1x
          p.scale = p.maxScale * pop;
          p.alpha = Math.min(1, p.life / (p.maxLife * 0.45));
          break;
        }

        case 'slash':
          // Trail sweeps across its arc while fading
          p.progress = 1 - (p.life / p.maxLife);
          p.alpha = Math.pow(1 - p.progress, 1.4);
          break;

        case 'cross_slash':
          p.progress = 1 - (p.life / p.maxLife);
          p.alpha = Math.min(1, Math.pow(p.progress / 0.25, 0.5)) * Math.pow(1 - p.progress, 1.2);
          break;

        case 'shockwave': {
          p.progress = 1 - (p.life / p.maxLife);
          // size/radius may be missing on externally-pushed particles.
          const base = Number.isFinite(p.size) ? p.size : 6;
          p.size = base;
          p.radius = base + Math.pow(p.progress, 0.55) * (p.maxRadius || 0);
          p.alpha = Math.pow(1 - p.progress, 1.5);
          break;
        }

        case 'speedline': {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          const t = 1 - p.life / p.maxLife;
          // quick fade in, long fade out
          p.alpha = Math.min(1, t * 8) * Math.pow(p.life / p.maxLife, 0.7);
          break;
        }

        case 'debris':
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += p.gravity * dt;
          p.rot += p.spin * dt;
          p.alpha = Math.min(1, p.life / (p.maxLife * 0.4));
          break;

        case 'spirit':
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy -= 60 * dt; // wisps rise
          p.vx *= 0.98;
          p.rot += p.spin * dt;
          p.alpha = Math.pow(p.life / p.maxLife, 0.8);
          break;

        default:
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.97;
          p.vy *= 0.97;
          if (p.gravity) p.vy += p.gravity * dt;
          p.alpha = Math.max(0, p.life / (p.maxLife || 1));
          break;
      }
    }
  }

  flashScreen(color, duration) {
    // duration in ms (legacy signature)
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

  // Sweeping crescent blade trail. The arc reveals itself over its lifetime
  // instead of being drawn statically, which reads much better.
  addSlash(x, y, angle, length, color, thickness = 6, life = 0.25, extra = {}) {
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
      progress: 0,
      alpha: 1,
      arc: extra.arc ?? Math.PI * 0.62,
      spin: extra.spin ?? 0
    });
  }

  // Cross-shaped double slash for heavy finishers.
  addCrossSlash(x, y, color, size = 70, thickness = 10, life = 0.26, angle = 0) {
    this.particles.push({
      type: 'cross_slash',
      x,
      y,
      color,
      length: size,
      thickness,
      life,
      maxLife: life,
      angle,
      progress: 0,
      alpha: 1
    });
  }

  // Horizontal streaks that sell attack momentum.
  addSpeedLines(x, y, dirX, count = 8, color = '#FFFFFF', spread = 160) {
    for (let i = 0; i < count; i++) {
      const oy = (Math.random() - 0.5) * spread;
      const len = 40 + Math.random() * 90;
      const life = 0.12 + Math.random() * 0.1;
      this.particles.push({
        type: 'speedline',
        x: x - dirX * (20 + Math.random() * 90),
        y: y + oy,
        color,
        length: len,
        thickness: 1 + Math.random() * 2.5,
        vx: dirX * (500 + Math.random() * 700),
        vy: (Math.random() - 0.5) * 40,
        life,
        maxLife: life,
        alpha: 1
      });
    }
  }

  // Tumbling shards with rotation — much chunkier than plain circles.
  addDebris(x, y, color, count = 6, baseAngle = -Math.PI / 2, spread = Math.PI * 0.9, speed = 240) {
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * spread;
      const s = speed * (0.5 + Math.random() * 0.9);
      const life = 0.45 + Math.random() * 0.35;
      this.particles.push({
        type: 'debris',
        x,
        y,
        color,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        gravity: 900,
        size: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 22,
        life,
        maxLife: life,
        alpha: 1
      });
    }
  }

  // Rising flame/chi wisps for specials.
  addSpirits(x, y, color, count = 10, spread = 60) {
    for (let i = 0; i < count; i++) {
      const life = 0.5 + Math.random() * 0.5;
      this.particles.push({
        type: 'spirit',
        x: x + (Math.random() - 0.5) * spread,
        y: y + (Math.random() - 0.5) * spread * 0.6,
        color,
        vx: (Math.random() - 0.5) * 70,
        vy: -60 - Math.random() * 120,
        size: 4 + Math.random() * 8,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 6,
        life,
        maxLife: life,
        alpha: 1
      });
    }
  }

  addDamageNumber(x, y, damage, isCrit = false) {
    if (this.particles.length >= this.maxParticles) {
      return;
    }

    // Pop-in: overshoot slightly then settle, so heavy hits read instantly.
    this.particles.push({
      type: 'damage_number',
      x: x + (Math.random() - 0.5) * 20,
      y: y - 20,
      vx: (Math.random() - 0.5) * 40,
      vy: -120,
      text: damage.toString(),
      isCrit,
      life: 0.85,
      maxLife: 0.85,
      scale: isCrit ? 0.4 : 0.6,
      maxScale: isCrit ? 1.7 : 1.15,
      alpha: 1
    });
  }

  // Expanding ring. `maxRadius` grows with impact strength.
  addShockwave(x, y, color, maxRadius = 60, thickness = 4, life = 0.28, delay = 0) {
    const spawn = () => {
      const r0 = 6;
      this.particles.push({
        type: 'shockwave',
        x,
        y,
        color,
        size: r0,
        radius: r0,
        maxRadius,
        thickness,
        life,
        maxLife: life,
        progress: 0,
        alpha: 1
      });
    };

    if (delay > 0) setTimeout(spawn, delay);
    else spawn();
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

      const flash = this.hitFlash[fighterId];
      const flashAmount = flash.max > 0 ? flash.timer / flash.max : 0;

      this.ctx.save();
      this.ctx.translate(centerX, bottomY);
      if (facing < 0) this.ctx.scale(-1, 1);

      if (flashAmount > 0) {
        // Draw the sprite normally, then overlay a pre-tinted copy of just
        // that frame. Tinting on the main canvas would bleed onto the stage.
        this.ctx.drawImage(
          sheetImg,
          frameIndex * frameWidth, 0, frameWidth, frameHeight,
          -drawW / 2, -drawH, drawW, drawH
        );

        const tinted = this.getTintedFrame(
          sheetImg,
          frameIndex * frameWidth, 0, frameWidth, frameHeight,
          '#FFFFFF',
          0.85 * flashAmount
        );
        if (tinted) {
          this.ctx.drawImage(tinted, -drawW / 2, -drawH, drawW, drawH);
        }
      } else {
        this.ctx.drawImage(
          sheetImg,
          frameIndex * frameWidth, 0, frameWidth, frameHeight,
          -drawW / 2, -drawH, drawW, drawH
        );
      }

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

      // Guard: a single malformed particle must never take down the frame.
      // (A non-finite value here used to throw inside createRadialGradient.)
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;

      this.ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

      switch (p.type) {
        case 'slash':
          this.drawSlashParticle(p);
          continue;

        case 'cross_slash':
          this.drawCrossSlash(p);
          continue;

        case 'shockwave':
          this.drawShockwave(p);
          continue;

        case 'speedline':
          this.drawSpeedLine(p);
          continue;

        case 'debris':
          this.drawDebris(p);
          continue;

        case 'spirit':
          this.drawSpirit(p);
          continue;

        case 'spark':
          this.drawSpark(p);
          continue;

        case 'flare':
          this.drawFlare(p);
          continue;

        default:
          this.ctx.fillStyle = p.color;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fill();
          continue;
      }
    }

    this.ctx.restore();

    // Damage numbers (drawn without composite lighter)
    for (const p of this.particles) {
      if (p.type !== 'damage_number') continue;
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      const scale = p.scale ?? 1;
      this.ctx.translate(p.x, p.y);
      this.ctx.scale(scale, scale);
      this.ctx.font = (p.isCrit ? 'bold 30px ' : 'bold 20px ') + 'sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // Dark outline first so the number reads on any background.
      this.ctx.lineJoin = 'round';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 5;
      this.ctx.strokeText(p.text, 0, 0);

      if (p.isCrit) {
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 14;
      }
      this.ctx.fillStyle = p.isCrit ? '#FFD700' : '#FFFFFF';
      this.ctx.fillText(p.text, 0, 0);
      this.ctx.restore();
    }
  }

  // Crescent trail: thick coloured outer arc + white hot inner core, revealed
  // progressively so it looks like the blade actually swept through.
  drawSlashParticle(p) {
    const arc = p.arc ?? Math.PI * 0.62;
    const sweep = Math.min(1, p.progress / 0.55);
    const fadeOut = 1 - Math.max(0, (p.progress - 0.55) / 0.45);
    const start = -arc / 2;
    const end = start + arc * sweep;
    if (end <= start) return;

    const scale = 0.85 + p.progress * 0.35;

    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.angle);
    this.ctx.scale(scale, scale);
    this.ctx.lineCap = 'round';

    // Outer glow
    this.ctx.globalAlpha = p.alpha * 0.45 * fadeOut;
    this.ctx.strokeStyle = p.color;
    this.ctx.lineWidth = p.thickness * 2.1;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, p.length, start, end);
    this.ctx.stroke();

    // Core body
    this.ctx.globalAlpha = p.alpha * fadeOut;
    this.ctx.strokeStyle = p.color;
    this.ctx.lineWidth = p.thickness;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, p.length, start, end);
    this.ctx.stroke();

    // White hot inner edge
    this.ctx.globalAlpha = p.alpha * 0.9 * fadeOut;
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = Math.max(1, p.thickness * 0.35);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, p.length, start + 0.05, end - 0.05);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawCrossSlash(p) {
    const t = p.progress;
    const len = p.length * (0.7 + t * 0.5);

    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.angle);
    this.ctx.lineCap = 'round';

    for (const dir of [1, -1]) {
      this.ctx.save();
      this.ctx.rotate(dir * Math.PI / 4);

      this.ctx.globalAlpha = p.alpha * 0.5;
      this.ctx.strokeStyle = p.color;
      this.ctx.lineWidth = p.thickness * 1.9;
      this.ctx.beginPath();
      this.ctx.moveTo(-len, 0);
      this.ctx.lineTo(len, 0);
      this.ctx.stroke();

      this.ctx.globalAlpha = p.alpha;
      this.ctx.strokeStyle = p.color;
      this.ctx.lineWidth = p.thickness * 0.7;
      this.ctx.beginPath();
      this.ctx.moveTo(-len, 0);
      this.ctx.lineTo(len, 0);
      this.ctx.stroke();

      this.ctx.globalAlpha = p.alpha * 0.85;
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = Math.max(1, p.thickness * 0.25);
      this.ctx.beginPath();
      this.ctx.moveTo(-len * 0.8, 0);
      this.ctx.lineTo(len * 0.8, 0);
      this.ctx.stroke();

      this.ctx.restore();
    }

    this.ctx.restore();
  }

  drawShockwave(p) {
    const r = p.radius ?? (p.size + p.maxRadius * p.progress);
    const t = p.progress;

    this.ctx.save();
    this.ctx.globalAlpha = p.alpha;

    // Main ring
    this.ctx.strokeStyle = p.color;
    this.ctx.lineWidth = Math.max(1, p.thickness * (1 - t * 0.8));
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    this.ctx.stroke();

    // Inner white ring, offset slightly for a double-ring read
    this.ctx.globalAlpha = p.alpha * 0.7;
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = Math.max(0.5, p.thickness * 0.3 * (1 - t));
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, r * 0.82, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawSpeedLine(p) {
    const angle = Math.atan2(p.vy, p.vx);
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(angle);

    const grad = this.ctx.createLinearGradient(-p.length, 0, p.length, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(1, p.color);

    this.ctx.strokeStyle = grad;
    this.ctx.lineWidth = p.thickness;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(-p.length, 0);
    this.ctx.lineTo(p.length * 0.2, 0);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawDebris(p) {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rot);

    this.ctx.fillStyle = p.color;
    this.ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(-p.size * 0.4, -p.size * 0.25, p.size * 0.8, p.size * 0.5);

    this.ctx.restore();
  }

  drawSpirit(p) {
    const t = 1 - p.life / p.maxLife;
    const r = p.size * (1 + t * 0.8);

    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rot);

    const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.4, p.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, r * 0.6, r, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawSpark(p) {
    this.ctx.save();
    const trailLen = Math.min(30, Math.hypot(p.vx, p.vy) * 0.014);
    const angle = Math.atan2(p.vy, p.vx);
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(angle);

    this.ctx.fillStyle = p.color;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, Math.max(2, trailLen), Math.max(1, p.size * 0.5), 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, Math.max(0.5, p.size * 0.35), 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawFlare(p) {
    const t = 1 - p.life / p.maxLife;
    const r = p.size * (1 - t * 0.55);
    if (!Number.isFinite(r) || r <= 0) return;

    const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.35, p.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, Math.max(1, r), 0, Math.PI * 2);
    this.ctx.fill();

    // Pulsing 4-point star over the burst
    this.ctx.save();
    this.ctx.globalAlpha *= 0.8 * (1 - t);
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = Math.max(1, p.size * 0.12);
    this.ctx.lineCap = 'round';
    const spike = p.size * (1.2 + t * 2.2);
    this.ctx.beginPath();
    this.ctx.moveTo(p.x - spike, p.y);
    this.ctx.lineTo(p.x + spike, p.y);
    this.ctx.moveTo(p.x, p.y - spike);
    this.ctx.lineTo(p.x, p.y + spike);
    this.ctx.stroke();
    this.ctx.restore();
  }

  // Radial white flash blooming out of the impact point.
  drawImpactFlash() {
    const f = this.impactFlash;
    if (!f.active || !Number.isFinite(f.radius) || f.radius <= 0) return;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    this.ctx.globalAlpha = Math.min(1, f.alpha);

    const grad = this.ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
    grad.addColorStop(0, f.color);
    grad.addColorStop(0.45, f.color);
    grad.addColorStop(1, 'rgba(255,255,255,0)');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  // Colour pulse around the screen edges — sells heavy hits without
  // washing the whole picture out the way a full flash does.
  drawVignette() {
    const v = this.vignette;
    if (!v.active || v.alpha <= 0) return;

    this.ctx.save();
    const w = this.width;
    const h = this.height;
    const inner = Math.min(w, h) * 0.32;
    const outer = Math.hypot(w, h) * 0.62;

    const grad = this.ctx.createRadialGradient(w / 2, h / 2, inner, w / 2, h / 2, outer);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, v.color);

    this.ctx.globalAlpha = Math.min(0.85, v.alpha);
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.restore();
  }

  drawScreenFlash() {
    if (!this.screenFlash.active) return;

    // Timer is advanced in updateEffects; this only draws.
    const ratio = Math.max(0, this.screenFlash.timer / this.screenFlash.duration);
    if (ratio <= 0) return;

    this.ctx.save();
    this.ctx.globalAlpha = 0.6 * ratio;
    this.ctx.fillStyle = this.screenFlash.color;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
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
