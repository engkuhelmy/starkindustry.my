// ==========================================================================
// STARK INDUSTRIES // INTERACTIVE HUD & TELEMETRY ENGINE
// ==========================================================================

// ==========================================================================
// STARK EXPO ANIMATED BACKGROUND ENGINE
// Cinematic looping canvas — Holographic rings, spotlights, particles,
// crowd silhouettes, arc beams, lens flares
// ==========================================================================
(function initStarkExpo() {
  const canvas = document.getElementById('starkExpoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, raf;
  let tick = 0;

  // ---- Resize ----
  function resize() {
    W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
    H = canvas.height = canvas.offsetHeight || window.innerHeight;
    buildSilhouettes();
  }

  // ---- PALETTE ----
  const C = {
    cyan:   '#00f0ff',
    blue:   '#0044ff',
    gold:   '#f3be44',
    red:    '#d32027',
    white:  '#ffffff',
    arc:    'rgba(0,240,255,',
    gold2:  'rgba(243,190,68,',
    white2: 'rgba(255,255,255,',
  };

  // ============================================================
  // 1. CROWD SILHOUETTES (bottom band)
  // ============================================================
  let crowd = [];
  function buildSilhouettes() {
    crowd = [];
    const bandH = H * 0.18;
    const groundY = H;
    const count = Math.floor(W / 14);
    for (let i = 0; i < count; i++) {
      const x = (i / count) * W + (Math.random() - 0.5) * 20;
      const personH = bandH * (0.55 + Math.random() * 0.45);
      const width = 10 + Math.random() * 8;
      crowd.push({ x, y: groundY - personH, w: width, h: personH,
        arm: Math.random() > 0.5 ? 1 : 0, // raised arm
        wave: Math.random() * Math.PI * 2,
        speed: 0.015 + Math.random() * 0.02,
        glow: Math.random() > 0.6,
      });
    }
  }

  function drawCrowd() {
    ctx.save();
    // Crowd glow band
    const bandGrad = ctx.createLinearGradient(0, H * 0.78, 0, H);
    bandGrad.addColorStop(0, 'rgba(0,240,255,0.0)');
    bandGrad.addColorStop(0.5, 'rgba(0,60,120,0.25)');
    bandGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = bandGrad;
    ctx.fillRect(0, H * 0.78, W, H * 0.22);

    crowd.forEach(p => {
      // Phone/light glow dots
      if (p.glow) {
        const glowX = p.x + p.w * 0.5;
        const glowY = p.y + p.h * 0.2;
        const gr = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 14);
        gr.addColorStop(0, 'rgba(0,240,255,0.6)');
        gr.addColorStop(1, 'rgba(0,240,255,0)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(glowX, glowY, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      // Body silhouette
      ctx.fillStyle = 'rgba(5,10,25,0.88)';
      ctx.beginPath();
      // Head
      const hw = p.w * 0.45;
      ctx.arc(p.x + p.w * 0.5, p.y + hw, hw, 0, Math.PI * 2);
      ctx.fill();
      // Body
      ctx.fillRect(p.x + p.w * 0.15, p.y + hw * 1.8, p.w * 0.7, p.h * 0.55);
      // Raised arm wave
      if (p.arm) {
        const waveOff = Math.sin(tick * p.speed + p.wave) * 12;
        ctx.beginPath();
        ctx.moveTo(p.x + p.w * 0.85, p.y + p.h * 0.32);
        ctx.lineTo(p.x + p.w * 1.5, p.y + p.h * 0.1 + waveOff);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(5,10,25,0.88)';
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  // ============================================================
  // 2. STAGE SPOTLIGHTS
  // ============================================================
  const spots = [
    { xRatio: 0.18, spread: 0.12, hue: C.arc, speed: 0.003 },
    { xRatio: 0.5,  spread: 0.18, hue: C.gold2, speed: 0.004 },
    { xRatio: 0.82, spread: 0.12, hue: C.arc, speed: 0.0025 },
    { xRatio: 0.35, spread: 0.08, hue: C.white2, speed: 0.006 },
    { xRatio: 0.65, spread: 0.08, hue: C.white2, speed: 0.005 },
  ];

  function drawSpotlights() {
    spots.forEach((s, i) => {
      const swing = Math.sin(tick * s.speed + i * 1.2) * W * 0.08;
      const topX  = W * s.xRatio + swing;
      const botX  = W * s.xRatio;
      const spreadW = W * s.spread;
      const grad = ctx.createLinearGradient(topX, 0, botX, H * 0.88);
      grad.addColorStop(0, s.hue + '0.18)');
      grad.addColorStop(0.4, s.hue + '0.07)');
      grad.addColorStop(1, s.hue + '0)');
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(topX - 2, 0);
      ctx.lineTo(topX + 2, 0);
      ctx.lineTo(botX + spreadW, H * 0.88);
      ctx.lineTo(botX - spreadW, H * 0.88);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    });
  }

  // ============================================================
  // 3. HOLOGRAPHIC ENERGY RINGS
  // ============================================================
  const rings = Array.from({ length: 6 }, (_, i) => ({
    cx: 0.5,
    cy: 0.42,
    baseR: 60 + i * 55,
    phase: (i / 6) * Math.PI * 2,
    speed: 0.004 + i * 0.0006,
    tilt: 0.28 + i * 0.04,
    color: i % 2 === 0 ? C.arc : C.gold2,
    alpha: 0.25 - i * 0.03,
    segments: 80,
    gapRatio: 0.05,
  }));

  function drawRings() {
    rings.forEach(r => {
      const cx = W * r.cx;
      const cy = H * r.cy;
      const rx = r.baseR + Math.sin(tick * r.speed + r.phase) * 8;
      const ry = rx * r.tilt;
      const rot = tick * r.speed * 0.5 + r.phase;
      const alpha = r.alpha + Math.sin(tick * 0.007 + r.phase) * 0.06;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      // Draw dashed ellipse
      const total = Math.PI * 2;
      const gapA  = total * r.gapRatio;
      const segA  = (total - gapA * 4) / r.segments;
      for (let s = 0; s < r.segments; s++) {
        const a1 = s * (total / r.segments);
        const a2 = a1 + segA;
        const fade = 0.4 + 0.6 * Math.abs(Math.sin(s * 0.3 + tick * 0.01));
        ctx.beginPath();
        ctx.strokeStyle = r.color + (alpha * fade) + ')';
        ctx.lineWidth = 1.5;
        ctx.ellipse(0, 0, rx, ry, 0, a1, a2);
        ctx.stroke();
      }

      // Bright nodes at cardinal points
      for (let n = 0; n < 4; n++) {
        const na = n * Math.PI / 2 + rot;
        const nx = Math.cos(na) * rx;
        const ny = Math.sin(na) * ry;
        const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, 8);
        ng.addColorStop(0, r.color + '0.9)');
        ng.addColorStop(1, r.color + '0)');
        ctx.fillStyle = ng;
        ctx.beginPath();
        ctx.arc(nx, ny, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  // ============================================================
  // 4. ARC BEAM PILLARS (vertical light columns from ground)
  // ============================================================
  const beams = [0.12, 0.28, 0.5, 0.72, 0.88].map((xr, i) => ({
    xRatio: xr,
    phase: i * 0.8,
    speed: 0.007 + i * 0.001,
    color: i === 2 ? C.arc : (i % 2 === 0 ? C.gold2 : C.arc),
  }));

  function drawBeams() {
    beams.forEach(b => {
      const x = W * b.xRatio;
      const alpha = 0.08 + Math.abs(Math.sin(tick * b.speed + b.phase)) * 0.18;
      const grad = ctx.createLinearGradient(x, H * 0.85, x, H * 0.05);
      grad.addColorStop(0, b.color + '0)');
      grad.addColorStop(0.2, b.color + (alpha * 0.6) + ')');
      grad.addColorStop(0.55, b.color + alpha + ')');
      grad.addColorStop(0.85, b.color + (alpha * 0.3) + ')');
      grad.addColorStop(1, b.color + '0)');
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = grad;
      ctx.fillRect(x - 1.5, H * 0.05, 3, H * 0.80);
      ctx.restore();
    });
  }

  // ============================================================
  // 5. PARTICLE SYSTEM (sparks / energy embers)
  // ============================================================
  const PCOUNT = 140;
  const particles = Array.from({ length: PCOUNT }, () => spawnParticle());

  function spawnParticle() {
    return {
      x: Math.random() * 1.2 - 0.1,      // ratio of W (allow offscreen)
      y: 0.82 + Math.random() * 0.15,     // ratio of H (ground area)
      vx: (Math.random() - 0.5) * 0.0015,
      vy: -(0.001 + Math.random() * 0.003),
      life: 0,
      maxLife: 80 + Math.random() * 160,
      size: 1 + Math.random() * 2.5,
      col: Math.random() > 0.6 ? C.arc : (Math.random() > 0.5 ? C.gold2 : C.white2),
    };
  }

  function drawParticles() {
    particles.forEach((p, i) => {
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      if (p.life > p.maxLife || p.y < -0.05) {
        particles[i] = spawnParticle();
        return;
      }
      const fade = Math.sin((p.life / p.maxLife) * Math.PI);
      const px = p.x * W, py = p.y * H;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const gr = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2.5);
      gr.addColorStop(0, p.col + (0.9 * fade) + ')');
      gr.addColorStop(1, p.col + '0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(px, py, p.size * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ============================================================
  // 6. LENS FLARES
  // ============================================================
  const flares = [
    { xr: 0.5, yr: 0.05, baseAlpha: 0.55, speed: 0.005, size: 60 },
    { xr: 0.18, yr: 0.9, baseAlpha: 0.3,  speed: 0.007, size: 35 },
    { xr: 0.82, yr: 0.9, baseAlpha: 0.3,  speed: 0.006, size: 35 },
  ];

  function drawFlares() {
    flares.forEach((f, i) => {
      const alpha = f.baseAlpha + Math.sin(tick * f.speed + i) * 0.2;
      const x = W * f.xr, y = H * f.yr;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(x, y, 0, x, y, f.size);
      g.addColorStop(0,   C.white2 + alpha + ')');
      g.addColorStop(0.2, C.arc    + (alpha * 0.6) + ')');
      g.addColorStop(0.6, C.arc    + (alpha * 0.15) + ')');
      g.addColorStop(1,   C.arc    + '0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, f.size, 0, Math.PI * 2);
      ctx.fill();
      // Cross streak
      ctx.strokeStyle = C.white2 + (alpha * 0.5) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - f.size * 1.8, y);
      ctx.lineTo(x + f.size * 1.8, y);
      ctx.moveTo(x, y - f.size * 1.8);
      ctx.lineTo(x, y + f.size * 1.8);
      ctx.stroke();
      ctx.restore();
    });
  }

  // ============================================================
  // 7. STAGE FLOOR REFLECTION
  // ============================================================
  function drawFloorReflection() {
    const grad = ctx.createLinearGradient(0, H * 0.82, 0, H);
    grad.addColorStop(0, 'rgba(0,240,255,0.06)');
    grad.addColorStop(0.5, 'rgba(0,80,180,0.04)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, H * 0.82, W, H * 0.18);

    // Center stage shine
    const shine = ctx.createRadialGradient(W * 0.5, H, 0, W * 0.5, H, W * 0.55);
    shine.addColorStop(0, 'rgba(0,240,255,0.09)');
    shine.addColorStop(0.5, 'rgba(0,80,200,0.03)');
    shine.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, H * 0.82, W, H * 0.18);
  }

  // ============================================================
  // 8. ATMOSPHERIC HAZE & SCANLINE SHIMMER
  // ============================================================
  function drawHaze() {
    // Top vignette
    const topHaze = ctx.createLinearGradient(0, 0, 0, H * 0.35);
    topHaze.addColorStop(0, 'rgba(0,5,18,0.65)');
    topHaze.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topHaze;
    ctx.fillRect(0, 0, W, H * 0.35);

    // Moving horizontal haze bands
    for (let b = 0; b < 3; b++) {
      const by = ((tick * 0.18 + b * H * 0.33) % H);
      const hg = ctx.createLinearGradient(0, by - 40, 0, by + 40);
      hg.addColorStop(0, 'rgba(0,200,255,0)');
      hg.addColorStop(0.5, 'rgba(0,200,255,0.018)');
      hg.addColorStop(1, 'rgba(0,200,255,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(0, by - 40, W, 80);
    }
  }

  // ============================================================
  // MAIN RENDER LOOP
  // ============================================================
  function render() {
    tick++;
    ctx.clearRect(0, 0, W, H);

    // Deep space background
    const bg = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.5, Math.max(W, H));
    bg.addColorStop(0,   'rgba(0,15,40,1)');
    bg.addColorStop(0.5, 'rgba(0,8,22,1)');
    bg.addColorStop(1,   'rgba(2,5,14,1)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawSpotlights();
    drawBeams();
    drawRings();
    drawFlares();
    drawFloorReflection();
    drawHaze();
    drawParticles();
    drawCrowd();

    raf = requestAnimationFrame(render);
  }

  // ---- Visibility pause/resume for performance ----
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); }
    else { render(); }
  });

  // ---- Init ----
  window.addEventListener('resize', resize);
  // Wait for layout then size canvas properly
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { resize(); render(); });
  } else {
    requestAnimationFrame(() => { resize(); render(); });
  }
})();


// --- SUIT VAULT DATABASE ---
const SUIT_DATA = {
  mark3: {
    code: 'MK-03 // FIRST RED & GOLD',
    name: 'MARK III (CLASSIC RED/GOLD)',
    bio: 'The iconic suit engineered following the Mark II icing threshold incident. Constructed with gold-titanium alloy to mitigate atmospheric freezing while retaining unmatched structural strength and repulsor output.',
    durability: 82,
    mobility: 80,
    energy: 85,
    nano: 10,
    core: 'Chest Arc Mk II',
    alloy: 'Gold-Titanium Plate',
    ai: 'J.A.R.V.I.S. Core 2.0',
    deploy: 'Gulmira & Los Angeles (2008)',
    photo: 'suit_mark3_clean.jpg',
    color: '#d48e36',
    accent: '#d32027',
    wireframeSvg: `
      <svg viewBox="0 0 200 280" width="100%" height="100%">
        <defs>
          <radialGradient id="arcGlow3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="60%" stop-color="#00f0ff"/>
            <stop offset="100%" stop-color="transparent"/>
          </radialGradient>
        </defs>
        <!-- Helmet -->
        <polygon points="85,30 115,30 125,50 115,75 85,75 75,50" fill="none" stroke="#d48e36" stroke-width="2"/>
        <line x1="86" y1="52" x2="98" y2="52" stroke="#00f0ff" stroke-width="3"/>
        <line x1="102" y1="52" x2="114" y2="52" stroke="#00f0ff" stroke-width="3"/>
        <!-- Torso -->
        <polygon points="70,80 130,80 145,140 120,170 80,170 55,140" fill="none" stroke="#d32027" stroke-width="2"/>
        <circle cx="100" cy="115" r="16" fill="url(#arcGlow3)" stroke="#00f0ff" stroke-width="2"/>
        <!-- Arms -->
        <polygon points="50,85 70,80 50,150 35,145" fill="none" stroke="#d48e36" stroke-width="1.5"/>
        <polygon points="150,85 130,80 150,150 165,145" fill="none" stroke="#d48e36" stroke-width="1.5"/>
        <!-- Repulsor nodes -->
        <circle cx="42" cy="155" r="5" fill="#00f0ff"/>
        <circle cx="158" cy="155" r="5" fill="#00f0ff"/>
        <!-- Legs -->
        <polygon points="80,170 100,175 95,250 80,250" fill="none" stroke="#d32027" stroke-width="1.5"/>
        <polygon points="120,170 100,175 105,250 120,250" fill="none" stroke="#d32027" stroke-width="1.5"/>
        <!-- Boots -->
        <rect x="75" y="250" width="22" height="12" fill="none" stroke="#d48e36" stroke-width="2"/>
        <rect x="103" y="250" width="22" height="12" fill="none" stroke="#d48e36" stroke-width="2"/>
      </svg>
    `
  },
  mark5: {
    code: 'MK-05 // CONVERTIBLE PROTOCOL',
    name: 'MARK V (SUITCASE CONVERTIBLE)',
    bio: 'Emergency deployable lightweight armor designed to compress into an ordinary briefcase. Prioritizes rapid deployment and survival mobility over heavy ordnance and flight speed.',
    durability: 60,
    mobility: 72,
    energy: 65,
    nano: 15,
    core: 'Mini-Arc Mk III',
    alloy: 'Segmented Steel Alloy',
    ai: 'J.A.R.V.I.S. Uplink',
    deploy: 'Monaco Grand Prix (2010)',
    photo: 'suit_mark1.jpg',
    color: '#c0c0c0',
    accent: '#d32027',
    wireframeSvg: `
      <svg viewBox="0 0 200 280" width="100%" height="100%">
        <!-- Segmented plates schematic -->
        <polygon points="85,30 115,30 120,70 80,70" fill="none" stroke="#c0c0c0" stroke-width="2"/>
        <line x1="88" y1="50" x2="98" y2="50" stroke="#00f0ff" stroke-width="2"/>
        <line x1="102" y1="50" x2="112" y2="50" stroke="#00f0ff" stroke-width="2"/>
        <!-- Segmented Torso -->
        <rect x="70" y="75" width="60" height="20" fill="none" stroke="#d32027" stroke-width="1.5"/>
        <rect x="65" y="98" width="70" height="20" fill="none" stroke="#c0c0c0" stroke-width="1.5"/>
        <rect x="72" y="121" width="56" height="25" fill="none" stroke="#d32027" stroke-width="1.5"/>
        <circle cx="100" cy="110" r="12" fill="#ffffff" stroke="#00f0ff" stroke-width="2"/>
        <!-- Limbs -->
        <rect x="35" y="85" width="25" height="60" fill="none" stroke="#c0c0c0" stroke-width="1.5"/>
        <rect x="140" y="85" width="25" height="60" fill="none" stroke="#c0c0c0" stroke-width="1.5"/>
        <rect x="75" y="150" width="20" height="95" fill="none" stroke="#c0c0c0" stroke-width="1.5"/>
        <rect x="105" y="150" width="20" height="95" fill="none" stroke="#c0c0c0" stroke-width="1.5"/>
      </svg>
    `
  },
  mark44: {
    code: 'MK-44 // CODE: VERONICA',
    name: 'MARK XLIV "HULKBUSTER"',
    bio: 'Heavy-duty planetary pacification modular armor deployed via orbital satellite Veronica. Designed with hydraulically assisted vibranium-enhanced joints to withstand direct blows from gamma-irradiated titans.',
    durability: 98,
    mobility: 74,
    energy: 95,
    nano: 40,
    core: '11 Mini-Arcs',
    alloy: 'Gold-Titanium Plate',
    ai: 'Veronica Heuristics',
    deploy: 'Johannesburg (2015)',
    photo: 'suit_hulkbuster.jpg',
    color: '#ff2233',
    accent: '#f3be44',
    wireframeSvg: `
      <svg viewBox="0 0 200 280" width="100%" height="100%">
        <!-- Massive Bulk Torso & Head -->
        <rect x="80" y="20" width="40" height="35" rx="8" fill="none" stroke="#f3be44" stroke-width="2.5"/>
        <line x1="86" y1="36" x2="96" y2="36" stroke="#00f0ff" stroke-width="4"/>
        <line x1="104" y1="36" x2="114" y2="36" stroke="#00f0ff" stroke-width="4"/>
        <!-- Giant Shoulders & Torso -->
        <polygon points="50,60 150,60 170,140 140,175 60,175 30,140" fill="none" stroke="#ff2233" stroke-width="3"/>
        <circle cx="100" cy="115" r="22" fill="none" stroke="#00f0ff" stroke-width="4"/>
        <circle cx="100" cy="115" r="10" fill="#ffffff"/>
        <!-- Huge Arm Pods -->
        <rect x="10" y="70" width="35" height="85" rx="10" fill="none" stroke="#f3be44" stroke-width="2.5"/>
        <rect x="155" y="70" width="35" height="85" rx="10" fill="none" stroke="#f3be44" stroke-width="2.5"/>
        <circle cx="28" cy="165" r="9" fill="#00f0ff"/>
        <circle cx="172" cy="165" r="9" fill="#00f0ff"/>
        <!-- Titan Legs -->
        <rect x="58" y="180" width="36" height="80" rx="8" fill="none" stroke="#ff2233" stroke-width="3"/>
        <rect x="106" y="180" width="36" height="80" rx="8" fill="none" stroke="#ff2233" stroke-width="3"/>
        <rect x="50" y="260" width="45" height="15" fill="none" stroke="#f3be44" stroke-width="2"/>
        <rect x="105" y="260" width="45" height="15" fill="none" stroke="#f3be44" stroke-width="2"/>
      </svg>
    `
  },
  mark50: {
    code: 'MK-42 // AUTONOMOUS PREHENSILE',
    name: 'MARK XLII (AUTONOMOUS STRIKE)',
    bio: 'Prehensile propulsion system capable of deploying modular segments remotely to enclose the operator anywhere across the globe. Features gold-titanium composition with rapid neural calibration.',
    durability: 91,
    mobility: 95,
    energy: 94,
    nano: 88,
    core: 'Vibranium Arc Matrix',
    alloy: 'Micro-Alloy Prehensile Mesh',
    ai: 'J.A.R.V.I.S. Core 4.0',
    deploy: 'Malibu & Miami (2013)',
    photo: 'suit_mark42.jpg',
    color: '#f3be44',
    accent: '#d32027',
    wireframeSvg: `
      <svg viewBox="0 0 200 280" width="100%" height="100%">
        <path d="M85,25 Q100,15 115,25 Q125,55 100,75 Q75,55 85,25 Z" fill="none" stroke="#00f0ff" stroke-width="2"/>
        <line x1="88" y1="45" x2="97" y2="45" stroke="#ffffff" stroke-width="2"/>
        <line x1="103" y1="45" x2="112" y2="45" stroke="#ffffff" stroke-width="2"/>
        <path d="M70,80 Q100,75 130,80 Q145,130 115,165 Q100,170 85,165 Q55,130 70,80 Z" fill="none" stroke="#d32027" stroke-width="2"/>
        <polygon points="100,95 118,125 82,125" fill="#ffffff" stroke="#00f0ff" stroke-width="2"/>
        <path d="M50,80 Q30,60 20,40 Q40,90 55,110" fill="none" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="3,3"/>
        <path d="M150,80 Q170,60 180,40 Q160,90 145,110" fill="none" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="3,3"/>
        <path d="M82,168 L76,260 L92,260 L98,172" fill="none" stroke="#00f0ff" stroke-width="1.5"/>
        <path d="M118,168 L124,260 L108,260 L102,172" fill="none" stroke="#00f0ff" stroke-width="1.5"/>
      </svg>
    `
  },
  mark85: {
    code: 'MK-07 // RAPID RAPID DEPLOYMENT',
    name: 'MARK VII (HEAVY COMBAT SUIT)',
    bio: 'Battle-proven combat armor equipped with micro-thruster pods, laser-guided ordnance, and triple-layer gold-titanium shielding deployed during the Battle of New York.',
    durability: 96,
    mobility: 90,
    energy: 97,
    nano: 65,
    core: 'High-Output Vibranium Arc',
    alloy: 'Gold-Titanium Battle Plate',
    ai: 'J.A.R.V.I.S. Combat Tactical',
    deploy: 'Battle of New York (2012)',
    photo: 'suit_mark7.jpg',
    color: '#f3be44',
    accent: '#d32027',
    wireframeSvg: `
      <svg viewBox="0 0 200 280" width="100%" height="100%">
        <path d="M82,22 Q100,12 118,22 Q130,55 100,75 Q70,55 82,22 Z" fill="none" stroke="#f3be44" stroke-width="2.5"/>
        <line x1="86" y1="44" x2="96" y2="44" stroke="#00f0ff" stroke-width="3"/>
        <line x1="104" y1="44" x2="114" y2="44" stroke="#00f0ff" stroke-width="3"/>
        <polygon points="65,78 135,78 145,135 120,170 80,170 55,135" fill="none" stroke="#d32027" stroke-width="2.5"/>
        <polygon points="100,90 120,125 80,125" fill="#00f0ff" stroke="#ffffff" stroke-width="2"/>
        <circle cx="100" cy="112" r="6" fill="#ffffff"/>
        <rect x="150" y="90" width="22" height="60" rx="4" fill="none" stroke="#f3be44" stroke-width="2"/>
        <polygon points="78,172 98,172 94,260 76,260" fill="none" stroke="#d32027" stroke-width="2"/>
        <polygon points="122,172 102,172 106,260 124,260" fill="none" stroke="#f3be44" stroke-width="2"/>
      </svg>
    `
  }
};

// --- REAL J.A.R.V.I.S. VOICE SYNTHESIZER ---
let jarvisVoice = null;

function loadJarvisVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  // Find a refined British English voice (e.g. Google UK English Male, Daniel, Oliver, or en-GB)
  jarvisVoice = voices.find(v => 
    (v.lang === 'en-GB' || v.name.includes('UK') || v.name.includes('British')) && 
    (v.name.includes('Male') || v.name.includes('George') || v.name.includes('Daniel') || v.name.includes('Oliver'))
  ) || voices.find(v => v.lang === 'en-GB') || voices.find(v => v.lang.startsWith('en')) || null;
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = loadJarvisVoice;
  loadJarvisVoice();
}

function speakJarvis(text) {
  if (!soundEnabled || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    if (!jarvisVoice) loadJarvisVoice();
    if (jarvisVoice) utterance.voice = jarvisVoice;
    utterance.rate = 1.02; // Sophisticated, measured British tempo
    utterance.pitch = 0.94; // Deep, calm Paul Bettany tone
    utterance.volume = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    // Graceful fallback
  }
}

// --- AUDIO SYNTHESIZER (WEB AUDIO API) ---
let audioContext = null;
let soundEnabled = true;

function initAudio() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function playBeep(freq = 880, type = 'sine', duration = 0.08, gainVal = 0.12) {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    gain.gain.setValueAtTime(gainVal, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (e) {
    // Graceful fallback if audio is blocked
  }
}

function playArcDischargeSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioContext) return;
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.8);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(now + 0.9);
  } catch (e) {}
}

// --- PARTICLE HUD CANVAS ENGINE ---
function initCanvasParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const PARTICLE_COUNT = Math.min(65, Math.floor(window.innerWidth / 20));

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 1,
      color: Math.random() > 0.3 ? 'rgba(0, 240, 255,' : 'rgba(0, 136, 255,'
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color} 0.55)`;
      ctx.fill();

      // Connect near points
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.18 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(render);
  }
  render();
}

// --- SUIT VAULT SELECTOR ---
function setupSuitSelector() {
  const buttons = document.querySelectorAll('.suit-btn');
  const svgWrapper = document.getElementById('suitSvgWrapper');
  const photoWrapper = document.getElementById('suitPhotoWrapper');
  const photoImage = document.getElementById('suitPhotoImage');
  const viewModePhotoBtn = document.getElementById('viewModePhoto');
  const viewModeSchematicBtn = document.getElementById('viewModeSchematic');

  const suitCode = document.getElementById('suitCode');
  const suitName = document.getElementById('suitName');
  const suitBio = document.getElementById('suitBio');
  const statDurability = document.getElementById('statDurability');
  const fillDurability = document.getElementById('fillDurability');
  const statMobility = document.getElementById('statMobility');
  const fillMobility = document.getElementById('fillMobility');
  const statEnergy = document.getElementById('statEnergy');
  const fillEnergy = document.getElementById('fillEnergy');
  const statNano = document.getElementById('statNano');
  const fillNano = document.getElementById('fillNano');
  const specCore = document.getElementById('specCore');
  const specAlloy = document.getElementById('specAlloy');
  const specAi = document.getElementById('specAi');
  const specDeploy = document.getElementById('specDeploy');

  let currentViewMode = 'photo'; // 'photo' or 'schematic'

  function setViewMode(mode) {
    currentViewMode = mode;
    if (mode === 'photo') {
      if (viewModePhotoBtn) viewModePhotoBtn.classList.add('active');
      if (viewModeSchematicBtn) viewModeSchematicBtn.classList.remove('active');
      if (photoWrapper) photoWrapper.style.display = 'flex';
      if (svgWrapper) svgWrapper.style.display = 'none';
    } else {
      if (viewModeSchematicBtn) viewModeSchematicBtn.classList.add('active');
      if (viewModePhotoBtn) viewModePhotoBtn.classList.remove('active');
      if (photoWrapper) photoWrapper.style.display = 'none';
      if (svgWrapper) svgWrapper.style.display = 'block';
    }
    playBeep(920, 'sine', 0.06);
  }

  if (viewModePhotoBtn) viewModePhotoBtn.addEventListener('click', () => setViewMode('photo'));
  if (viewModeSchematicBtn) viewModeSchematicBtn.addEventListener('click', () => setViewMode('schematic'));

  function updateSuit(key) {
    const data = SUIT_DATA[key];
    if (!data) return;

    buttons.forEach(b => b.classList.toggle('active', b.dataset.suit === key));

    suitCode.textContent = data.code;
    suitName.textContent = data.name;
    suitBio.textContent = data.bio;

    statDurability.textContent = `${data.durability}%`;
    fillDurability.style.width = `${data.durability}%`;

    statMobility.textContent = `${data.mobility}%`;
    fillMobility.style.width = `${data.mobility}%`;

    statEnergy.textContent = `${data.energy}%`;
    fillEnergy.style.width = `${data.energy}%`;

    statNano.textContent = `${data.nano}%`;
    fillNano.style.width = `${data.nano}%`;

    specCore.textContent = data.core;
    specAlloy.textContent = data.alloy;
    specAi.textContent = data.ai;
    specDeploy.textContent = data.deploy;

    // Update real photo
    if (photoImage && data.photo) {
      photoImage.style.opacity = '0.2';
      setTimeout(() => {
        photoImage.src = data.photo;
        photoImage.style.opacity = '1';
      }, 150);
    }

    svgWrapper.innerHTML = data.wireframeSvg;
    playBeep(640, 'triangle', 0.1);
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      updateSuit(btn.dataset.suit);
    });
  });

  // Default suit: mark3 Classic
  updateSuit('mark3');
  setViewMode('photo');

  // Hotspots interaction
  const hotspots = document.querySelectorAll('.hotspot');
  const detailCard = document.getElementById('hotspotDetailText');

  hotspots.forEach(hs => {
    hs.addEventListener('mouseenter', () => {
      detailCard.textContent = hs.dataset.info;
      playBeep(1200, 'sine', 0.05, 0.08);
    });
    hs.addEventListener('click', () => {
      detailCard.textContent = hs.dataset.info;
      playBeep(1400, 'sine', 0.07, 0.1);
    });
  });

  // Simulate Arm Button
  const simBtn = document.getElementById('simulateArmBtn');
  if (simBtn) {
    simBtn.addEventListener('click', () => {
      playArcDischargeSound();
      openModal(
        'SUIT DIAGNOSTIC SIMULATION',
        'Repulsor charge: 100% // Flight telemetry: Calibrated // Target tracking: Online.<br/><br/>"Sometimes you gotta run before you can walk." — Tony Stark'
      );
    });
  }
}

// --- ARC REACTOR DISCHARGE INTERACTION ---
function setupArcReactor() {
  const reactor = document.getElementById('arcReactor');
  const arcVal = document.getElementById('arcOutputValue');

  if (!reactor) return;

  reactor.addEventListener('click', () => {
    playArcDischargeSound();

    // Pulse animation
    reactor.style.boxShadow = '0 0 140px rgba(0, 240, 255, 0.9), inset 0 0 80px #fff';
    setTimeout(() => {
      reactor.style.boxShadow = '';
    }, 400);

    // Boost arc energy counter temporarily
    if (arcVal) {
      const current = (5000 + Math.random() * 500).toFixed(1);
      arcVal.textContent = `${current} GW (SURGE)`;
      arcVal.classList.add('green');
      setTimeout(() => {
        arcVal.textContent = '4,892.4 GW';
      }, 3000);
    }
  });
}

// --- BATTERY TELEMETRY SYNC ---
function setupBatteryTelemetry() {
  const batteryEl = document.getElementById('deviceBatteryVal');
  if (!batteryEl) return;

  if ('getBattery' in navigator) {
    navigator.getBattery().then(battery => {
      function updateBattery() {
        const pct = Math.round(battery.level * 100);
        const charging = battery.charging ? '⚡ CHARGING' : 'ACTIVE';
        batteryEl.textContent = `CORE ${pct}% [${charging}]`;
        if (pct < 20) {
          batteryEl.style.color = 'var(--color-stark-red)';
        } else {
          batteryEl.style.color = 'var(--color-green)';
        }
      }
      updateBattery();
      battery.addEventListener('levelchange', updateBattery);
      battery.addEventListener('chargingchange', updateBattery);
    }).catch(() => {
      batteryEl.textContent = 'ARC-LINK ENCRYPTED (100%)';
    });
  } else {
    batteryEl.textContent = 'QUANTUM CELL (99.8%)';
  }
}

// --- J.A.R.V.I.S. INTERACTIVE CLI TERMINAL ---
function setupTerminal() {
  const body = document.getElementById('terminalBody');
  const input = document.getElementById('termInput');
  const submitBtn = document.getElementById('termSubmitBtn');

  if (!body || !input) return;

  const COMMANDS = {
    help: () => {
      speakJarvis("Displaying authorized Stark Industries command directory.");
      return [
        'AVAILABLE STARK SHELL COMMANDS:',
        '  status       - Diagnostic of Stark power grids & Veronica orbital',
        '  suits        - List active Iron Legion chassis in vault',
        '  jarvis       - Query J.A.R.V.I.S. heuristic intelligence status',
        '  override     - Toggle Stark Defense Security Protocol',
        '  iamironman   - Initiate the endgame contingency',
        '  avengers     - Display active team readiness status',
        '  pepper       - Message Virginia "Pepper" Potts executive desk',
        '  clear        - Clear console window'
      ];
    },
    status: () => {
      speakJarvis("All primary grids are operational, sir. Global Arc output is nominal.");
      return [
        'DIAGNOSTICS REPORT // STARK CORP GLOBAL:',
        '  • Metropolitan Arc Grid: 100% Operational',
        '  • Veronica Orbital Platform: Low-Earth orbit, telemetry locked',
        '  • Clean Energy Share: 74.2% of North American East Coast',
        '  • Security Level: LEVEL 9 (Executive Clearances Tony/Pepper)'
      ];
    },
    suits: () => {
      speakJarvis("Accessing the armor vault. Iron Legion chassis are primed and standing by.");
      return [
        'IRON LEGION VAULT INVENTORY:',
        '  • Mark III: Classic Gold-Titanium (Showroom)',
        '  • Mark V: Emergency Suitcase Chassis',
        '  • Mark XLIV: Veronica Hulkbuster Platform',
        '  • Mark XLII: Autonomous Prehensile System',
        '  • Mark VII: Heavy Combat Armor'
      ];
    },
    jarvis: () => {
      speakJarvis("Always at your service, sir. All automated systems are functioning within normal parameters. Shall I schedule an appointment with Miss Potts?");
      return [
        'J.A.R.V.I.S.: "At your service, sir. All automated systems are functioning within normal parameters. Shall I schedule an appointment with Miss Potts?"'
      ];
    },
    iamironman: () => {
      speakJarvis("Authentication accepted, Mister Stark. And I... am... Iron Man.");
      return [
        '>>> AUTHENTICATION ACCEPTED: ANTHONY EDWARD STARK',
        '>>> "And I... am... Iron Man." *SNAP*',
        '>>> Global radiation dissipated. The universe is secure.'
      ];
    },
    avengers: () => {
      speakJarvis("Avengers telemetry linked. Captain Rogers and Doctor Banner are in position.");
      return [
        'AVENGERS INITIATIVE PROTOCOL:',
        '  • Captain Rogers: Active // Tactical Lead',
        '  • Dr. Banner: Laboratory // Gamma containment stable',
        '  • Thor Odinson: Off-world telemetry',
        '  • Natasha Romanoff: Intelligence / Black Ops',
        '  • Clint Barton: Field Specialist'
      ];
    },
    pepper: () => {
      speakJarvis("Connecting to Miss Potts' executive terminal.");
      return [
        'OUTGOING TO PEPPER POTTS: "Tony, please stop letting visitors test the prototype repulsors in the living room."'
      ];
    },
    override: () => {
      toggleThreatMode();
      speakJarvis("Warning. Stark Defense Protocol toggled. Threat levels elevated.");
      return ['DEFENSE PROTOCOL TOGGLED. Threat levels updated.'];
    },
    clear: () => {
      body.innerHTML = '';
      return [];
    }
  };

  function executeCommand(cmdText) {
    const raw = cmdText.trim();
    if (!raw) return;

    // Echo command
    const echo = document.createElement('div');
    echo.className = 'term-line cmd-echo';
    echo.textContent = `tony@stark:~$ ${raw}`;
    body.appendChild(echo);

    playBeep(800, 'sine', 0.05);

    const cmd = raw.toLowerCase();
    let responseLines = [];

    if (COMMANDS[cmd]) {
      responseLines = COMMANDS[cmd]();
    } else {
      speakJarvis("Command not recognized. Please consult the help directory.");
      responseLines = [
        `Command not recognized: "${raw}". Type "help" for a list of authorized Stark commands.`
      ];
    }

    responseLines.forEach(line => {
      const resp = document.createElement('div');
      resp.className = 'term-line output';
      resp.textContent = line;
      body.appendChild(resp);
    });

    body.scrollTop = body.scrollHeight;
    input.value = '';
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      executeCommand(input.value);
    }
  });

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      executeCommand(input.value);
    });
  }
}

// --- THREAT PROTOCOL TOGGLE ---
function toggleThreatMode() {
  const isThreat = document.body.classList.toggle('theme-threat');
  const alertBtn = document.getElementById('threatAlertBtn');

  if (alertBtn) {
    const label = alertBtn.querySelector('.btn-text');
    if (isThreat) {
      label.textContent = 'DEFENSE: HULKBUSTER THREAT';
      playArcDischargeSound();
    } else {
      label.textContent = 'DEFENSE: SECURE';
      playBeep(520, 'sine', 0.15);
    }
  }
}

// --- MODAL SYSTEM ---
function openModal(title, htmlContent) {
  const modal = document.getElementById('hudModal');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');

  if (!modal) return;
  titleEl.textContent = title;
  bodyEl.innerHTML = htmlContent;
  modal.classList.add('active');
  playBeep(980, 'sine', 0.08);
}

function closeModal() {
  const modal = document.getElementById('hudModal');
  if (modal) modal.classList.remove('active');
  playBeep(440, 'sine', 0.05);
}

function setupModal() {
  const closeBtn = document.getElementById('modalCloseBtn');
  const actionBtn = document.getElementById('modalActionBtn');
  const modal = document.getElementById('hudModal');

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (actionBtn) actionBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal();
    });
  }

  // Grant Application Trigger
  const grantBtn = document.getElementById('applyGrantBtn');
  if (grantBtn) {
    grantBtn.addEventListener('click', () => {
      openModal(
        'SEPTEMBER FOUNDATION GRANT APPLICATION',
        'Applicant telemetry uploaded.<br/><br/>"We don\'t believe in red tape. If your science solves real problems, consider your seed round funded by Stark Industries."<br/><br/><strong>Status: APPLICATION QUEUED FOR J.A.R.V.I.S. EVALUATION.</strong>'
      );
    });
  }
}

// --- AUDIO TOGGLE ---
function setupAudioToggle() {
  const soundBtn = document.getElementById('soundToggle');
  if (!soundBtn) return;

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    const label = soundBtn.querySelector('.hud-label');
    const icon = soundBtn.querySelector('.hud-icon');

    if (soundEnabled) {
      label.textContent = 'AUDIO: ON';
      icon.textContent = '🔊';
      playBeep(900, 'sine', 0.08);
    } else {
      label.textContent = 'AUDIO: MUTED';
      icon.textContent = '🔇';
    }
  });
}

// --- INITIALIZE ALL MODULES ---
document.addEventListener('DOMContentLoaded', () => {
  initCanvasParticles();
  setupSuitSelector();
  setupArcReactor();
  setupBatteryTelemetry();
  setupTerminal();
  setupModal();
  setupAudioToggle();

  const threatBtn = document.getElementById('threatAlertBtn');
  if (threatBtn) {
    threatBtn.addEventListener('click', toggleThreatMode);
  }

  // --- MOBILE NAV DRAWER TOGGLE ---
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  if (mobileMenuBtn && mobileNavDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileNavDrawer.classList.toggle('open');
      mobileMenuBtn.querySelector('.hamburger-icon').textContent = isOpen ? '✕' : '☰';
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    // Close drawer on outside click
    mobileNavDrawer.addEventListener('click', (e) => {
      if (e.target === mobileNavDrawer) {
        mobileNavDrawer.classList.remove('open');
        mobileMenuBtn.querySelector('.hamburger-icon').textContent = '☰';
        document.body.style.overflow = '';
      }
    });
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNavDrawer.classList.contains('open')) {
        mobileNavDrawer.classList.remove('open');
        mobileMenuBtn.querySelector('.hamburger-icon').textContent = '☰';
        document.body.style.overflow = '';
      }
    });
  }

  // Welcome beep on first interaction
  window.addEventListener('click', () => {
    initAudio();
  }, { once: true });
});

