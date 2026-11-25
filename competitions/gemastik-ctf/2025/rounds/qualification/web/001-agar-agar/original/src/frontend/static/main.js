(() => {
  const canvas = document.getElementById('game');
  const starsCanvas = document.getElementById('stars');

  const starsCtx = starsCanvas.getContext('2d');
  let stars = [];
  function resizeStars() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    starsCanvas.width = Math.floor(window.innerWidth * dpr);
    starsCanvas.height = Math.floor(window.innerHeight * dpr);
    starsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // generate stars
    const count = Math.floor((window.innerWidth * window.innerHeight) / 3000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.6 + 0.2,
      a: Math.random() * 0.6 + 0.4,
      s: Math.random() * 0.4 + 0.1, // parallax speed
    }));
  }
  function drawStars(cx, cy) {
    starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
    starsCtx.save();
    for (const st of stars) {
      const px = (st.x - (cx * st.s) % window.innerWidth + window.innerWidth) % window.innerWidth;
      const py = (st.y - (cy * st.s) % window.innerHeight + window.innerHeight) % window.innerHeight;
      starsCtx.globalAlpha = st.a;
      starsCtx.fillStyle = '#cbd5e1';
      starsCtx.beginPath();
      starsCtx.arc(px, py, st.r, 0, Math.PI * 2);
      starsCtx.fill();
    }
    starsCtx.restore();
  }
  window.addEventListener('resize', resizeStars);
  resizeStars();

  // --- Renderer & Scene (Three.js)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const scene = new THREE.Scene();

  let camera;
  function createOrthoCamera() {
    const { width, height } = canvas.getBoundingClientRect();
    const halfH = height / 2;
    const halfW = width / 2;
    camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 2000);
    camera.position.set(0, 0, 500);
    camera.lookAt(0, 0, 0);
  }
  function setRendererSize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    renderer.setPixelRatio(dpr);
    renderer.setSize(rect.width, rect.height, false);
    if (!camera) createOrthoCamera();
    const halfH = rect.height / 2;
    const halfW = rect.width / 2;
    camera.left = -halfW; camera.right = halfW; camera.top = halfH; camera.bottom = -halfH;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', setRendererSize);
  setRendererSize();

  // World grid
  const grid = new THREE.GridHelper(2500, 50, 0x243244, 0x18202a);
  grid.rotation.x = Math.PI / 2; grid.position.set(1250, 1250, 0); grid.frustumCulled = false; scene.add(grid);

  // UI: leaderboard
  const board = document.getElementById('board');
  function renderBoard(list) {
    if (!board) return;
    board.innerHTML = '<div class="title">Leaderboard</div>' +
      list.map(item => `<div class="row"><span></span><span>${Number(item.mass).toFixed(1)}</span></div>`).join('');
    const rows = board.querySelectorAll('.row');
    rows.forEach((row, idx) => {
      const span = row.firstChild;
      if (span && list[idx]) span.textContent = String(list[idx].name || 'Player');
    });
  }

  // Name input
  const nameInput = document.getElementById('nameInput');
  const nameBtn = document.getElementById('nameBtn');
  const skinUrl = document.getElementById('skinUrl');
  const skinFetchBtn = document.getElementById('skinFetchBtn');

  // Boost bar
  const boostBar = document.querySelector('#boostbar .fill');
  let boostFuelPct = 100;
  let boosting = false;

  // State
  const state = {
    myId: null,
    worldSize: 2500,
    players: [],
    pellets: [],
    stars: [],
    galaxies: [],
    blackholes: [],
    leaderboard: [],
    myPlayer: null,
    camera: { x: 0, y: 0, zoom: 1, shake: 0 },
    mouseX: 0,
    mouseY: 0,
  };

  // Helpers
  function radiusFromMass(m) { return Math.sqrt(Math.max(0.0001, m)) * 4; }
  const pelletMass = 1;
  const pelletRadius = Math.max(2, radiusFromMass(pelletMass) * 0.65);
  const starRadiusFn = (m) => radiusFromMass(m);
  const galaxyRadiusFn = (m) => radiusFromMass(m) * 1.1;
  const blackholeRadiusFn = (m) => radiusFromMass(m) * 1.2;

  // Geoms/Mats
  const circleGeomPellet = new THREE.CircleGeometry(pelletRadius, 18);
  const circleGeomUnit = new THREE.CircleGeometry(1, 24);
  const ringGeomUnit = new THREE.RingGeometry(1.15, 1.7, 48);
  const matPellet = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const matStar = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  const matGalaxy = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
  const matBlackhole = new THREE.MeshBasicMaterial({ color: 0x111827 });
  const matBlackholeGlow = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
  const matProtection = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.35, side: THREE.DoubleSide });

  // Instanced collectibles
  const pelletsMesh = new THREE.InstancedMesh(circleGeomPellet, matPellet, 600);
  pelletsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  pelletsMesh.frustumCulled = false;
  scene.add(pelletsMesh);

  const starsMesh = new THREE.InstancedMesh(circleGeomUnit, matStar, 64);
  starsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  starsMesh.frustumCulled = false;
  scene.add(starsMesh);

  const galaxiesMesh = new THREE.InstancedMesh(circleGeomUnit, matGalaxy, 64);
  galaxiesMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  galaxiesMesh.frustumCulled = false;
  scene.add(galaxiesMesh);

  const blackholesMesh = new THREE.InstancedMesh(circleGeomUnit, matBlackhole, 64);
  blackholesMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  blackholesMesh.frustumCulled = false;
  scene.add(blackholesMesh);

  const blackholesRingMesh = new THREE.InstancedMesh(ringGeomUnit, matBlackholeGlow, 64);
  blackholesRingMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  blackholesRingMesh.frustumCulled = false;
  scene.add(blackholesRingMesh);

  // Socket (JSON events)
  const socket = io();
  const PB = null;

  // Label helpers
  function createLabelSprite(text) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const padding = 4 * dpr;
    const fontSize = 16 * dpr;

    const cvs = document.createElement('canvas');
    const ctx = cvs.getContext('2d');
    ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui`;
    const txt = String(text || '');
    const textW = Math.ceil(ctx.measureText(txt).width);
    const textH = Math.ceil(fontSize * 1.4);

    cvs.width = textW + padding * 2;
    cvs.height = textH + padding * 2;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
    const w = cvs.width, h = cvs.height, r = 10 * dpr;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.fill();

    ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui`;
    ctx.fillStyle = '#e5e7eb';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(txt, w / 2, h / 2);

    const texture = new THREE.CanvasTexture(cvs);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    sprite.userData.baseW = cvs.width / dpr;
    sprite.userData.baseH = cvs.height / dpr;
    sprite.userData.text = txt;
    sprite.frustumCulled = false;
    return sprite;
  }

  function updateLabelSprite(sprite, text) {
    const txt = String(text || '');
    if (sprite.userData.text === txt) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const padding = 4 * dpr;
    const fontSize = 16 * dpr;

    const cvs = document.createElement('canvas');
    const ctx = cvs.getContext('2d');
    ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui`;
    const textW = Math.ceil(ctx.measureText(txt).width);
    const textH = Math.ceil(fontSize * 1.4);

    cvs.width = textW + padding * 2;
    cvs.height = textH + padding * 2;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
    const w = cvs.width, h = cvs.height, r = 10 * dpr;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.fill();

    ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui`;
    ctx.fillStyle = '#e5e7eb';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(txt, w / 2, h / 2);

    const texture = new THREE.CanvasTexture(cvs);
    texture.needsUpdate = true;
    sprite.material.map.dispose();
    sprite.material.map = texture;
    sprite.userData.baseW = cvs.width / dpr;
    sprite.userData.baseH = cvs.height / dpr;
    sprite.userData.text = txt;
  }

  // Jelly geometry utilities
  function createJellyGeometry(segments = 64) {
    const positions = new Float32Array((segments + 1) * 3);
    const uvs = new Float32Array((segments + 1) * 2);
    const indices = [];

    // center vertex
    uvs[0] = 0.5; uvs[1] = 0.5;

    for (let i = 0; i < segments; i++) {
      const a = i * (Math.PI * 2 / segments);
      const x = Math.cos(a), y = Math.sin(a);
      const idx = (1 + i) * 3;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = 0;

      const uvidx = (1 + i) * 2;
      uvs[uvidx] = (x + 1) * 0.5;
      uvs[uvidx + 1] = (y + 1) * 0.5;

      const c = 0, v1 = 1 + i, v2 = 1 + ((i + 1) % segments);
      indices.push(c, v1, v2);
    }

    const geom = new THREE.BufferGeometry();
    const positionAttr = new THREE.BufferAttribute(positions, 3);
    positionAttr.setUsage(THREE.DynamicDrawUsage);
    geom.setAttribute('position', positionAttr);
    const uvAttr = new THREE.BufferAttribute(uvs, 2);
    uvAttr.setUsage(THREE.StaticDrawUsage);
    geom.setAttribute('uv', uvAttr);
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const angles = Array.from({ length: segments }, (_, i) => i * (Math.PI * 2 / segments));
    return { geometry: geom, segments, angles };
  }

  function impulseAtAngle(entry, angle, strength) {
    const seg = entry.jelly.segments;
    const step = (Math.PI * 2) / seg;

    let a = angle % (Math.PI * 2);
    if (a < 0) a += Math.PI * 2;

    const idx = Math.round(a / step) % seg;
    const opp = (idx + Math.floor(seg / 2)) % seg;

    entry.jelly.vel[idx] -= strength;
    entry.jelly.vel[opp] += strength * 0.5;
  }

  function updateJelly(entry, targetRadius, dt, worldSize) {
    const kSpring = 40.0;
    const kDamp = 7.5;
    const spread = 0.32;

    const disp = entry.jelly.disp;
    const vel = entry.jelly.vel;
    const seg = entry.jelly.segments;
    const angles = entry.jelly.angles;

    // movement-induced wobble
    const vx = (entry.latest?.x ?? entry.mesh.position.x) - (entry.jelly.lastX ?? entry.mesh.position.x);
    const vy = (entry.latest?.y ?? entry.mesh.position.y) - (entry.jelly.lastY ?? entry.mesh.position.y);
    entry.jelly.lastX = entry.latest?.x ?? entry.mesh.position.x;
    entry.jelly.lastY = entry.latest?.y ?? entry.mesh.position.y;

    const speed = Math.hypot(vx, vy);
    if (speed > 0.0001) {
      const dir = Math.atan2(vy, vx);
      const amp = Math.min(1.2, speed * 0.08);
      impulseAtAngle(entry, dir, amp);
    }

    // wall proximity impulses (penetration-based)
    if (entry.latest) {
      const r = targetRadius;
      const t = 36;

      if (entry.latest.x < r + t) {
        const depth = Math.max(0, (r + t - entry.latest.x) / t);
        impulseAtAngle(entry, Math.PI, 0.9 * depth);
      }
      if (entry.latest.x > state.worldSize - (r + t)) {
        const depth = Math.max(0, (r + t - (state.worldSize - entry.latest.x)) / t);
        impulseAtAngle(entry, 0, 0.9 * depth);
      }
      if (entry.latest.y < r + t) {
        const depth = Math.max(0, (r + t - entry.latest.y) / t);
        impulseAtAngle(entry, -Math.PI / 2, 0.9 * depth);
      }
      if (entry.latest.y > state.worldSize - (r + t)) {
        const depth = Math.max(0, (r + t - (state.worldSize - entry.latest.y)) / t);
        impulseAtAngle(entry, Math.PI / 2, 0.9 * depth);
      }
    }

    // integrate springs
    for (let i = 0; i < seg; i++) {
      const acc = -kSpring * disp[i] - kDamp * vel[i];
      vel[i] += acc * dt;
      disp[i] += vel[i] * dt;
    }

    // neighbor coupling
    for (let p = 0; p < 2; p++) {
      for (let i = 0; i < seg; i++) {
        const left = (i + seg - 1) % seg;
        const right = (i + 1) % seg;

        const deltaL = spread * (disp[i] - disp[left]);
        const deltaR = spread * (disp[i] - disp[right]);

        vel[left] += deltaL;
        vel[right] += deltaR;
      }
    }

    const pos = entry.mesh.geometry.getAttribute('position');
    const arr = pos.array;

    for (let i = 0; i < seg; i++) {
      const a = angles[i];
      const rr = Math.max(2, targetRadius + disp[i]);
      const x = rr * Math.cos(a);
      const y = rr * Math.sin(a);
      const base = (1 + i) * 3;
      arr[base] = x;
      arr[base + 1] = y;
    }

    pos.needsUpdate = true;
  }

  const playersGroup = new THREE.Group();
  scene.add(playersGroup);
  const playerMeshes = new Map();
  let mySkinTexture = null;
  const playerSkins = new Map(); // playerId -> skinUrl
  const skinTextures = new Map(); // skinUrl -> THREE.Texture

  function upsertPlayerMesh(player) {
    let entry = playerMeshes.get(player.id);
    const targetRadius = radiusFromMass(player.mass);

    if (!entry) {
      const { geometry, segments, angles } = createJellyGeometry(64);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      
      // Apply skin texture if player has one
      const skinUrl = playerSkins.get(player.id);
      if (skinUrl && skinTextures.has(skinUrl)) {
        material.map = skinTextures.get(skinUrl);
        material.color.set(0xffffff);
        material.needsUpdate = true;
      }
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(player.x, player.y, 0.01);
      mesh.frustumCulled = false;

      const protection = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.35, 64), matProtection);
      protection.position.set(player.x, player.y, 0.0);
      protection.visible = !!player.protected;
      protection.frustumCulled = false;

      const label = createLabelSprite(player.name || player.id.slice(0, 4));
      label.position.set(player.x, player.y - targetRadius - 14, 0.02);
      label.scale.set(label.userData.baseW, label.userData.baseH, 1);

      playersGroup.add(mesh);
      playersGroup.add(protection);
      playersGroup.add(label);

      entry = {
        mesh,
        protection,
        label,
        jelly: {
          segments,
          angles,
          disp: new Float32Array(segments),
          vel: new Float32Array(segments),
          lastX: player.x,
          lastY: player.y,
        },
        latest: player,
      };

      playerMeshes.set(player.id, entry);
      updateJelly(entry, targetRadius, 0.016, state.worldSize);
      
      // Set color only if no texture
      if (!mesh.material.map) {
        mesh.material.color.setStyle(player.color || '#ffffff');
      }
    } else {
      // Update existing player
      const skinUrl = playerSkins.get(player.id);
      if (skinUrl && skinTextures.has(skinUrl)) {
        if (entry.mesh.material.map !== skinTextures.get(skinUrl)) {
          entry.mesh.material.map = skinTextures.get(skinUrl);
          entry.mesh.material.color.set(0xffffff);
          entry.mesh.material.needsUpdate = true;
        }
      } else {
        // No skin or skin not loaded yet
        if (entry.mesh.material.map) {
          entry.mesh.material.map = null;
          entry.mesh.material.needsUpdate = true;
        }
        entry.mesh.material.color.setStyle(player.color || '#ffffff');
      }
      entry.latest = player;
    }
  }

  function removeMissingPlayers(currentIds) {
    for (const [id, entry] of playerMeshes) {
      if (!currentIds.has(id)) {
        playersGroup.remove(entry.mesh);
        playersGroup.remove(entry.protection);
        playersGroup.remove(entry.label);

        entry.mesh.geometry.dispose();
        entry.mesh.material.dispose();
        entry.protection.geometry.dispose();
        entry.label.material.map.dispose();
        entry.label.material.dispose();

        playerMeshes.delete(id);
      }
    }
  }

  const _matrix = new THREE.Matrix4();
  function updateInstanced(mesh, items, getRadius) {
    const capacity = mesh.instanceMatrix.count;
    const count = Math.min(items.length, capacity);

    for (let i = 0; i < count; i++) {
      const it = items[i];
      const r = getRadius(it.mass || pelletMass);
      _matrix.makeTranslation(it.x, it.y, 0);
      _matrix.multiply(new THREE.Matrix4().makeScale(r, r, 1));
      mesh.setMatrixAt(i, _matrix);
    }

    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
  }

  function screenToWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    const v = new THREE.Vector3(x, y, 0).unproject(camera);
    return { x: v.x, y: v.y };
  }

  function emitInput(tx, ty) { socket.emit('input', { tx, ty }); }

  function emitBoostStart(tx, ty) { socket.emit('boost_start', { tx, ty }); }

  canvas.addEventListener('mousemove', (e) => {
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
    if (!state.myPlayer) return;
    const w = screenToWorld(e.clientX, e.clientY);
    emitInput(w.x, w.y);
  });

  let boostHeld = false;

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !boostHeld) {
      e.preventDefault();
      boostHeld = true;
      const w = screenToWorld(state.mouseX || 0, state.mouseY || 0);
      emitBoostStart(w.x, w.y);
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && boostHeld) {
      e.preventDefault();
      boostHeld = false;
      socket.emit('boost_end');
    }
  });

  function forceBoostEnd() {
    if (!boostHeld) return;
    boostHeld = false;
    socket.emit('boost_end');
  }
  window.addEventListener('blur', forceBoostEnd);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) forceBoostEnd();
  });

  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    if (!t) return;
    const w = screenToWorld(t.clientX, t.clientY);
    boostHeld = true;
    emitBoostStart(w.x, w.y);
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (!t) return;
    const w = screenToWorld(t.clientX, t.clientY);
    emitInput(w.x, w.y);
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    if (boostHeld) {
      boostHeld = false;
      socket.emit('boost_end');
    }
  }, { passive: true });
  canvas.addEventListener('touchcancel', () => { forceBoostEnd(); }, { passive: true });

  if (nameBtn && nameInput) {
    const sendName = () => {
      const name = String(nameInput.value || '');
      socket.emit('set_name', { name });
    };
    nameBtn.addEventListener('click', sendName);
    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendName(); });
  }

  async function fetchSkinUrl(url) {
    const resp = await fetch('/skins/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const js = await resp.json().catch(() => ({}));
    if (!resp.ok || !js?.ok || !js?.url) throw new Error(js?.error || 'Fetch failed');
    return js.url;
  }

  async function loadSkinTexture(url) {
    return new Promise((resolve, reject) => {
      const texLoader = new THREE.TextureLoader();
      texLoader.load(url, (tex) => {
        tex.minFilter = THREE.LinearMipMapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        resolve(tex);
      }, undefined, (err) => reject(err));
    });
  }

  async function loadAndCacheSkinTexture(url) {
    if (skinTextures.has(url)) {
      return skinTextures.get(url);
    }
    try {
      const tex = await loadSkinTexture(url);
      skinTextures.set(url, tex);
      return tex;
    } catch (e) {
      console.warn('Skin load failed:', e?.message || e);
      return null;
    }
  }

  async function setMySkinFromUrl(url) {
    try {
      const tex = await loadAndCacheSkinTexture(url);
      if (!tex) return;
      
      mySkinTexture = tex;
      playerSkins.set(state.myId, url);
      
      // Notify server about skin change
      socket.emit('set_skin', { url });
      
      // Update existing my mesh if present
      const entry = state.myId ? playerMeshes.get(state.myId) : null;
      if (entry && entry.mesh && entry.mesh.material) {
        entry.mesh.material.map = tex;
        entry.mesh.material.color.set(0xffffff);
        entry.mesh.material.needsUpdate = true;
      }
    } catch (e) {
      console.warn('Skin load failed:', e?.message || e);
    }
  }

  if (skinFetchBtn && skinUrl) {
    skinFetchBtn.addEventListener('click', async () => {
      try {
        const urlInput = String(skinUrl.value || '').trim();
        if (!urlInput) return;
        const savedUrl = await fetchSkinUrl(urlInput);
        await setMySkinFromUrl(savedUrl);
      } catch (e) {
        alert(e?.message || 'Fetch failed');
      }
    });
  }

  socket.on('welcome', (msg) => {
    state.myId = msg.id;
    state.worldSize = msg.world?.size ?? 2500;
    const you = document.getElementById('name');
    if (you) you.textContent = `You: ${state.myId.slice(0, 4)}`;
  });

  socket.on('respawn', () => { state.camera.shake = 0.4; });

  socket.on('boost_status', (info) => {
    boostFuelPct = Number(info?.fuel ?? 0);
    boosting = Boolean(info?.boosting);
  });

  // Handle initial skin data
  socket.on('skins_data', (skinData) => {
    for (const [playerId, skinUrl] of Object.entries(skinData)) {
      if (skinUrl) {
        playerSkins.set(playerId, skinUrl);
        // Pre-load texture
        loadAndCacheSkinTexture(skinUrl);
      }
    }
  });

  // Handle skin changes
  socket.on('skin_set', (data) => {
    const playerId = data.playerId;
    const skinUrl = data.url;
    
    if (skinUrl) {
      playerSkins.set(playerId, skinUrl);
      // Load texture and update player mesh if exists
      loadAndCacheSkinTexture(skinUrl).then((tex) => {
        if (tex) {
          const entry = playerMeshes.get(playerId);
          if (entry && entry.mesh && entry.mesh.material) {
            entry.mesh.material.map = tex;
            entry.mesh.material.color.set(0xffffff);
            entry.mesh.material.needsUpdate = true;
          }
        }
      });
    } else {
      playerSkins.delete(playerId);
      // Remove texture from player mesh
      const entry = playerMeshes.get(playerId);
      if (entry && entry.mesh && entry.mesh.material) {
        entry.mesh.material.map = null;
        entry.mesh.material.needsUpdate = true;
        // Restore color from current player state
        const player = state.players.find(p => p.id === playerId);
        if (player) {
          entry.mesh.material.color.setStyle(player.color || '#ffffff');
        }
      }
    }
  });

  socket.on('state', (world) => {
    state.players = world.players || [];
    state.pellets = (world.pellets || []).map((p) => ({ x: p.x, y: p.y, mass: pelletMass }));
    state.stars = world.stars || [];
    state.galaxies = world.galaxies || [];
    state.blackholes = world.blackholes || [];
    state.leaderboard = world.leaderboard || [];
    state.worldSize = world.world?.size ?? state.worldSize;

    state.myPlayer = state.players.find((p) => p.id === state.myId) || null;

    if (state.myPlayer) {
      const desiredZoom = Math.max(0.4, Math.min(1.8, 1 / Math.sqrt(Math.max(1, state.myPlayer.mass / 24))));
      state.camera.zoom += (desiredZoom - state.camera.zoom) * 0.12;
      state.camera.x += (state.myPlayer.x - state.camera.x) * 0.15;
      state.camera.y += (state.myPlayer.y - state.camera.y) * 0.15;
      const massEl = document.getElementById('mass');
      if (massEl) massEl.textContent = `Mass: ${state.myPlayer.mass.toFixed(1)}`;
    }

    const playersEl = document.getElementById('players');
    if (playersEl) playersEl.textContent = `Players: ${state.players.length}`;

    renderBoard(state.leaderboard);

    const ids = new Set(state.players.map((p) => p.id));
    for (const p of state.players) {
      upsertPlayerMesh(p);
    }
    removeMissingPlayers(ids);

    updateInstanced(pelletsMesh, state.pellets, () => pelletRadius);
    updateInstanced(starsMesh, state.stars, (m) => starRadiusFn(m));
    updateInstanced(galaxiesMesh, state.galaxies, (m) => galaxyRadiusFn(m));
    updateInstanced(blackholesMesh, state.blackholes, (m) => blackholeRadiusFn(m));
    updateInstanced(blackholesRingMesh, state.blackholes, (m) => blackholeRadiusFn(m) * 1.45);
  });

  let lastTime = performance.now();
  function animate(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (camera) {
      let sx = 0;
      let sy = 0;
      if (state.camera.shake > 0) {
        const s = state.camera.shake;
        sx = (Math.random() - 0.5) * 10 * s;
        sy = (Math.random() - 0.5) * 10 * s;
        state.camera.shake = Math.max(0, state.camera.shake - dt * 1.5);
      }
      camera.position.x = state.camera.x + sx;
      camera.position.y = state.camera.y + sy;
      camera.zoom += (state.camera.zoom - camera.zoom) * 0.2;
      camera.updateProjectionMatrix();
      drawStars(camera.position.x, camera.position.y);
    }

    for (const [id, entry] of playerMeshes) {
      if (!entry.latest) continue;
      const targetRadius = radiusFromMass(entry.latest.mass);
      entry.mesh.position.set(entry.latest.x, entry.latest.y, 0.01);
      entry.protection.position.set(entry.latest.x, entry.latest.y, 0.0);
      entry.protection.visible = !!entry.latest.protected;
      entry.protection.scale.set(targetRadius, targetRadius, 1);
      updateLabelSprite(entry.label, entry.latest.name || id.slice(0, 4));
      entry.label.position.set(entry.latest.x, entry.latest.y - targetRadius - 14, 0.02);
      updateJelly(entry, targetRadius, dt, state.worldSize);
      if (camera) {
        const s = 1 / camera.zoom;
        entry.label.scale.set(entry.label.userData.baseW * s, entry.label.userData.baseH * s, 1);
      }
    }

    if (boostBar) {
      boostBar.style.width = `${Math.max(0, Math.min(100, boostFuelPct)).toFixed(0)}%`;
      boostBar.style.opacity = boosting ? '1' : '0.6';
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();
