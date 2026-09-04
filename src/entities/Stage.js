// Stage entity - Japanese night dojo arena
export class Stage {
  constructor(config) {
    this.config = config;
    this.groundY = config.groundY;
    this.renderer = null;

    // Arena width - very wide so camera never shows edge
    this.arenaWidth = 5000;
    this.arenaLeft = -2000;
    this.arenaRight = this.arenaLeft + this.arenaWidth;

    // Cherry blossom petals animation state
    this.petals = [];
    this.petalTimer = 0;

    // Platforms that fighters can stand on (x, y, width, height)
    // y is top of platform
    // Arena spans from arenaLeft (-2000) to arenaRight (3000)
    const centerX = this.arenaLeft + this.arenaWidth / 2; // 500
    this.platforms = [
      // Main ground
      { x: this.arenaLeft, y: this.groundY, width: this.arenaWidth, height: 20, isGround: true },

      // Left side - dojo platforms
      { x: this.arenaLeft + 250, y: this.groundY - 110, width: 180, height: 22 },
      { x: this.arenaLeft + 420, y: this.groundY - 210, width: 160, height: 22 },
      { x: this.arenaLeft + 650, y: this.groundY - 310, width: 140, height: 22 },

      // Center - balanced platforms
      { x: centerX - 200, y: this.groundY - 130, width: 180, height: 22 },
      { x: centerX - 90, y: this.groundY - 230, width: 180, height: 22 },

      // Right side - mirrored dojo platforms
      { x: this.arenaRight - 730, y: this.groundY - 310, width: 140, height: 22 },
      { x: this.arenaRight - 580, y: this.groundY - 210, width: 160, height: 22 },
      { x: this.arenaRight - 430, y: this.groundY - 110, width: 180, height: 22 },
    ];
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  // Get platform at position for collision
  getPlatformAt(x, y, width, height) {
    const fighterBottom = y + height;
    const fighterLeft = x;
    const fighterRight = x + width;

    for (const platform of this.platforms) {
      const platLeft = platform.x;
      const platRight = platform.x + platform.width;
      const platTop = platform.y;
      const platBottom = platform.y + platform.height;

      // Check horizontal overlap
      if (fighterRight > platLeft && fighterLeft < platRight) {
        // Check if fighter is landing on top of platform
        if (fighterBottom >= platTop - 8 && fighterBottom <= platTop + 12) {
          return platform;
        }
      }
    }
    return null;
  }

  render(ctx, renderer) {
    ctx.save();

    // === NIGHT ARENA ===

    // Dark night sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.config.height);
    skyGradient.addColorStop(0, '#0B0D17');
    skyGradient.addColorStop(0.45, '#1A1F35');
    skyGradient.addColorStop(0.75, '#2A1F2F');
    skyGradient.addColorStop(1, '#140C10');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(this.arenaLeft, 0, this.arenaWidth, this.config.height);

    // Stars
    this.drawStars(ctx);

    // Moon
    this.drawMoon(ctx);

    // Distant mountain silhouettes
    this.drawMountains(ctx, this.arenaLeft, this.groundY - 180, '#141825', 0.1);
    this.drawMountains(ctx, this.arenaLeft, this.groundY - 140, '#1E2235', 0.2);
    this.drawMountains(ctx, this.arenaLeft, this.groundY - 100, '#2A2F45', 0.3);

    // Pagoda silhouettes in distance
    this.drawPagodas(ctx);

    // Bamboo silhouettes
    this.drawBamboo(ctx);

    // Ground floor - dark stone
    ctx.fillStyle = '#1A1C24';
    ctx.fillRect(this.arenaLeft, this.groundY, this.arenaWidth, 20);
    ctx.fillStyle = '#0F1116';
    ctx.fillRect(this.arenaLeft, this.groundY + 20, this.arenaWidth, this.config.height - this.groundY - 20);

    // Draw platforms
    for (const platform of this.platforms) {
      if (platform.isGround) continue;
      this.drawDojoPlatform(ctx, platform.x, platform.y, platform.width, platform.height);
    }

    // Torii gates
    this.drawToriiGates(ctx);

    // Lanterns
    this.drawLanterns(ctx);

    // Cherry blossom petals
    this.drawPetals(ctx);

    // Ground reference line
    ctx.strokeStyle = '#3A3F55';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.arenaLeft, this.groundY);
    ctx.lineTo(this.arenaLeft + this.arenaWidth, this.groundY);
    ctx.stroke();

    // Fog overlay near ground
    this.drawFog(ctx);

    ctx.restore();
  }

