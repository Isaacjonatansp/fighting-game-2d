// Stage entity - CraftPix Rocks themed arena
export class Stage {
  constructor(config) {
    this.config = config;
    this.groundY = config.groundY;
    this.renderer = null;

    // Arena width - very wide so camera never shows edge
    this.arenaWidth = 5000;
    this.arenaLeft = -2000;
    this.arenaRight = this.arenaLeft + this.arenaWidth;

    // Loaded rock sprites cache
    this.rocks = {};
    this.rocksLoaded = false;

    // Platforms that fighters can stand on (x, y, width, height)
    // y is top of platform
    this.platforms = [
      // Main ground
      { x: this.arenaLeft, y: this.groundY, width: this.arenaWidth, height: 20, isGround: true },

      // Left side platforms
      { x: 80, y: this.groundY - 130, width: 200, height: 22 },
      { x: 200, y: this.groundY - 240, width: 160, height: 22 },

      // Center platforms
      { x: 380, y: this.groundY - 110, width: 240, height: 22 },
      { x: 520, y: this.groundY - 200, width: 240, height: 22 },

      // Right side platforms
      { x: this.config.width - 280, y: this.groundY - 130, width: 200, height: 22 },
      { x: this.config.width - 360, y: this.groundY - 240, width: 160, height: 22 },
    ];
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  // Load all rock sprites from CraftPix pack
  async loadRocks() {
    const basePath = '/assets/rocks';
    const rockCategories = {
      canyon_rocks: ['canyon_rock1', 'canyon_rock2', 'canyon_rock3', 'canyon_rock4', 'canyon_rock5'],
      desert_rocks: ['desert_rock1', 'desert_rock2', 'desert_rock3', 'desert_rock4', 'desert_rock5'],
      ice_rock: ['ice_rock1', 'ice_rock2', 'ice_rock3', 'ice_rock4', 'ice_rock5'],
      cave_rocks: ['cave_rock1', 'cave_rock2', 'cave_rock3', 'cave_rock4', 'cave_rock5'],
      snowy_rocks1: ['snowy_rock1', 'snowy_rock2', 'snowy_rock3', 'snowy_rock4', 'snowy_rock5'],
      middle_lane_rocks1: ['middle_lane_rock1_1', 'middle_lane_rock1_2', 'middle_lane_rock1_3', 'middle_lane_rock1_4', 'middle_lane_rock1_5'],
      middle_lane_rocks2: ['middle_lane_rock2_1', 'middle_lane_rock2_2', 'middle_lane_rock2_3', 'middle_lane_rock2_4', 'middle_lane_rock2_5'],
      stalagmites: ['stalagmite1', 'stalagmite2', 'stalagmite3', 'stalagmite4', 'stalagmite5']
    };

    for (const [category, files] of Object.entries(rockCategories)) {
      this.rocks[category] = [];
      for (const fileName of files) {
        try {
          const img = await this.loadImage(`${basePath}/${category}/${fileName}.png`);
          this.rocks[category].push(img);
        } catch (err) {
          console.warn(`Failed to load rock: ${fileName}`, err);
        }
      }
    }
    this.rocksLoaded = true;
    console.log('CraftPix rocks loaded');
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load: ${src}`));
      img.src = src;
    });
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

    // === CRAFTPIX ROCKS ARENA ===

    // Background sky gradient - fill ENTIRE canvas height
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.config.height);
    skyGradient.addColorStop(0, '#2C1810');
    skyGradient.addColorStop(0.4, '#5C3A1E');
    skyGradient.addColorStop(0.8, '#8B5A2B');
    skyGradient.addColorStop(1, '#1A0F0A');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(this.arenaLeft, 0, this.arenaWidth, this.config.height);

    // Distant mountain silhouettes
    this.drawMountains(ctx, this.arenaLeft, this.groundY - 180, '#3A2418', 0.1);
    this.drawMountains(ctx, this.arenaLeft, this.groundY - 140, '#5C3A1E', 0.2);
    this.drawMountains(ctx, this.arenaLeft, this.groundY - 100, '#8B5A2B', 0.3);

    // Dust particles in air
    this.drawDustParticles(ctx);

    // Ground floor - dark cavern rock (drawn on top of gradient)
    ctx.fillStyle = '#2C1810';
    ctx.fillRect(this.arenaLeft, this.groundY, this.arenaWidth, 20);
    ctx.fillStyle = '#1A0F0A';
    ctx.fillRect(this.arenaLeft, this.groundY + 20, this.arenaWidth, this.config.height - this.groundY - 20);

    // Draw all platforms using rock sprites
    for (const platform of this.platforms) {
      if (platform.isGround) continue; // Skip main ground
      this.drawRockPlatform(ctx, platform.x, platform.y, platform.width, platform.height);
    }

    // Stalagmites and stalactites for atmosphere
    this.drawStalagmites(ctx);
    this.drawStalactites(ctx);

    // Large background rocks
    this.drawBackgroundRocks(ctx);

    // Scatter small rocks on ground
    this.drawScatteredRocks(ctx);

    // Ground reference line (gold accent)
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.arenaLeft, this.groundY);
    ctx.lineTo(this.arenaLeft + this.arenaWidth, this.groundY);
    ctx.stroke();

    ctx.restore();
  }

  // Draw platform composed of rock sprites
  drawRockPlatform(ctx, x, y, width, height) {
    if (!this.rocksLoaded || !this.rocks.canyon_rocks || this.rocks.canyon_rocks.length === 0) {
      // Fallback procedural stone
      ctx.fillStyle = '#5C3A1E';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(x, y, width, 4);
      return;
    }

    // Draw rocks tiled across platform width
    const rockSize = 64;
    const numRocks = Math.ceil(width / rockSize);

    for (let i = 0; i < numRocks; i++) {
      const rockX = x + i * rockSize;
      const rock = this.rocks.canyon_rocks[i % this.rocks.canyon_rocks.length];
      if (rock) {
        ctx.drawImage(rock, rockX, y - rockSize * 0.3, rockSize, rockSize * 0.6);
      }
    }

    // Top edge highlight
    ctx.fillStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.fillRect(x, y, width, 2);

    // Bottom shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x, y + height - 2, width, 2);
  }

  // Draw stalagmites pointing up from ground
  drawStalagmites(ctx) {
    if (!this.rocksLoaded || !this.rocks.stalagmites) return;

    const positions = [
      { x: 60, y: this.groundY, scale: 1.0 },
      { x: 300, y: this.groundY, scale: 0.8 },
      { x: 580, y: this.groundY, scale: 1.2 },
      { x: 900, y: this.groundY, scale: 0.9 },
      { x: 1150, y: this.groundY, scale: 1.1 },
      { x: 50, y: this.groundY, scale: 0.7 },
      { x: 350, y: this.groundY, scale: 1.0 },
      { x: 750, y: this.groundY, scale: 0.85 },
      { x: 1050, y: this.groundY, scale: 1.05 },
      { x: 1220, y: this.groundY, scale: 0.75 }
    ];

    positions.forEach((pos, idx) => {
      const stalagmite = this.rocks.stalagmites[idx % this.rocks.stalagmites.length];
      if (stalagmite) {
        const w = stalagmite.width * pos.scale;
        const h = stalagmite.height * pos.scale;
        ctx.drawImage(stalagmite, pos.x - w / 2, pos.y - h, w, h);
      }
    });
  }

  // Draw stalactites hanging from top
  drawStalactites(ctx) {
    if (!this.rocksLoaded || !this.rocks.stalagmites) return;

    const positions = [
      { x: 180, y: 0, scale: 0.9 },
      { x: 450, y: 0, scale: 1.1 },
      { x: 700, y: 0, scale: 0.85 },
      { x: 980, y: 0, scale: 1.0 },
      { x: 1200, y: 0, scale: 0.95 }
    ];

    positions.forEach((pos, idx) => {
      const stalactite = this.rocks.stalagmites[(idx + 2) % this.rocks.stalagmites.length];
      if (stalactite) {
        const w = stalactite.width * pos.scale;
        const h = stalactite.height * pos.scale;
        ctx.save();
        ctx.translate(pos.x, pos.y + h);
        ctx.scale(1, -1); // Flip vertically
        ctx.drawImage(stalactite, -w / 2, 0, w, h);
        ctx.restore();
      }
    });
  }

  // Draw large background rocks (parallax decoration)
  drawBackgroundRocks(ctx) {
    if (!this.rocksLoaded) return;

    const positions = [
      { x: 100, y: this.groundY - 380, scale: 2.0, category: 'cave_rocks' },
      { x: this.config.width - 180, y: this.groundY - 400, scale: 2.2, category: 'cave_rocks' },
      { x: this.config.width / 2 - 200, y: this.groundY - 360, scale: 1.8, category: 'cave_rocks' },
      { x: this.config.width / 2 + 150, y: this.groundY - 420, scale: 2.1, category: 'cave_rocks' },
      { x: 250, y: this.groundY - 520, scale: 1.5, category: 'snowy_rocks1' },
      { x: this.config.width - 300, y: this.groundY - 540, scale: 1.6, category: 'snowy_rocks1' }
    ];

    positions.forEach((pos, idx) => {
      const rockList = this.rocks[pos.category];
      if (!rockList) return;
      const rock = rockList[idx % rockList.length];
      if (rock) {
        const w = rock.width * pos.scale;
        const h = rock.height * pos.scale;
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.drawImage(rock, pos.x - w / 2, pos.y - h, w, h);
        ctx.restore();
      }
    });
  }

  // Draw small scattered rocks on ground
  drawScatteredRocks(ctx) {
    if (!this.rocksLoaded) return;

    const seed = 12345;
    for (let i = 0; i < 30; i++) {
      const x = ((seed * (i + 1) * 7) % this.arenaWidth) + this.arenaLeft;
      const rockList = this.rocks.desert_rocks || this.rocks.canyon_rocks;
      if (!rockList || rockList.length === 0) continue;
      const rock = rockList[i % rockList.length];
      const scale = 0.4 + ((i * 13) % 100) / 200;
      const w = rock.width * scale;
      const h = rock.height * scale;
      ctx.drawImage(rock, x, this.groundY - h * 0.3, w, h);
    }
  }

  // Dust particles for atmosphere
  drawDustParticles(ctx) {
    const seed = 99999;
    ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
    for (let i = 0; i < 50; i++) {
      const x = ((seed * (i + 1) * 11) % this.config.width);
      const y = ((seed * (i + 1) * 17) % (this.groundY - 50));
      const size = 1 + (i % 3);
      ctx.fillRect(x, y, size, size);
    }
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