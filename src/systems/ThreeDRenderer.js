// Three.js 3D Renderer for Kenney Blocky Characters
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ThreeDRenderer {
  constructor(config) {
    this.config = config;
    this.canvas = config.canvas;
    this.width = config.width;
    this.height = config.height;
    
    // Three.js setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    // Camera position for 2D side-view fighting game
    this.camera.position.set(0, 8, 25);
    this.camera.lookAt(0, 2, 0);
    
    // Lighting
    this.setupLighting();
    
    // Loaders
    this.gltfLoader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
    
    // Character models
    this.characterModels = {};
    this.characterAnimations = {};
    this.fighterMeshes = { 1: null, 2: null };
    this.fighterAnimations = { 1: {}, 2: {} };
    this.fighterMixers = { 1: null, 2: null };
    this.fighterActions = { 1: {}, 2: {} };
    
    // Stage
    this.stageMeshes = [];
    
    // Animation clock
    this.clock = new THREE.Clock();
    
    // Load assets
    this.loadCharacterModels();
    this.loadStageModels();
    
    // Particle system
    this.particles = [];
    this.screenFlash = { active: false, alpha: 0, color: 0xffffff };
    
    // Screen shake
    this.screenShake = { intensity: 0, duration: 0, elapsed: 0, x: 0, y: 0 };
  }
  
  // Camera shake
  shakeCamera(intensity, duration = 300) {
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
    this.screenShake.elapsed = 0;
  }
  
  flashScreen(color, duration = 100) {
    this.screenFlash = { active: true, color, alpha: 0.6, duration, elapsed: 0 };
  }
  
  setupLighting() {
    // Ambient light - brighter for better visibility
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);
    
    // Main directional light (sun) - stronger
    const dirLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
    dirLight.position.set(10, 25, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.bias = -0.001;
    this.scene.add(dirLight);
    
    // Fill light - warmer and stronger
    const fillLight = new THREE.DirectionalLight(0xffe4b5, 0.8);
    fillLight.position.set(-15, 15, -15);
    this.scene.add(fillLight);
    
    // Rim light for character separation - gold tint
    const rimLight = new THREE.DirectionalLight(0xffd700, 0.5);
    rimLight.position.set(0, 8, -20);
    this.scene.add(rimLight);
    
    // Point lights for atmosphere - torch-like
    const pointLight1 = new THREE.PointLight(0xff6b35, 1.0, 40);
    pointLight1.position.set(-20, 8, 10);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x356bff, 1.0, 40);
    pointLight2.position.set(20, 8, 10);
    this.scene.add(pointLight2);
    
    // Additional fill from front
    const frontLight = new THREE.DirectionalLight(0xfff8e7, 0.6);
    frontLight.position.set(0, 10, 25);
    this.scene.add(frontLight);
  }
  
  async loadCharacterModels() {
    // Load all 18 character variants (a-r)
    const characters = 'abcdefghijklmnopqr'.split('');
    
    for (const char of characters) {
      try {
        const modelPath = `/assets/kenney-blocky-characters/Models/GLB format/character-${char}.glb`;
        const texturePath = `/assets/kenney-blocky-characters/Models/GLB format/Textures/texture-${char}.png`;
        
        const [gltf, texture] = await Promise.all([
          this.gltfLoader.loadAsync(modelPath),
          this.textureLoader.loadAsync(texturePath)
        ]);
        
        // Setup model - convert to MeshStandardMaterial for proper lighting
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Replace material with MeshStandardMaterial for lighting
            const originalMaterial = child.material;
            const mats = Array.isArray(originalMaterial) ? originalMaterial : [originalMaterial];
            
            const newMaterials = mats.map(mat => {
              const newMat = new THREE.MeshStandardMaterial({
                map: texture,
                color: mat.color ? mat.color.clone() : new THREE.Color(0xffffff),
                roughness: 0.7,
                metalness: 0.1,
                side: mat.side || THREE.FrontSide
              });
              newMat.map.colorSpace = THREE.SRGBColorSpace;
              return newMat;
            });
            
            child.material = newMaterials.length === 1 ? newMaterials[0] : newMaterials;
          }
        });
        
        // Scale model to fighting game size
        model.scale.setScalar(0.08);
        
        // Store animations
        const animations = {};
        if (gltf.animations && gltf.animations.length > 0) {
          gltf.animations.forEach(clip => {
            animations[clip.name] = clip;
          });
        }
        
        this.characterModels[char] = model;
        this.characterAnimations[char] = animations;
        
        console.log(`Loaded character ${char} with ${Object.keys(animations).length} animations`);
      } catch (e) {
        console.warn(`Failed to load character ${char}:`, e);
      }
    }
  }
  
  async loadStageModels() {
    // Load castle kit models for arena
    const stageModels = [
      'ground',
      'wall',
      'wall-corner',
      'tower-square-base',
      'tower-square-mid',
      'tower-square-top',
      'flag',
      'bridge-straight',
      'stairs-stone',
      'rocks-large',
      'tree-large'
    ];
    
    for (const modelName of stageModels) {
      try {
        const modelPath = `/assets/kenney-castle-kit/Models/GLB format/${modelName}.glb`;
        const gltf = await this.gltfLoader.loadAsync(modelPath);
        
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        this.stageMeshes.push({ name: modelName, model });
        console.log(`Loaded stage model: ${modelName}`);
      } catch (e) {
        console.warn(`Failed to load stage model ${modelName}:`, e);
      }
    }
  }
  
  setCharacter(fighter, characterKey) {
    // Map character keys to Kenney character variants
    const charMap = {
      'crimson': 'a',  // Red/orange character
      'azure': 'b'     // Blue character
    };
    
    const charId = charMap[characterKey] || 'a';
    const model = this.characterModels[charId];
    const animations = this.characterAnimations[charId];
    
    if (!model) {
      // Retry after delay if models still loading
      setTimeout(() => this.setCharacter(fighter, characterKey), 200);
      return;
    }
    
    // Clone model for this fighter
    const fighterModel = model.clone(true);
    
    // Setup animation mixer
    const mixer = new THREE.AnimationMixer(fighterModel);
    this.fighterMixers[fighter.id] = mixer;
    
    // Create animation actions
    const actions = {};
    if (animations) {
      Object.entries(animations).forEach(([name, clip]) => {
        actions[name] = mixer.clipAction(clip);
      });
    }
    this.fighterActions[fighter.id] = actions;
    
    // Position fighter - map 2D arena (0-1280) to 3D arena (-25 to 25) for 2D side view
    // Both fighters at z=0 for classic 2D fighting game perspective
    const arenaScale = 50 / 1280; // 0.0390625
    const arenaOffset = -25;
    const targetX = fighter.x * arenaScale + arenaOffset;
    fighterModel.position.set(targetX, 0, 0);
    fighterModel.rotation.y = fighter.facing > 0 ? Math.PI : 0;
    
    // Scale model to appropriate fighting size - increased for better visibility
    fighterModel.scale.setScalar(0.18);
    
    // Add to scene
    this.scene.add(fighterModel);
    this.fighterMeshes[fighter.id] = fighterModel;
    
    // Play idle animation
    this.playAnimation(fighter.id, 'idle', true);
    
    // Store reference on fighter
    fighter.threeModel = fighterModel;
    fighter.threeMixer = mixer;
  }
  
  playAnimation(fighterId, animName, loop = false) {
    const actions = this.fighterActions[fighterId];
    if (!actions || !actions[animName]) {
      // Try common animation name variations
      const variations = [
        animName,
        animName.toLowerCase(),
        `anim_${animName}`,
        `${animName}_loop`,
        'idle'
      ];
      
      for (const v of variations) {
        if (actions[v]) {
          this.stopAllAnimations(fighterId);
          actions[v].setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
          actions[v].clampWhenFinished = !loop;
          actions[v].reset().play();
          return;
        }
      }
      return;
    }
    
    this.stopAllAnimations(fighterId);
    actions[animName].setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
    actions[animName].clampWhenFinished = !loop;
    actions[animName].reset().play();
  }
  
  stopAllAnimations(fighterId) {
    const actions = this.fighterActions[fighterId];
    if (actions) {
      Object.values(actions).forEach(action => {
        action.stop();
        action.weight = 0;
      });
    }
  }
  
  updateFighterAnimation(fighter, dt) {
    const mixer = this.fighterMixers[fighter.id];
    if (mixer) {
      mixer.update(dt);
    }
    
    // Update model position to match fighter
    const model = this.fighterMeshes[fighter.id];
    if (model && fighter.threeModel) {
      // Map 2D arena (0-1280) to 3D arena (-25 to 25) for 2D side view
      const arenaScale = 50 / 1280; // 0.0390625
      const arenaOffset = -25;
      const targetX = fighter.x * arenaScale + arenaOffset;
      
      // Smooth position interpolation
      model.position.x += (targetX - model.position.x) * 0.2;
      // Position y based on jump state - y starts at 460 (ground level)
      const groundY = 0;
      const jumpScale = (fighter.y - 460) / 100; // Map fighter y to jump height
      model.position.y = groundY + jumpScale * 1.5;
      
      // Face direction
      model.rotation.y = fighter.facing > 0 ? Math.PI : 0;
      
      // State-based animation
      this.updateAnimationState(fighter);
    }
  }
  
  updateAnimationState(fighter) {
    const actions = this.fighterActions[fighter.id];
    if (!actions) return;
    
    let targetAnim = 'idle';
    
    if (fighter.isBlocking) {
      targetAnim = 'block';
    } else if (fighter.isDashing) {
      targetAnim = 'run';
    } else if (fighter.velY !== 0) {
      targetAnim = fighter.velY < 0 ? 'jump' : 'fall';
    } else if (Math.abs(fighter.velX) > 0.5) {
      targetAnim = 'walk';
    } else if (fighter.isAttacking) {
      if (fighter.currentAttack === 'heavy') targetAnim = 'attack_heavy';
      else if (fighter.currentAttack === 'special') targetAnim = 'attack_special';
      else targetAnim = 'attack_light';
    } else if (fighter.isHit) {
      targetAnim = 'hit';
    }
    
    // Check if current animation matches target
    let currentAnim = null;
    for (const [name, action] of Object.entries(actions)) {
      if (action.isRunning() && action.getEffectiveWeight() > 0.5) {
        currentAnim = name;
        break;
      }
    }
    
    if (currentAnim !== targetAnim && actions[targetAnim]) {
      // Crossfade
      if (currentAnim && actions[currentAnim]) {
        actions[currentAnim].crossFadeTo(actions[targetAnim], 0.15, true);
      } else {
        this.playAnimation(fighter.id, targetAnim, 
          ['idle', 'walk', 'run', 'block'].includes(targetAnim));
      }
    }
  }
  
  buildStage() {
    // Clear existing stage - track ALL meshes directly
    this.stageMeshes.forEach(mesh => {
      if (mesh.parent) mesh.parent.remove(mesh);
    });
    this.stageMeshes = [];
    
    // Simple 2D-style floor - just a flat plane for shadows
    this.groundSize = 100;
    const groundGeo = new THREE.BoxGeometry(this.groundSize, 0.5, this.groundSize);
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0x1a0307,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.stageMeshes.push(ground);
    
    // Subtle floor grid lines for depth perception (2D style)
    this.addFloorGrid();
  }
  
  addFloorGrid() {
    const gridMat = new THREE.MeshBasicMaterial({ 
      color: 0xd4af37,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    
    // Horizontal lines (depth)
    for (let i = -10; i <= 10; i++) {
      const lineGeo = new THREE.PlaneGeometry(this.groundSize, 0.1);
      const line = new THREE.Mesh(lineGeo, gridMat);
      line.position.set(0, 0.01, i * 5);
      line.rotation.x = -Math.PI / 2;
      this.scene.add(line);
      this.stageMeshes.push(line);
    }
    
    // Vertical lines (width)
    for (let i = -10; i <= 10; i++) {
      const lineGeo = new THREE.PlaneGeometry(0.1, this.groundSize);
      const line = new THREE.Mesh(lineGeo, gridMat);
      line.position.set(i * 5, 0.01, 0);
      line.rotation.x = -Math.PI / 2;
      this.scene.add(line);
      this.stageMeshes.push(line);
    }
    
    // Center line (gold accent)
    const centerLineGeo = new THREE.PlaneGeometry(this.groundSize, 0.3);
    const centerLineMat = new THREE.MeshBasicMaterial({ 
      color: 0xd4af37,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const centerLine = new THREE.Mesh(centerLineGeo, centerLineMat);
    centerLine.position.set(0, 0.02, 0);
    centerLine.rotation.x = -Math.PI / 2;
    this.scene.add(centerLine);
    this.stageMeshes.push(centerLine);
  }
  
  updateCamera(dt) {
    // Camera shake effect
    if (this.screenFlash.active) {
      this.camera.position.x += (Math.random() - 0.5) * 0.3;
      this.camera.position.y += (Math.random() - 0.5) * 0.3;
    }
    
    // Smooth camera follow - track midpoint between fighters (2D side view)
    const f1 = this.fighterMeshes[1];
    const f2 = this.fighterMeshes[2];
    if (f1 && f2) {
      const midX = (f1.position.x + f2.position.x) / 2;
      const distance = Math.abs(f1.position.x - f2.position.x);
      
      // Adjust camera zoom based on fighter distance - keep both in view
      const targetZoom = Math.max(25, 25 + distance * 0.2);
      
      // 2D side-view camera: positioned at z=0, looking along -z axis
      // This gives a classic 2D fighting game perspective
      this.camera.position.x = midX;
      this.camera.position.y = 8;
      this.camera.position.z = targetZoom;
      
      // Look at the midpoint between fighters at ground level
      this.camera.lookAt(midX, 2, 0);
      
      // Constrain camera X position to arena bounds
      const maxCameraX = 22;
      if (Math.abs(this.camera.position.x) > maxCameraX) {
        this.camera.position.x = Math.sign(this.camera.position.x) * maxCameraX;
      }
    }
  }
  
  updateParticles(dt) {
    // Update 3D particles
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        return false;
      }
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= 9.8 * dt * 0.5; // gravity
      p.mesh.material.opacity = p.life / p.maxLife;
      return true;
    });
  }
  
  addHitParticles(x, y, z, color = 0xffd700, count = 10) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ 
        color, 
        transparent: true, 
        opacity: 1 
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x * 0.05, y * 0.05, z);
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 5
      );
      
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1
      });
    }
  }
  
  // Compatibility method for CombatSystem
  addParticle(x, y, color, velocity, life, size = 3) {
    // Convert 2D particle to 3D
    this.addHitParticles(x, y, 0, color, 5);
  }
  
  triggerScreenFlash(color = 0xffffff, duration = 0.15) {
    this.screenFlash = { active: true, alpha: 1, color, duration, timer: duration };
  }
  
  drawScreenFlash() {
    if (this.screenFlash.active) {
      this.screenFlash.timer -= this.clock.getDelta();
      this.screenFlash.alpha = this.screenFlash.timer / this.screenFlash.duration;
      
      if (this.screenFlash.timer <= 0) {
        this.screenFlash.active = false;
      }
    }
  }
  
  clear() {
    this.renderer.clear();
  }
  
  render() {
    const dt = this.clock.getDelta();
    
    // Update mixers
    Object.values(this.fighterMixers).forEach(mixer => {
      if (mixer) mixer.update(dt);
    });
    
    this.updateParticles(dt);
    this.updateScreenShake(dt);
    this.drawScreenFlash();
    
    // Apply screen shake offset to camera
    const baseX = this.camera.userData.baseX !== undefined ? this.camera.userData.baseX : this.camera.position.x;
    const baseY = this.camera.userData.baseY !== undefined ? this.camera.userData.baseY : this.camera.position.y;
    this.camera.userData.baseX = baseX;
    this.camera.userData.baseY = baseY;
    this.camera.position.x = baseX + this.screenShake.x;
    this.camera.position.y = baseY + this.screenShake.y;
    
    this.renderer.render(this.scene, this.camera);
  }
  
  updateScreenShake(dt) {
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
  }
  
  drawScreenFlash() {
    if (this.screenFlash.active) {
      const dt = this.clock.getDelta();
      this.screenFlash.elapsed += dt * 1000;
      this.screenFlash.alpha = 0.6 * Math.max(0, 1 - this.screenFlash.elapsed / this.screenFlash.duration);
      if (this.screenFlash.elapsed >= this.screenFlash.duration) {
        this.screenFlash.active = false;
      }
      if (this.screenFlash.active) {
        const color = new THREE.Color(this.screenFlash.color);
        this.renderer.setClearColor(color, this.screenFlash.alpha);
      } else {
        this.renderer.setClearColor(0x000000, 0);
      }
    }
  }
  
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  // Compatibility methods for existing code
  get ctx() {
    // Return a mock context for compatibility
    return {
      canvas: this.canvas,
      drawImage: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      clearRect: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      fillText: () => {},
      measureText: () => ({ width: 0 }),
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1,
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    };
  }
  
  drawParticles() {
    // Handled in render()
  }
}