  // Draw platform composed of rock sprites
  drawDojoPlatform(ctx, x, y, width, height) {
    // Wooden dojo platform
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(x, y, width, height);

    // Top highlight
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x, y, width, 4);

    // Wood grain lines
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 12) {
      ctx.beginPath();
      ctx.moveTo(x + i, y + 4);
      ctx.lineTo(x + i + 6, y + height);
      ctx.stroke();
    }

    // Bottom shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x, y + height - 2, width, 2);
  }

  drawMoon(ctx) {
    const moonX = this.arenaLeft + this.arenaWidth / 2 + 200;
    const moonY = 80;
    const moonR = 40;

    // Glow
    ctx.fillStyle = 'rgba(255, 255, 200, 0.15)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR + 20, 0, Math.PI * 2);
    ctx.fill();

    // Moon body
    ctx.fillStyle = '#F5F5DC';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    // Craters
    ctx.fillStyle = 'rgba(200, 200, 180, 0.4)';
    ctx.beginPath();
    ctx.arc(moonX - 12, moonY - 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX + 10, moonY + 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX + 5, moonY - 15, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawStars(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 120; i++) {
      const x = this.arenaLeft + ((i * 137) % this.arenaWidth);
      const y = (i * 53) % (this.groundY - 200);
      const size = (i % 3 === 0) ? 2 : 1;
      ctx.fillRect(x, y, size, size);
    }
    // A few brighter stars
    ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
    for (let i = 0; i < 20; i++) {
      const x = this.arenaLeft + ((i * 211) % this.arenaWidth);
      const y = (i * 97) % (this.groundY - 250);
      ctx.fillRect(x, y, 2, 2);
    }
  }

  drawPagodas(ctx) {
    const positions = [
      { x: this.arenaLeft + 800, baseY: this.groundY - 100, scale: 0.8 },
      { x: this.arenaLeft + 1400, baseY: this.groundY - 80, scale: 0.6 },
      { x: this.arenaRight - 1200, baseY: this.groundY - 90, scale: 0.7 },
      { x: this.arenaRight - 600, baseY: this.groundY - 70, scale: 0.5 },
    ];

    positions.forEach(pos => {
      ctx.save();
      ctx.globalAlpha = 0.5;
      this.drawPagoda(ctx, pos.x, pos.baseY, pos.scale);
      ctx.restore();
    });
  }

  drawPagoda(ctx, x, baseY, scale) {
    const w = 80 * scale;
    const h = 120 * scale;
    const color = '#1E2235';

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(x - w * 0.15, baseY - h * 0.5, w * 0.3, h * 0.5);

    // Tiered roofs
    for (let i = 0; i < 3; i++) {
      const tierY = baseY - h * 0.5 + i * h * 0.2;
      const tierW = w * (0.6 - i * 0.12);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x - tierW / 2, tierY);
      ctx.lineTo(x, tierY - h * 0.12);
      ctx.lineTo(x + tierW / 2, tierY);
      ctx.closePath();
      ctx.fill();
    }

    // Spire
    ctx.fillStyle = color;
    ctx.fillRect(x - 1, baseY - h * 0.62, 2, h * 0.12);
  }

  drawBamboo(ctx) {
    const positions = [
      { x: this.arenaLeft + 150, baseY: this.groundY, scale: 1.0 },
      { x: this.arenaLeft + 180, baseY: this.groundY, scale: 0.8 },
      { x: this.arenaLeft + 210, baseY: this.groundY, scale: 0.9 },
      { x: this.arenaRight - 220, baseY: this.groundY, scale: 1.0 },
      { x: this.arenaRight - 190, baseY: this.groundY, scale: 0.85 },
      { x: this.arenaRight - 160, baseY: this.groundY, scale: 0.75 },
    ];

    positions.forEach(pos => {
      ctx.save();
      ctx.globalAlpha = 0.35;
      this.drawBambooStalk(ctx, pos.x, pos.baseY, pos.scale);
      ctx.restore();
    });
  }

  drawBambooStalk(ctx, x, baseY, scale) {
    const h = 200 * scale;
    const w = 8 * scale;
    const segH = 40 * scale;

    // Stalk segments
    ctx.fillStyle = '#1A2A1A';
    for (let i = 0; i < 5; i++) {
      const segY = baseY - (i + 1) * segH;
      ctx.fillRect(x - w / 2, segY, w, segH - 2);
      // Node
      ctx.fillStyle = '#0D1A0D';
      ctx.fillRect(x - w / 2 - 1, segY + segH - 3, w + 2, 3);
      ctx.fillStyle = '#1A2A1A';
    }

    // Leaves at top
    ctx.fillStyle = '#1A2A1A';
    const topY = baseY - h;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI - Math.PI / 2;
      const lx = x + Math.cos(angle) * 20 * scale;
      const ly = topY + Math.sin(angle) * 20 * scale;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 12 * scale, 3 * scale, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawFog(ctx) {
    const fogGradient = ctx.createLinearGradient(0, this.groundY - 60, 0, this.groundY + 40);
    fogGradient.addColorStop(0, 'rgba(180, 180, 200, 0)');
    fogGradient.addColorStop(0.5, 'rgba(180, 180, 200, 0.12)');
    fogGradient.addColorStop(1, 'rgba(180, 180, 200, 0.25)');
    ctx.fillStyle = fogGradient;
    ctx.fillRect(this.arenaLeft, this.groundY - 60, this.arenaWidth, 100);
  }

  drawToriiGates(ctx) {
    const positions = [
      { x: this.arenaLeft + 600, baseY: this.groundY },
      { x: this.arenaRight - 600, baseY: this.groundY },
      { x: this.arenaLeft + this.arenaWidth / 2, baseY: this.groundY },
    ];

    positions.forEach(pos => {
      ctx.save();
      ctx.globalAlpha = 0.85;
      this.drawToriiGate(ctx, pos.x, pos.baseY);
      ctx.restore();
    });
  }

  drawToriiGate(ctx, x, baseY) {
    const w = 120;
    const h = 140;
    const color = '#8B1A1A';
    const dark = '#5C1010';

    // Pillars
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2 + 10, baseY - h, 12, h);
    ctx.fillRect(x + w / 2 - 22, baseY - h, 12, h);

    // Top beam
    ctx.fillStyle = dark;
    ctx.fillRect(x - w / 2 - 10, baseY - h - 14, w + 20, 18);

    // Lower beam
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2 + 4, baseY - h + 10, w - 8, 12);

    // Decorative ends
    ctx.fillStyle = dark;
    ctx.fillRect(x - w / 2 - 14, baseY - h - 18, 28, 10);
    ctx.fillRect(x + w / 2 - 14, baseY - h - 18, 28, 10);
  }

  drawLanterns(ctx) {
    const positions = [
      { x: this.arenaLeft + 300, baseY: this.groundY },
      { x: this.arenaLeft + 900, baseY: this.groundY },
      { x: this.arenaRight - 900, baseY: this.groundY },
      { x: this.arenaRight - 300, baseY: this.groundY },
      { x: this.arenaLeft + this.arenaWidth / 2 - 120, baseY: this.groundY },
      { x: this.arenaLeft + this.arenaWidth / 2 + 120, baseY: this.groundY },
    ];

    positions.forEach(pos => {
      ctx.save();
      ctx.globalAlpha = 0.9;
      this.drawLantern(ctx, pos.x, pos.baseY);
      ctx.restore();
    });
  }

  drawLantern(ctx, x, baseY) {
    const poleH = 90;
    const poleW = 6;
    const lanternW = 28;
    const lanternH = 36;

    // Pole
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(x - poleW / 2, baseY - poleH, poleW, poleH);

    // Lantern body
    ctx.fillStyle = '#B71C1C';
    ctx.fillRect(x - lanternW / 2, baseY - poleH - lanternH, lanternW, lanternH);

    // Glow
    ctx.fillStyle = 'rgba(255, 200, 120, 0.35)';
    ctx.beginPath();
    ctx.arc(x, baseY - poleH - lanternH / 2, lanternW, 0, Math.PI * 2);
    ctx.fill();

    // Inner light
    ctx.fillStyle = '#FFE0B2';
    ctx.fillRect(x - lanternW / 2 + 6, baseY - poleH - lanternH + 8, lanternW - 12, lanternH - 16);

    // Top/bottom caps
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(x - lanternW / 2 - 4, baseY - poleH - lanternH - 6, lanternW + 8, 8);
    ctx.fillRect(x - lanternW / 2 - 4, baseY - poleH - 6, lanternW + 8, 8);
  }

  drawPetals(ctx) {
    if (!this.petals.length) {
      for (let i = 0; i < 60; i++) {
        this.petals.push({
          x: this.arenaLeft + Math.random() * this.arenaWidth,
          y: Math.random() * (this.groundY - 50),
          vx: 20 + Math.random() * 40,
          vy: 10 + Math.random() * 30,
          size: 3 + Math.random() * 4,
          alpha: 0.4 + Math.random() * 0.5,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 2
        });
      }
    }

    ctx.fillStyle = '#F8BBD0';
    this.petals.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  updatePetals(dt) {
    this.petalTimer += dt;
    if (this.petalTimer > 0.05) {
      this.petalTimer = 0;
      this.petals.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.spin * dt;
        if (p.y > this.groundY) {
          p.y = -10;
          p.x = this.arenaLeft + Math.random() * this.arenaWidth;
        }
        if (p.x > this.arenaRight) {
          p.x = this.arenaLeft;
        }
      });
    }
  }

  drawMountains(ctx, x, y, color, scale) {
    const w = this.arenaWidth;
    const h = 80;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + h);

    // Jagged mountain peaks
    const peakWidth = 100;
    for (let mx = 0; mx <= w; mx += peakWidth) {
      const peakHeight = 40 + Math.sin(mx * 0.01) * 30;
      ctx.lineTo(x + mx + peakWidth/2, y + h - peakHeight);
    }
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();

    // Highlight on left side of peaks
    ctx.fillStyle = this.lightenMountain(color, 0.15);
    for (let mx = 0; mx <= w; mx += peakWidth) {
      const peakHeight = 40 + Math.sin(mx * 0.01) * 30;
      ctx.beginPath();
      ctx.moveTo(x + mx, y + h);
      ctx.lineTo(x + mx + peakWidth/4, y + h - peakHeight/2);
      ctx.lineTo(x + mx + peakWidth/2, y + h);
      ctx.closePath();
      ctx.fill();
    }
  }
  
  lightenMountain(hex, amount) {
    const r = Math.min(255, Math.round(parseInt(hex.substr(1, 2), 16) + (255 - parseInt(hex.substr(1, 2), 16)) * amount));
    const g = Math.min(255, Math.round(parseInt(hex.substr(3, 2), 16) + (255 - parseInt(hex.substr(3, 2), 16)) * amount));
    const b = Math.min(255, Math.round(parseInt(hex.substr(5, 2), 16) + (255 - parseInt(hex.substr(5, 2), 16)) * amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}