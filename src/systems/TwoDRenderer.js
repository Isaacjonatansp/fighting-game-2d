// 2D Pixel Art Renderer for Fighting Game
export class TwoDRenderer {
  constructor(config) {
    this.config = config;
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.width = config.width;
    this.height = config.height;
    
    // Reference dimensions
    this.referenceWidth = 1280;
    this.referenceHeight = 720;
    
    // Scale factors
    this.scaleX = 1;
    this.scaleY = 1;
    
    // Camera/viewport
    this.cameraX = 0;
    this.cameraY = 0;
    this.viewportWidth = this.referenceWidth;
    this.viewportHeight = this.referenceHeight;
    
    // Arena bounds in game coordinates
    this.arenaLeft = 0;
    this.arenaRight = this.referenceWidth;
    this.groundY = config.groundY;
    
    // Character sprite data
    this.characterSprites = {};
    this.characterAnimations = {};
    this.fighterSprites = { 1: null, 2: null };
    this.fighterAnimationState = { 1: 'idle', 2: 'idle' };
    this.fighterAnimationFrame = { 1: 0, 2: 0 };
    this.fighterAnimationTimer = { 1: 0, 2: 0 };
    
    // Animation frame rates (frames per second)
    this.animationFPS = {
      idle: 6,
      walk: 10,
      run: 12,
      jump: 8,
      fall: 8,
      attack: 15,
      heavyAttack: 12,
      special: 10,
      airAttack: 12,
      crouchAttack: 12,
      block: 4,
      hit: 8,
      dash: 15,
      die: 4
    };
    
    // Frame counts for each animation
    this.animationFrameCounts = {
      idle: 4,
      walk: 6,
      run: 6,
      jump: 3,
      fall: 2,
      attack: 6,
      heavyAttack: 7,
      special: 8,
      airAttack: 5,
      crouchAttack: 5,
      block: 3,
      hit: 3,
      dash: 5,
      die: 4
    };
    
    // Particle system
    this.particles = [];
    this.screenFlash = { active: false, alpha: 0, color: '#ffffff', duration: 0, timer: 0 };
    this.screenShake = { intensity: 0, duration: 0, elapsed: 0, x: 0, y: 0 };
    
    // Initialize
    this.generateCharacterSprites();
    this.setupCanvas();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    this.resize(window.innerWidth, window.innerHeight);
  }
  
  setupCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false; // Pixel art look
  }
  
  generateCharacterSprites() {
    // Color schemes for different characters
    const colorSchemes = {
      crimson: { // Player 1 - Red/Orange
        skin: '#ffccaa',
        hair: '#ff6600',
        shirt: '#cc3333',
        pants: '#333366',
        shoes: '#111111',
        outline: '#882222'
      },
      azure: { // Player 2 - Blue
        skin: '#ffccaa',
        hair: '#4444ff',
        shirt: '#3366cc',
        pants: '#112244',
        shoes: '#111111',
        outline: '#223366'
      }
    };
    
    // Generate sprites for each character type
    for (const [charName, colors] of Object.entries(colorSchemes)) {
      this.characterSprites[charName] = {};
      this.characterAnimations[charName] = {};
      
      for (const [animName, frameCount] of Object.entries(this.animationFrameCounts)) {
        const frames = [];
        for (let frame = 0; frame < frameCount; frame++) {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 128;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = false;
          
          this.drawCharacterFrame(ctx, colors, animName, frame, frameCount);
          frames.push(canvas);
        }
        this.characterSprites[charName][animName] = frames;
      }
    }
  }
  
  drawCharacterFrame(ctx, colors, animName, frameIndex, frameCount) {
    const w = 64;
    const h = 128;
    const cx = w / 2;
    const cy = h / 2;
    
    // Animation offsets
    let bodyOffsetY = 0;
    let armOffset = 0;
    let legOffset = 0;
    let headOffset = 0;
    let lean = 0;
    
    const progress = frameIndex / Math.max(1, frameCount - 1);
    
    switch (animName) {
      case 'idle':
        bodyOffsetY = Math.sin(progress * Math.PI * 2) * 1;
        armOffset = Math.sin(progress * Math.PI * 2) * 1;
        headOffset = Math.sin(progress * Math.PI * 2) * 0.5;
        break;
      case 'walk':
        armOffset = Math.sin(progress * Math.PI * 2) * 6;
        legOffset = Math.sin(progress * Math.PI * 2) * 6;
        bodyOffsetY = Math.abs(Math.sin(progress * Math.PI * 2)) * 2;
        headOffset = Math.sin(progress * Math.PI * 2) * 1;
        break;
      case 'run':
        armOffset = Math.sin(progress * Math.PI * 2) * 10;
        legOffset = Math.sin(progress * Math.PI * 2) * 10;
        bodyOffsetY = Math.abs(Math.sin(progress * Math.PI * 2)) * 3;
        lean = Math.sin(progress * Math.PI * 2) * 3;
        break;
      case 'jump':
        if (frameIndex === 0) { armOffset = -8; legOffset = -4; lean = -5; }
        else if (frameIndex === 1) { armOffset = 0; legOffset = 0; lean = 0; }
        else { armOffset = 8; legOffset = 8; lean = 5; }
        break;
      case 'fall':
        armOffset = 5; legOffset = 3; lean = 2;
        break;
      case 'attack':
        const attackProgress = progress;
        if (attackProgress < 0.25) { 
          armOffset = -12 * (attackProgress / 0.25); 
          lean = -4 * (attackProgress / 0.25);
          legOffset = -3 * (attackProgress / 0.25);
          bodyOffsetY = -2 * (attackProgress / 0.25);
        }
        else if (attackProgress < 0.55) { 
          armOffset = 18 * ((attackProgress - 0.25) / 0.3); 
          lean = 6 * ((attackProgress - 0.25) / 0.3);
          legOffset = 8 * ((attackProgress - 0.25) / 0.3);
          bodyOffsetY = 1 * ((attackProgress - 0.25) / 0.3);
        }
        else { 
          armOffset = 18 * (1 - (attackProgress - 0.55) / 0.45); 
          lean = 6 * (1 - (attackProgress - 0.55) / 0.45);
          legOffset = 8 * (1 - (attackProgress - 0.55) / 0.45);
          bodyOffsetY = 1 * (1 - (attackProgress - 0.55) / 0.45);
        }
        break;
      case 'heavyAttack':
        const heavyProgress = progress;
        if (heavyProgress < 0.35) { 
          armOffset = -15 * (heavyProgress / 0.35); 
          lean = -6 * (heavyProgress / 0.35);
          legOffset = -5 * (heavyProgress / 0.35);
          bodyOffsetY = -3 * (heavyProgress / 0.35);
        }
        else if (heavyProgress < 0.65) { 
          armOffset = 25 * ((heavyProgress - 0.35) / 0.3); 
          lean = 10 * ((heavyProgress - 0.35) / 0.3);
          legOffset = 12 * ((heavyProgress - 0.35) / 0.3);
          bodyOffsetY = 2 * ((heavyProgress - 0.35) / 0.3);
        }
        else { 
          armOffset = 25 * (1 - (heavyProgress - 0.65) / 0.35); 
          lean = 10 * (1 - (heavyProgress - 0.65) / 0.35);
          legOffset = 12 * (1 - (heavyProgress - 0.65) / 0.35);
          bodyOffsetY = 2 * (1 - (heavyProgress - 0.65) / 0.35);
        }
        break;
      case 'special':
        const specialProgress = progress;
        if (specialProgress < 0.3) { 
          armOffset = -18 * (specialProgress / 0.3); 
          legOffset = -8 * (specialProgress / 0.3); 
          lean = -10 * (specialProgress / 0.3);
          bodyOffsetY = -4 * (specialProgress / 0.3);
        }
        else if (specialProgress < 0.6) { 
          armOffset = 30 * ((specialProgress - 0.3) / 0.3); 
          legOffset = 15 * ((specialProgress - 0.3) / 0.3); 
          lean = 12 * ((specialProgress - 0.3) / 0.3);
          bodyOffsetY = 3 * ((specialProgress - 0.3) / 0.3);
        }
        else { 
          armOffset = 30 * (1 - (specialProgress - 0.6) / 0.4); 
          legOffset = 15 * (1 - (specialProgress - 0.6) / 0.4); 
          lean = 12 * (1 - (specialProgress - 0.6) / 0.4);
          bodyOffsetY = 3 * (1 - (specialProgress - 0.6) / 0.4);
        }
        break;
      case 'airAttack':
        armOffset = Math.sin(progress * Math.PI) * 14;
        legOffset = Math.sin(progress * Math.PI) * 8;
        bodyOffsetY = Math.sin(progress * Math.PI) * 2;
        break;
      case 'crouchAttack':
        bodyOffsetY = 10;
        armOffset = Math.sin(progress * Math.PI) * 12;
        legOffset = Math.sin(progress * Math.PI) * 6;
        break;
      case 'block':
        armOffset = Math.sin(progress * Math.PI * 2) * 4;
        legOffset = Math.sin(progress * Math.PI * 2) * 2;
        bodyOffsetY = 3;
        break;
      case 'hit':
        if (frameIndex === 0) { lean = -12; armOffset = -10; legOffset = -5; headOffset = -6; bodyOffsetY = -2; }
        else if (frameIndex === 1) { lean = 8; armOffset = 8; legOffset = 4; headOffset = 4; bodyOffsetY = 1; }
        else { lean = -4; armOffset = -3; legOffset = -2; headOffset = -2; bodyOffsetY = -1; }
        break;
      case 'dash':
        lean = 15;
        armOffset = -10;
        legOffset = 15;
        bodyOffsetY = -6;
        break;
      case 'die':
        bodyOffsetY = progress * 20;
        lean = progress * 30;
        armOffset = progress * 10;
        legOffset = progress * 5;
        headOffset = progress * 15;
        break;
    }
    
    // Apply lean to all parts
    const leanRad = lean * Math.PI / 180;
    
    // Draw helper
    const drawRect = (x, y, width, height, fillColor, outlineColor = null) => {
      ctx.fillStyle = fillColor;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
      if (outlineColor) {
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
      }
    };
    
    const drawEllipse = (x, y, rx, ry, fillColor, outlineColor = null) => {
      ctx.beginPath();
      ctx.ellipse(Math.round(x), Math.round(y), Math.round(rx), Math.round(ry), 0, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      if (outlineColor) {
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };
    
    // Legs
    const legW = 10;
    const legH = 28;
    const legY = cy + 30 + bodyOffsetY;
    
    // Left leg - extended differently per attack type
    const leftLegX = cx - 12 + lean;
    drawRect(leftLegX - legW/2, legY, legW, legH + legOffset, colors.pants, colors.outline);
    drawRect(leftLegX - legW/2 - 1, legY + legH + legOffset, legW + 2, 6, colors.shoes, colors.outline);
    
    // Right leg
    const rightLegX = cx + 12 + lean;
    drawRect(rightLegX - legW/2, legY, legW, legH - legOffset, colors.pants, colors.outline);
    drawRect(rightLegX - legW/2 - 1, legY + legH - legOffset, legW + 2, 6, colors.shoes, colors.outline);
    
    // Special: forward kick with right leg
    if (animName === 'special' && progress > 0.3 && progress < 0.7) {
      const kickProgress = (progress - 0.3) / 0.4;
      const kickExtension = kickProgress * 22;
      drawRect(rightLegX - legW/2 + kickExtension, legY - 4, legW + 6, legH * 0.7, colors.pants, colors.outline);
      drawRect(rightLegX - legW/2 + kickExtension, legY - 4 + legH * 0.7, legW + 10, 8, colors.shoes, colors.outline);
    }
    
    // HeavyAttack: low stomp leg
    if (animName === 'heavyAttack' && progress > 0.35 && progress < 0.65) {
      const stompProgress = (progress - 0.35) / 0.3;
      const stompOffset = stompProgress * 10;
      drawRect(rightLegX - legW/2 + 4, legY + stompOffset, legW, legH, colors.pants, colors.outline);
      drawRect(rightLegX - legW/2 + 3, legY + legH + stompOffset, legW + 2, 6, colors.shoes, colors.outline);
    }
    
    // Torso
    const torsoW = 28;
    const torsoH = 32;
    const torsoY = cy - 10 + bodyOffsetY;
    drawRect(cx - torsoW/2 + lean, torsoY, torsoW, torsoH, colors.shirt, colors.outline);
    
    // Belt
    drawRect(cx - torsoW/2 + lean, torsoY + torsoH - 4, torsoW, 4, colors.pants, colors.outline);
    
    // Arms - with attack extension
    const armW = 8;
    const armH = 26;
    const armY = torsoY + 4;
    
    // Extend arm forward during attack frames (punch reach)
    let attackReach = 0;
    if (animName === 'attack' && progress > 0.25 && progress < 0.55) {
      attackReach = ((progress - 0.25) / 0.3) * 16;
    } else if (animName === 'heavyAttack' && progress > 0.35 && progress < 0.65) {
      attackReach = ((progress - 0.35) / 0.3) * 22;
    } else if (animName === 'special' && progress > 0.3 && progress < 0.6) {
      attackReach = ((progress - 0.3) / 0.3) * 26;
    }
    
    // Left arm (back arm)
    const leftArmX = cx - torsoW/2 - armW + lean;
    drawRect(leftArmX, armY + armOffset, armW, armH, colors.skin, colors.outline);
    drawEllipse(leftArmX + armW/2, armY + armH + armOffset + 2, 6, 4, colors.skin, colors.outline);
    
    // Right arm (front arm - extends during attacks)
    const rightArmX = cx + torsoW/2 + lean;
    drawRect(rightArmX, armY - armOffset, armW + attackReach * 0.4, armH, colors.skin, colors.outline);
    
    // Extended fist during attacks
    if (attackReach > 4) {
      drawRect(rightArmX + armW + attackReach * 0.3, armY - armOffset + armH * 0.4, attackReach, 10, colors.skin, colors.outline);
      drawEllipse(rightArmX + armW + attackReach * 0.5 + attackReach, armY - armOffset + armH * 0.4 + 5, 8, 6, colors.skin, colors.outline);
    } else {
      drawEllipse(rightArmX + armW/2, armY + armH - armOffset + 2, 6, 4, colors.skin, colors.outline);
    }
    
    // Head
    const headR = 16;
    const headY = torsoY - headR - 2 + headOffset;
    drawEllipse(cx + lean, headY, headR, headR, colors.skin, colors.outline);
    
    // Hair
    drawEllipse(cx + lean, headY - headR + 4, headR, headR - 4, colors.hair, colors.outline);
    
    // Eyes
    const eyeY = headY - 2;
    drawRect(cx - 6 + lean, eyeY, 4, 4, '#000000');
    drawRect(cx + 2 + lean, eyeY, 4, 4, '#000000');
    
    // Facing indicator (small dot on side)
    // This will be flipped based on facing direction in render
  }
  
  setCharacter(fighter, characterName) {
    this.fighterSprites[fighter.id] = characterName;
    this.fighterAnimationState[fighter.id] = 'idle';
    this.fighterAnimationFrame[fighter.id] = 0;
    this.fighterAnimationTimer[fighter.id] = 0;
  }
  
  updateFighterAnimation(fighter, dt) {
    // Determine animation state from fighter
    let targetState = 'idle';
    
    if (fighter.state === 'dash') targetState = 'dash';
    else if (fighter.state === 'block') targetState = 'block';
    else if (fighter.state === 'hit' || fighter.isHit) targetState = 'hit';
    else if (fighter.state.startsWith('attack') || fighter.state === 'special' || fighter.isAttacking) {
      if (fighter.state === 'heavyAttack' || fighter.state === 'heavyAttack2') targetState = 'heavyAttack';
      else if (fighter.state === 'special') targetState = 'special';
      else if (fighter.state === 'airAttack') targetState = 'airAttack';
      else if (fighter.state === 'crouchAttack') targetState = 'crouchAttack';
      else targetState = 'attack';
    }
    else if (!fighter.onGround) {
      if (fighter.velocityY < 0) targetState = 'jump';
      else targetState = 'fall';
    }
    else if (Math.abs(fighter.velocityX) > 1) {
      targetState = 'walk';
    }
    else if (fighter.state === 'crouch') {
      targetState = 'block'; // Use block as crouch
    }
    
    // Update animation state
    if (this.fighterAnimationState[fighter.id] !== targetState) {
      this.fighterAnimationState[fighter.id] = targetState;
      this.fighterAnimationFrame[fighter.id] = 0;
      this.fighterAnimationTimer[fighter.id] = 0;
    }
    
    // Advance animation frame
    const fps = this.animationFPS[targetState] || 6;
    const frameCount = this.animationFrameCounts[targetState] || 1;
    this.fighterAnimationTimer[fighter.id] += dt;
    const frameTime = 1 / fps;
    
    if (this.fighterAnimationTimer[fighter.id] >= frameTime) {
      this.fighterAnimationTimer[fighter.id] -= frameTime;
      this.fighterAnimationFrame[fighter.id] = (this.fighterAnimationFrame[fighter.id] + 1) % frameCount;
    }
  }
  
  updateCamera(dt) {
    // Camera shake
    if (this.screenShake.duration > 0) {
      this.screenShake.elapsed += dt * 1000;
      const progress = this.screenShake.elapsed / this.screenShake.duration;
      const currentIntensity = this.screenShake.intensity * (1 - progress);
      this.screenShake.x = (Math.random() - 0.5) * currentIntensity;
      this.screenShake.y = (Math.random() - 0.5) * currentIntensity;
      
      if (this.screenShake.elapsed >= this.screenShake.duration) {
        this.screenShake.x = 0;
        this.screenShake.y = 0;
        this.screenShake.duration = 0;
      }
    }
    
    // Smooth camera follow - center on midpoint between fighters
    const f1 = this.game?.fighter1;
    const f2 = this.game?.fighter2;
    
    if (f1 && f2) {
      const midX = (f1.x + f2.x) / 2;
      const distance = Math.abs(f1.x - f2.x);
      
      // Target camera position
      const targetX = midX - this.viewportWidth / 2;
      
      // Clamp to arena bounds
      const minX = this.arenaLeft - this.viewportWidth / 2;
      const maxX = this.arenaRight - this.viewportWidth / 2;
      this.cameraX = Math.max(minX, Math.min(maxX, targetX));
      
      // Vertical camera follows action
      const midY = (f1.y + f2.y) / 2;
      this.cameraY = Math.max(0, midY - this.viewportHeight / 2);
    }
  }
  
  updateParticles(dt) {
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      if (p.life <= 0) return false;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt; // gravity
      p.alpha = p.life / p.maxLife;
      return true;
    });
  }
  
  addHitParticles(x, y, color = '#ffd700', count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 0.3 + Math.random() * 0.5,
        maxLife: 0.8,
        color,
        size: 2 + Math.random() * 4,
        alpha: 1
      });
    }
  }
  
  addParticle(x, y, color, velocity, life, size = 3) {
    this.particles.push({
      x, y,
      vx: velocity.x,
      vy: velocity.y,
      life,
      maxLife: life,
      color,
      size,
      alpha: 1
    });
  }
  
  triggerScreenFlash(color = '#ffffff', duration = 150) {
    this.screenFlash = { active: true, color, alpha: 0.6, duration, timer: duration };
  }
  
  shakeCamera(intensity, duration = 300) {
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
    this.screenShake.elapsed = 0;
  }
  
  flashScreen(color, duration = 100) {
    this.triggerScreenFlash(color, duration);
  }
  
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Calculate scale to fit reference resolution
    this.scaleX = width / this.referenceWidth;
    this.scaleY = height / this.referenceHeight;
    const scale = Math.min(this.scaleX, this.scaleY);
    
    this.viewportWidth = this.referenceWidth;
    this.viewportHeight = this.referenceHeight;
  }
  
  handleResize() {
    this.resize(window.innerWidth, window.innerHeight);
  }
  
  clear() {
    // Dark maroon background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#1A0307');
    gradient.addColorStop(0.25, '#2B050B');
    gradient.addColorStop(0.5, '#360A11');
    gradient.addColorStop(0.75, '#4A0E17');
    gradient.addColorStop(1, '#5A121C');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
  
  render() {
    this.clear();
    
    // Apply camera transform
    this.ctx.save();
    this.ctx.translate(-this.cameraX + this.screenShake.x, -this.cameraY + this.screenShake.y);
    this.ctx.scale(this.scaleX, this.scaleY);
    
    // Draw arena floor
    this.drawArena();
    
    // Draw fighters
    this.drawFighter(1);
    this.drawFighter(2);
    
    // Draw particles
    this.drawParticles();
    
    this.ctx.restore();
    
    // Draw screen flash (on top, not affected by camera)
    this.drawScreenFlash();
  }
  
  drawArena() {
    const groundY = this.groundY;
    const arenaWidth = this.arenaRight - this.arenaLeft;
    
    // Ground
    const groundGradient = this.ctx.createLinearGradient(0, groundY, 0, this.referenceHeight);
    groundGradient.addColorStop(0, '#2B050B');
    groundGradient.addColorStop(0.5, '#360A11');
    groundGradient.addColorStop(1, '#4A0E17');
    this.ctx.fillStyle = groundGradient;
    this.ctx.fillRect(this.arenaLeft, groundY, arenaWidth, this.referenceHeight - groundY);
    
    // Grid lines
    this.ctx.strokeStyle = '#4A0E17';
    this.ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = this.arenaLeft; x <= this.arenaRight; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, groundY);
      this.ctx.lineTo(x, this.referenceHeight);
      this.ctx.stroke();
    }
    for (let y = groundY; y <= this.referenceHeight; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.arenaLeft, y);
      this.ctx.lineTo(this.arenaRight, y);
      this.ctx.stroke();
    }
    
    // Gold accent lines at edges
    this.ctx.strokeStyle = '#D4AF37';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(this.arenaLeft, groundY);
    this.ctx.lineTo(this.arenaLeft, this.referenceHeight);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(this.arenaRight, groundY);
    this.ctx.lineTo(this.arenaRight, this.referenceHeight);
    this.ctx.stroke();
    
    // Center line
    this.ctx.strokeStyle = '#D4AF37';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.referenceWidth / 2, groundY);
    this.ctx.lineTo(this.referenceWidth / 2, this.referenceHeight);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
  
  drawFighter(fighterId) {
    const fighter = this.game?.['fighter' + fighterId];
    if (!fighter) return;
    
    const charName = this.fighterSprites[fighterId];
    if (!charName || !this.characterSprites[charName]) return;
    
    const animState = this.fighterAnimationState[fighterId];
    const frameIndex = this.fighterAnimationFrame[fighterId];
    const frames = this.characterSprites[charName][animState];
    if (!frames || frames.length === 0) return;
    
    const frame = frames[frameIndex % frames.length];
    
    // Position in game coordinates
    const x = fighter.x;
    const y = fighter.y;
    
    // Face direction
    const facing = fighter.facing || 1;
    
    this.ctx.save();
    this.ctx.translate(x, y + fighter.height);
    
    if (facing < 0) {
      this.ctx.scale(-1, 1);
    }
    
    // Draw character sprite (centered horizontally, bottom at feet)
    this.ctx.drawImage(frame, -frame.width / 2, -frame.height);
    
    this.ctx.restore();
  }
  
  drawParticles() {
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }
  
  drawScreenFlash() {
    if (this.screenFlash.active) {
      const dt = 1/60; // approximate
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
}