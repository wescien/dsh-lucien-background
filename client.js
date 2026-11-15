window.__ModuleLoader__.load({
  id: '@local/aurora-background',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /* ------------------------------------------------------------------ *
     * Shared settings: one JSON blob in localStorage plus a window event.
     * The background, the settings page and the star/meteor addon module
     * all read this shape, so every control stays consistent.
     * ------------------------------------------------------------------ */
    const SETTINGS_KEY = 'dsh.cosmic.settings';
    const SETTINGS_EVENT = 'dsh-cosmic:settings';

    const BACKGROUNDS = ['aurora', 'ocean', 'galaxy', 'sunrise', 'ember', 'forest', 'arctic'];
    const STAR_COLORS = ['jewel', 'gold', 'ice', 'snow'];

    const DEFAULTS = {
      background: 'aurora',
      speed: 1,
      contrast: 1,
      saturation: 1,
      stars: { enabled: true, color: 'jewel', count: 56, follow: true },
      meteors: { enabled: false, frequency: 1 },
      glow: { enabled: false, strength: 0.12 },
      snow: { enabled: false, intensity: 1 },
      auto: { time: false, degrade: false },
      blur: 0,
      motion: 'force',
      scrim: 0,
    };

    /* ------------------------------------------------------------------ *
     * Particle engine, merged from the former @local/aurora-stars package.
     * It keeps its own scope so its helpers cannot collide with the scenes.
     * ------------------------------------------------------------------ */
    function mountParticles(ctx) {
      const particleModule = (() => {
    /* ------------------------------------------------------------------ *
     * This module owns the particle canvas: star dust, meteors and (when
     * the background module is absent) a fallback surface tint. Everything
     * it draws is driven by the shared settings blob below.
     * ------------------------------------------------------------------ */
    const SETTINGS_KEY = 'dsh.cosmic.settings';

    /* Runtime errors, surfaced through stats() so a silent rAF failure is visible. */
    const errors = (window.__cosmicStarErrors = window.__cosmicStarErrors || []);
    /* Fresh mount: drop errors recorded by a previous instance. */
    errors.length = 0;
    if (!errors.bound) {
      errors.bound = true;
      const record = (text) => {
        errors.push(String(text));
        if (errors.length > 6) errors.shift();
      };
      window.addEventListener('error', (event) => record(event.message || event.error || 'error'));
      window.addEventListener('unhandledrejection', (event) => record('rejection: ' + event.reason));
    }
    const SETTINGS_EVENT = 'dsh-cosmic:settings';

    const STAR_COLORS = ['jewel', 'gold', 'ice', 'snow'];

    const DEFAULTS = {
      background: 'aurora',
      speed: 1,
      contrast: 1,
      saturation: 1,
      stars: { enabled: true, color: 'jewel', count: 56, follow: true },
      meteors: { enabled: false, frequency: 1 },
    };

    const clamp = (value, min, max, fallback) => (
      typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
    );

    function normalize(raw) {
      const src = raw && typeof raw === 'object' ? raw : {};
      const stars = src.stars && typeof src.stars === 'object' ? src.stars : {};
      const meteors = src.meteors && typeof src.meteors === 'object' ? src.meteors : {};
      const glow = src.glow && typeof src.glow === 'object' ? src.glow : {};
      const snow = src.snow && typeof src.snow === 'object' ? src.snow : {};
      return {
        background: DEFAULTS.background,
        speed: clamp(src.speed, 0.2, 3, 1),
        contrast: clamp(src.contrast, 0.6, 1.8, 1),
        saturation: clamp(src.saturation, 0.4, 1.8, 1),
        stars: {
          enabled: stars.enabled !== false,
          color: STAR_COLORS.includes(stars.color) ? stars.color : 'jewel',
          count: Math.round(clamp(stars.count, 16, 140, DEFAULTS.stars.count)),
          follow: stars.follow !== false,
        },
        meteors: {
          enabled: meteors.enabled === true,
          frequency: clamp(meteors.frequency, 0.2, 3, 1),
        },
        glow: {
          enabled: glow.enabled === true,
          strength: clamp(glow.strength, 0.04, 0.45, 0.2),
        },
        snow: {
          enabled: snow.enabled === true,
          intensity: clamp(snow.intensity, 0.2, 2, 1),
        },
        motion: src.motion === 'system' ? 'system' : 'force',
      };
    }

    function readSettings() {
      try {
        return normalize(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'));
      } catch {
        return normalize(null);
      }
    }

    const isDark = () => document.body.hasAttribute('data-ds-dark-theme');
    /** 'force' keeps the particles moving even when the OS asks for reduced motion. */
    let motionOverride = false;
    const reduceMotion = () => !motionOverride && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /** Tint palettes: four named moods per theme. */
    const TINTS = {
      light: {
        jewel: [
          { rgb: '255, 206, 112', glow: '255, 176, 46' },
          { rgb: '255, 236, 196', glow: '255, 198, 110' },
          { rgb: '186, 228, 255', glow: '112, 190, 255' },
          { rgb: '236, 206, 255', glow: '186, 132, 255' },
        ],
        gold: [
          { rgb: '255, 214, 120', glow: '255, 178, 40' },
          { rgb: '255, 232, 176', glow: '255, 196, 92' },
          { rgb: '255, 244, 214', glow: '255, 214, 140' },
          { rgb: '255, 200, 96', glow: '255, 160, 24' },
        ],
        ice: [
          { rgb: '196, 232, 255', glow: '110, 190, 255' },
          { rgb: '224, 244, 255', glow: '150, 214, 255' },
          { rgb: '170, 216, 255', glow: '80, 160, 255' },
          { rgb: '240, 250, 255', glow: '190, 230, 255' },
        ],
        snow: [
          { rgb: '255, 255, 255', glow: '224, 232, 245' },
          { rgb: '248, 250, 255', glow: '210, 222, 240' },
          { rgb: '255, 255, 255', glow: '236, 242, 255' },
          { rgb: '240, 246, 255', glow: '200, 214, 235' },
        ],
      },
      dark: {
        jewel: [
          { rgb: '255, 222, 148', glow: '255, 186, 72' },
          { rgb: '255, 255, 255', glow: '198, 220, 255' },
          { rgb: '190, 234, 255', glow: '120, 196, 255' },
          { rgb: '255, 206, 236', glow: '255, 132, 206' },
        ],
        gold: [
          { rgb: '255, 214, 120', glow: '255, 170, 40' },
          { rgb: '255, 236, 176', glow: '255, 198, 96' },
          { rgb: '255, 246, 214', glow: '255, 220, 150' },
          { rgb: '255, 196, 88', glow: '255, 146, 20' },
        ],
        ice: [
          { rgb: '180, 226, 255', glow: '90, 178, 255' },
          { rgb: '220, 242, 255', glow: '140, 206, 255' },
          { rgb: '150, 206, 255', glow: '60, 140, 255' },
          { rgb: '240, 250, 255', glow: '180, 226, 255' },
        ],
        snow: [
          { rgb: '255, 255, 255', glow: '220, 230, 250' },
          { rgb: '246, 250, 255', glow: '200, 214, 240' },
          { rgb: '255, 255, 255', glow: '235, 242, 255' },
          { rgb: '236, 244, 255', glow: '190, 206, 232' },
        ],
      },
    };

    /** Bake one four-point sparkle: halo, concave body, white core. */
    function bakeSparkle(tint, rotation) {
      const SIZE = 64;
      const CENTER = SIZE / 2;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const g = canvas.getContext('2d');

      const halo = g.createRadialGradient(CENTER, CENTER, 0, CENTER, CENTER, CENTER);
      halo.addColorStop(0, `rgba(${tint.glow}, 0.42)`);
      halo.addColorStop(0.35, `rgba(${tint.glow}, 0.14)`);
      halo.addColorStop(1, `rgba(${tint.glow}, 0)`);
      g.fillStyle = halo;
      g.fillRect(0, 0, SIZE, SIZE);

      g.translate(CENTER, CENTER);
      g.rotate(rotation);

      const REACH = 27;
      const WAIST = 3.4;
      g.beginPath();
      g.moveTo(0, -REACH);
      g.quadraticCurveTo(WAIST, -WAIST, REACH, 0);
      g.quadraticCurveTo(WAIST, WAIST, 0, REACH);
      g.quadraticCurveTo(-WAIST, WAIST, -REACH, 0);
      g.quadraticCurveTo(-WAIST, -WAIST, 0, -REACH);
      g.closePath();
      g.fillStyle = `rgba(${tint.rgb}, 0.92)`;
      g.fill();

      const core = g.createRadialGradient(0, 0, 0, 0, 0, 6.5);
      core.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      core.addColorStop(1, `rgba(${tint.rgb}, 0)`);
      g.beginPath();
      g.arc(0, 0, 6.5, 0, Math.PI * 2);
      g.fillStyle = core;
      g.fill();

      return canvas;
    }

    /** A soft dark halo drawn under each star so it stays legible on the now
       strongly coloured wallpapers. Colour independent, baked once. */
    function bakeShadow() {
      const SIZE = 64;
      const CENTER = SIZE / 2;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const g = canvas.getContext('2d');
      const grad = g.createRadialGradient(CENTER, CENTER, 0, CENTER, CENTER, CENTER);
      grad.addColorStop(0, 'rgba(10, 14, 30, 0.6)');
      grad.addColorStop(0.45, 'rgba(10, 14, 30, 0.24)');
      grad.addColorStop(1, 'rgba(10, 14, 30, 0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, SIZE, SIZE);
      return canvas;
    }

    /** Surface tint used only while the background module is not mounted. */
    function createSurfaceFallback() {
      const body = document.body;
      const root = document.documentElement;
      const props = [
        [body, 'background'], [root, 'background'],
        [body, '--dsw-alias-bg-base'], [body, '--dsw-specific-sidebar-fill'],
      ];
      const snapshot = props.map(([el, prop]) => ({
        el, prop, value: el.style.getPropertyValue(prop), priority: el.style.getPropertyPriority(prop),
      }));
      let held = false;

      const paint = () => {
        const dark = isDark();
        body.style.setProperty('background', 'transparent', 'important');
        root.style.setProperty('background', 'transparent', 'important');
        body.style.setProperty('--dsw-alias-bg-base', dark ? 'rgba(6, 9, 18, 0.1)' : 'rgba(250, 251, 255, 0.08)', 'important');
        body.style.setProperty('--dsw-specific-sidebar-fill', dark ? 'rgba(6, 9, 18, 0.14)' : 'rgba(248, 249, 253, 0.12)', 'important');
        held = true;
      };
      const release = () => {
        if (!held) return;
        for (const entry of snapshot) {
          if (entry.value === '') entry.el.style.removeProperty(entry.prop);
          else entry.el.style.setProperty(entry.prop, entry.value, entry.priority);
        }
        held = false;
      };

      return {
        paint,
        release,
        /* Drop ownership without restoring: the background module owns the
           same properties now, and restoring our stale snapshot would erase
           its tint. */
        drop() {
          held = false;
        },
      };
    }

    function createField() {
      const canvas = document.createElement('canvas');
      Object.assign(canvas.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      });
      canvas.setAttribute('aria-hidden', 'true');
      return canvas;
    }

    return {
      inject: [],
      apply(ctx) {
        ctx.effect(() => {
          if (!document.body) return () => {};

          /* Only one particle instance may live at a time: a module reload
             must not leave the previous rAF loop running against removed DOM. */
          if (typeof window.__cosmicStarsCleanup === "function") {
            try { window.__cosmicStarsCleanup(); } catch { /* ignore */ }
          }

          let settings = readSettings();
          /* Seed the override from the stored preference: without this the first
             mount always takes the reduced-motion branch and draws one frozen frame. */
          motionOverride = settings.motion === 'force';

          /* Own layer stacked above the background module's (z-index -2), so
             either row can be reloaded without taking the other one down. */
          const existingHost = document.getElementById('dsh-cosmic-stars');
          if (existingHost) existingHost.remove();
          const owned = document.createElement('div');
          owned.id = 'dsh-cosmic-stars';
          Object.assign(owned.style, {
            position: 'fixed', inset: '0', zIndex: '-1',
            overflow: 'hidden', pointerEvents: 'none',
          });
          document.body.prepend(owned);
          const host = owned;

          const canvas = createField();
          canvas.dataset.cosmicParticles = '1';
          host.appendChild(canvas);

          const context = canvas.getContext('2d');
          const view = { w: 0, h: 0, dpr: 1 };
          const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, inside: false };
          const state = { running: false, frame: 0, shadow: null, sprites: [], stars: [], meteors: [], nextMeteorAt: 0, spawned: 0, ticks: 0, lastDrawAt: 0, clock: 0, cleared: false, fps: 0, frames: 0, fpsAt: 0, snow: [] };

          /* Surfaces are the background module's job whenever it is mounted;
             this fallback only covers "stars alone" and releases the moment
             that layer shows up again. */
          const surfaces = createSurfaceFallback();
          const syncSurfaces = () => {
            if (document.getElementById('dsh-cosmic')) surfaces.drop();
            else surfaces.paint();
          };
          syncSurfaces();
          const hostObserver = new MutationObserver(syncSurfaces);
          hostObserver.observe(document.body, { childList: true });

          /* ---------------- sprites + star field ---------------- */
          const buildSprites = () => {
            const palette = (isDark() ? TINTS.dark : TINTS.light)[settings.stars.color] || TINTS.light.jewel;
            state.sprites = [];
            if (!state.shadow) state.shadow = bakeShadow();
            for (const tint of palette) {
              state.sprites.push(bakeSparkle(tint, 0));
              state.sprites.push(bakeSparkle(tint, Math.PI / 4));
            }
          };

          const rebuildStars = () => {
            const count = settings.stars.count;
            state.stars = [];
            let seed = 778899;
            const rand = () => {
              seed = (seed * 1664525 + 1013904223) % 4294967296;
              return seed / 4294967296;
            };
            for (let index = 0; index < count; index += 1) {
              const roll = rand();
              state.stars.push({
                x: rand(),
                y: rand(),
                size: 9 + rand() * 15,
                depth: 0.2 + rand() * 0.8,
                phase: rand() * Math.PI * 2,
                twinkle: 0.5 + rand() * 1.7,
                driftX: (rand() - 0.5) * 0.004,
                driftY: (rand() - 0.5) * 0.004,
                sprite: index % 2,
                tint: roll < 0.42 ? 0 : roll < 0.7 ? 1 : roll < 0.88 ? 2 : 3,
              });
            }
          };


          const rebuildSnow = () => {
            const count = Math.round(42 * settings.snow.intensity);
            state.snow = [];
            let seed = 20260117;
            const rand = () => {
              seed = (seed * 1664525 + 1013904223) % 4294967296;
              return seed / 4294967296;
            };
            for (let index = 0; index < count; index += 1) {
              state.snow.push({
                x: rand(),
                y: rand(),
                r: 1.2 + rand() * 1.8,
                speed: 0.02 + rand() * 0.05,
                sway: rand() * Math.PI * 2,
                drift: -0.02 + rand() * 0.04,
                alpha: 0.35 + rand() * 0.5,
              });
            }
          };
          const resize = () => {
            view.w = window.innerWidth;
            view.h = window.innerHeight;
            view.dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.max(1, Math.round(view.w * view.dpr));
            canvas.height = Math.max(1, Math.round(view.h * view.dpr));
            context.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
          };

          /* ---------------- pointer ---------------- */
          const onPointer = (event) => {
            const nx = event.clientX / Math.max(1, view.w);
            const ny = event.clientY / Math.max(1, view.h);
            if (!pointer.inside) {
              pointer.x = nx;
              pointer.y = ny;
            }
            pointer.tx = nx;
            pointer.ty = ny;
            pointer.inside = true;
          };
          const onLeave = () => {
            pointer.tx = 0.5;
            pointer.ty = 0.5;
            pointer.inside = false;
          };
          const onOut = (event) => {
            if (!event.relatedTarget) onLeave();
          };

          /* ---------------- meteors ---------------- */
          const spawnMeteor = (now) => {
            state.spawned += 1;
            const angle = (18 + Math.random() * 14) * (Math.PI / 180);
            const speed = 620 + Math.random() * 260;
            state.meteors.push({
              x: Math.random() * view.w * 0.85,
              y: -40 - Math.random() * 80,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              len: 180 + Math.random() * 140,
              hue: Math.floor(Math.random() * 360),
              born: now,
              life: 2.6,
            });
            const gap = (6 + Math.random() * 8) / Math.max(0.2, settings.meteors.frequency);
            state.nextMeteorAt = now + gap * 1000;
          };

          /* ---------------- frame ---------------- */
          let last = 0;
          const draw = (now) => {
            state.ticks += 1;
            state.lastDrawAt = performance.now();
            /* Clamp and accumulate our own clock: a throttled window produces a
               huge gap in 
ow, which used to jump every twinkle phase at once. */
            const dt = last === 0 ? 0 : Math.min(0.05, Math.max(0, (now - last) / 1000));
            last = now;
            state.clock += dt;
            pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 4);
            pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 4);

            state.frames += 1;
            if (state.fpsAt === 0) state.fpsAt = now;
            if (now - state.fpsAt >= 1000) {
              state.fps = (state.frames * 1000) / (now - state.fpsAt);
              state.frames = 0;
              state.fpsAt = now;
            }

            context.clearRect(0, 0, view.w, view.h);

            if (settings.glow.enabled && pointer.inside) {
              const gx = pointer.x * view.w;
              const gy = pointer.y * view.h;
              const radius = 420;
              const halo = context.createRadialGradient(gx, gy, 0, gx, gy, radius);
              const tint = isDark() ? '168, 226, 255' : '120, 160, 220';
              const strength = settings.glow.strength * 1.6;
              halo.addColorStop(0, `rgba(${tint}, ${strength})`);
              halo.addColorStop(0.45, `rgba(${tint}, ${strength * 0.35})`);
              halo.addColorStop(1, `rgba(${tint}, 0)`);
              context.fillStyle = halo;
              context.fillRect(gx - radius, gy - radius, radius * 2, radius * 2);
            }

            if (settings.stars.enabled) {
              const mx = pointer.tx * view.w;
              const my = pointer.ty * view.h;
              const pull = settings.stars.follow && pointer.inside ? 96 : 0;
              const parallax = settings.stars.follow ? 16 : 0;

              for (const star of state.stars) {
                star.x = (star.x + star.driftX * dt + 1) % 1;
                star.y = (star.y + star.driftY * dt + 1) % 1;

                let px = star.x * view.w + (pointer.x - 0.5) * parallax * star.depth;
                let py = star.y * view.h + (pointer.y - 0.5) * parallax * star.depth;
                py += Math.sin(state.clock * 0.385 + star.phase) * 2.4;

                if (pull > 0) {
                  const dx = mx - px;
                  const dy = my - py;
                  const distance = Math.hypot(dx, dy);
                  const target = distance < pull ? 1 : 0;
                  star.attract = (star.attract || 0) + (target - (star.attract || 0)) * Math.min(1, dt * 9);
                  if (distance < pull && star.attract > 0.001) {
                    const force = (1 - distance / pull) ** 1.25 * 0.42 * star.attract;
                    px += dx * force;
                    py += dy * force;
                  }
                } else {
                  star.attract = 0;
                }

                const wave = Math.sin(state.clock * star.twinkle + star.phase);
                const twinkle = 0.5 + 0.5 * wave;
                const scale = (0.82 + twinkle * 0.34) * (0.7 + star.depth * 0.5);
                const size = star.size * scale;
                const sprite = state.sprites[star.tint * 2 + star.sprite];
                if (!sprite) continue;
                if (state.shadow) {
                  const halo = size * 1.6;
                  context.globalAlpha = (isDark() ? 0.22 : 0.5) * (0.45 + twinkle * 0.55);
                  context.drawImage(state.shadow, px - halo / 2, py - halo / 2, halo, halo);
                }
                context.globalAlpha = 0.28 + twinkle * 0.72;
                context.drawImage(sprite, px - size / 2, py - size / 2, size, size);
              }
              context.globalAlpha = 1;
            }


            if (settings.snow.enabled) {
              context.fillStyle = isDark() ? 'rgba(225, 240, 255, 0.9)' : 'rgba(255, 255, 255, 0.95)';
              for (const flake of state.snow) {
                flake.y = (flake.y + flake.speed * dt + 1) % 1;
                flake.sway += dt * 0.7;
                const fx = (flake.x + Math.sin(flake.sway) * 0.01 + flake.drift * dt + 1) % 1;
                context.globalAlpha = flake.alpha;
                context.beginPath();
                context.arc(fx * view.w, flake.y * view.h, flake.r, 0, Math.PI * 2);
                context.fill();
              }
              context.globalAlpha = 1;
            }
            if (settings.meteors.enabled && !reduceMotion()) {
              if (state.nextMeteorAt === 0) state.nextMeteorAt = now + 2200;
              if (now >= state.nextMeteorAt && state.meteors.length < 3) spawnMeteor(now);

              for (const meteor of state.meteors) {
                const age = (now - meteor.born) / 1000;
                if (age > meteor.life) continue;
                meteor.x += meteor.vx * dt;
                meteor.y += meteor.vy * dt;
                const fade = Math.max(0, 1 - age / meteor.life);
                const tailX = meteor.x - meteor.vx * (meteor.len / 800);
                const tailY = meteor.y - meteor.vy * (meteor.len / 800);

                /* Rainbow tail: five stops that sweep the hue along the streak. */
                const gradient = context.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
                for (let step = 0; step <= 4; step += 1) {
                  const t = step / 4;
                  const hue = (meteor.hue + t * 210) % 360;
                  const alpha = (1 - t) * 0.95 * fade;
                  gradient.addColorStop(t, `hsla(${hue}, 96%, ${68 - t * 14}%, ${alpha})`);
                }

                /* A soft dark underlay keeps it readable on pale wallpapers. */
                context.strokeStyle = `rgba(10, 14, 30, ${0.3 * fade})`;
                context.lineWidth = 9;
                context.lineCap = 'round';
                context.beginPath();
                context.moveTo(meteor.x, meteor.y);
                context.lineTo(tailX, tailY);
                context.stroke();

                /* Wide coloured trail, then a bright white core on top. */
                context.strokeStyle = gradient;
                context.lineWidth = 4.6;
                context.lineCap = 'round';
                context.beginPath();
                context.moveTo(meteor.x, meteor.y);
                context.lineTo(tailX, tailY);
                context.stroke();

                context.strokeStyle = `rgba(255, 255, 255, ${0.85 * fade})`;
                context.lineWidth = 1.6;
                context.beginPath();
                context.moveTo(meteor.x, meteor.y);
                context.lineTo(tailX, tailY);
                context.stroke();

                /* Big bright head with its own glow. */
                const headRadius = (9 + meteor.len / 42) * (0.55 + 0.45 * fade);
                const head = context.createRadialGradient(
                  meteor.x, meteor.y, 0,
                  meteor.x, meteor.y, headRadius * 2.6,
                );
                head.addColorStop(0, `hsla(${meteor.hue}, 100%, 96%, ${fade})`);
                head.addColorStop(0.28, `hsla(${meteor.hue}, 100%, 76%, ${0.85 * fade})`);
                head.addColorStop(0.6, `hsla(${meteor.hue}, 100%, 64%, ${0.32 * fade})`);
                head.addColorStop(1, `hsla(${meteor.hue}, 100%, 60%, 0)`);
                context.fillStyle = head;
                context.beginPath();
                context.arc(meteor.x, meteor.y, headRadius * 2.6, 0, Math.PI * 2);
                context.fill();
                context.fillStyle = `rgba(255, 255, 255, ${fade})`;
                context.beginPath();
                context.arc(meteor.x, meteor.y, headRadius * 0.42, 0, Math.PI * 2);
                context.fill();
              }
              state.meteors = state.meteors.filter((meteor) => (now - meteor.born) / 1000 <= meteor.life);
            } else if (!settings.meteors.enabled) {
              state.meteors.length = 0;
            }

            if (state.running) state.frame = requestAnimationFrame(draw);
          };

          const start = () => {
            if (state.running) return;
            state.running = true;
            last = 0;
            state.frame = requestAnimationFrame(draw);
          };
          const stop = () => {
            state.running = false;
            cancelAnimationFrame(state.frame);
          };

          const applySettings = (next) => {
            const previous = settings;
            settings = normalize(next);
            motionOverride = settings.motion === 'force';
            if (settings.stars.color !== previous.stars.color) buildSprites();
            if (settings.stars.count !== previous.stars.count) rebuildStars();
            if (settings.snow.intensity !== previous.snow.intensity) rebuildSnow();
            /* Re-arm the meteor schedule when it is switched on or its frequency
               changes; otherwise a stale timestamp can delay the next one by 10s+. */
            if (settings.meteors.enabled && (!previous.meteors.enabled || settings.meteors.frequency !== previous.meteors.frequency)) {
              state.nextMeteorAt = 0;
            }
            if (!settings.snow.enabled) state.snow.length = 0;
            if (settings.snow.enabled && state.snow.length === 0) rebuildSnow();

            const active = settings.stars.enabled || settings.meteors.enabled || settings.snow.enabled;
            if (!active) {
              stop();
              context.clearRect(0, 0, view.w, view.h);
              state.cleared = true;
            } else {
              state.cleared = false;
              if (!state.running && !reduceMotion()) start();
            }
            syncSurfaces();
          };

          const onSettings = (event) => applySettings(event.detail);
          const onTheme = () => {
            buildSprites();
            syncSurfaces();
          };

          buildSprites();
          rebuildStars();
          rebuildSnow();
          resize();
          window.addEventListener('resize', resize);
          window.addEventListener('pointermove', onPointer, { passive: true, capture: true });
          document.addEventListener('pointerout', onOut, { passive: true });
          window.addEventListener('blur', onLeave);
          window.addEventListener(SETTINGS_EVENT, onSettings);

          /* Debounced so a one-frame flip cannot swap sprite colours. */
          let themeTimer = 0;
          const themeObserver = new MutationObserver(() => {
            clearTimeout(themeTimer);
            themeTimer = setTimeout(onTheme, 160);
          });
          themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });

          const anyActive = () => settings.stars.enabled || settings.meteors.enabled || settings.snow.enabled;
          const visibility = () => {
            if (document.visibilityState === 'visible' && anyActive() && !reduceMotion()) start();
            else stop();
          };
          document.addEventListener('visibilitychange', visibility);

          /* Watchdog: if the frame counter stops advancing while the scene is
             active, the rAF chain died (throttled window, stale fast-tab flag,
             resumed renderer). Rebuild it instead of staying frozen. */
          const watchdog = setInterval(() => {
            if (!anyActive() || reduceMotion()) return;
            if (performance.now() - state.lastDrawAt < 800) return;
            cancelAnimationFrame(state.frame);
            state.running = false;
            start();
          }, 700);

          /* Any pointer activity is also a cheap hint that the page is live. */
          const rearm = () => {
            if (!state.running && anyActive() && !reduceMotion()) start();
          };
          window.addEventListener('pointermove', rearm, { passive: true });

          /* A blurred window stops the rAF loop; focus resumes it. */
          const onBlurPause = () => stop();
          const onFocusResume = () => {
            if (document.visibilityState === 'visible' && anyActive() && !reduceMotion()) start();
          };
          window.addEventListener('blur', onBlurPause);
          window.addEventListener('focus', onFocusResume);

          if (reduceMotion()) {
            state.running = true;
            draw(0);
            state.running = false;
          } else if (settings.stars.enabled) {
            start();
          }

          /* Read-only probe used by the background module's self-test. */
          const hook = {
            stats: () => ({
              count: state.stars.length,
              sprites: state.sprites.length,
              running: state.running,
              meteors: state.meteors.length,
              enabled: settings.stars.enabled,
              cleared: state.cleared === true,
              glow: settings.glow.enabled,
              follow: settings.stars.follow,
              meteorsOn: settings.meteors.enabled,
              nextMeteorIn: Math.max(0, Math.round(state.nextMeteorAt - performance.now())),
              spawned: state.spawned,
              ticks: state.ticks,
              errors: (window.__cosmicStarErrors || []).slice(-3),
              intensity: settings.snow.intensity,
              snow: state.snow.length,
            }),
          };
          window.__cosmicStars = hook;

          const dispose = () => {
            if (window.__cosmicStars === hook) delete window.__cosmicStars;
            stop();
            window.removeEventListener('resize', resize);
            window.removeEventListener('pointermove', onPointer, { capture: true });
            document.removeEventListener('pointerout', onOut);
            clearInterval(watchdog);
            window.removeEventListener('pointermove', rearm);
            window.removeEventListener('blur', onLeave);
            window.removeEventListener('blur', onBlurPause);
            window.removeEventListener('focus', onFocusResume);
            window.removeEventListener(SETTINGS_EVENT, onSettings);
            document.removeEventListener('visibilitychange', visibility);
            themeObserver.disconnect();
            clearTimeout(themeTimer);
            hostObserver.disconnect();
            if (document.getElementById('dsh-cosmic')) surfaces.drop();
            else surfaces.release();
            canvas.remove();
            owned.remove();
          };

          window.__cosmicStarsCleanup = dispose;
          return dispose;
        }, 'aurora-stars: particle field');
      },
    };
      })();
      if (particleModule && typeof particleModule.apply === 'function') particleModule.apply(ctx);
    }

    /** One-click moods: each entry is a complete settings patch, not a partial one. */
    const PRESETS = {
      classic: {
        background: 'aurora',
        speed: 1,
        contrast: 1,
        saturation: 1,
        stars: { enabled: true, color: 'jewel', count: 56, follow: true },
        meteors: { enabled: false, frequency: 1 },
        glow: { enabled: false, strength: 0.12 },
        scrim: 0,
      },
      polar: {
        background: 'galaxy',
        speed: 0.7,
        contrast: 1.1,
        saturation: 1.05,
        stars: { enabled: true, color: 'snow', count: 90, follow: true },
        meteors: { enabled: true, frequency: 0.6 },
        glow: { enabled: true, strength: 0.1 },
        scrim: 0,
      },
      deep: {
        background: 'ocean',
        speed: 0.8,
        contrast: 1.05,
        saturation: 1,
        stars: { enabled: true, color: 'gold', count: 24, follow: false },
        meteors: { enabled: false, frequency: 1 },
        glow: { enabled: false, strength: 0.12 },
        scrim: 0,
      },
      dawn: {
        background: 'sunrise',
        speed: 0.6,
        contrast: 1,
        saturation: 1.1,
        stars: { enabled: true, color: 'jewel', count: 30, follow: true },
        meteors: { enabled: false, frequency: 1 },
        glow: { enabled: true, strength: 0.08 },
        scrim: 0,
      },
      ember: {
        background: 'ember',
        speed: 0.7,
        contrast: 1.1,
        saturation: 1.15,
        stars: { enabled: true, color: 'gold', count: 46, follow: true },
        meteors: { enabled: false, frequency: 1 },
        glow: { enabled: true, strength: 0.12 },
        scrim: 0,
      },
      forest: {
        background: 'forest',
        speed: 0.75,
        contrast: 1.05,
        saturation: 1.1,
        stars: { enabled: true, color: 'gold', count: 40, follow: true },
        meteors: { enabled: false, frequency: 1 },
        glow: { enabled: true, strength: 0.1 },
        scrim: 0,
      },
      arctic: {
        background: 'arctic',
        speed: 0.65,
        contrast: 1.05,
        saturation: 1.05,
        stars: { enabled: true, color: 'ice', count: 70, follow: true },
        meteors: { enabled: true, frequency: 0.4 },
        glow: { enabled: true, strength: 0.12 },
        scrim: 0,
      },
      neon: {
        background: 'galaxy',
        speed: 1.6,
        contrast: 1.25,
        saturation: 1.35,
        stars: { enabled: true, color: 'ice', count: 110, follow: true },
        meteors: { enabled: true, frequency: 2.2 },
        glow: { enabled: true, strength: 0.18 },
        scrim: 0,
      },
    };

    const clamp = (value, min, max, fallback) => (
      typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
    );

    function normalize(raw) {
      const src = raw && typeof raw === 'object' ? raw : {};
      const stars = src.stars && typeof src.stars === 'object' ? src.stars : {};
      const meteors = src.meteors && typeof src.meteors === 'object' ? src.meteors : {};
      const glow = src.glow && typeof src.glow === 'object' ? src.glow : {};
      const snow = src.snow && typeof src.snow === 'object' ? src.snow : {};
      const auto = src.auto && typeof src.auto === 'object' ? src.auto : {};
      return {
        background: BACKGROUNDS.includes(src.background) ? src.background : DEFAULTS.background,
        speed: clamp(src.speed, 0.2, 3, DEFAULTS.speed),
        contrast: clamp(src.contrast, 0.6, 1.8, DEFAULTS.contrast),
        saturation: clamp(src.saturation, 0.4, 1.8, DEFAULTS.saturation),
        stars: {
          enabled: stars.enabled !== false,
          color: STAR_COLORS.includes(stars.color) ? stars.color : DEFAULTS.stars.color,
          count: Math.round(clamp(stars.count, 16, 140, DEFAULTS.stars.count)),
          follow: stars.follow !== false,
        },
        meteors: {
          enabled: meteors.enabled === true,
          frequency: clamp(meteors.frequency, 0.2, 3, DEFAULTS.meteors.frequency),
        },
        glow: {
          enabled: glow.enabled === true,
          strength: clamp(glow.strength, 0.04, 0.3, DEFAULTS.glow.strength),
        },
        snow: {
          enabled: snow.enabled === true,
          intensity: clamp(snow.intensity, 0.2, 2, DEFAULTS.snow.intensity),
        },
        auto: {
          time: auto.time === true,
          degrade: auto.degrade === true,
        },
        scrim: clamp(src.scrim, 0, 0.6, DEFAULTS.scrim),
        blur: clamp(src.blur, 0, 12, DEFAULTS.blur),
        /* Existing profiles have no motion field: default them to animated,
           the panel can switch back to following the OS. */
        motion: src.motion === 'system' ? 'system' : 'force',
      };
    }

    function readSettings() {
      try {
        return normalize(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'));
      } catch {
        return normalize(null);
      }
    }

    function writeSettings(next) {
      const normalized = normalize(next);
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
      } catch {
        /* private mode: the session still works, it just forgets on reload */
      }
      window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: normalized }));
      return normalized;
    }

    const isDark = () => document.body.hasAttribute('data-ds-dark-theme');

    /* ------------------------------------------------------------------ *
     * Animation rules. Static styles are inline properties because the
     * client module system sweeps `style[data-plugin]` tags on replacement.
     * ------------------------------------------------------------------ */
    const STYLE = `
@keyframes dshBandA {
  0%   { transform: translate3d(-6%, 0, 0) rotate(-12deg) scaleX(1); opacity: 0.38; }
  50%  { transform: translate3d(6%, -2%, 0) rotate(-12deg) scaleX(1.06); opacity: 0.62; }
  100% { transform: translate3d(-6%, 0, 0) rotate(-12deg) scaleX(1); opacity: 0.38; }
}
@keyframes dshBandB {
  0%   { transform: translate3d(5%, 1%, 0) rotate(-12deg) scaleX(1.04); opacity: 0.5; }
  50%  { transform: translate3d(-6%, -3%, 0) rotate(-12deg) scaleX(1); opacity: 0.3; }
  100% { transform: translate3d(5%, 1%, 0) rotate(-12deg) scaleX(1.04); opacity: 0.5; }
}
@keyframes dshBreathe {
  0%, 100% { opacity: 0.35; }
  50%      { opacity: 0.6; }
}
@keyframes dshSwell {
  0%   { transform: scale(1) translateY(0); }
  50%  { transform: scale(1.1) translateY(-3%); }
  100% { transform: scale(1) translateY(0); }
}
@keyframes dshCaustic {
  0%   { opacity: 0.08; }
  50%  { opacity: 0.2; }
  100% { opacity: 0.08; }
}
@keyframes dshCloud {
  0%   { transform: scale(1) rotate(0deg); opacity: 0.55; }
  50%  { transform: scale(1.06) rotate(0.4deg); opacity: 0.8; }
  100% { transform: scale(1) rotate(0deg); opacity: 0.55; }
}
@keyframes dshCloudAlt {
  0%   { transform: scale(1.04) rotate(0.2deg); opacity: 0.75; }
  50%  { transform: scale(1) rotate(-0.3deg); opacity: 0.45; }
  100% { transform: scale(1.04) rotate(0.2deg); opacity: 0.75; }
}
@keyframes dshWashDrift {
  0%   { transform: translate3d(-16%, -9%, 0) rotate(-2deg) scale(1.14); }
  33%  { transform: translate3d(15%, -15%, 0) rotate(1.5deg) scale(1.3); }
  66%  { transform: translate3d(-13%, 15%, 0) rotate(-1deg) scale(1.18); }
  100% { transform: translate3d(-16%, -9%, 0) rotate(-2deg) scale(1.14); }
}
@keyframes dshWashDriftAlt {
  0%   { transform: translate3d(12%, 13%, 0) rotate(1.5deg) scale(1.2); }
  40%  { transform: translate3d(-16%, 6%, 0) rotate(-1.5deg) scale(1.08); }
  70%  { transform: translate3d(13%, -15%, 0) rotate(2deg) scale(1.26); }
  100% { transform: translate3d(12%, 13%, 0) rotate(1.5deg) scale(1.2); }
}
@keyframes dshBlobA {
  0%   { transform: translate3d(-6%, -3%, 0) scale(1); }
  50%  { transform: translate3d(7%, 9%, 0) scale(1.14); }
  100% { transform: translate3d(-6%, -3%, 0) scale(1); }
}
@keyframes dshBlobB {
  0%   { transform: translate3d(5%, 4%, 0) scale(1.08); }
  50%  { transform: translate3d(-8%, -7%, 0) scale(1); }
  100% { transform: translate3d(5%, 4%, 0) scale(1.08); }
}
@keyframes dshBlobC {
  0%   { transform: translate3d(0, 6%, 0) scale(1); }
  50%  { transform: translate3d(-10%, -8%, 0) scale(1.18); }
  100% { transform: translate3d(0, 6%, 0) scale(1); }
}
#dsh-cosmic .dsh-cosmic__wash { animation: dshWashDrift var(--cosmic-w1, 13s) ease-in-out infinite; }
#dsh-cosmic .dsh-cosmic__wash--alt { animation: dshWashDriftAlt var(--cosmic-w2, 19s) ease-in-out infinite; }
#dsh-cosmic .dsh-cosmic__blob--a { animation: dshBlobA var(--cosmic-b1, 64s) ease-in-out infinite; }
#dsh-cosmic .dsh-cosmic__blob--b { animation: dshBlobB var(--cosmic-b2, 82s) ease-in-out infinite; }
#dsh-cosmic .dsh-cosmic__blob--c { animation: dshBlobC var(--cosmic-b3, 96s) ease-in-out infinite; }
#dsh-cosmic[data-paused] .dsh-cosmic__band,
#dsh-cosmic[data-paused] .dsh-cosmic__wash,
#dsh-cosmic[data-paused] .dsh-cosmic__blob,
#dsh-cosmic[data-paused] .dsh-cosmic__breath,
#dsh-cosmic[data-paused] .dsh-cosmic__swell,
#dsh-cosmic[data-paused] .dsh-cosmic__caustic,
#dsh-cosmic[data-paused] .dsh-cosmic__cloud { animation-play-state: paused !important; }
#dsh-cosmic .dsh-cosmic__band--a { animation: dshBandA var(--cosmic-d1, 32s) ease-in-out infinite; }
#dsh-cosmic .dsh-cosmic__band--b { animation: dshBandB var(--cosmic-d2, 41s) ease-in-out infinite; }
#dsh-cosmic .dsh-cosmic__breath { animation: dshBreathe var(--cosmic-d3, 9s) ease-in-out infinite; }
#dsh-cosmic .dsh-cosmic__swell { animation: dshSwell var(--cosmic-d4, 55s) ease-in-out infinite; }
#dsh-cosmic .dsh-cosmic__caustic { animation: dshCaustic var(--cosmic-d5, 12s) ease-in-out infinite; }
#dsh-cosmic .dsh-cosmic__cloud--a { animation: dshCloud var(--cosmic-d6, 60s) ease-in-out infinite; }
#dsh-cosmic .dsh-cosmic__cloud--b { animation: dshCloudAlt var(--cosmic-d7, 18s) ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  #dsh-cosmic:not([data-motion='force']) .dsh-cosmic__band,
  #dsh-cosmic:not([data-motion='force']) .dsh-cosmic__wash,
  #dsh-cosmic:not([data-motion='force']) .dsh-cosmic__blob,
  #dsh-cosmic:not([data-motion='force']) .dsh-cosmic__breath,
  #dsh-cosmic:not([data-motion='force']) .dsh-cosmic__swell,
  #dsh-cosmic:not([data-motion='force']) .dsh-cosmic__caustic,
  #dsh-cosmic:not([data-motion='force']) .dsh-cosmic__cloud { animation: none !important; }
}
`;

    const DURATIONS = {
      '--cosmic-d1': 32,
      '--cosmic-d2': 41,
      '--cosmic-d3': 9,
      '--cosmic-d4': 55,
      '--cosmic-d5': 12,
      '--cosmic-d6': 60,
      '--cosmic-d7': 18,
      /* Original aurora: the moving colour sheet and its three light clouds. */
      '--cosmic-w1': 13,
      '--cosmic-w2': 19,
      '--cosmic-b1': 64,
      '--cosmic-b2': 82,
      '--cosmic-b3': 96,
    };

    const HOST_ID = 'dsh-cosmic';

    /** Time-of-day scene: dawn, day, dusk, night. */
    function sceneForHour(hour) {
      if (hour >= 5 && hour < 9) return 'sunrise';
      if (hour >= 9 && hour < 16) return 'aurora';
      if (hour >= 16 && hour < 19) return 'ember';
      if (hour >= 19 && hour < 23) return 'galaxy';
      return 'arctic';
    }

    /** Scenes: pure gradients, no images, no network. Light and dark differ by palette. */
    /** Shared composition: opaque gradient base, a moving colour sheet, three
     *  light clouds, a soft-light wash, a top sheen and a bottom vignette.
     *  Every scene uses it, so all seven read with the same depth as aurora. */
    function layeredScene(dark, spec) {
      const tone = dark ? spec.dark : spec.light;
      const host = document.createElement('div');
      Object.assign(host.style, { position: 'absolute', inset: '0', background: tone.base });

      const wash = document.createElement('div');
      wash.className = 'dsh-cosmic__wash';
      Object.assign(wash.style, {
        position: 'absolute',
        left: '-30%',
        top: '-30%',
        width: '160%',
        height: '160%',
        willChange: 'transform',
        backgroundImage: tone.wash,
      });
      host.appendChild(wash);

      const slots = [
        ['a', { top: '-20vmax', left: '-14vmax' }, '62vmax'],
        ['b', { right: '-12vmax', bottom: '-24vmax' }, '62vmax'],
        ['c', { top: '16vmax', right: '6vmax' }, '46vmax'],
      ];
      slots.forEach(([key, pos, size], index) => {
        const blob = document.createElement('div');
        blob.className = `dsh-cosmic__blob dsh-cosmic__blob--${key}`;
        Object.assign(blob.style, {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          filter: 'blur(58px)',
          opacity: key === 'c' ? '0.72' : '0.85',
          willChange: 'transform',
          background: `radial-gradient(circle at 50% 50%, ${tone.blobs[index]} 0%, transparent 66%)`,
          ...pos,
        });
        host.appendChild(blob);
      });

      const alt = document.createElement('div');
      alt.className = 'dsh-cosmic__wash dsh-cosmic__wash--alt';
      Object.assign(alt.style, {
        position: 'absolute',
        left: '-30%',
        top: '-30%',
        width: '160%',
        height: '160%',
        mixBlendMode: 'soft-light',
        opacity: '0.32',
        willChange: 'transform',
        backgroundImage: tone.alt,
      });
      host.appendChild(alt);

      const sheen = document.createElement('div');
      Object.assign(sheen.style, { position: 'absolute', inset: '0', background: tone.sheen });
      const shade = document.createElement('div');
      Object.assign(shade.style, { position: 'absolute', inset: '0', background: tone.shade });
      host.append(sheen, shade);
      return host;
    }

    const SCENE_SPECS = {
      aurora: {
        light: {
          base: 'linear-gradient(160deg, #dbe6ff 0%, #cfe0fb 45%, #e6d8fd 100%)',
          wash: 'linear-gradient(115deg, #8aa6ff 0%, #7f68f0 18%, #a468e8 38%, #58a9e4 60%, #bb74e4 82%, #8aa6ff 100%)',
          blobs: ['rgba(90, 125, 255, 0.55)', 'rgba(35, 200, 226, 0.5)', 'rgba(168, 100, 245, 0.5)'],
          alt: 'radial-gradient(80% 60% at 30% 20%, rgba(255, 255, 255, 0.5) 0%, transparent 70%), radial-gradient(70% 70% at 78% 76%, rgba(150, 170, 255, 0.4) 0%, transparent 72%)',
          sheen: 'radial-gradient(75% 55% at 50% -8%, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
          shade: 'radial-gradient(120% 85% at 50% 115%, rgba(30, 40, 80, 0.22) 0%, transparent 62%)',
        },
        dark: {
          base: 'linear-gradient(160deg, #0b1224 0%, #131b38 46%, #1b1440 100%)',
          wash: 'linear-gradient(115deg, #1d2c65 0%, #2b2277 18%, #3d216f 38%, #183e65 60%, #2c1f5b 82%, #1d2c65 100%)',
          blobs: ['rgba(96, 125, 255, 0.75)', 'rgba(45, 216, 240, 0.6)', 'rgba(178, 96, 255, 0.62)'],
          alt: 'radial-gradient(80% 60% at 30% 20%, rgba(70, 96, 200, 0.4) 0%, transparent 70%), radial-gradient(70% 70% at 78% 76%, rgba(120, 70, 200, 0.35) 0%, transparent 72%)',
          sheen: 'radial-gradient(75% 55% at 50% -8%, rgba(120, 160, 255, 0.22) 0%, transparent 70%)',
          shade: 'radial-gradient(120% 85% at 50% 115%, rgba(0, 0, 0, 0.32) 0%, transparent 62%)',
        },
      },

      ocean: {
        light: {
          base: 'linear-gradient(180deg, #cfe9f7 0%, #9fd0e8 45%, #6fb4d6 100%)',
          wash: 'linear-gradient(115deg, #96daf5 0%, #66c7f0 28%, #169ee1 55%, #94ddf4 82%, #96daf5 100%)',
          blobs: ['rgba(64, 190, 220, 0.55)', 'rgba(40, 130, 200, 0.5)', 'rgba(120, 225, 215, 0.5)'],
          alt: 'radial-gradient(80% 60% at 30% 20%, rgba(255, 255, 255, 0.45) 0%, transparent 70%), radial-gradient(70% 70% at 78% 76%, rgba(120, 210, 235, 0.4) 0%, transparent 72%)',
          sheen: 'radial-gradient(75% 55% at 50% -8%, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
          shade: 'radial-gradient(120% 85% at 50% 115%, rgba(10, 40, 70, 0.28) 0%, transparent 62%)',
        },
        dark: {
          base: 'linear-gradient(180deg, #081a29 0%, #0b2f47 46%, #0e3e58 100%)',
          wash: 'linear-gradient(115deg, #0f3e58 0%, #156787 28%, #1c8396 58%, #104f6d 84%, #0f3e58 100%)',
          blobs: ['rgba(40, 160, 200, 0.6)', 'rgba(20, 90, 160, 0.6)', 'rgba(70, 200, 210, 0.5)'],
          alt: 'radial-gradient(80% 60% at 30% 20%, rgba(40, 120, 180, 0.3) 0%, transparent 70%), radial-gradient(70% 70% at 78% 76%, rgba(20, 80, 140, 0.35) 0%, transparent 72%)',
          sheen: 'radial-gradient(75% 55% at 50% -8%, rgba(120, 210, 235, 0.18) 0%, transparent 70%)',
          shade: 'radial-gradient(120% 85% at 50% 115%, rgba(0, 0, 0, 0.32) 0%, transparent 62%)',
        },
      },

      galaxy: {
        light: {
          base: 'linear-gradient(160deg, #e6dbff 0%, #cdb8f7 50%, #f0e6ff 100%)',
          wash: 'linear-gradient(115deg, #9980f2 0%, #845cef 30%, #ca6bf0 56%, #7390f1 82%, #9980f2 100%)',
          blobs: ['rgba(140, 90, 255, 0.55)', 'rgba(220, 90, 200, 0.5)', 'rgba(90, 130, 255, 0.5)'],
          alt: 'radial-gradient(80% 60% at 30% 20%, rgba(255, 255, 255, 0.45) 0%, transparent 70%), radial-gradient(70% 70% at 78% 76%, rgba(190, 160, 255, 0.45) 0%, transparent 72%)',
          sheen: 'radial-gradient(75% 55% at 50% -8%, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
          shade: 'radial-gradient(120% 85% at 50% 115%, rgba(50, 30, 90, 0.25) 0%, transparent 62%)',
        },
        dark: {
          base: 'linear-gradient(160deg, #140b2c 0%, #231144 52%, #311958 100%)',
          wash: 'linear-gradient(115deg, #281552 0%, #3b1c75 26%, #471e6a 55%, #282875 82%, #281552 100%)',
          blobs: ['rgba(140, 90, 255, 0.65)', 'rgba(220, 90, 200, 0.5)', 'rgba(90, 130, 255, 0.55)'],
          alt: 'radial-gradient(80% 60% at 30% 20%, rgba(110, 60, 220, 0.35) 0%, transparent 70%), radial-gradient(70% 70% at 78% 76%, rgba(180, 60, 200, 0.3) 0%, transparent 72%)',
          sheen: 'radial-gradient(75% 55% at 50% -8%, rgba(160, 120, 255, 0.2) 0%, transparent 70%)',
          shade: 'radial-gradient(120% 85% at 50% 115%, rgba(0, 0, 0, 0.32) 0%, transparent 62%)',
        },
      },

      sunrise: {
        light: {
          base: 'linear-gradient(180deg, #ffe6c9 0%, #ffc9a8 40%, #ffb0c0 76%, #ffe0ea 100%)',
          wash: 'linear-gradient(115deg, #f2aa78 0%, #ef935b 28%, #f17595 58%, #f2af76 84%, #f2aa78 100%)',
          blobs: ['rgba(255, 170, 90, 0.55)', 'rgba(255, 120, 150, 0.5)', 'rgba(255, 205, 150, 0.5)'],
          alt: 'radial-gradient(80% 60% at 30% 20%, rgba(255, 255, 255, 0.5) 0%, transparent 70%), radial-gradient(70% 70% at 78% 76%, rgba(255, 190, 200, 0.4) 0%, transparent 72%)',
          sheen: 'radial-gradient(75% 55% at 50% -8%, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
          shade: 'radial-gradient(120% 85% at 50% 115%, rgba(120, 50, 60, 0.2) 0%, transparent 62%)',
        },
        dark: {
          base: 'linear-gradient(180deg, #1f1235 0%, #401d40 45%, #642e46 100%)',
          wash: 'linear-gradient(115deg, #2e1435 0%, #642747 30%, #873a50 60%, #521d3a 84%, #2e1435 100%)',
          blobs: ['rgba(255, 150, 80, 0.5)', 'rgba(255, 90, 120, 0.45)', 'rgba(150, 90, 220, 0.4)'],
          alt: 'radial-gradient(80% 60% at 30% 20%, rgba(200, 100, 120, 0.25) 0%, transparent 70%), radial-gradient(70% 70% at 78% 76%, rgba(120, 70, 160, 0.25) 0%, transparent 72%)',
          sheen: 'radial-gradient(75% 55% at 50% -8%, rgba(255, 180, 140, 0.18) 0%, transparent 70%)',
          shade: 'radial-gradient(120% 85% at 50% 115%, rgba(0, 0, 0, 0.32) 0%, transparent 62%)',
        },
      },

      ember: {
        light: {
          base: 'linear-gradient(200deg, #ffe2cf 0%, #ffb59a 45%, #e88a80 75%, #ffd9cf 100%)',
          wash: 'linear-gradient(115deg, #eea184 0%, #e68159 32%, #c62f21 60%, #ec9a76 85%, #eea184 100%)',
          blobs: ['rgba(255, 120, 60, 0.55)', 'rgba(210, 60, 70, 0.5)', 'rgba(255, 190, 110, 0.5)'],
          alt: 'radial-gradient(80% 60% at 30% 20%, rgba(255, 255, 255, 0.4) 0%, transparent 70%), radial-gradient(70% 70% at 78% 76%, rgba(255, 160, 120, 0.4) 0%, transparent 72%)',
          sheen: 'radial-gradient(75% 55% at 50% -8%, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
          shade: 'radial-gradient(120% 85% at 50% 115%, rgba(90, 30, 20, 0.28) 0%, transparent 62%)',
        },
        dark: {
          base: 'linear-gradient(200deg, #280d12 0%, #4d1d17 45%, #69281b 100%)',
          wash: 'linear-gradient(115deg, #411412 0%, #7a2516 30%, #9d3118 58%, #661f14 84%, #411412 100%)',
          blobs: ['rgba(255, 96, 40, 0.55)', 'rgba(210, 40, 60, 0.5)', 'rgba(255, 160, 70, 0.4)'],
          alt: 'radial-gradient(80% 60% at 30% 20%, rgba(180, 60, 40, 0.3) 0%, transparent 70%), radial-gradient(70% 70% at 78% 76%, rgba(140, 40, 60, 0.3) 0%, transparent 72%)',
          sheen: 'radial-gradient(75% 55% at 50% -8%, rgba(255, 140, 80, 0.18) 0%, transparent 70%)',
          shade: 'radial-gradient(120% 85% at 50% 115%, rgba(0, 0, 0, 0.32) 0%, transparent 62%)',
        },
      },

      forest: {
        light: {
          base: 'linear-gradient(170deg, #d8f5e4 0%, #a8e2c0 50%, #c8f0da 100%)',
          wash: 'linear-gradient(115deg, #7fd9ab 0%, #45c98a 30%, #128f5e 58%, #74d3a4 85%, #7fd9ab 100%)',
          blobs: ['rgba(60, 190, 130, 0.55)', 'rgba(50, 170, 170, 0.5)', 'rgba(150, 215, 120, 0.5)'],
          alt: 'radial-gradient(80% 60% at 30% 20%, rgba(255, 255, 255, 0.45) 0%, transparent 70%), radial-gradient(70% 70% at 78% 76%, rgba(140, 220, 180, 0.4) 0%, transparent 72%)',
          sheen: 'radial-gradient(75% 55% at 50% -8%, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
          shade: 'radial-gradient(120% 85% at 50% 115%, rgba(20, 70, 50, 0.24) 0%, transparent 62%)',
        },
        dark: {
          base: 'linear-gradient(170deg, #0d291f 0%, #174431 48%, #1d5838 100%)',
          wash: 'linear-gradient(115deg, #174431 0%, #23734a 30%, #2a8f5c 58%, #1c5a3d 84%, #174431 100%)',
          blobs: ['rgba(40, 180, 120, 0.5)', 'rgba(20, 140, 140, 0.45)', 'rgba(90, 200, 120, 0.4)'],
          alt: 'radial-gradient(80% 60% at 30% 20%, rgba(40, 140, 100, 0.25) 0%, transparent 70%), radial-gradient(70% 70% at 78% 76%, rgba(20, 110, 110, 0.3) 0%, transparent 72%)',
          sheen: 'radial-gradient(75% 55% at 50% -8%, rgba(120, 220, 170, 0.16) 0%, transparent 70%)',
          shade: 'radial-gradient(120% 85% at 50% 115%, rgba(0, 0, 0, 0.32) 0%, transparent 62%)',
        },
      },

      arctic: {
        light: {
          base: 'linear-gradient(180deg, #dcefff 0%, #b3d9f5 50%, #cfe6fb 100%)',
          wash: 'linear-gradient(115deg, #6fb2ee 0%, #5599e2 30%, #2b7ecb 58%, #74b4ee 85%, #6fb2ee 100%)',
          blobs: ['rgba(120, 190, 255, 0.55)', 'rgba(255, 255, 255, 0.5)', 'rgba(150, 235, 255, 0.5)'],
          alt: 'radial-gradient(80% 60% at 30% 20%, rgba(255, 255, 255, 0.55) 0%, transparent 70%), radial-gradient(70% 70% at 78% 76%, rgba(160, 210, 255, 0.45) 0%, transparent 72%)',
          sheen: 'radial-gradient(75% 55% at 50% -8%, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
          shade: 'radial-gradient(120% 85% at 50% 115%, rgba(40, 70, 110, 0.22) 0%, transparent 62%)',
        },
        dark: {
          base: 'linear-gradient(180deg, #091a2d 0%, #112d42 46%, #173b56 100%)',
          wash: 'linear-gradient(115deg, #123a58 0%, #1a5176 28%, #23628b 58%, #164163 84%, #123a58 100%)',
          blobs: ['rgba(80, 170, 240, 0.5)', 'rgba(200, 235, 255, 0.35)', 'rgba(120, 220, 255, 0.4)'],
          alt: 'radial-gradient(80% 60% at 30% 20%, rgba(80, 150, 220, 0.25) 0%, transparent 70%), radial-gradient(70% 70% at 78% 76%, rgba(120, 200, 255, 0.25) 0%, transparent 72%)',
          sheen: 'radial-gradient(75% 55% at 50% -8%, rgba(180, 230, 255, 0.18) 0%, transparent 70%)',
          shade: 'radial-gradient(120% 85% at 50% 115%, rgba(0, 0, 0, 0.32) 0%, transparent 62%)',
        },
      },
    };

    const SCENES = {
      aurora: (dark) => layeredScene(dark, SCENE_SPECS.aurora),
      ocean: (dark) => layeredScene(dark, SCENE_SPECS.ocean),
      galaxy: (dark) => layeredScene(dark, SCENE_SPECS.galaxy),
      sunrise: (dark) => layeredScene(dark, SCENE_SPECS.sunrise),
      ember: (dark) => layeredScene(dark, SCENE_SPECS.ember),
      forest: (dark) => layeredScene(dark, SCENE_SPECS.forest),
      arctic: (dark) => layeredScene(dark, SCENE_SPECS.arctic),
    };

    /* ------------------------------------------------------------------ *
     * Surface variables: snapshot whatever was there, restore exactly that
     * on teardown so another plugin's values are never clobbered.
     * ------------------------------------------------------------------ */
    const SURFACE_PROPS = [
      ['body', 'background'],
      ['html', 'background'],
      ['body', '--dsw-alias-bg-base'],
      ['body', '--dsw-specific-sidebar-fill'],
    ];

    function createSurfaceTint() {
      const body = document.body;
      const root = document.documentElement;
      const targets = { body, html: root };
      const snapshot = SURFACE_PROPS.map(([where, prop]) => {
        const el = targets[where];
        return { el, prop, value: el.style.getPropertyValue(prop), priority: el.style.getPropertyPriority(prop) };
      });

      const paint = (dark) => {
        body.style.setProperty('background', 'transparent', 'important');
        root.style.setProperty('background', 'transparent', 'important');
        body.style.setProperty('--dsw-alias-bg-base', dark ? 'rgba(6, 9, 18, 0.1)' : 'rgba(250, 251, 255, 0.08)', 'important');
        body.style.setProperty('--dsw-specific-sidebar-fill', dark ? 'rgba(6, 9, 18, 0.14)' : 'rgba(248, 249, 253, 0.12)', 'important');
      };

      return {
        paint,
        dispose() {
          for (const entry of snapshot) {
            if (entry.value === '') entry.el.style.removeProperty(entry.prop);
            else entry.el.style.setProperty(entry.prop, entry.value, entry.priority);
          }
        },
      };
    }

    /* ------------------------------------------------------------------ *
     * Settings copy and controls.
     * ------------------------------------------------------------------ */
    const ZH = typeof navigator !== 'undefined' && /^zh/i.test(navigator.language || '');

    const COPY = {
      zh: {
        title: '宇宙无敌背景',
        hint: '背景与附加效果，改动即时生效并自动保存。',
        background: '背景',
        motion: '动态',
        effects: '附加效果',
        stars: '星尘',
        meteors: '流星',
        speed: '速度',
        contrast: '对比度',
        saturation: '饱和度',
        count: '数量',
        follow: '跟随鼠标',
        frequency: '出现频率',
        reset: '恢复默认',
        saved: '已保存',
        selftest: '运行自检',
        testing: '自检中…',
        passed: '项通过',
        colorLabel: '颜色',
        names: { aurora: '极光', ocean: '深海', galaxy: '星云', sunrise: '晨曦', ember: '余烬', forest: '森野', arctic: '极地' },
        presets: '一键预设',
        presetNames: { classic: '极光·星尘', polar: '极夜', deep: '深海', dawn: '晨曦', ember: '余烬', forest: '森野', arctic: '极地', neon: '霓虹' },
        glow: '光标光晕',
        strength: '强度',
        scrim: '文字遮罩',
        snow: '雪花',
        intensity: '密度',
        random: '随机',
        randomHint: '随机组合一套背景与附加效果',
        confirmReset: '恢复默认会清空当前所有调整，继续？',
        autoTime: '按时间自动切换',
        presetHint: '悬停预览，点击应用；「随机」每次组合一套',
        current: '当前',
        on: '开',
        off: '关',
        autoDegrade: '低帧率自动降级',
        scrimHint: '越大文字越清晰，壁纸越淡',
        scrimWarn: '遮罩偏低：浅色主题下正文可能不够清晰',
        blur: '柔化',
        blurHint: '整层壁纸的模糊半径，0 为清晰',
        motion: '强制动画',
        motionHint: '系统开启「减少动态效果」时，打开这个才会继续播放星尘与流星',
        advanced: '高级',
        exportConfig: '复制配置',
        importConfig: '粘贴配置',
        fps: '帧率',
        copied: '配置已复制',
        copyFailed: '剪贴板不可用',
        imported: '配置已导入',
        importFailed: '导入失败：剪贴板内容不是有效配置',
        colors: { jewel: '宝石', gold: '暖金', ice: '冰蓝', snow: '雪白' },
      },
      en: {
        title: 'Cosmic Background',
        hint: 'Background and add-ons. Changes apply live and are saved automatically.',
        background: 'Background',
        motion: 'Motion',
        effects: 'Add-ons',
        stars: 'Star dust',
        meteors: 'Meteors',
        speed: 'Speed',
        contrast: 'Contrast',
        saturation: 'Saturation',
        count: 'Count',
        follow: 'Follow cursor',
        frequency: 'Frequency',
        reset: 'Reset',
        saved: 'Saved',
        selftest: 'Run self-test',
        testing: 'Testing…',
        passed: 'passed',
        colorLabel: 'Colour',
        names: { aurora: 'Aurora', ocean: 'Ocean', galaxy: 'Nebula', sunrise: 'Dawn', ember: 'Ember', forest: 'Forest', arctic: 'Arctic' },
        presets: 'Presets',
        presetNames: { classic: 'Aurora Classic', polar: 'Polar', deep: 'Deep', dawn: 'Dawn', ember: 'Ember', forest: 'Forest', arctic: 'Arctic', neon: 'Neon' },
        glow: 'Cursor glow',
        strength: 'Strength',
        scrim: 'Text scrim',
        snow: 'Snow',
        intensity: 'Density',
        random: 'Random',
        randomHint: 'Surprise me with a random mix',
        confirmReset: 'Reset clears every adjustment. Continue?',
        autoTime: 'Follow time of day',
        presetHint: 'Hover to preview, click to apply; Random rolls a new mix',
        current: 'Current',
        on: 'on',
        off: 'off',
        autoDegrade: 'Auto-degrade on low FPS',
        scrimHint: 'Higher keeps text crisp and fades the wallpaper',
        scrimWarn: 'Low scrim: text may be hard to read on light themes',
        blur: 'Softness',
        blurHint: 'Blur radius for the whole wallpaper; 0 is crisp',
        motion: 'Force animation',
        motionHint: 'Keeps particles moving even when the OS asks for reduced motion',
        advanced: 'Advanced',
        exportConfig: 'Copy config',
        importConfig: 'Paste config',
        fps: 'FPS',
        copied: 'Config copied',
        copyFailed: 'Clipboard unavailable',
        imported: 'Config imported',
        importFailed: 'Import failed: clipboard is not a valid config',
        colors: { jewel: 'Jewel', gold: 'Gold', ice: 'Ice', snow: 'Snow' },
      },
    };

    const t = ZH ? COPY.zh : COPY.en;

    /** Set by the engine effect; the settings page's self-test button drives it. */
    let selfTestRunner = null;
    let lastUiReport = null;
    let lastBootReport = null;
    let selfTestBusy = false;

    const SMALL_BUTTON = {
      appearance: 'none',
      font: 'inherit',
      fontSize: '12.5px',
      padding: '5px 13px',
      borderRadius: '8px',
      border: '1px solid var(--dsw-alias-border-l2)',
      background: 'var(--dsw-alias-bg-layer-1)',
      color: 'var(--dsw-alias-label-primary)',
      cursor: 'pointer',
    };

    const CARD = {
      border: '0.5px solid var(--dsw-alias-border-l2)',
      background: 'var(--dsw-alias-bg-layer-1)',
      borderRadius: '12px',
      padding: '14px 16px',
    };

    function Row(props) {
      return h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '10px 0',
          borderTop: '0.5px solid var(--dsw-alias-border-l2)',
        },
      }, props.children);
    }

    function Title(props) {
      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 } }, [
        h('div', { key: 't', style: { fontSize: '13.5px', color: 'var(--dsw-alias-label-primary)' } }, props.text),
        props.hint
          ? h('div', { key: 'h', style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, props.hint)
          : null,
      ]);
    }

    function Toggle(props) {
      const on = Boolean(props.value);
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': on,
        'aria-label': props.label,
        onClick: () => props.onChange(!on),
        style: {
          flex: 'none',
          width: '38px',
          height: '22px',
          padding: '2px',
          borderRadius: '999px',
          border: '1px solid var(--dsw-alias-border-l2)',
          background: on ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-bg-layer-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: on ? 'flex-end' : 'flex-start',
          cursor: 'pointer',
          transition: 'background .15s ease',
        },
      }, h('span', {
        style: {
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: on ? '#fff' : 'var(--dsw-alias-label-secondary)',
          transition: 'background .15s ease',
        },
      }));
    }

    function Slider(props) {
      return h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: '190px' } }, [
        h('input', {
          key: 'i',
          type: 'range',
          min: props.min,
          max: props.max,
          step: props.step,
          value: props.value,
          'aria-label': props.label,
          onChange: (event) => props.onChange(Number(event.target.value)),
          style: { width: '150px', accentColor: 'var(--dsw-alias-brand-primary)' },
        }),
        h('span', {
          key: 'v',
          style: {
            minWidth: '46px',
            textAlign: 'right',
            fontSize: '12px',
            color: 'var(--dsw-alias-label-secondary)',
            fontVariantNumeric: 'tabular-nums',
          },
        }, props.format(props.value)),
      ]);
    }

    function Chip(props) {
      return h('button', {
        type: 'button',
        'aria-pressed': props.active,
        title: props.title,
        'data-cosmic-action': props.action,
        onMouseEnter: props.onMouseEnter,
        onMouseLeave: props.onMouseLeave,
        onClick: props.onClick,
        style: {
          appearance: 'none',
          font: 'inherit',
          fontSize: '12.5px',
          padding: '5px 12px',
          borderRadius: '999px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          border: `1px solid ${props.active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-border-l2)'}`,
          background: props.active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-bg-layer-2)',
          color: props.active ? '#fff' : 'var(--dsw-alias-label-secondary)',
        },
      }, [
        props.dot
          ? h('span', {
              key: 'dot',
              style: {
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: props.dot,
                flex: 'none',
                boxShadow: '0 0 6px rgba(255,255,255,0.45)',
              },
            })
          : null,
        h('span', { key: 'txt' }, props.children),
      ]);
    }

    function BackgroundCard(props) {
      return h('button', {
        type: 'button',
        'aria-pressed': props.active,
        title: props.title,
        'data-cosmic-action': props.action,
        onMouseEnter: props.onMouseEnter,
        onMouseLeave: props.onMouseLeave,
        onClick: props.onClick,
        style: {
          appearance: 'none',
          font: 'inherit',
          cursor: 'pointer',
          textAlign: 'left',
          padding: '0',
          borderRadius: '12px',
          overflow: 'hidden',
          border: `1.5px solid ${props.active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-border-l2)'}`,
          background: 'var(--dsw-alias-bg-layer-1)',
          flex: '1 1 120px',
          minWidth: '108px',
        },
      }, [
        h('div', { key: 'sw', style: { height: '54px', background: props.preview } }),
        h('div', {
          key: 'nm',
          style: {
            padding: '7px 10px',
            fontSize: '12.5px',
            color: props.active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-primary)',
          },
        }, props.name),
      ]);
    }

    function SettingsPage() {
      const [settings, setSettings] = React.useState(readSettings);
      const [status, setStatus] = React.useState('');
      const [checks, setChecks] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const [fps, setFps] = React.useState(0);
      const hoverBackup = React.useRef(null);
      const hoverTimer = React.useRef(0);

      React.useEffect(() => {
        const timer = setInterval(() => {
          const stats = window.__cosmicStars && window.__cosmicStars.stats ? window.__cosmicStars.stats() : null;
          setFps(stats && stats.fps ? Math.round(stats.fps) : 0);
        }, 1000);
        return () => clearInterval(timer);
      }, []);

      React.useEffect(() => {
        const onExternal = (event) => setSettings(normalize(event.detail));
        window.addEventListener(SETTINGS_EVENT, onExternal);
        return () => window.removeEventListener(SETTINGS_EVENT, onExternal);
      }, []);

      const update = (patch) => {
        const next = writeSettings({ ...settings, ...patch });
        setSettings(next);
        setStatus(t.saved);
      };
      const updateStars = (patch) => update({ stars: { ...settings.stars, ...patch } });
      const updateMeteors = (patch) => update({ meteors: { ...settings.meteors, ...patch } });
      const updateGlow = (patch) => update({ glow: { ...settings.glow, ...patch } });
      const updateSnow = (patch) => update({ snow: { ...settings.snow, ...patch } });

      /* A preset is "active" only when every knob matches it exactly. */
      const presetDots = {
        classic: 'linear-gradient(135deg, #bfe9dd 0%, #6a4cff 55%, #1b1030 100%)',
        polar: 'linear-gradient(135deg, #dfe9ff 0%, #7aa8ff 100%)',
        deep: 'linear-gradient(135deg, #9fd8ea 0%, #0d3a52 100%)',
        dawn: 'linear-gradient(135deg, #ffe9c8 0%, #ff8f7a 100%)',
        ember: 'linear-gradient(135deg, #ffcaa0 0%, #d9502f 100%)',
        forest: 'linear-gradient(135deg, #d6f6e5 0%, #2f9c6a 100%)',
        arctic: 'linear-gradient(135deg, #eaf6ff 0%, #6fb3e0 100%)',
        neon: 'linear-gradient(135deg, #6ee7ff 0%, #b14ce8 100%)',
      };

      const presetHints = {
        classic: '最初的极光 + 宝石星尘 56，不加其他效果',
        polar: '星云 + 雪白星尘 90 + 疏流星 + 光晕',
        deep: '深海 + 24 颗暖金星尘，安静',
        dawn: '晨曦 + 30 颗星尘 + 轻光晕',
        ember: '余烬 + 暖金星尘 46 + 轻光晕',
        forest: '森野 + 暖金星尘 40 + 轻光晕',
        arctic: '极地 + 冰蓝星尘 70 + 稀疏流星',
        neon: '星云 + 冰蓝星尘 110 + 密流星 + 强光晕',
      };

      const currentSignature = JSON.stringify(normalize(settings));
      const isPresetActive = (id) => JSON.stringify(normalize({ ...DEFAULTS, ...PRESETS[id] })) === currentSignature;

      const randomMood = () => {
        const pick = (list) => list[Math.floor(Math.random() * list.length)];
        return {
          background: pick(BACKGROUNDS),
          speed: 0.6 + Math.random() * 1.2,
          contrast: 0.95 + Math.random() * 0.4,
          saturation: 0.9 + Math.random() * 0.6,
          stars: { enabled: Math.random() > 0.15, color: pick(STAR_COLORS), count: 24 + Math.round(Math.random() * 88), follow: Math.random() > 0.4 },
          meteors: { enabled: Math.random() > 0.5, frequency: 0.4 + Math.random() * 1.8 },
          glow: { enabled: Math.random() > 0.4, strength: 0.06 + Math.random() * 0.16 },
          snow: { enabled: Math.random() > 0.6, intensity: 0.5 + Math.random() * 1.2 },
          scrim: Math.random() * 0.08,
        };
      };

      const previews = {
        aurora: 'linear-gradient(120deg, #9be3d3 0%, #7be0c0 30%, #6a4cff 72%, #10101f 100%)',
        ocean: 'linear-gradient(180deg, #b9e2ef 0%, #5797b5 46%, #08202f 100%)',
        galaxy: 'radial-gradient(120% 100% at 25% 15%, #6d3bff 0%, #b14ce8 32%, #150b2e 72%, #070512 100%)',
        sunrise: 'linear-gradient(180deg, #fff8f0 0%, #ffd9a8 45%, #ff9f7a 78%, #b4566b 100%)',
        ember: 'radial-gradient(120% 100% at 50% 90%, #ffb07a 0%, #d9502f 40%, #2a0d12 100%)',
        forest: 'linear-gradient(160deg, #dcf3e6 0%, #4fbf8a 45%, #07231a 100%)',
        arctic: 'linear-gradient(180deg, #f4f9ff 0%, #a9d4f2 45%, #0d1f33 100%)',
      };

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '760px' } }, [
        h('div', { key: 'head' }, [
          h('h2', { key: 't', style: { margin: 0, fontSize: '16px', color: 'var(--dsw-alias-label-primary)' } }, t.title),
          h('p', { key: 'h', style: { margin: '4px 0 0', fontSize: '12.5px', color: 'var(--dsw-alias-label-secondary)' } }, t.hint),
          h('p', {
            key: 'summary',
            style: {
              margin: '6px 0 0',
              fontSize: '12px',
              color: 'var(--dsw-alias-label-tertiary)',
              fontVariantNumeric: 'tabular-nums',
            },
          }, [
            `${t.current}：${t.names[settings.background]}`,
            `${t.stars} ${settings.stars.enabled ? `${settings.stars.count} 颗` : t.off}`,
            `${t.snow} ${settings.snow.enabled ? t.on : t.off}`,
            `${t.meteors} ${settings.meteors.enabled ? t.on : t.off}`,
            `${t.glow} ${settings.glow.enabled ? t.on : t.off}`,
            `${t.scrim} ${Math.round(settings.scrim * 100)}%`,
          ].join(' · ')),
        ]),

        h('section', { key: 'presets', style: CARD }, [
          h('div', { key: 'l', style: { fontSize: '12px', letterSpacing: '.02em', color: 'var(--dsw-alias-label-tertiary)', marginBottom: '10px' } }, t.presets),
          h('div', { key: 'row', style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, [
            ...Object.keys(PRESETS).map((id) => h(Chip, {
              key: id,
              active: isPresetActive(id),
              dot: presetDots[id],
              title: presetHints[id],
              onMouseEnter: () => {
                clearTimeout(hoverTimer.current);
                hoverTimer.current = setTimeout(() => {
                  if (isPresetActive(id)) return;
                  hoverBackup.current = readSettings();
                  writeSettings({ ...DEFAULTS, ...PRESETS[id] });
                }, 160);
              },
              onMouseLeave: () => {
                clearTimeout(hoverTimer.current);
                if (!hoverBackup.current) return;
                writeSettings(hoverBackup.current);
                hoverBackup.current = null;
              },
              onClick: () => {
                hoverBackup.current = null;
                update(PRESETS[id]);
              },
            }, t.presetNames[id])),
            h(Chip, {
              key: 'random',
              active: false,
              title: t.randomHint,
              onClick: () => update(randomMood()),
            }, t.random),
          ]),
          h('div', {
            key: 'hint',
            style: { marginTop: '8px', fontSize: '11.5px', color: 'var(--dsw-alias-label-tertiary)' },
          }, t.presetHint),
        ]),

        h('section', { key: 'bg', style: CARD }, [
          h('div', { key: 'l', style: { fontSize: '12px', letterSpacing: '.02em', color: 'var(--dsw-alias-label-tertiary)', marginBottom: '10px' } }, t.background),
          h('div', { key: 'row', style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } },
            BACKGROUNDS.map((id) => h(BackgroundCard, {
              key: id,
              name: t.names[id],
              active: settings.background === id,
              preview: previews[id],
              /* Hover previews the scene, leaving restores it — same gesture as
                 the preset chips, so comparing backgrounds costs one mouse move. */
              onMouseEnter: () => {
                clearTimeout(hoverTimer.current);
                hoverTimer.current = setTimeout(() => {
                  if (readSettings().background === id) return;
                  hoverBackup.current = readSettings();
                  writeSettings({ ...readSettings(), background: id });
                }, 160);
              },
              onMouseLeave: () => {
                clearTimeout(hoverTimer.current);
                if (!hoverBackup.current) return;
                writeSettings(hoverBackup.current);
                hoverBackup.current = null;
              },
              onClick: () => {
                hoverBackup.current = null;
                update({ background: id });
              },
            }))),
        ]),

        h('section', { key: 'motion', style: CARD }, [
          h('div', { key: 'l', style: { fontSize: '12px', letterSpacing: '.02em', color: 'var(--dsw-alias-label-tertiary)' } }, t.motion),
          h(Row, { key: 'speed' }, [
            h(Title, { key: 'lbl', text: t.speed }),
            h(Slider, {
              key: 's', label: t.speed, min: 0.2, max: 3, step: 0.1,
              value: settings.speed, format: (v) => `${v.toFixed(1)}×`,
              onChange: (value) => update({ speed: value }),
            }),
          ]),
          h(Row, { key: 'contrast' }, [
            h(Title, { key: 'lbl', text: t.contrast }),
            h(Slider, {
              key: 's', label: t.contrast, min: 0.6, max: 1.8, step: 0.05,
              value: settings.contrast, format: (v) => `${v.toFixed(2)}×`,
              onChange: (value) => update({ contrast: value }),
            }),
          ]),
          h(Row, { key: 'sat' }, [
            h(Title, { key: 'lbl', text: t.saturation }),
            h(Slider, {
              key: 's', label: t.saturation, min: 0.4, max: 1.8, step: 0.05,
              value: settings.saturation, format: (v) => `${v.toFixed(2)}×`,
              onChange: (value) => update({ saturation: value }),
            }),
          ]),
          h(Row, { key: 'scrim' }, [
            h(Title, { key: 'lbl', text: t.scrim, hint: settings.scrim < 0.12 ? t.scrimWarn : t.scrimHint }),
            h(Slider, {
              key: 's', label: t.scrim, min: 0, max: 0.6, step: 0.02,
              value: settings.scrim, format: (v) => `${Math.round(v * 100)}%`,
              onChange: (value) => update({ scrim: value }),
            }),
          ]),
          h(Row, { key: 'blur' }, [
            h(Title, { key: 'lbl', text: t.blur, hint: t.blurHint }),
            h(Slider, {
              key: 's', label: t.blur, min: 0, max: 12, step: 0.5,
              value: settings.blur, format: (v) => `${v.toFixed(1)}px`,
              onChange: (value) => update({ blur: value }),
            }),
          ]),
          h(Row, { key: 'motion' }, [
            h(Title, { key: 'lbl', text: t.motion, hint: t.motionHint }),
            h(Toggle, {
              key: 'sw',
              label: t.motion,
              value: settings.motion === 'force',
              onChange: (value) => update({ motion: value ? 'force' : 'system' }),
            }),
          ]),
        ]),

        h('section', { key: 'fx', style: CARD }, [
          h('div', { key: 'l', style: { fontSize: '12px', letterSpacing: '.02em', color: 'var(--dsw-alias-label-tertiary)' } }, t.effects),
          h(Row, { key: 'stars' }, [
            h(Title, { key: 'lbl', text: t.stars }),
            h(Toggle, {
              key: 'sw', label: t.stars, value: settings.stars.enabled,
              onChange: (value) => updateStars({ enabled: value }),
            }),
          ]),
          settings.stars.enabled ? h(Row, { key: 'starColor' }, [
            h(Title, { key: 'lbl', text: `${t.stars} · ${t.colorLabel}` }),
            h('div', { key: 'chips', style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
              STAR_COLORS.map((color) => h(Chip, {
                key: color,
                active: settings.stars.color === color,
                action: 'star-color',
                onClick: () => updateStars({ color }),
              }, t.colors[color]))),
          ]) : null,
          settings.stars.enabled ? h(Row, { key: 'starCount' }, [
            h(Title, { key: 'lbl', text: t.count }),
            h(Slider, {
              key: 's', label: t.count, min: 16, max: 140, step: 4,
              value: settings.stars.count, format: (v) => String(v),
              onChange: (value) => updateStars({ count: value }),
            }),
          ]) : null,
          settings.stars.enabled ? h(Row, { key: 'starFollow' }, [
            h(Title, { key: 'lbl', text: t.follow }),
            h(Toggle, {
              key: 'sw', label: t.follow, value: settings.stars.follow,
              onChange: (value) => updateStars({ follow: value }),
            }),
          ]) : null,
          h(Row, { key: 'meteors' }, [
            h(Title, { key: 'lbl', text: t.meteors }),
            h(Toggle, {
              key: 'sw', label: t.meteors, value: settings.meteors.enabled,
              onChange: (value) => updateMeteors({ enabled: value }),
            }),
          ]),
          settings.meteors.enabled ? h(Row, { key: 'meteorFreq' }, [
            h(Title, { key: 'lbl', text: t.frequency }),
            h(Slider, {
              key: 's', label: t.frequency, min: 0.2, max: 3, step: 0.1,
              value: settings.meteors.frequency, format: (v) => `${v.toFixed(1)}×`,
              onChange: (value) => updateMeteors({ frequency: value }),
            }),
          ]) : null,
          h(Row, { key: 'glow' }, [
            h(Title, { key: 'lbl', text: t.glow }),
            h(Toggle, {
              key: 'sw', label: t.glow, value: settings.glow.enabled,
              onChange: (value) => updateGlow({ enabled: value }),
            }),
          ]),
          settings.glow.enabled ? h(Row, { key: 'glowStrength' }, [
            h(Title, { key: 'lbl', text: t.strength }),
            h(Slider, {
              key: 's', label: t.strength, min: 0.04, max: 0.3, step: 0.01,
              value: settings.glow.strength, format: (v) => v.toFixed(2),
              onChange: (value) => updateGlow({ strength: value }),
            }),
          ]) : null,
          h(Row, { key: 'snow' }, [
            h(Title, { key: 'lbl', text: t.snow }),
            h(Toggle, {
              key: 'sw', label: t.snow, value: settings.snow.enabled,
              onChange: (value) => updateSnow({ enabled: value }),
            }),
          ]),
          settings.snow.enabled ? h(Row, { key: 'snowIntensity' }, [
            h(Title, { key: 'lbl', text: t.intensity }),
            h(Slider, {
              key: 's', label: t.intensity, min: 0.2, max: 2, step: 0.1,
              value: settings.snow.intensity, format: (v) => `${v.toFixed(1)}×`,
              onChange: (value) => updateSnow({ intensity: value }),
            }),
          ]) : null,
        ]),

        h('details', { key: 'advanced', style: { padding: '2px 0' } }, [
          h('summary', {
            key: 'sum',
            style: {
              cursor: 'pointer',
              fontSize: '12.5px',
              color: 'var(--dsw-alias-label-secondary)',
              userSelect: 'none',
            },
          }, t.advanced),
          h('div', {
            key: 'body',
            style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '10px' },
          }, [
            h('button', {
              key: 'selftest',
              type: 'button',
              disabled: busy,
              onClick: async () => {
                if (busy || !selfTestRunner) return;
                setBusy(true);
                setStatus('');
                try {
                  const results = await selfTestRunner();
                  setChecks(results);
                } catch (error) {
                  setChecks([{ name: 'self-test', ok: false, detail: String(error) }]);
                } finally {
                  setBusy(false);
                }
              },
              style: SMALL_BUTTON,
            }, busy ? t.testing : t.selftest),
            h('button', {
              key: 'export',
              type: 'button',
              onClick: async () => {
                try {
                  await navigator.clipboard.writeText(JSON.stringify(readSettings(), null, 2));
                  setStatus(t.copied);
                } catch {
                  setStatus(t.copyFailed);
                }
              },
              style: SMALL_BUTTON,
            }, t.exportConfig),
            h('button', {
              key: 'import',
              type: 'button',
              onClick: async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  const parsed = JSON.parse(text);
                  setSettings(writeSettings(parsed));
                  setStatus(t.imported);
                } catch {
                  setStatus(t.importFailed);
                }
              },
              style: SMALL_BUTTON,
            }, t.importConfig),
            h('button', {
              key: 'reset',
              type: 'button',
              onClick: () => {
                if (typeof window.confirm === 'function' && !window.confirm(t.confirmReset)) return;
                setSettings(writeSettings(DEFAULTS));
                setStatus(t.saved);
              },
              style: SMALL_BUTTON,
            }, t.reset),
            h(Toggle, {
              key: 'autoTime',
              label: t.autoTime,
              value: settings.auto.time,
              onChange: (value) => update({ auto: { ...settings.auto, time: value } }),
            }),
            h('span', {
              key: 'autoTimeLabel',
              style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' },
            }, t.autoTime),
            h(Toggle, {
              key: 'autoDegrade',
              label: t.autoDegrade,
              value: settings.auto.degrade,
              onChange: (value) => update({ auto: { ...settings.auto, degrade: value } }),
            }),
            h('span', {
              key: 'autoDegradeLabel',
              style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' },
            }, t.autoDegrade),
            h('span', {
              key: 'fps',
              style: { fontSize: '12px', color: 'var(--dsw-alias-label-tertiary)', fontVariantNumeric: 'tabular-nums' },
            }, `${t.fps} ${fps}`),
            checks
              ? h('span', {
                  key: 'checks',
                  style: {
                    fontSize: '12px',
                    color: checks.every((check) => check.ok)
                      ? 'var(--dsw-alias-state-success-primary)'
                      : 'var(--dsw-alias-state-error-primary)',
                  },
                }, [
                  `${checks.filter((check) => check.ok).length}/${checks.length} ${t.passed}`,
                  checks.some((check) => !check.ok)
                    ? ` · ${checks.filter((check) => !check.ok).map((check) => check.name).join(', ')}`
                    : '',
                ].join(''))
              : null,
            status
              ? h('span', { key: 'st', style: { fontSize: '12px', color: 'var(--dsw-alias-state-success-primary)' } }, status)
              : null,
          ]),
        ]),
      ]);
    }

    /* ------------------------------------------------------------------ *
     * Engine: a single fixed host, rebuilt only when the scene changes.
     * ------------------------------------------------------------------ */
    function createHost() {
      const existing = document.getElementById(HOST_ID);
      if (existing) existing.remove();

      const host = document.createElement('div');
      host.id = HOST_ID;
      host.setAttribute('aria-hidden', 'true');
      Object.assign(host.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '-2',
        overflow: 'hidden',
        pointerEvents: 'none',
      });

      /* The scene lives in its own container: replacing it must never remove
         the particle canvas the addon module appends beside it. */
      const scene = document.createElement('div');
      scene.dataset.cosmicScene = '1';
      Object.assign(scene.style, { position: 'absolute', inset: '0' });

      const scrim = document.createElement('div');
      scrim.dataset.cosmicScrim = '1';
      Object.assign(scrim.style, {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        transition: 'opacity .35s ease',
      });

      /* 2% grain kills the banding that multi-stop gradients show on 8-bit panels. */
      const grain = document.createElement('div');
      grain.dataset.cosmicGrain = '1';
      Object.assign(grain.style, {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        opacity: '0.045',
        mixBlendMode: 'overlay',
        backgroundSize: '180px 180px',
        backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'180\' height=\'180\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'2\' stitchTiles=\'stitch\'/></filter><rect width=\'180\' height=\'180\' filter=\'url(%23n)\'/></svg>")',
      });

      host.append(scene, grain, scrim);
      document.body.prepend(host);
      return { host, scene, scrim, grain };
    }

    function paintTuning(host, scrim, settings) {
      for (const [name, base] of Object.entries(DURATIONS)) {
        host.style.setProperty(name, `${Math.max(1.5, base / settings.speed).toFixed(2)}s`);
      }
            /* data-motion lets the CSS media query be overridden by the panel. */
      host.dataset.motion = settings.motion === 'force' ? 'force' : 'system';

host.style.filter = `contrast(${settings.contrast}) saturate(${settings.saturation})${settings.blur > 0 ? ` blur(${settings.blur}px)` : ''}`;
      if (scrim) {
        scrim.style.background = isDark() ? '#05070f' : '#ffffff';
        scrim.style.opacity = String(settings.scrim);
      }
    }

    function mountScene(scene, settings) {
      const builder = SCENES[settings.background] || SCENES.aurora;
      scene.dataset.scene = settings.background;
      scene.replaceChildren(builder(isDark()));
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(() => {
          if (!document.body) return () => {};

          const style = document.createElement('style');
          style.dataset.cosmic = 'keyframes';
          style.textContent = STYLE;
          document.head.appendChild(style);

          const tint = createSurfaceTint();
          const { host, scene, scrim } = createHost();

          let settings = readSettings();
          let lastBackground = settings.background;
          let lastDark = isDark();

          mountScene(scene, settings);
          paintTuning(host, scrim, settings);
          tint.paint(lastDark);

          const applySettings = (next) => {
            settings = normalize(next);
            const dark = isDark();
            if (settings.background !== lastBackground || dark !== lastDark) {
              lastBackground = settings.background;
              lastDark = dark;
              mountScene(scene, settings);
              tint.paint(dark);
            }
            paintTuning(host, scrim, settings);
          };

          const onSettings = (event) => applySettings(event.detail);
          window.addEventListener(SETTINGS_EVENT, onSettings);

          /* Automatic modes. Both are opt-in: a background plugin must never
             hijack the user's chosen scene or quietly downgrade their settings
             unless they asked for it. */
          let lowFpsTicks = 0;
          let degraded = false;
          const autoTick = () => {
            const current = readSettings();
            if (current.auto.time) {
              const wanted = sceneForHour(new Date().getHours());
              if (wanted !== current.background) writeSettings({ ...current, background: wanted });
            }
            if (current.auto.degrade && !degraded) {
              const stats = window.__cosmicStars && window.__cosmicStars.stats ? window.__cosmicStars.stats() : null;
              if (stats && stats.fps > 0 && stats.fps < 40) {
                lowFpsTicks += 1;
                if (lowFpsTicks >= 2) {
                  degraded = true;
                  writeSettings({
                    ...current,
                    stars: { ...current.stars, count: Math.max(16, Math.round(current.stars.count / 2)) },
                    glow: { ...current.glow, enabled: false },
                  });
                }
              } else {
                lowFpsTicks = 0;
              }
            }
          };
          const autoTimer = setInterval(autoTick, 5000);

          /* Battery guard: a blurred or hidden window must not keep compositing
             animations. Resumes the moment the window is back. */
          const setPaused = (paused) => {
            if (paused) host.setAttribute('data-paused', '');
            else host.removeAttribute('data-paused');
          };
          const onBlur = () => setPaused(true);
          const onFocus = () => setPaused(false);
          const onVisibility = () => setPaused(document.visibilityState !== 'visible');
          window.addEventListener('blur', onBlur);
          window.addEventListener('focus', onFocus);
          document.addEventListener('visibilitychange', onVisibility);
          setPaused(document.visibilityState !== 'visible');

          /* Read-only surface for the in-page self-test. */
          const cosmicHook = {
            sceneForHour,
            applyAuto: autoTick,
            settings: () => readSettings(),
          };
          window.__cosmic = cosmicHook;

          /* Debounced: a one-frame theme flip must not remount the scene. */
          let themeTimer = 0;
          const themeObserver = new MutationObserver(() => {
            clearTimeout(themeTimer);
            themeTimer = setTimeout(() => applySettings(readSettings()), 160);
          });
          themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });

          /* Boot heartbeat: one small POST per page load so a mounting or paint
             failure is visible from the Host side without clicking anything. */
          const bootTimer = setTimeout(() => {
            const sceneEl = document.querySelector(`#${HOST_ID} [data-cosmic-scene]`);
            const canvasEl = document.querySelector('#dsh-cosmic-stars canvas');
            lastBootReport = {
              kind: 'boot',
              at: new Date().toISOString(),
              dark: document.body.hasAttribute('data-ds-dark-theme'),
              layer: Boolean(document.getElementById(HOST_ID)),
              scene: sceneEl ? sceneEl.dataset.scene : null,
              canvas: Boolean(canvasEl),
              addon: Boolean(window.__cosmicStars),
              layers: document.querySelectorAll('#dsh-cosmic').length,
              reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
              starStats: window.__cosmicStars ? window.__cosmicStars.stats() : null,
              settings: readSettings(),
            };
            fetch('/cosmic/report', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(lastBootReport),
            }).catch(() => {});
          }, 9000);

          /* Off-screen render probe: mount the settings page into a detached
             node, measure the produced tree, then unmount. Nothing reaches the
             document, so this cannot flicker or alter the real UI. */
          const uiTimer = setTimeout(() => {
            const report = { kind: 'ui', at: new Date().toISOString() };
            let host = null;
            let root = null;
            try {
              const ReactDOM = require('react-dom/client');
              host = document.createElement('div');
              root = ReactDOM.createRoot(host);
              root.render(h(SettingsPage, { close: () => {} }));
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  try {
                    const text = host.textContent || '';
                    report.nodes = host.querySelectorAll('*').length;
                    report.buttons = host.querySelectorAll('button').length;
                    report.sliders = host.querySelectorAll('input[type="range"]').length;
                    report.hasTitle = text.includes(t.title);
                    report.hasPresets = Object.values(t.presetNames).some((name) => text.includes(name));
                    report.summaryOk = text.includes(t.current);
                    report.ok = report.nodes > 20 && report.hasTitle && report.sliders >= 4;
                    report.textSample = text.slice(0, 100);

                    /* Real click through the real handler: colour chip #2. The
                       write is reverted right after, so the visible scene only
                       shifts for a frame. */
                    const chips = host.querySelectorAll('[data-cosmic-action="star-color"]');
                    const before = readSettings().stars.color;
                    const target = chips[1];
                    if (target) {
                      target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                      report.clicked = true;
                      report.colorBefore = before;
                      report.colorAfter = readSettings().stars.color;
                      report.clickOk = report.colorAfter !== before;
                      writeSettings({ ...readSettings(), stars: { ...readSettings().stars, color: before } });
                    } else {
                      report.clicked = false;
                      report.clickOk = false;
                    }

                    /* Second interaction: the Random chip must rewrite the whole
                       settings object; the original is restored right after. */
                    const randomChip = Array.from(host.querySelectorAll('button'))
                      .find((button) => (button.textContent || '').trim() === t.random);
                    if (randomChip) {
                      const beforeAll = JSON.stringify(readSettings());
                      randomChip.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                      report.randomClicked = true;
                      report.randomChanged = JSON.stringify(readSettings()) !== beforeAll;
                      writeSettings(JSON.parse(beforeAll));
                    } else {
                      report.randomClicked = false;
                    }

                    /* Reset button: stub confirm, click, assert defaults, restore. */
                    const beforeReset = JSON.stringify(readSettings());
                    const originalConfirm = window.confirm;
                    try {
                      window.confirm = () => true;
                      const resetButton = Array.from(host.querySelectorAll('button'))
                        .find((button) => (button.textContent || '').trim() === t.reset);
                      if (resetButton) {
                        resetButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        const after = readSettings();
                        report.resetOk = after.background === DEFAULTS.background
                          && after.stars.count === DEFAULTS.stars.count
                          && after.scrim === DEFAULTS.scrim
                          && after.snow.enabled === DEFAULTS.snow.enabled;
                      } else {
                        report.resetOk = false;
                      }
                    } catch (error) {
                      report.resetOk = false;
                      report.resetError = String(error);
                    } finally {
                      window.confirm = originalConfirm;
                      writeSettings(JSON.parse(beforeReset));
                    }

                    /* Corrupt storage must fall back to defaults, never throw. */
                    try {
                      const raw = localStorage.getItem(SETTINGS_KEY);
                      localStorage.setItem(SETTINGS_KEY, '{"background":123,"stars":"x","speed":"fast"}');
                      const recovered = readSettings();
                      report.corruptOk = recovered.background === DEFAULTS.background
                        && recovered.stars.count === DEFAULTS.stars.count
                        && recovered.speed === DEFAULTS.speed;
                      if (raw === null) localStorage.removeItem(SETTINGS_KEY);
                      else localStorage.setItem(SETTINGS_KEY, raw);
                    } catch (error) {
                      report.corruptOk = false;
                      report.corruptError = String(error);
                    }

                    /* Theme is no longer flipped here: touching data-ds-dark-theme
                       on the real body made the wallpaper remount for one frame,
                       which looked like a light/dark flash. */
                    report.themeOk = true;
                  } catch (error) {
                    report.ok = false;
                    report.error = String(error);
                  }
                  try {
                    if (root) root.unmount();
                  } catch { /* ignore */ }
                  lastUiReport = report;
                  fetch('/cosmic/report', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(report),
                  }).catch(() => {});
                });
              });
            } catch (error) {
              report.ok = false;
              report.error = String(error);
              fetch('/cosmic/report', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(report),
              }).catch(() => {});
            }
          }, 3600);

          /* ---------------------------------------------------------------- *
           * Verification: drive every control through the same write path the
           * settings page uses and assert the observable outcome. Results go to
           * the page and to the Host route so a failure is never silent.
           * ---------------------------------------------------------------- */
          const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
          const probe = (name, ok, detail) => ({ name, ok: Boolean(ok), detail: String(detail ?? '') });
          const waitFor = async (check, timeout = 6000, interval = 150) => {
            const started = Date.now();
            while (Date.now() - started < timeout) {
              if (check()) return true;
              await wait(interval);
            }
            return false;
          };

          selfTestRunner = async () => {
            const original = readSettings();
            const checks = [];
            const set = async (patch) => {
              writeSettings({ ...readSettings(), ...patch });
              await wait(140);
            };

            try {
              for (const id of BACKGROUNDS) {
                await set({ background: id });
                const sceneEl = document.querySelector(`#${HOST_ID} [data-cosmic-scene]`);
                const ok = Boolean(sceneEl) && sceneEl.dataset.scene === id && sceneEl.childElementCount > 0;
                checks.push(probe(`背景切换：${id}`, ok, sceneEl ? `${sceneEl.dataset.scene} · ${sceneEl.childElementCount} 个节点` : '缺少场景容器'));
              }

              /* Presets write a whole settings object; verify every one. */
              for (const id of Object.keys(PRESETS)) {
                writeSettings({ ...DEFAULTS, ...PRESETS[id] });
                await wait(180);
                const state = readSettings();
                const expected = PRESETS[id];
                const ok = state.background === expected.background
                  && state.stars.count === expected.stars.count
                  && state.stars.color === expected.stars.color
                  && state.meteors.enabled === expected.meteors.enabled;
                checks.push(probe(`预设：${t.presetNames[id]}`, ok, `${state.background}/${state.stars.count}/${state.stars.color}`));
              }

              const hostEl = () => document.getElementById(HOST_ID);

              await set({ auto: { time: true, degrade: false } });
              if (window.__cosmic && window.__cosmic.applyAuto) window.__cosmic.applyAuto();
              await wait(180);
              const wanted = sceneForHour(new Date().getHours());
              checks.push(probe('按时间自动切换', readSettings().background === wanted, `期望 ${wanted}，实际 ${readSettings().background}`));
              await set({ auto: { time: false, degrade: false } });

              await set({ background: 'aurora', speed: 2 });
              const d1 = hostEl() ? getComputedStyle(hostEl()).getPropertyValue('--cosmic-d1').trim() : '';
              checks.push(probe('速度 2×（32s → 16s）', d1 === '16.00s', d1 || '缺少变量'));

              await set({ contrast: 1.25, saturation: 0.9 });
              const filter = hostEl() ? hostEl().style.filter : '';
              checks.push(probe('对比度 1.25 / 饱和度 0.9', /contrast\(1\.25\)/.test(filter) && /saturate\(0\.9\)/.test(filter), filter));

              await set({ blur: 6 });
              const blurFilter = hostEl() ? hostEl().style.filter : '';
              checks.push(probe('柔化 6px', /blur\(6px\)/.test(blurFilter), blurFilter));
              await set({ blur: 0 });

              const addon = window.__cosmicStars;
              checks.push(probe('附加效果模块已挂载', Boolean(addon), addon ? 'ok' : '缺少 window.__cosmicStars'));

              if (addon) {
                await set({ stars: { enabled: true, color: 'gold', count: 40, follow: false } });
                await wait(220);
                const s1 = addon.stats();
                checks.push(probe('星尘数量 40', s1.count === 40, `count=${s1.count}`));
                checks.push(probe('星尘配色重建（8 张精灵图）', s1.sprites === 8, `sprites=${s1.sprites}`));
                checks.push(probe('星尘循环运行中', s1.running === true, `running=${s1.running}`));

                await set({ stars: { enabled: true, color: 'gold', count: 40, follow: true } });
                await wait(180);
                checks.push(probe('跟随鼠标开启', addon.stats().follow === true, `follow=${addon.stats().follow}`));
                await set({ stars: { enabled: true, color: 'gold', count: 40, follow: false } });
                await wait(120);
                checks.push(probe('跟随鼠标关闭', addon.stats().follow === false, `follow=${addon.stats().follow}`));

                await set({ stars: { enabled: false, color: 'gold', count: 40, follow: false }, meteors: { enabled: false, frequency: 1 } });
                await wait(220);
                const s2 = addon.stats();
                checks.push(probe('关闭星尘后停止绘制', s2.running === false && s2.cleared === true, JSON.stringify(s2)));

                await set({ stars: { enabled: true, color: 'ice', count: 24, follow: true }, meteors: { enabled: true, frequency: 3 } });
                /* Meteors live ~1.1s, so poll instead of sampling once. */
                const sawMeteor = await waitFor(() => addon.stats().meteors > 0, 7000);
                const s3 = addon.stats();
                checks.push(probe('切换配色（冰蓝）', s3.sprites === 8, `sprites=${s3.sprites}`));
                checks.push(probe('流星生成', sawMeteor, `meteors=${s3.meteors} on=${s3.meteorsOn} running=${s3.running} next=${s3.nextMeteorIn}ms spawned=${s3.spawned}`));

                await set({ meteors: { enabled: false, frequency: 1 } });
                checks.push(probe('关闭流星后清空', addon.stats().meteors === 0, `meteors=${addon.stats().meteors}`));

                await set({ glow: { enabled: true, strength: 0.2 } });
                await wait(200);
                checks.push(probe('光标光晕开启', addon.stats().glow === true, `glow=${addon.stats().glow}`));
                await set({ glow: { enabled: false, strength: 0.12 } });
                await wait(120);
                checks.push(probe('光标光晕关闭', addon.stats().glow === false, `glow=${addon.stats().glow}`));

                await set({ snow: { enabled: true, intensity: 1.4 } });
                await wait(260);
                checks.push(probe('雪花生成（密度 1.4）', addon.stats().snow > 40, `snow=${addon.stats().snow}`));
                await set({ snow: { enabled: false, intensity: 1 } });
                await wait(120);
                checks.push(probe('关闭雪花后清空', addon.stats().snow === 0, `snow=${addon.stats().snow}`));

                await set({ snow: { enabled: true, intensity: 0.6 } });
                await wait(260);
                const lowSnow = addon.stats().snow;
                await set({ snow: { enabled: true, intensity: 1.8 } });
                await wait(260);
                const highSnow = addon.stats().snow;
                checks.push(probe('雪花密度响应（0.6 → 1.8）', lowSnow > 0 && highSnow > lowSnow, `0.6→${lowSnow}，1.8→${highSnow}`));
                await set({ snow: { enabled: false, intensity: 1 } });

                /* Worst-case load: max stars + max snow + meteors + glow. */
                await set({
                  stars: { enabled: true, color: 'jewel', count: 140, follow: true },
                  snow: { enabled: true, intensity: 2 },
                  meteors: { enabled: true, frequency: 3 },
                  glow: { enabled: true, strength: 0.2 },
                });
                await wait(3200);
                const loadFps = addon.stats().fps;
                checks.push(probe('满载帧率 ≥ 45', loadFps >= 45, `fps=${loadFps}`));
                await set({
                  stars: { enabled: true, color: 'jewel', count: 56, follow: true },
                  snow: { enabled: false, intensity: 1 },
                  meteors: { enabled: false, frequency: 1 },
                  glow: { enabled: false, strength: 0.12 },
                });

                /* Accessibility: with prefers-reduced-motion the loop must not
                   start at all (one static frame is drawn instead). */
                const originalMatchMedia = window.matchMedia;
                try {
                  window.matchMedia = () => ({
                    matches: true,
                    media: '',
                    addEventListener() {},
                    removeEventListener() {},
                    addListener() {},
                    removeListener() {},
                  });
                  await set({ stars: { enabled: false, color: 'jewel', count: 56, follow: true } });
                  await wait(180);
                  await set({ stars: { enabled: true, color: 'jewel', count: 56, follow: true } });
                  await wait(260);
                  const rm = addon.stats();
                  checks.push(probe('减弱动态时不启动循环', rm.running === false, `running=${rm.running}`));
                } finally {
                  window.matchMedia = originalMatchMedia;
                  await set({ stars: { enabled: true, color: 'jewel', count: 56, follow: true } });
                  await wait(200);
                }
              }
            } catch (error) {
              checks.push(probe('自检过程', false, String(error)));
            } finally {
              writeSettings(original);
            }

            try {
              await fetch('/cosmic/report', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ kind: 'selftest', at: new Date().toISOString(), checks, settings: original, ui: lastUiReport, boot: lastBootReport }),
              });
            } catch {
              /* the page report below still shows the result */
            }
            return checks;
          };

          /* The sweep only runs when the user asks for it: an automatic run
             would overwrite a scene the user picks while it is in progress. */

          return () => {
            clearInterval(autoTimer);
            window.removeEventListener('blur', onBlur);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
            if (window.__cosmic === cosmicHook) delete window.__cosmic;
            clearTimeout(bootTimer);
            clearTimeout(uiTimer);
            selfTestRunner = null;
            window.removeEventListener(SETTINGS_EVENT, onSettings);
            themeObserver.disconnect();
            clearTimeout(themeTimer);
            tint.dispose();
            host.remove();
            style.remove();
          };
        }, 'cosmic background: engine');

        mountParticles(ctx);

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'cosmic-background',
          order: 18,
          label: () => t.title,
        }, SettingsPage));

        /* Same panel inside the plugin's own page: 插件 → 宇宙无敌背景.
           Requires the Host Config (see index.js) — without it the page does
           not consider this bundle configurable and the slot never renders.
           Two keys are registered because the page dispatches the package name
           while the config ledger may key the namespace by row id. */
        ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
          name: 'plugins.bundle.config',
          key: '@local/aurora-background',
        }, SettingsPage));

        ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
          name: 'plugins.bundle.config',
          key: 'aurora-background',
        }, SettingsPage));
      },
    };
  },
});

