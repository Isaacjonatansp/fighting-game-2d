
// Renderer - handles all drawing operations
export class Renderer {
  constructor(config) {
    this.config = config;
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.width = config.width;
    this.height = config.height;
    
    this.camera = { x: 0, y: 0, shake: 0, shakeIntensity: 0 };
    this.particles = [];
    this.screenFlash = { active: false, color: '#FFFFFF', alpha: 0, duration: 0, elapsed: 0 };
  }
  
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }
  
  clear() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#1A0307');
    grad.addColorStop(0.25, '#2B050B');
    grad.addColorStop(0.5, '#360A11');
    grad.addColorStop(0.75, '#4A0E17');
    grad.addColorStop(1, '#5A121C');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }
  
  setCamera(x, y) {
    this.camera.x = x;
    this.camera.y = y;
  }
  
  shakeCamera(intensity, duration = 300) {
    this.camera.shake = duration;
    this.camera.shakeIntensity = intensity;
  }
  
  flashScreen(color, duration = 100) {
    this.screenFlash = { active: true, color, alpha: 0.6, duration, elapsed: 0 };
  }
  
  updateCamera(dt) {
    if (this.camera.shake > 0) {
      this.camera.shake -= dt * 1000;
      const intensity = this.camera.shakeIntensity * Math.max(0, this.camera.shake / 300);
      this.camera.x = (Math.random() - 0.5) * intensity;
      this.camera.y = (Math.random() - 0.5) * intensity;
    } else {
      this.camera.x = 0;
      this.camera.y = 0;
    }
    
    if (this.screenFlash.active) {
      this.screenFlash.elapsed += dt * 1000;
      this.screenFlash.alpha = 0.6 * Math.max(0, 1 - this.screenFlash.elapsed / this.screenFlash.duration);
      if (this.screenFlash.elapsed >= this.screenFlash.duration) {
        this.screenFlash.active = false;
      }
    }
  }
  
  drawFighter(fighter) {
    const { x, y, width, height, color, facing, state, animFrame, currentAttack } = fighter;
    const cx = x + width / 2;
    const cy = y + height / 2;
    
    this.ctx.save();
    this.ctx.translate(cx + this.camera.x, cy + this.camera.y);
    if (facing === -1) this.ctx.scale(-1, 1);
    
    // Store currentAttack for drawArms to access
    this.currentAttack = currentAttack;
    this.drawBodyParts(fighter);
    
    this.ctx.restore();
  }
  
  drawBodyParts(fighter) {
    const { state, animFrame, facing, color } = fighter;
    const hw = 30;
    const hh = 60;
    
    const primaryColor = color;
    const secondaryColor = this.lightenColor(color, 30);
    const darkColor = this.darkenColor(color, 30);
    const skinColor = '#E8C5A0';
    
    const legOffset = state === 'crouch' ? 15 : (state === 'jump' ? -5 : 0);
    
    // Legs
    const legW = 14;
    const legH = 35;
    
    this.ctx.fillStyle = darkColor;
    this.ctx.fillRect(-hw + 8, legOffset, legW, legH);
    this.ctx.fillStyle = primaryColor;
    this.ctx.fillRect(-hw + 6, legOffset + legH - 5, 18, 10);
    
    this.ctx.fillStyle = darkColor;
    this.ctx.fillRect(hw - 22, legOffset, legW, legH);
    this.ctx.fillStyle = primaryColor;
    this.ctx.fillRect(hw - 24, legOffset + legH - 5, 18, 10);
    
    // Torso - more dynamic shape
    const torsoW = 36;
    const torsoH = 40;
    this.ctx.fillStyle = primaryColor;
    this.ctx.beginPath();
    this.ctx.moveTo(-torsoW/2 + 5, -hh + 10 + legOffset);
    this.ctx.lineTo(torsoW/2 - 5, -hh + 10 + legOffset);
    this.ctx.lineTo(torsoW/2, -hh + 10 + legOffset + torsoH);
    this.ctx.lineTo(-torsoW/2, -hh + 10 + legOffset + torsoH);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Belt
    this.ctx.fillStyle = '#D4AF37';
    this.ctx.fillRect(-torsoW/2, -hh + 10 + legOffset + torsoH - 10, torsoW, 8);
    
    // Arms
    this.drawArms(fighter, -torsoW/2, -hh + 10 + legOffset, torsoW, torsoH);
    
    // Head - more detailed
    const headR = 18;
    this.ctx.fillStyle = skinColor;
    this.ctx.beginPath();
    this.ctx.arc(0, -hh - headR + 5 + legOffset, headR, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Hair - stylized
    this.ctx.fillStyle = darkColor;
    this.ctx.beginPath();
    this.ctx.moveTo(-headR, -hh - headR + 5 + legOffset);
    this.ctx.quadraticCurveTo(0, -hh - headR - 10 + legOffset, headR, -hh - headR + 5 + legOffset);
    this.ctx.lineTo(headR, -hh - headR + 5 + legOffset);
    this.ctx.fill();
    
    // Eyes
    this.ctx.fillStyle = '#2D1B15';
    // Eyes - more expressive
    this.ctx.fillStyle = '#1A0307';
    const eyeY = -hh - headR + 3 + legOffset;
    const eyeOffset = facing * 4;
    this.ctx.beginPath();
    this.ctx.arc(-6 + eyeOffset, eyeY, 3, 0, Math.PI * 2);
    this.ctx.arc(6 + eyeOffset, eyeY, 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Eye highlights
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(-5 + eyeOffset, eyeY - 1, 1.5, 0, Math.PI * 2);
    this.ctx.arc(7 + eyeOffset, eyeY - 1, 1.5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Eyebrows for expression
    this.ctx.strokeStyle = darkColor;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(-10 + eyeOffset, eyeY - 6);
    this.ctx.lineTo(-2 + eyeOffset, eyeY - 8);
    this.ctx.moveTo(2 + eyeOffset, eyeY - 8);
    this.ctx.lineTo(10 + eyeOffset, eyeY - 6);
    this.ctx.stroke();
    
    // State indicator with better styling
    if (state === 'attack' || state === 'attack2' || state === 'attack3') {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 16px Cinzel';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('⚔', 0, -hh - 35 + legOffset);
    } else if (state === 'heavyAttack' || state === 'heavyAttack2') {
      this.ctx.fillStyle = '#FF4444';
      this.ctx.font = 'bold 16px Cinzel';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('⚡', 0, -hh - 35 + legOffset);
    } else if (state === 'special') {
      this.ctx.fillStyle = '#FF00FF';
      this.ctx.font = 'bold 16px Cinzel';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('✦', 0, -hh - 35 + legOffset);
    } else if (state === 'doubleJump') {
      this.ctx.fillStyle = '#00FFFF';
      this.ctx.font = 'bold 16px Cinzel';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('↑↑', 0, -hh - 35 + legOffset);
    } else if (state === 'block') {
      this.ctx.fillStyle = '#4488FF';
      this.ctx.font = 'bold 16px Cinzel';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('🛡', 0, -hh - 35 + legOffset);
    } else if (state === 'hit') {
      this.ctx.fillStyle = '#FF4444';
      this.ctx.font = 'bold 16px Cinzel';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('✦', 0, -hh - 35 + legOffset);
    }
  }
  
  drawArms(fighter, torsoX, torsoY, torsoW, torsoH) {
    const { state, animFrame, facing, color } = fighter;
    const darkColor = this.darkenColor(color, 30);
    const skinColor = '#E8C5A0';
    
    const armW = 10;
    const armH = 30;
    const shoulderY = torsoY + 8;
    
    let leftArmRot = 0;
    let rightArmRot = 0;
    let leftForearmRot = 0;
    let rightForearmRot = 0;
    
    // Smooth animation interpolation
    const getAnimProgress = (phase, total) => {
      const progress = Math.min(1, animFrame / total);
      return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    };
    
    const startup = (fighter.currentAttack?.startup) || 0.1;
    const active = (fighter.currentAttack?.active) || 0.15;
    const recovery = (fighter.currentAttack?.recovery) || 0.2;
    const totalDuration = startup + active + recovery;
    
    switch (state) {
      case 'attack':
      case 'attack2':
      case 'attack3': {
        const progress = getAnimProgress(animFrame, totalDuration);
        if (animFrame < startup) {
          // Windup - pull back
          leftArmRot = -0.8 * progress;
          rightArmRot = 1.2 * progress;
        } else if (animFrame < startup + active) {
          // Active - extend forward
          const activeProgress = (animFrame - startup) / active;
          leftArmRot = -0.8 + 2.2 * activeProgress;
          rightArmRot = 1.2 - 1.5 * activeProgress;
          leftForearmRot = 0.8 * activeProgress;
        } else {
          // Recovery - return
          const recoveryProgress = (animFrame - startup - active) / recovery;
          leftArmRot = 1.4 - 1.1 * recoveryProgress;
          rightArmRot = -0.3 + 1.1 * recoveryProgress;
          leftForearmRot = 0.8 - 0.8 * recoveryProgress;
        }
        break;
      }
      case 'heavyAttack':
      case 'heavyAttack2': {
        const progress = getAnimProgress(animFrame, totalDuration);
        if (animFrame < startup) {
          // Windup - big pull back
          leftArmRot = -1.2 * progress;
          rightArmRot = 1.8 * progress;
        } else if (animFrame < startup + active) {
          // Active - powerful forward thrust
          const activeProgress = (animFrame - startup) / active;
          leftArmRot = -1.2 + 3.0 * activeProgress;
          rightArmRot = 1.8 - 2.3 * activeProgress;
          leftForearmRot = 1.0 * activeProgress;
        } else {
          // Recovery
          const recoveryProgress = (animFrame - startup - active) / recovery;
          leftArmRot = 1.8 - 1.3 * recoveryProgress;
          rightArmRot = -0.5 + 1.3 * recoveryProgress;
          leftForearmRot = 1.0 - 1.0 * recoveryProgress;
        }
        break;
      }
      case 'special': {
        const progress = getAnimProgress(animFrame, totalDuration);
        if (animFrame < startup) {
          // Charge up
          leftArmRot = -1.0 * progress;
          rightArmRot = -1.0 * progress;
          leftForearmRot = -0.5 * progress;
          rightForearmRot = -0.5 * progress;
        } else if (animFrame < startup + active) {
          // Release
          const activeProgress = (animFrame - startup) / active;
          leftArmRot = -1.0 + 2.5 * activeProgress;
          rightArmRot = -1.0 + 2.5 * activeProgress;
          leftForearmRot = -0.5 + 1.5 * activeProgress;
          rightForearmRot = -0.5 + 1.5 * activeProgress;
        } else {
          // Recovery
          const recoveryProgress = (animFrame - startup - active) / recovery;
          leftArmRot = 1.5 - 1.5 * recoveryProgress;
          rightArmRot = 1.5 - 1.5 * recoveryProgress;
          leftForearmRot = 1.0 - 1.0 * recoveryProgress;
          rightForearmRot = 1.0 - 1.0 * recoveryProgress;
        }
        break;
      }
      case 'airAttack': {
        const progress = getAnimProgress(animFrame, totalDuration);
        if (animFrame < startup) {
          // Windup - arms up for aerial strike
          leftArmRot = -1.5 * progress;
          rightArmRot = -1.5 * progress;
          leftForearmRot = -0.8 * progress;
          rightForearmRot = -0.8 * progress;
        } else if (animFrame < startup + active) {
          // Active - downward strike
          const activeProgress = (animFrame - startup) / active;
          leftArmRot = -1.5 + 2.5 * activeProgress;
          rightArmRot = -1.5 + 2.5 * activeProgress;
          leftForearmRot = -0.8 + 1.8 * activeProgress;
          rightForearmRot = -0.8 + 1.8 * activeProgress;
        } else {
          // Recovery
          const recoveryProgress = (animFrame - startup - active) / recovery;
          leftArmRot = 1.0 - 1.5 * recoveryProgress;
          rightArmRot = 1.0 - 1.5 * recoveryProgress;
          leftForearmRot = 1.0 - 1.0 * recoveryProgress;
          rightForearmRot = 1.0 - 1.0 * recoveryProgress;
        }
        break;
      }
      case 'crouchAttack': {
        const progress = getAnimProgress(animFrame, totalDuration);
        if (animFrame < startup) {
          // Windup - low sweep preparation
          leftArmRot = 0.5 * progress;
          rightArmRot = -0.5 * progress;
          leftForearmRot = 0.3 * progress;
          rightForearmRot = -0.3 * progress;
        } else if (animFrame < startup + active) {
          // Active - low sweep
          const activeProgress = (animFrame - startup) / active;
          leftArmRot = 0.5 + 1.5 * activeProgress;
          rightArmRot = -0.5 - 1.5 * activeProgress;
          leftForearmRot = 0.3 + 1.0 * activeProgress;
          rightForearmRot = -0.3 - 1.0 * activeProgress;
        } else {
          // Recovery
          const recoveryProgress = (animFrame - startup - active) / recovery;
          leftArmRot = 2.0 - 1.5 * recoveryProgress;
          rightArmRot = -2.0 + 1.5 * recoveryProgress;
          leftForearmRot = 1.3 - 1.0 * recoveryProgress;
          rightForearmRot = -1.3 + 1.0 * recoveryProgress;
        }
        break;
      }
      case 'block':
        leftArmRot = 0.8;
        rightArmRot = -0.8;
        leftForearmRot = -0.3;
        rightForearmRot = -0.3;
        break;
      case 'hit':
        leftArmRot = 1.5;
        rightArmRot = -1.5;
        break;
      case 'crouch':
        leftArmRot = 0.5;
        rightArmRot = -0.5;
        break;
      case 'jump':
      case 'doubleJump':
        leftArmRot = -0.5;
        rightArmRot = 0.5;
        break;
      default:
        // Smooth idle/walk animation
        const swing = Math.sin(animFrame * 3) * 0.35;
        leftArmRot = swing;
        rightArmRot = -swing;
    }
    
    const leftArmX = torsoX - armW;
    const rightArmX = torsoX + torsoW;
    
    // Left arm (upper arm)
    this.ctx.save();
    this.ctx.translate(leftArmX, shoulderY);
    this.ctx.rotate(leftArmRot * facing);
    this.ctx.fillStyle = darkColor;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(armW, 0);
    this.ctx.lineTo(armW - 2, armH);
    this.ctx.lineTo(2, armH);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Left forearm
    this.ctx.translate(armW/2, armH);
    this.ctx.rotate(leftForearmRot * facing);
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(-armW/2, 0);
    this.ctx.lineTo(armW/2, 0);
    this.ctx.lineTo(armW/2 - 2, armH * 0.8);
    this.ctx.lineTo(-armW/2 + 2, armH * 0.8);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Left hand
    this.ctx.fillStyle = skinColor;
    this.ctx.beginPath();
    this.ctx.arc(0, armH * 0.8, 8, 0, Math.PI * 2);
    this.ctx.fill();
    // Fingers
    this.ctx.fillStyle = darkColor;
    for (let i = -2; i <= 2; i++) {
      this.ctx.fillRect(i * 3 - 1, armH * 0.8 + 2, 2, 6);
    }
    this.ctx.restore();
    
    // Right arm (upper arm)
    this.ctx.save();
    this.ctx.translate(rightArmX, shoulderY);
    this.ctx.rotate(rightArmRot * facing);
    this.ctx.fillStyle = darkColor;
    this.ctx.beginPath();
    this.ctx.moveTo(-armW, 0);
    this.ctx.lineTo(0, 0);
    this.ctx.lineTo(-2, armH);
    this.ctx.lineTo(-armW + 2, armH);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Right forearm
    this.ctx.translate(-armW/2, armH);
    this.ctx.rotate(rightForearmRot * facing);
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(-armW/2, 0);
    this.ctx.lineTo(armW/2, 0);
    this.ctx.lineTo(armW/2 - 2, armH * 0.8);
    this.ctx.lineTo(-armW/2 + 2, armH * 0.8);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Right hand
    this.ctx.fillStyle = skinColor;
    this.ctx.beginPath();
    this.ctx.arc(0, armH * 0.8, 8, 0, Math.PI * 2);
    this.ctx.fill();
    // Fingers
    this.ctx.fillStyle = darkColor;
    for (let i = -2; i <= 2; i++) {
      this.ctx.fillRect(i * 3 - 1, armH * 0.8 + 2, 2, 6);
    }
    this.ctx.restore();
  }
  
  drawHitbox(hitbox, color = '#00FF00') {
    if (!hitbox) return;
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(hitbox.x + this.camera.x, hitbox.y + this.camera.y, hitbox.width, hitbox.height);
    this.ctx.restore();
  }
  
  drawHurtbox(hurtbox, color = '#FF0000') {
    if (!hurtbox) return;
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(hurtbox.x + this.camera.x, hurtbox.y + this.camera.y, hurtbox.width, hurtbox.height);
    this.ctx.restore();
  }
  
  addParticle(x, y, color, velocity, life = 500) {
    this.particles.push({
      x, y, color,
      vx: velocity.x, vy: velocity.y,
      life, maxLife: life,
      size: 4 + Math.random() * 4
    });
  }
  
  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vy += 0.3 * dt * 60;
      p.life -= dt * 1000;
      p.size *= 0.98;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  renderParticles() {
    this.ctx.save();
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x + this.camera.x, p.y + this.camera.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }
  
  renderScreenFlash() {
    if (this.screenFlash.active) {
      this.ctx.save();
      this.ctx.globalAlpha = this.screenFlash.alpha;
      this.ctx.fillStyle = this.screenFlash.color;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.restore();
    }
  }
  
  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (R.toString(16).padStart(2, '0') + G.toString(16).padStart(2, '0') + B.toString(16).padStart(2, '0'));
  }
  
  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (R.toString(16).padStart(2, '0') + G.toString(16).padStart(2, '0') + B.toString(16).padStart(2, '0'));
  }
}