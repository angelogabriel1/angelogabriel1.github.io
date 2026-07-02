(() => {
  'use strict';

  const LEGENDS = {
    exodia: {
      title: 'EXODIA, O PROIBIDO',
      kicker: 'AS CINCO PARTES ESTÃO REUNIDAS',
      subtitle: 'O poder supremo atravessa o selo ancestral',
      color: '#f6bd49', rgb: '246,189,73', image: 'assets/cards/exodia.jpg'
    },
    'blue-eyes': {
      title: 'DRAGÃO BRANCO DE OLHOS AZUIS',
      kicker: 'LUZ SUPREMA • NÍVEL 8',
      subtitle: 'Explosão branca de destruição',
      color: '#a8edff', rgb: '168,237,255', image: 'assets/cards/blue-eyes.jpg'
    },
    'dark-magician': {
      title: 'MAGO NEGRO',
      kicker: 'MESTRE SUPREMO DA MAGIA',
      subtitle: 'Ataque de magia negra',
      color: '#c783ff', rgb: '199,131,255', image: 'assets/cards/dark-magician.jpg'
    },
    ra: {
      title: 'O DRAGÃO ALADO DE RÁ',
      kicker: 'A FÊNIX DIVINA DESPERTA',
      subtitle: 'O sol soberano incendeia o campo',
      color: '#ffd24f', rgb: '255,210,79', image: 'assets/cards/ra.jpg'
    },
    obelisk: {
      title: 'OBELISCO, O ATORMENTADOR',
      kicker: 'O PUNHO DO DESTINO',
      subtitle: 'A terra treme diante do deus azul',
      color: '#63b7ff', rgb: '99,183,255', image: 'assets/cards/obelisk.jpg'
    },
    slifer: {
      title: 'SLIFER, O DRAGÃO CELESTE',
      kicker: 'OS CÉUS RESPONDEM AO CHAMADO',
      subtitle: 'Trovão celeste sobre o campo de duelo',
      color: '#ff606b', rgb: '255,96,107', image: 'assets/cards/slifer.jpg'
    }
  };

  const EXODIA_PARTS = [
    ['assets/cards/exodia.jpg',        0,  1.42],
    ['assets/cards/right-arm.jpg', -1.72, .28],
    ['assets/cards/left-arm.jpg',   1.72, .28],
    ['assets/cards/right-leg.jpg',  -.92,-1.52],
    ['assets/cards/left-leg.jpg',    .92,-1.52]
  ];

  const overlay = document.getElementById('summonOverlay');
  const stage = document.getElementById('summonStage');
  const canvas = document.getElementById('summonCanvas');
  const copy = document.querySelector('.summon-copy');
  const titleEl = document.getElementById('summonTitle');
  const kickerEl = document.getElementById('summonKicker');
  const subtitleEl = document.getElementById('summonSubtitle');
  const statusEl = document.getElementById('summonStatus');
  const flashEl = document.getElementById('whiteFlash');
  const errorEl = document.getElementById('webglError');
  const fallbackScene = document.getElementById('fallbackScene');
  const fallbackCards = document.getElementById('fallbackCards');
  const fallbackChains = document.getElementById('fallbackChains');
  const fallbackParticles = document.getElementById('fallbackParticles');
  const soundToggle = document.getElementById('soundToggle');

  let renderer;
  let scene;
  let camera;
  let clock;
  let frameId = 0;
  let activeRun = 0;
  let soundEnabled = true;
  let audioContext;
  let mainCard = null;
  let portal = null;
  let particleSystems = [];
  let looseLinks = [];
  let transientLines = [];
  let tweens = [];
  let backTexture = null;
  let currentTheme = LEGENDS.exodia;
  const textureCache = new Map();
  const glowTextureCache = new Map();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  const EASE = {
    outCubic: t => 1 - Math.pow(1 - t, 3),
    inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    outBack: t => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
  };

  function mix(a, b, t) { return a + (b - a) * t; }
  function vecSnapshot(v) { return { x: v.x, y: v.y, z: v.z }; }
  function isActive(token) { return token === activeRun && overlay.classList.contains('open'); }

  function sleep(ms, token) {
    return new Promise(resolve => setTimeout(() => resolve(isActive(token)), ms));
  }

  function animate({ duration = 1000, delay = 0, ease = EASE.outCubic, update, token = activeRun }) {
    return new Promise(resolve => {
      tweens.push({ start: performance.now() + delay, duration, ease, update, token, resolve });
    });
  }

  function tweenVector(target, end, options = {}) {
    const from = vecSnapshot(target);
    return animate({
      ...options,
      update: t => {
        if (end.x !== undefined) target.x = mix(from.x, end.x, t);
        if (end.y !== undefined) target.y = mix(from.y, end.y, t);
        if (end.z !== undefined) target.z = mix(from.z, end.z, t);
        options.update?.(t);
      }
    });
  }

  function updateTweens(now) {
    const remaining = [];
    for (const tween of tweens) {
      if (tween.token !== activeRun) { tween.resolve(false); continue; }
      if (now < tween.start) { remaining.push(tween); continue; }
      const raw = Math.min(1, (now - tween.start) / tween.duration);
      tween.update(tween.ease(raw));
      if (raw >= 1) tween.resolve(true); else remaining.push(tween);
    }
    tweens = remaining;
  }

  function cancelTweens() {
    tweens.forEach(t => t.resolve(false));
    tweens = [];
  }

  function initRenderer() {
    if (renderer) return true;
    if (!window.THREE) return false;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.24;
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.physicallyCorrectLights = true;
      return true;
    } catch (error) {
      console.error('Falha ao iniciar WebGL:', error);
      return false;
    }
  }

  function disposeObject(root) {
    root?.traverse?.(obj => {
      obj.geometry?.dispose?.();
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.filter(Boolean).forEach(material => material.dispose?.());
    });
  }

  function resetScene(theme) {
    if (scene) disposeObject(scene);
    cancelTweens();
    particleSystems = [];
    looseLinks = [];
    transientLines = [];
    mainCard = null;
    portal = null;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030106, .055);
    camera = new THREE.PerspectiveCamera(42, 1, .1, 80);
    camera.position.set(0, .1, 9.4);
    camera.lookAt(0, 0, -1.2);
    clock = new THREE.Clock();

    const ambient = new THREE.HemisphereLight(0xb8a8cc, 0x08020c, 1.45);
    const key = new THREE.SpotLight(new THREE.Color(theme.color), 180, 34, .72, .48, 1.2);
    key.position.set(4, 6, 8);
    key.target.position.set(0, 0, -1);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const rim = new THREE.PointLight(new THREE.Color(theme.color), 110, 20, 1.75);
    rim.position.set(-4, -1, 3);
    const fill = new THREE.PointLight(0xffffff, 58, 18, 1.8);
    fill.position.set(3.8, -2.8, 5.5);
    const back = new THREE.PointLight(new THREE.Color(theme.color), 82, 16, 1.65);
    back.position.set(0, 2.3, -1.6);
    const floorLight = new THREE.SpotLight(new THREE.Color(theme.color), 110, 22, .8, .65, 1.4);
    floorLight.position.set(0, -5.2, 5);
    floorLight.target.position.set(0, .3, -1);
    [rim, fill, back, floorLight].forEach((light, index) => {
      light.userData.pulseLight = true;
      light.userData.baseIntensity = light.intensity;
      light.userData.phase = index * 1.45;
    });
    scene.add(ambient, key, key.target, rim, fill, back, floorLight, floorLight.target);

    createStarField(theme);
    createRadiantBackdrop(theme);
    portal = createPortal(theme);
    scene.add(portal);
    createParticleVortex(theme, theme === LEGENDS.exodia ? 720 : 520);
    resizeRenderer();
  }

  function createStarField(theme) {
    const count = 850;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - .5) * 28;
      positions[i * 3 + 1] = (Math.random() - .5) * 18;
      positions[i * 3 + 2] = -2 - Math.random() * 22;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: theme.color, size: .025, transparent: true, opacity: .72, blending: THREE.AdditiveBlending, depthWrite: false });
    const stars = new THREE.Points(geometry, material);
    stars.name = 'stars';
    scene.add(stars);
  }

  function makeGlowTexture(color) {
    if (glowTextureCache.has(color)) return glowTextureCache.get(color);
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const gradient = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(.12, '#ffffff');
    gradient.addColorStop(.3, color);
    gradient.addColorStop(.62, `${color}66`);
    gradient.addColorStop(1, 'transparent');
    g.fillStyle = gradient;
    g.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(c);
    glowTextureCache.set(color, texture);
    return texture;
  }

  function addGlowSprite(parent, theme, position, scale, opacity = .55, phase = 0) {
    const material = new THREE.SpriteMaterial({
      map: makeGlowTexture(theme.color),
      color: theme.color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(...position);
    sprite.scale.set(scale[0], scale[1], 1);
    sprite.userData.pulseGlow = true;
    sprite.userData.baseScale = [scale[0], scale[1]];
    sprite.userData.baseOpacity = opacity;
    sprite.userData.phase = phase;
    parent.add(sprite);
    return sprite;
  }

  function createRadiantBackdrop(theme) {
    addGlowSprite(scene, theme, [0, .2, -3.6], [10.5, 10.5], .36);
    addGlowSprite(scene, theme, [-4.6, 2.8, -2.8], [3.7, 3.7], .22, 1.8);
    addGlowSprite(scene, theme, [4.8, -2.5, -2.8], [3.4, 3.4], .2, 3.6);

    [-1, 1].forEach((side, index) => {
      const beamMaterial = new THREE.SpriteMaterial({
        map: makeGlowTexture(theme.color),
        color: theme.color,
        transparent: true,
        opacity: .11,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        rotation: side * .42
      });
      const beam = new THREE.Sprite(beamMaterial);
      beam.position.set(side * 4.1, 1.6, -3.1);
      beam.scale.set(2.3, 12, 1);
      beam.userData.lightBeam = true;
      beam.userData.phase = index * Math.PI;
      scene.add(beam);
    });
  }

  function makeSigilTexture(theme) {
    const c = document.createElement('canvas');
    c.width = c.height = 1024;
    const g = c.getContext('2d');
    const color = theme.color;
    g.translate(512, 512);
    g.strokeStyle = color;
    g.fillStyle = color;
    g.shadowColor = color;
    g.shadowBlur = 24;
    g.lineCap = 'round';

    [440, 378, 245].forEach((r, i) => {
      g.lineWidth = i === 0 ? 10 : 4;
      g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
    });

    g.lineWidth = 7;
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 4 / 6;
      const x = Math.cos(a) * 340, y = Math.sin(a) * 340;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.closePath(); g.stroke();

    g.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      g.save();
      g.rotate(a);
      g.beginPath(); g.moveTo(382, -20); g.lineTo(425, 0); g.lineTo(382, 20); g.stroke();
      g.fillRect(332, -4, 22, 8);
      g.restore();
    }

    const texture = new THREE.CanvasTexture(c);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  function createPortal(theme) {
    const group = new THREE.Group();
    group.name = 'portal';
    group.scale.setScalar(.05);
    group.userData.opacity = 0;

    const sigilMaterial = new THREE.MeshBasicMaterial({ map: makeSigilTexture(theme), color: theme.color, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const sigil = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 8.8), sigilMaterial);
    sigil.position.z = -2.35;
    sigil.rotation.x = -.08;
    sigil.name = 'sigil';
    group.add(sigil);

    const ringMaterial = new THREE.MeshBasicMaterial({ color: theme.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    [3.15, 3.65, 4.22].forEach((radius, i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .012 + i * .006, 8, 160), ringMaterial.clone());
      ring.position.z = -2.2 + i * .04;
      ring.name = `ring-${i}`;
      group.add(ring);
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), sigilMaterial.clone());
    floor.position.set(0, -3.2, -2.3);
    floor.rotation.x = -Math.PI * .41;
    floor.material.opacity = 0;
    floor.name = 'floor-sigil';
    group.add(floor);
    return group;
  }

  function createParticleVortex(theme, count) {
    const positions = new Float32Array(count * 3);
    const data = [];
    for (let i = 0; i < count; i++) {
      const d = {
        angle: Math.random() * Math.PI * 2,
        radius: .65 + Math.pow(Math.random(), .55) * 5.4,
        y: (Math.random() - .5) * 8,
        speed: .18 + Math.random() * .85,
        lift: .28 + Math.random() * .65,
        wobble: Math.random() * 6
      };
      data.push(d);
      positions[i * 3] = Math.cos(d.angle) * d.radius;
      positions[i * 3 + 1] = d.y;
      positions[i * 3 + 2] = -2 + Math.sin(d.angle) * d.radius * .32;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: theme.color, size: .055, sizeAttenuation: true, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    particleSystems.push({ points, data });
  }

  function updateParticles(dt, elapsed) {
    for (const system of particleSystems) {
      const p = system.points.geometry.attributes.position.array;
      system.data.forEach((d, i) => {
        d.angle += d.speed * dt;
        d.y += d.lift * dt;
        if (d.y > 4.3) d.y = -4.3;
        const pulse = 1 + Math.sin(elapsed * 1.4 + d.wobble) * .08;
        p[i * 3] = Math.cos(d.angle) * d.radius * pulse;
        p[i * 3 + 1] = d.y;
        p[i * 3 + 2] = -2.4 + Math.sin(d.angle) * d.radius * .32;
      });
      system.points.geometry.attributes.position.needsUpdate = true;
      system.points.rotation.z += dt * .035;
    }
  }

  function createBackTexture() {
    if (backTexture) return backTexture;
    const c = document.createElement('canvas');
    c.width = 600; c.height = 870;
    const g = c.getContext('2d');
    const gradient = g.createRadialGradient(300,435,25,300,435,520);
    gradient.addColorStop(0,'#ff9c28'); gradient.addColorStop(.18,'#7b2507'); gradient.addColorStop(.55,'#1c0b06'); gradient.addColorStop(1,'#000');
    g.fillStyle = '#0a0706'; g.fillRect(0,0,600,870);
    g.save(); g.translate(300,435);
    for (let i=0;i<95;i++) {
      g.rotate(.48);
      g.strokeStyle = `rgba(255,${70 + (i%4)*25},8,${.28 + (i%7)*.035})`;
      g.lineWidth = 5 + i%4;
      g.beginPath(); g.ellipse(0,0,38+i*4.2,9+i*.86,i*.31,0,Math.PI*1.6); g.stroke();
    }
    g.restore();
    g.strokeStyle='#b59a65'; g.lineWidth=9; g.strokeRect(13,13,574,844);
    g.strokeStyle='#2a2118'; g.lineWidth=5; g.strokeRect(28,28,544,814);
    backTexture = new THREE.CanvasTexture(c);
    backTexture.encoding = THREE.sRGBEncoding;
    backTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return backTexture;
  }

  function loadTexture(url) {
    if (textureCache.has(url)) return textureCache.get(url);
    const promise = new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(url, texture => {
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        resolve(texture);
      }, undefined, reject);
    });
    textureCache.set(url, promise);
    return promise;
  }

  async function createCard(url, theme) {
    const frontTexture = await loadTexture(url);
    const edge = new THREE.MeshPhysicalMaterial({ color: 0x9a732c, metalness: .82, roughness: .16, clearcoat: 1, clearcoatRoughness: .1, emissive: new THREE.Color(theme.color), emissiveIntensity: .08 });
    const front = new THREE.MeshPhysicalMaterial({ map: frontTexture, color: 0xffffff, roughness: .25, metalness: .08, clearcoat: .95, clearcoatRoughness: .13 });
    const back = new THREE.MeshPhysicalMaterial({ map: createBackTexture(), color: 0xffffff, roughness: .3, metalness: .1, clearcoat: .72 });
    const materials = [edge, edge, edge, edge, front, back];
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.17, 3.16, .085, 1, 1, 1), materials);
    body.castShadow = true;
    body.receiveShadow = true;

    const holoMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(theme.color) }, uPower: { value: .27 } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uPower;void main(){float band=pow(max(0.0,1.0-abs(fract(vUv.x*0.62+vUv.y*0.44+uTime*.08)-.5)*8.0),3.0);float edge=smoothstep(.12,0.0,vUv.x)*.25+smoothstep(.88,1.0,vUv.x)*.25;gl_FragColor=vec4(mix(vec3(.35,.72,1.0),uColor,vUv.y), (band+edge)*uPower);}',
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const holo = new THREE.Mesh(new THREE.PlaneGeometry(2.11,3.10), holoMaterial);
    holo.position.z = .044;

    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), new THREE.LineBasicMaterial({ color: theme.color, transparent: true, opacity: .68, blending: THREE.AdditiveBlending }));
    const group = new THREE.Group();
    const cardAura = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(theme.color), color: theme.color, transparent: true, opacity: .43, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true }));
    cardAura.position.z = -.14;
    cardAura.scale.set(4.15, 5.25, 1);
    cardAura.userData.pulseGlow = true;
    cardAura.userData.baseScale = [4.15, 5.25];
    cardAura.userData.baseOpacity = .43;
    cardAura.userData.phase = 1.1;
    group.add(cardAura, body, holo, outline);
    group.userData.holo = holoMaterial;
    group.userData.fadeMaterials = [...new Set([...materials, holoMaterial, outline.material])];
    return group;
  }

  function setCardOpacity(card, opacity) {
    card.userData.fadeMaterials.forEach(material => {
      material.transparent = opacity < .999 || material.transparent;
      material.opacity = opacity;
      if (material.uniforms?.uPower) material.uniforms.uPower.value = .27 * opacity;
    });
  }

  function revealPortal(token, intense = false) {
    portal.children.forEach(child => { child.material.opacity = 0; });
    const scaleTarget = intense ? 1.06 : .94;
    return Promise.all([
      tweenVector(portal.scale, { x:scaleTarget, y:scaleTarget, z:scaleTarget }, { duration: 1500, ease:EASE.outBack, token }),
      animate({ duration: 1100, token, update: t => portal.children.forEach((child,i) => child.material.opacity = t * (i === 0 ? .72 : .58)) })
    ]);
  }

  function createLightColumn(theme) {
    const material = new THREE.MeshBasicMaterial({ color: theme.color, transparent:true, opacity:0, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false });
    const column = new THREE.Mesh(new THREE.CylinderGeometry(.45,2.7,14,32,1,true), material);
    column.position.set(0,0,-1.5);
    scene.add(column);
    return column;
  }

  function createChains(theme) {
    const anchors = [[-6,4.4],[6,4.4],[-6,-4.4],[6,-4.4]];
    const groups = [];
    anchors.forEach(([ax,ay], chainIndex) => {
      const group = new THREE.Group();
      group.scale.setScalar(.02);
      group.userData.links = [];
      const count = 25;
      for (let i=0;i<count;i++) {
        const t = i/(count-1);
        const link = new THREE.Mesh(
          new THREE.TorusGeometry(.16,.043,8,18),
          new THREE.MeshPhysicalMaterial({ color:chainIndex%2 ? 0xb67720 : 0xe3bd5c, metalness:.92, roughness:.17, emissive:new THREE.Color(theme.color), emissiveIntensity:.1 })
        );
        link.position.set(mix(ax,0,t),mix(ay,0,t),-1.1 + Math.sin(t*Math.PI)*.4);
        link.rotation.set(i%2 ? Math.PI/2 : 0, i%2 ? 0 : Math.PI/2, Math.atan2(-ay,-ax));
        link.castShadow = true;
        group.add(link);
        group.userData.links.push(link);
      }
      scene.add(group);
      groups.push(group);
    });
    return groups;
  }

  function shatterChains(chains) {
    chains.forEach(group => {
      group.updateMatrixWorld(true);
      group.userData.links.forEach(link => {
        const world = new THREE.Vector3();
        link.getWorldPosition(world);
        scene.attach(link);
        link.userData.velocity = world.clone().normalize().multiplyScalar(2.7 + Math.random()*4.5);
        link.userData.velocity.z = 1.8 + Math.random()*3;
        link.userData.spin = new THREE.Vector3(Math.random()*8,Math.random()*8,Math.random()*8);
        looseLinks.push(link);
      });
      scene.remove(group);
    });
  }

  function updateLooseLinks(dt) {
    looseLinks.forEach(link => {
      link.userData.velocity.y -= 3.8*dt;
      link.position.addScaledVector(link.userData.velocity,dt);
      link.rotation.x += link.userData.spin.x*dt;
      link.rotation.y += link.userData.spin.y*dt;
      link.rotation.z += link.userData.spin.z*dt;
    });
  }

  function createLightning(theme, amount = 5) {
    for (let n=0;n<amount;n++) {
      const points=[];
      const x=(Math.random()-.5)*7;
      for(let i=0;i<12;i++) points.push(new THREE.Vector3(x+(Math.random()-.5)*.75,5-i*.85,-1.2+(Math.random()-.5)*.8));
      const geometry=new THREE.BufferGeometry().setFromPoints(points);
      const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({ color:theme.color, transparent:true, opacity:1, blending:THREE.AdditiveBlending }));
      const core=new THREE.Line(geometry.clone(),new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:.7, blending:THREE.AdditiveBlending }));
      core.position.z=.018;
      scene.add(line,core);
      const life=.24+Math.random()*.38;
      transientLines.push({line,life},{line:core,life:life*.72});
    }
  }

  function updateTransientLines(dt) {
    transientLines = transientLines.filter(item => {
      item.life -= dt;
      item.line.material.opacity = Math.max(0,item.life*3);
      if(item.life<=0){ scene.remove(item.line); disposeObject(item.line); return false; }
      return true;
    });
  }

  function createEnergyWings(theme) {
    const group = new THREE.Group();
    [-1, 1].forEach(side => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.bezierCurveTo(side*1.1, 1.55, side*3.25, 2.15, side*4.7, .82);
      shape.bezierCurveTo(side*3.45, .48, side*2.45, .02, side*1.18, -.12);
      shape.bezierCurveTo(side*2.3, -.5, side*3.45, -1.15, side*4.12, -2.0);
      shape.bezierCurveTo(side*2.28, -1.45, side*.86, -.72, 0, 0);
      const geometry = new THREE.ShapeGeometry(shape, 24);
      const material = new THREE.MeshBasicMaterial({ color:theme.color, transparent:true, opacity:.14, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false });
      const wing = new THREE.Mesh(geometry, material);
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color:theme.color, transparent:true, opacity:.82, blending:THREE.AdditiveBlending }));
      wing.add(edge);
      wing.userData.energyWing = side;
      group.add(wing);
    });
    group.position.set(0, .35, -1.45);
    scene.add(group);
    addGlowSprite(scene, theme, [0,.45,-2.1], [9.5,5.5], .3, 2.1);
  }

  function createRuneOrbit(theme) {
    for(let i=0;i<18;i++){
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.13,.022,6,28),new THREE.MeshBasicMaterial({color:theme.color,transparent:true,opacity:.86,blending:THREE.AdditiveBlending}));
      const a=i/18*Math.PI*2;
      ring.position.set(Math.cos(a)*3.55,Math.sin(a)*2.38,-.55);
      ring.rotation.x=Math.PI/2;
      ring.userData.orbit=a;
      ring.userData.radius=3.55;
      ring.userData.radiusY=2.38;
      scene.add(ring);
    }
    addGlowSprite(scene, theme, [-3.1,1.65,-.9], [1.25,1.25], .65, .4);
    addGlowSprite(scene, theme, [3.15,-1.45,-.9], [1.4,1.4], .65, 2.8);
  }

  function createSolarCrown(theme) {
    const sunMat = new THREE.MeshBasicMaterial({ color:theme.color, transparent:true, opacity:.48, blending:THREE.AdditiveBlending, depthWrite:false });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(2.2,48,48),sunMat);
    sun.position.set(0,1,-4.25);
    sun.userData.solarCore = true;
    scene.add(sun);
    addGlowSprite(scene, theme, [0,1,-4], [10.8,10.8], .52, 1.2);
    const crown = new THREE.Group();
    for(let i=0;i<24;i++){
      const ray = new THREE.Mesh(new THREE.BoxGeometry(.045,1.45+(i%3)*.32,.02),new THREE.MeshBasicMaterial({color:theme.color,transparent:true,opacity:.48,blending:THREE.AdditiveBlending,depthWrite:false}));
      const a=i/24*Math.PI*2;
      ray.position.set(Math.cos(a)*3.05,1+Math.sin(a)*3.05,-3.75);
      ray.rotation.z=a-Math.PI/2;
      crown.add(ray);
    }
    crown.userData.spinCrown=true;
    scene.add(crown);
  }

  function createObeliskImpact(theme) {
    for(let i=0;i<5;i++){
      const ring = new THREE.Mesh(new THREE.RingGeometry(.75,.83,64),new THREE.MeshBasicMaterial({color:theme.color,transparent:true,opacity:.46-i*.055,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
      ring.position.set(0,-1.15,-1.3-i*.08);
      ring.userData.baseScale=1+i*.75;
      ring.scale.setScalar(ring.userData.baseScale);
      ring.userData.shockRing=true;
      ring.userData.phase=i*.95;
      scene.add(ring);
    }
    [-1,1].forEach(side=>{
      const fist=new THREE.Group();
      const mat=new THREE.MeshStandardMaterial({color:theme.color,emissive:new THREE.Color(theme.color),emissiveIntensity:1.25,transparent:true,opacity:.58,metalness:.45,roughness:.25});
      const palm=new THREE.Mesh(new THREE.BoxGeometry(1.15,1.45,.65),mat);
      fist.add(palm);
      for(let i=0;i<4;i++){
        const knuckle=new THREE.Mesh(new THREE.BoxGeometry(.25,.42,.72),mat);
        knuckle.position.set(-.43+i*.29,.88,.03);
        fist.add(knuckle);
      }
      fist.position.set(side*3.3,-.55,-.85);
      fist.userData.baseY=-.55;
      fist.rotation.z=side*.34;
      fist.userData.energyFist=side;
      scene.add(fist);
      addGlowSprite(scene,theme,[side*3.3,-.55,-1.05],[2.5,2.5],.48,side<0?0:2.5);
    });
  }

  function createSliferStorm(theme) {
    const coilGroup=new THREE.Group();
    for(let coil=0;coil<2;coil++){
      const points=[];
      for(let i=0;i<70;i++){
        const t=i/69;
        const angle=t*Math.PI*3.6+coil*Math.PI;
        const radius=3.45-t*.55;
        points.push(new THREE.Vector3(Math.cos(angle)*radius,-3.25+t*6.5,-1.45+Math.sin(angle)*.42));
      }
      const curve=new THREE.CatmullRomCurve3(points);
      const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,90,.055,8,false),new THREE.MeshBasicMaterial({color:theme.color,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));
      coilGroup.add(tube);
    }
    coilGroup.userData.stormCoil=true;
    scene.add(coilGroup);
    addGlowSprite(scene,theme,[0,0,-2.4],[10,8],.34,1.7);
  }

  function createIceShards(theme) {
    for(let i=0;i<28;i++){
      const shard=new THREE.Mesh(new THREE.TetrahedronGeometry(.08+Math.random()*.2),new THREE.MeshBasicMaterial({color:i%3?theme.color:0xffffff,transparent:true,opacity:.5+Math.random()*.38,blending:THREE.AdditiveBlending,depthWrite:false}));
      const a=Math.random()*Math.PI*2, radius=2.7+Math.random()*2.3;
      shard.position.set(Math.cos(a)*radius,(Math.random()-.5)*6.2,-.4-Math.random()*2.4);
      shard.userData.iceShard=true;
      shard.userData.spin=(Math.random()-.5)*2.6;
      scene.add(shard);
    }
  }

  function addThemeSetPiece(key, theme) {
    scene.userData.themeKey=key;
    if(key==='blue-eyes'){createEnergyWings(theme);createIceShards(theme);}
    if(key==='dark-magician')createRuneOrbit(theme);
    if(key==='ra')createSolarCrown(theme);
    if(key==='obelisk')createObeliskImpact(theme);
    if(key==='slifer')createSliferStorm(theme);
    if (key === 'blue-eyes' || key === 'obelisk' || key === 'slifer') {
      scene.userData.lightningTheme=theme;
      scene.userData.nextLightning=.35;
      scene.userData.lightningRate=key==='slifer'?.48:key==='obelisk'?.72:1.05;
      createLightning(theme,10);
    }
  }

  function triggerLightBurst(theme,token) {
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:makeGlowTexture(theme.color),color:theme.color,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false}));
    sprite.position.set(0,.1,-.15);
    sprite.scale.set(.3,.3,1);
    const light=new THREE.PointLight(new THREE.Color(theme.color),0,26,1.45);
    light.position.set(0,.2,2.6);
    scene.add(sprite,light);
    animate({duration:1050,token,ease:EASE.outCubic,update:t=>{
      const s=.3+t*10.5;
      sprite.scale.set(s,s,1);
      sprite.material.opacity=(1-t)*.9;
      light.intensity=Math.sin(t*Math.PI)*380;
    }});
  }

  function flash() {
    flashEl.classList.remove('fire');
    void flashEl.offsetWidth;
    flashEl.classList.add('fire');
  }

  function resetFallback() {
    fallbackScene.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
    fallbackScene.querySelectorAll('.fallback-theme-fx').forEach(node=>node.remove());
    fallbackCards.replaceChildren();
    fallbackChains.replaceChildren();
    fallbackParticles.replaceChildren();
    fallbackScene.classList.remove('active');
    fallbackScene.querySelector('.fallback-portal').classList.remove('open');
  }

  function buildFallbackParticles() {
    for(let i=0;i<150;i++){
      const particle=document.createElement('i');
      particle.className='fallback-particle';
      particle.style.left=`${Math.random()*100}%`;
      particle.style.top=`${35+Math.random()*80}%`;
      particle.style.setProperty('--duration',`${2.4+Math.random()*3.8}s`);
      particle.style.setProperty('--delay',`${-Math.random()*5}s`);
      particle.style.setProperty('--drift',`${(Math.random()-.5)*180}px`);
      fallbackParticles.appendChild(particle);
    }
  }

  function buildFallbackTheme(key) {
    if(key==='exodia')return;
    const fx=document.createElement('div');
    fx.className=`fallback-theme-fx ${key}`;
    const counts={'blue-eyes':24,'dark-magician':18,ra:24,obelisk:5,slifer:14};
    for(let i=0;i<(counts[key]||12);i++){
      const spark=document.createElement('i');
      spark.style.setProperty('--i',i);
      spark.style.setProperty('--a',`${i*360/(counts[key]||12)}deg`);
      spark.style.setProperty('--x',`${8+Math.random()*84}%`);
      spark.style.setProperty('--y',`${8+Math.random()*78}%`);
      spark.style.setProperty('--size',`${120+i*105}px`);
      spark.style.setProperty('--tilt',`${-18+i*3}deg`);
      spark.style.setProperty('--delay',`${-Math.random()*3}s`);
      if(key==='dark-magician')spark.textContent=i%2?'✦':'◇';
      fx.appendChild(spark);
    }
    fallbackScene.appendChild(fx);
  }

  function makeFallbackCard(url){
    const card=document.createElement('div');
    card.className='fallback-card';
    const img=document.createElement('img');
    img.src=url; img.alt='';
    card.appendChild(img);
    fallbackCards.appendChild(card);
    return card;
  }

  function cssAnimate(element,keyframes,options){
    const animation=element.animate(keyframes,{fill:'forwards',...options});
    return animation.finished.catch(()=>false);
  }

  function buildFallbackChains(){
    const rotations=[22,158,-22,202];
    return rotations.map(rotation=>{
      const chain=document.createElement('i');
      chain.className='fallback-chain';
      chain.dataset.rotation=rotation;
      chain.style.transform=`rotate(${rotation}deg) translateX(0) scaleX(.02)`;
      fallbackChains.appendChild(chain);
      return chain;
    });
  }

  async function playFallback(key,token){
    resetFallback();
    fallbackScene.classList.add('active');
    buildFallbackParticles();
    buildFallbackTheme(key);
    const portalEl=fallbackScene.querySelector('.fallback-portal');
    portalEl.classList.add('open');
    setStatus(key==='exodia'?'ROMPENDO O SELO ANCESTRAL':'O PORTAL RECONHECE A CARTA');
    playRumble();
    await sleep(900,token);
    if(!isActive(token))return;

    if(key==='exodia'){
      const targets=[[0,-150],[-190,-18],[190,-18],[-100,165],[100,165]];
      const cards=[];
      for(let i=0;i<EXODIA_PARTS.length;i++){
        const card=makeFallbackCard(EXODIA_PARTS[i][0]); cards.push(card);
        const fromX=(i===0?0:(i%2?-1:1))*(innerWidth*.72);
        const fromY=i===0?-innerHeight*.7:(i<3?0:innerHeight*.65);
        playWhoosh(.05);
        cssAnimate(card,[
          {opacity:0,transform:`translate(-50%,-50%) translate3d(${fromX}px,${fromY}px,-900px) scale(.12) rotateY(${i%2?-720:720}deg) rotateZ(${i%2?-35:35}deg)`},
          {opacity:1,offset:.72,transform:`translate(-50%,-50%) translate3d(${targets[i][0]}px,${targets[i][1]}px,90px) scale(.74) rotateY(-12deg)`},
          {opacity:1,transform:`translate(-50%,-50%) translate3d(${targets[i][0]}px,${targets[i][1]}px,35px) scale(.68) rotateY(0)`}
        ],{duration:1100,easing:'cubic-bezier(.16,.84,.32,1)'});
        await sleep(310,token);
      }
      await sleep(850,token);
      if(!isActive(token))return;
      flash();impact();setStatus('AS CINCO PARTES RESPONDERAM');
      const chains=buildFallbackChains();
      await Promise.all(chains.map((chain,i)=>cssAnimate(chain,[
        {opacity:0,transform:`rotate(${chain.dataset.rotation}deg) translateX(0) scaleX(.02)`},
        {opacity:1,transform:`rotate(${chain.dataset.rotation}deg) translateX(0) scaleX(1)`}
      ],{duration:650,delay:i*75,easing:'cubic-bezier(.2,.8,.2,1)'})));
      setStatus('PODER INFINITO EM CONVERGÊNCIA');
      await Promise.all(cards.map((card,i)=>cssAnimate(card,[
        {filter:'brightness(1)',transform:getComputedStyle(card).transform},
        {opacity:0,filter:'brightness(3) blur(7px)',transform:`translate(-50%,-50%) translate3d(0,0,260px) scale(.12) rotateY(${720+i*90}deg)`}
      ],{duration:1050,delay:i*45,easing:'ease-in'})));
      if(!isActive(token))return;
      chains.forEach((chain,i)=>cssAnimate(chain,[
        {opacity:1,transform:`rotate(${chain.dataset.rotation}deg) scaleX(1)`},
        {opacity:0,filter:'brightness(4)',transform:`rotate(${Number(chain.dataset.rotation)+(i%2?-18:18)}deg) translateY(${i%2?-180:180}px) scaleX(1.18)`}
      ],{duration:750,easing:'ease-out'}));
      flash();impact();setStatus('EXODIA ATRAVESSA O PORTAL');
      const finalCard=makeFallbackCard(currentTheme.image);
      await cssAnimate(finalCard,[
        {opacity:0,filter:'brightness(.25) blur(7px)',transform:'translate(-50%,-50%) translate3d(0,0,-1100px) scale(.12) rotateY(1080deg)'},
        {opacity:1,filter:'brightness(1.35) blur(0)',offset:.82,transform:'translate(-50%,-50%) translate3d(0,-35px,140px) scale(1.32) rotateY(-8deg)'},
        {opacity:1,filter:'brightness(1.06)',transform:'translate(-50%,-50%) translate3d(0,-35px,95px) scale(1.24) rotateY(0)'}
      ],{duration:2350,easing:'cubic-bezier(.16,.84,.32,1)'});
      if(!isActive(token))return;
    }else{
      const card=makeFallbackCard(currentTheme.image);
      if(['blue-eyes','obelisk','slifer'].includes(key)){
        fallbackScene.style.filter='brightness(1.18)';
        setTimeout(()=>fallbackScene.style.filter='',500);
      }
      playWhoosh(.18);
      await cssAnimate(card,[
        {opacity:0,filter:'brightness(.35) blur(8px)',transform:'translate(-50%,-50%) translate3d(0,0,-1200px) scale(.1) rotateY(1260deg) rotateX(35deg)'},
        {opacity:1,filter:'brightness(1.45) blur(0)',offset:.78,transform:'translate(-50%,-50%) translate3d(0,-28px,150px) scale(1.38) rotateY(-12deg)'},
        {opacity:1,filter:'brightness(1.05)',transform:'translate(-50%,-50%) translate3d(0,-28px,90px) scale(1.28) rotateY(0)'}
      ],{duration:2850,easing:'cubic-bezier(.16,.84,.32,1)'});
      if(!isActive(token))return;
      flash();impact();
    }
    copy.classList.add('reveal');
    setStatus('INVOCAÇÃO CONCLUÍDA');
  }

  function impact() {
    stage.classList.remove('impact');
    void stage.offsetWidth;
    stage.classList.add('impact');
    playImpactSound();
  }

  function setStatus(text) { statusEl.textContent = text; }

  async function playExodia(token) {
    setStatus('ROMPENDO O SELO ANCESTRAL');
    playRumble();
    await revealPortal(token,true);
    if (!isActive(token)) return;

    const cards = [];
    for (let i=0;i<EXODIA_PARTS.length;i++) {
      const [url,x,y] = EXODIA_PARTS[i];
      const card = await createCard(url,currentTheme);
      if (!isActive(token)) return;
      const angle = i/EXODIA_PARTS.length*Math.PI*2 - Math.PI/2;
      card.position.set(Math.cos(angle)*9,Math.sin(angle)*6,-8-Math.random()*3);
      card.rotation.set((Math.random()-.5)*1.5,(i%2 ? -1 : 1)*Math.PI*1.4,(Math.random()-.5)*1.2);
      card.scale.setScalar(.52);
      scene.add(card); cards.push(card);
      playWhoosh(.1+i*.03);
      const arrival = Promise.all([
        tweenVector(card.position,{x,y,z:-.35},{duration:980,ease:EASE.outBack,token}),
        tweenVector(card.rotation,{x:0,y:0,z:0},{duration:1050,ease:EASE.outCubic,token}),
        tweenVector(card.scale,{x:.63,y:.63,z:.63},{duration:900,ease:EASE.outBack,token})
      ]);
      await sleep(330,token);
      if (i===EXODIA_PARTS.length-1) await arrival;
    }

    if (!isActive(token)) return;
    setStatus('AS CINCO PARTES RESPONDERAM');
    flash(); impact();
    const chains = createChains(currentTheme);
    await Promise.all(chains.map((group,i)=>tweenVector(group.scale,{x:1,y:1,z:1},{duration:720,delay:i*70,ease:EASE.outBack,token})));
    await sleep(420,token);
    if (!isActive(token)) return;

    setStatus('PODER INFINITO EM CONVERGÊNCIA');
    const column = createLightColumn(currentTheme);
    animate({duration:800,token,update:t=>column.material.opacity=t*.42});
    await Promise.all(cards.map((card,i)=>Promise.all([
      tweenVector(card.position,{x:0,y:.05,z:-1.4},{duration:1050,delay:i*55,ease:EASE.inOutCubic,token}),
      tweenVector(card.rotation,{x:0,y:Math.PI*4,z:i*Math.PI*2/5},{duration:1100,delay:i*55,ease:EASE.inOutCubic,token}),
      tweenVector(card.scale,{x:.08,y:.08,z:.08},{duration:1050,delay:i*55,ease:EASE.inOutCubic,token}),
      animate({duration:700,delay:420+i*40,token,update:t=>setCardOpacity(card,1-t)})
    ])));

    if (!isActive(token)) return;
    shatterChains(chains);
    flash(); impact(); createLightning(currentTheme,9);
    setStatus('EXODIA ATRAVESSA O PORTAL');

    const finalCard = await createCard(currentTheme.image,currentTheme);
    if (!isActive(token)) return;
    finalCard.position.set(0,-.15,-13);
    finalCard.rotation.set(.35,Math.PI,0);
    finalCard.scale.setScalar(.12);
    scene.add(finalCard);
    playWhoosh(.32);
    await Promise.all([
      tweenVector(finalCard.position,{x:0,y:.28,z:.35},{duration:2400,ease:EASE.outBack,token}),
      tweenVector(finalCard.rotation,{x:0,y:Math.PI*4,z:0},{duration:2350,ease:EASE.outCubic,token}),
      tweenVector(finalCard.scale,{x:1.32,y:1.32,z:1.32},{duration:2200,ease:EASE.outBack,token}),
      animate({duration:1500,token,update:t=>column.material.opacity=(1-t)*.52})
    ]);

    if (!isActive(token)) return;
    mainCard = finalCard;
    mainCard.userData.baseY = .28;
    copy.classList.add('reveal');
    setStatus('INVOCAÇÃO CONCLUÍDA');
    flash(); impact();
  }

  async function playSingle(key, token) {
    setStatus('O PORTAL RECONHECE A CARTA');
    playRumble();
    await revealPortal(token,false);
    if (!isActive(token)) return;
    addThemeSetPiece(key,currentTheme);
    const summonColumn = createLightColumn(currentTheme);
    summonColumn.material.opacity = 0;

    const card = await createCard(currentTheme.image,currentTheme);
    if (!isActive(token)) return;
    card.position.set(0,-.2,-13);
    card.rotation.set(.5,Math.PI,0);
    card.scale.setScalar(.16);
    scene.add(card);
    setStatus('ENERGIA LENDÁRIA DETECTADA');
    playWhoosh(.2);

    await Promise.all([
      tweenVector(card.position,{x:0,y:.18,z:.22},{duration:2750,ease:EASE.outBack,token}),
      tweenVector(card.rotation,{x:0,y:Math.PI*4,z:0},{duration:2700,ease:EASE.outCubic,token}),
      tweenVector(card.scale,{x:1.38,y:1.38,z:1.38},{duration:2450,ease:EASE.outBack,token}),
      animate({duration:2750,token,update:t=>summonColumn.material.opacity=Math.sin(t*Math.PI)*.46})
    ]);
    if (!isActive(token)) return;

    if (key === 'blue-eyes' || key === 'obelisk' || key === 'slifer') createLightning(currentTheme,10);
    triggerLightBurst(currentTheme,token);
    flash(); impact();
    mainCard = card;
    mainCard.userData.baseY = .18;
    copy.classList.add('reveal');
    setStatus('INVOCAÇÃO CONCLUÍDA');
  }

  function updateScene(dt, elapsed) {
    updateParticles(dt,elapsed);
    updateLooseLinks(dt);
    updateTransientLines(dt);
    if(scene?.userData.lightningTheme && elapsed>=scene.userData.nextLightning){
      createLightning(scene.userData.lightningTheme,scene.userData.themeKey==='slifer'?7:4);
      scene.userData.nextLightning=elapsed+scene.userData.lightningRate+Math.random()*.35;
    }
    if (portal) {
      const sigil=portal.getObjectByName('sigil');
      if(sigil) sigil.rotation.z += dt*.13;
      portal.children.forEach((child,i)=>{ if(child.name.startsWith('ring-')) child.rotation.z += dt*(i%2 ? -.2 : .14); });
    }
    scene?.traverse(obj => {
      if (obj.userData?.holo) obj.userData.holo.uniforms.uTime.value = elapsed;
      if (obj.userData?.pulseLight) obj.intensity=obj.userData.baseIntensity*(.88+Math.sin(elapsed*2.2+obj.userData.phase)*.18);
      if (obj.userData?.pulseGlow) {
        const pulse=1+Math.sin(elapsed*1.75+obj.userData.phase)*.08;
        obj.scale.set(obj.userData.baseScale[0]*pulse,obj.userData.baseScale[1]*pulse,1);
        obj.material.opacity=obj.userData.baseOpacity*(.84+Math.sin(elapsed*2.05+obj.userData.phase)*.16);
      }
      if (obj.userData?.lightBeam) obj.material.opacity=.065+Math.sin(elapsed*1.35+obj.userData.phase)*.025;
      if (obj.userData?.orbit !== undefined) {
        obj.userData.orbit += dt*.35;
        obj.position.x=Math.cos(obj.userData.orbit)*(obj.userData.radius||3.3);
        obj.position.y=Math.sin(obj.userData.orbit)*(obj.userData.radiusY||2.25);
      }
      if(obj.userData?.energyWing) obj.rotation.y=obj.userData.energyWing*(.07+Math.sin(elapsed*1.7)*.1);
      if(obj.userData?.solarCore){const s=1+Math.sin(elapsed*2.4)*.065;obj.scale.setScalar(s);obj.material.opacity=.44+Math.sin(elapsed*2.4)*.09;}
      if(obj.userData?.spinCrown)obj.rotation.z+=dt*.11;
      if(obj.userData?.shockRing){const wave=.94+(Math.sin(elapsed*2.1+obj.userData.phase)+1)*.09;obj.scale.setScalar(obj.userData.baseScale*wave);obj.material.opacity=.22+(Math.sin(elapsed*2.1+obj.userData.phase)+1)*.11;}
      if(obj.userData?.energyFist){obj.position.y=obj.userData.baseY+Math.sin(elapsed*1.9+(obj.userData.energyFist>0?Math.PI:0))*.22;obj.rotation.y=Math.sin(elapsed*1.3)*.12;}
      if(obj.userData?.stormCoil){obj.rotation.z+=dt*.12;obj.rotation.y=Math.sin(elapsed*.65)*.09;}
      if(obj.userData?.iceShard){obj.rotation.x+=dt*obj.userData.spin;obj.rotation.y+=dt*obj.userData.spin*.7;}
    });
    pointer.x += (pointer.tx-pointer.x)*.055;
    pointer.y += (pointer.ty-pointer.y)*.055;
    if(mainCard){
      mainCard.rotation.y = pointer.x*.26;
      mainCard.rotation.x = -pointer.y*.18;
      mainCard.position.y = mainCard.userData.baseY + Math.sin(elapsed*1.25)*.09;
      camera.position.x = pointer.x*.36;
      camera.position.y = .1 + pointer.y*.22;
      camera.lookAt(0,0,-1);
    }
  }

  function frame(now) {
    frameId = requestAnimationFrame(frame);
    if(!scene || !renderer || !camera) return;
    const dt=Math.min(clock.getDelta(),.035);
    const elapsed=clock.elapsedTime;
    updateTweens(now);
    updateScene(dt,elapsed);
    renderer.render(scene,camera);
  }

  function resizeRenderer() {
    if(!renderer || !camera) return;
    const w=stage.clientWidth, h=stage.clientHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
  }

  async function startSummon(key) {
    const theme=LEGENDS[key] || LEGENDS.exodia;
    currentTheme=theme;
    activeRun++;
    const token=activeRun;
    overlay.style.setProperty('--scene',theme.color);
    overlay.style.setProperty('--scene-rgb',theme.rgb);
    kickerEl.textContent=theme.kicker;
    titleEl.textContent=theme.title;
    subtitleEl.textContent=theme.subtitle;
    copy.classList.remove('reveal');
    errorEl.hidden=true;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    setStatus('ABRINDO O PORTAL');

    resetFallback();
    // Navegadores bloqueiam imagens locais como texturas WebGL em páginas file://.
    // Nesse caso, usamos automaticamente a cena CSS 3D, que funciona ao abrir
    // index.html diretamente pela pasta e mantém todas as invocações temáticas.
    const forceCompatibleMode = location.protocol === 'file:' || new URLSearchParams(location.search).has('fallback');
    if(forceCompatibleMode || !initRenderer()){
      canvas.style.display='none';
      await playFallback(key,token);
      return;
    }
    canvas.style.display='block';
    resetScene(theme);
    cancelAnimationFrame(frameId);
    frameId=requestAnimationFrame(frame);
    primeAudio();
    try {
      if(key==='exodia') await playExodia(token);
      else await playSingle(key,token);
    } catch(error) {
      console.error('A invocação foi interrompida:',error);
      if(isActive(token)){
        setStatus('FALHA AO CARREGAR A CARTA');
        errorEl.hidden=false;
        errorEl.querySelector('b').textContent='A imagem da carta não pôde ser carregada.';
        errorEl.querySelector('span').textContent='Confirme se a pasta assets está ao lado do arquivo index.html.';
      }
    }
  }

  function closeSummon() {
    activeRun++;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    copy.classList.remove('reveal');
    cancelTweens();
    resetFallback();
    setTimeout(()=>{
      if(!overlay.classList.contains('open')){
        cancelAnimationFrame(frameId);
        frameId=0;
        if(scene) disposeObject(scene);
        scene=null; mainCard=null; portal=null;
      }
    },380);
  }

  function primeAudio(){
    if(!soundEnabled) return;
    audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioContext.state==='suspended') audioContext.resume();
  }

  function tone(freq,duration,type='sine',gain=.05,delay=0){
    if(!soundEnabled) return;
    primeAudio();
    const now=audioContext.currentTime+delay;
    const osc=audioContext.createOscillator();
    const amp=audioContext.createGain();
    osc.type=type; osc.frequency.setValueAtTime(freq,now); osc.frequency.exponentialRampToValueAtTime(Math.max(24,freq*.55),now+duration);
    amp.gain.setValueAtTime(.0001,now); amp.gain.exponentialRampToValueAtTime(gain,now+.035); amp.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(amp).connect(audioContext.destination); osc.start(now); osc.stop(now+duration+.05);
  }

  function playRumble(){ tone(52,2.8,'sawtooth',.025); tone(38,3.4,'sine',.065,.08); }
  function playWhoosh(offset=0){ tone(390,1.05,'triangle',.025,offset); tone(95,.95,'sawtooth',.018,offset); }
  function playImpactSound(){ tone(58,.8,'square',.055); tone(120,.45,'sine',.08); tone(820,.16,'triangle',.026); }

  document.querySelectorAll('[data-summon]').forEach(button => button.addEventListener('click',()=>startSummon(button.dataset.summon)));
  document.getElementById('randomSummon').addEventListener('click',()=>{
    const keys=Object.keys(LEGENDS);
    startSummon(keys[Math.floor(Math.random()*keys.length)]);
  });
  document.getElementById('closeSummon').addEventListener('click',closeSummon);
  soundToggle.addEventListener('click',()=>{
    soundEnabled=!soundEnabled;
    soundToggle.setAttribute('aria-pressed',String(soundEnabled));
    soundToggle.textContent=`Som: ${soundEnabled?'ligado':'desligado'}`;
    if(soundEnabled){ primeAudio(); tone(440,.15,'sine',.025); }
  });
  window.addEventListener('keydown',event=>{ if(event.key==='Escape'&&overlay.classList.contains('open')) closeSummon(); });
  window.addEventListener('resize',resizeRenderer);
  window.addEventListener('pointermove',event=>{
    pointer.tx=(event.clientX/innerWidth)*2-1;
    pointer.ty=-((event.clientY/innerHeight)*2-1);
  },{passive:true});
})();
