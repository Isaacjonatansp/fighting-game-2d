// Stage entity - handles 3D arena
export class Stage {
  constructor(config) {
    this.config = config;
    this.groundY = config.groundY;
    this.renderer = null;
    
    // Arena width - make it very wide so camera never shows edge
    this.arenaWidth = 5000;
    this.arenaLeft = -2000;
    this.arenaRight = this.arenaLeft + this.arenaWidth;
    
    // Platforms that fighters can stand on (x, y, width, height)
    // y is top of platform
    this.platforms = [
      // Main ground
      { x: this.arenaLeft, y: this.groundY, width: this.arenaWidth, height: 20, isGround: true },
      
      // Left side platforms
      { x: 100, y: this.groundY - 120, width: 180, height: 20 },
      { x: 200, y: this.groundY - 200, width: 140, height: 20 },
      
      // Center platforms
      { x: 320, y: this.groundY - 100, width: 240, height: 20 },
      { x: 480, y: this.groundY - 40, width: 320, height: 20 }, // wooden bridge
      
      // Right side platforms
      { x: this.config.width - 560, y: this.groundY - 140, width: 240, height: 20 },
      { x: this.config.width - 340, y: this.groundY - 240, width: 140, height: 20 },
      { x: this.config.width - 280, y: this.groundY - 160, width: 180, height: 20 },
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
        if (fighterBottom >= platTop - 5 && fighterBottom <= platTop + 10) {
          return platform;
        }
      }
    }
    return null;
  }
  
  render(ctx, renderer) {
    ctx.save();
    
    // === KENNEY-INSPIRED BLOCKY ARENA - FULL WIDTH ===
    
    // Background sky gradient - extend far left/right
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.5, '#B0E0E6');
    skyGradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(this.arenaLeft, 0, this.arenaWidth, this.groundY);
    
    // Distant mountains (parallax layers) - extended
    this.drawMountains(ctx, this.arenaLeft, this.groundY - 180, '#6B8E5C', 0.1);
    this.drawMountains(ctx, this.arenaLeft, this.groundY - 140, '#8FBC8F', 0.2);
    this.drawMountains(ctx, this.arenaLeft, this.groundY - 100, '#A8D5BA', 0.3);
    
    // Clouds - extended
    this.drawCloudsExtended(ctx);
    
    // Ground with grass and dirt layers - extended
    ctx.fillStyle = '#2D5016';
    ctx.fillRect(this.arenaLeft, this.groundY, this.arenaWidth, 20);
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(this.arenaLeft, this.groundY + 20, this.arenaWidth, this.config.height - this.groundY - 20);
    
    // Grass tufts pattern on top - extended
    ctx.fillStyle = '#4CAF50';
    for (let x = this.arenaLeft; x < this.arenaLeft + this.arenaWidth; x += 16) {
      ctx.fillRect(x, this.groundY - 4, 8, 4);
      ctx.fillRect(x + 8, this.groundY - 2, 8, 2);
    }
    
    // Draw all platforms
    for (const platform of this.platforms) {
      if (platform.isGround) continue; // Skip main ground, it's drawn above
      
      // Determine if it's wooden bridge or stone
      const isWooden = platform.width === 320 && platform.y === this.groundY - 40;
      if (isWooden) {
        this.drawWoodenBridge(ctx, platform.x, platform.y, platform.width, platform.height, renderer);
      } else {
        this.drawStoneBlock(ctx, platform.x, platform.y - platform.height, platform.width, platform.height, renderer);
      }
    }
    
    // Decorative pillars and structures
    if (renderer && renderer.drawPixelRect) {
      // Stone pillar left
      this.drawStonePillar(ctx, 80, this.groundY - 280, renderer);
      // Stone pillar right
      this.drawStonePillar(ctx, this.config.width - 80, this.groundY - 280, renderer);
      
      // Torches on left side
      this.drawKenneyTorch(ctx, 60, this.groundY - 320, renderer);
      this.drawKenneyTorch(ctx, 60, this.groundY - 420, renderer);
      
      // Torches on right side
      this.drawKenneyTorch(ctx, this.config.width - 60, this.groundY - 320, renderer);
      this.drawKenneyTorch(ctx, this.config.width - 60, this.groundY - 420, renderer);
      
      // Background castle towers
      this.drawCastleTower(ctx, 150, this.groundY - 380, renderer);
      this.drawCastleTower(ctx, this.config.width - 150, this.groundY - 380, renderer);
      
      // Flags
      this.drawFlag(ctx, 200, this.groundY - 380, renderer, true);
      this.drawFlag(ctx, this.config.width - 200, this.groundY - 380, renderer, false);
    }
    
    // Ground reference line
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.arenaLeft, this.groundY);
    ctx.lineTo(this.arenaLeft + this.arenaWidth, this.groundY);
    ctx.stroke();
    
    ctx.restore();
  }

  drawStoneBlock(ctx, x, y, w, h, renderer) {
    // Main stone block with Kenney-style shading
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(x, y, w, h);
    
    // Top highlight (light source from top-left)
    ctx.fillStyle = '#A0826D';
    ctx.fillRect(x, y, w, 4);
    
    // Right shadow
    ctx.fillStyle = '#5D4E42';
    ctx.fillRect(x + w - 4, y, 4, h);
    
    // Bottom shadow
    ctx.fillStyle = '#4A3F38';
    ctx.fillRect(x, y + h - 4, w, 4);
    
    // Left highlight edge
    ctx.fillStyle = '#B09977';
    ctx.fillRect(x, y, 3, h);
    
    // Grid lines for stone blocks
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let bx = x; bx < x + w; bx += 16) {
      ctx.beginPath();
      ctx.moveTo(bx, y);
      ctx.lineTo(bx, y + h);
      ctx.stroke();
    }
    for (let by = y; by < y + h; by += 16) {
      ctx.beginPath();
      ctx.moveTo(x, by);
      ctx.lineTo(x + w, by);
      ctx.stroke();
    }
  }
  
  drawWoodenBridge(ctx, x, y, w, h, renderer) {
    // Bridge planks
    ctx.fillStyle = '#8B6F47';
    ctx.fillRect(x, y, w, h);
    
    // Top highlight
    ctx.fillStyle = '#A0845A';
    ctx.fillRect(x, y, w, 2);
    
    // Planks pattern (vertical lines)
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    for (let px = x + 20; px < x + w; px += 20) {
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px, y + h);
      ctx.stroke();
    }
    
    // Wood grain
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    for (let gy = y + 4; gy < y + h; gy += 6) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }
    
    // Bottom shadow
    ctx.fillStyle = '#5D4526';
    ctx.fillRect(x, y + h - 2, w, 2);
  }
  
  drawStonePillar(ctx, x, y, renderer) {
    const w = 32;
    const h = 240;
    
    // Pillar body
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(x - w/2, y, w, h);
    
    // Left highlight
    ctx.fillStyle = '#A0826D';
    ctx.fillRect(x - w/2, y, 4, h);
    
    // Right shadow
    ctx.fillStyle = '#5D4E42';
    ctx.fillRect(x + w/2 - 4, y, 4, h);
    
    // Stone blocks pattern
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let py = y; py < y + h; py += 16) {
      ctx.beginPath();
      ctx.moveTo(x - w/2, py);
      ctx.lineTo(x + w/2, py);
      ctx.stroke();
    }
    
    // Pillar top
    ctx.fillStyle = '#654321';
    ctx.fillRect(x - w/2 - 8, y - 8, w + 16, 8);
    ctx.fillStyle = '#8B6F47';
    ctx.fillRect(x - w/2 - 6, y - 6, w + 12, 6);
  }
  
  drawKenneyTorch(ctx, x, y, renderer) {
    // Torch pole
    ctx.fillStyle = '#5D3E1F';
    ctx.fillRect(x - 3, y, 6, 60);
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(x - 2, y + 1, 4, 58);
    
    // Torch bracket
    ctx.fillStyle = '#4A3F38';
    ctx.fillRect(x - 6, y + 8, 12, 4);
    ctx.fillStyle = '#654321';
    ctx.fillRect(x - 5, y + 9, 10, 3);
    
    // Flame (animated flicker)
    const flicker = Math.sin(Date.now() * 0.01) * 2;
    ctx.fillStyle = '#FF6B35';
    ctx.fillRect(x - 8 + flicker, y - 12, 16, 14);
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(x - 6 + flicker, y - 10, 12, 12);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x - 4 + flicker, y - 6, 8, 8);
  }
  
  drawCastleTower(ctx, x, y, renderer) {
    const w = 50;
    const h = 120;
    
    // Tower body
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(x - w/2, y, w, h);
    
    // Left highlight
    ctx.fillStyle = '#A0826D';
    ctx.fillRect(x - w/2, y, 3, h);
    
    // Right shadow
    ctx.fillStyle = '#5D4E42';
    ctx.fillRect(x + w/2 - 3, y, 3, h);
    
    // Stone block pattern
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let by = y; by < y + h; by += 20) {
      ctx.beginPath();
      ctx.moveTo(x - w/2, by);
      ctx.lineTo(x + w/2, by);
      ctx.stroke();
    }
    
    // Crenellations (castle top teeth - merlons only)
    const crenelW = 8;
    const crenelH = 16;
    for (let cx2 = x - w/2 + 4; cx2 < x + w/2; cx2 += crenelW * 2) {
      // Merlon (raised wall block)
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(cx2 + crenelW, y - crenelH, crenelW, crenelH);
      ctx.fillStyle = '#A0826D';
      ctx.fillRect(cx2 + crenelW, y - crenelH, 2, crenelH);
      ctx.fillStyle = '#5D4E42';
      ctx.fillRect(cx2 + crenelW * 2 - 2, y - crenelH, 2, crenelH);
    }
    
    // Roof/turret top
    ctx.fillStyle = '#654321';
    ctx.fillRect(x - w/2 - 6, y - 8, w + 12, 8);
    ctx.fillStyle = '#8B6F47';
    ctx.fillRect(x - w/2 - 4, y - 6, w + 8, 6);
  }
  
  drawFlag(ctx, x, y, renderer, isLeft) {
    // Flagpole
    ctx.fillStyle = '#5D3E1F';
    ctx.fillRect(x - 2, y, 4, 80);
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(x - 1, y + 1, 2, 78);
    
    // Flag banner
    const flagW = 40;
    const flagH = 24;
    const flagWave = Math.sin(Date.now() * 0.01) * 4;
    
    // Flag cloth
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.moveTo(x, y + 16);
    ctx.quadraticCurveTo(x + flagW/2 + flagWave, y + 12, x + flagW, y + 16);
    ctx.quadraticCurveTo(x + flagW/2 + flagWave, y + 20, x, y + 24);
    ctx.fill();
    
    // Flag highlight
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 17);
    ctx.quadraticCurveTo(x + flagW/2 + flagWave - 2, y + 14, x + flagW - 2, y + 17);
    ctx.quadraticCurveTo(x + flagW/2 + flagWave - 2, y + 19, x + 2, y + 22);
    ctx.fill();
  }
  
  drawMountains(ctx, x, y, color, scale) {
    const w = this.config.width;
    const h = 80;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    
    // Jagged mountain peaks
    const peakWidth = 100;
    for (let mx = 0; mx <= w; mx += peakWidth) {
      const peakHeight = 40 + Math.sin(mx * 0.01) * 30;
      ctx.lineTo(mx + peakWidth/2, y + h - peakHeight);
    }
    ctx.lineTo(w, y + h);
    ctx.closePath();
    ctx.fill();
    
    // Highlight on left side of peaks
    ctx.fillStyle = this.lightenMountain(color, 0.15);
    for (let mx = 0; mx <= w; mx += peakWidth) {
      const peakHeight = 40 + Math.sin(mx * 0.01) * 30;
      ctx.beginPath();
      ctx.moveTo(mx, y + h);
      ctx.lineTo(mx + peakWidth/4, y + h - peakHeight/2);
      ctx.lineTo(mx + peakWidth/2, y + h);
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
  
  drawClouds(ctx) {
    const clouds = [
      { x: 100, y: 80, w: 80 },
      { x: 400, y: 120, w: 100 },
      { x: 700, y: 60, w: 90 },
      { x: 1000, y: 100, w: 85 },
      { x: 550, y: 40, w: 70 }
    ];
    
    clouds.forEach(cloud => {
      // Cloud base
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cloud.x, cloud.y, cloud.w, 20);
      ctx.fillRect(cloud.x + 10, cloud.y - 8, cloud.w - 20, 8);
      ctx.fillRect(cloud.x + 20, cloud.y - 16, cloud.w - 40, 8);
      
      // Cloud shadow
      ctx.fillStyle = 'rgba(200, 220, 240, 0.6)';
      ctx.fillRect(cloud.x, cloud.y + 16, cloud.w, 4);
      ctx.fillRect(cloud.x + 10, cloud.y - 4, cloud.w - 20, 4);
    });
  }
  
  drawCloudsExtended(ctx) {
    // Extended cloud pattern across full arena
    const baseCloudSpacing = 500;
    const cloudW = 80;
    
    for (let x = this.arenaLeft; x < this.arenaLeft + this.arenaWidth; x += baseCloudSpacing) {
      const yVar = Math.sin(x * 0.001) * 40 + 80;
      const wVar = Math.sin(x * 0.002) * 20 + 80;
      
      // Cloud base
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x, yVar, wVar, 20);
      ctx.fillRect(x + 10, yVar - 8, wVar - 20, 8);
      ctx.fillRect(x + 20, yVar - 16, wVar - 40, 8);
      
      // Cloud shadow
      ctx.fillStyle = 'rgba(200, 220, 240, 0.6)';
      ctx.fillRect(x, yVar + 16, wVar, 4);
      ctx.fillRect(x + 10, yVar - 4, wVar - 20, 4);
    }
  }
}