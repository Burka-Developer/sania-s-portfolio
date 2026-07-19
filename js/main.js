/* ============================================================
   SANIA KIRAN — "THE VEIL & THE STRIKE"
   Main experience: Three.js veil background + GSAP choreography
   + morphing cursor + magnetic interactions + parallax depth.
   ============================================================ */

(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer    = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP        = typeof gsap !== "undefined";
  const hasScrollTrigger = hasGSAP && typeof ScrollTrigger !== "undefined";

  if (hasGSAP && hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  if (!hasGSAP || !hasScrollTrigger) {
    document.addEventListener("DOMContentLoaded", () => {
      const loader = document.getElementById("loader");
      if (loader) loader.style.display = "none";
      document.querySelectorAll(
        '[style*="opacity: 0"], .hero__name, .hero__roles, [data-reveal-line] span, ' +
        '[data-reveal], [data-tl], [data-cluster], .char, .contact__line span, .hero__line-text'
      ).forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    });
    if (!hasGSAP) {
      document.addEventListener("DOMContentLoaded", () => {
        const burger = document.getElementById("navBurger");
        const menu = document.getElementById("mobileMenu");
        const y = document.getElementById("year");
        if (y) y.textContent = new Date().getFullYear();
        if (burger && menu) {
          burger.addEventListener("click", () => {
            const o = !menu.classList.contains("is-open");
            menu.classList.toggle("is-open", o);
            burger.classList.toggle("is-open", o);
          });
        }
      });
    }
    return;
  }

  /* ----------------------------------------------------------
     1 · CURSOR — morphing dot/ring with contextual label
     ---------------------------------------------------------- */
  function initCursor() {
    if (!finePointer) return;
    const cursor  = document.getElementById("cursor");
    const dot     = cursor.querySelector(".cursor__dot");
    const ring    = cursor.querySelector(".cursor__ring");
    const labelEl = document.getElementById("cursorLabel");
    if (!cursor) return;

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });

    const tick = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // label state
    const labelables = document.querySelectorAll('[data-cursor="label"]');
    const hoverables = document.querySelectorAll('a, button, .cluster__tags li');

    labelables.forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursor.classList.add("is-label");
        cursor.classList.remove("is-hover");
        labelEl.textContent = el.dataset.cursorLabel || "";
      });
      el.addEventListener("mouseleave", () => {
        cursor.classList.remove("is-label");
      });
    });

    hoverables.forEach((el) => {
      if (el.dataset.cursor === "label") return;
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });

    document.addEventListener("mouseleave", () => cursor.style.opacity = "0");
    document.addEventListener("mouseenter", () => cursor.style.opacity = "1");
  }

  /* ----------------------------------------------------------
     2 · THREE.JS — flowing "veil" shader background
     ---------------------------------------------------------- */
  function initBackground() {
    const canvas = document.getElementById("bgCanvas");
    if (!canvas || prefersReduced || typeof THREE === "undefined") {
      if (canvas) canvas.style.display = "none";
      document.body.style.background =
        "radial-gradient(ellipse at 20% 0%, #1a0a14 0%, #0A0A0C 55%)";
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, alpha: false, powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime:    { value: 0 },
      uRes:     { value: new THREE.Vector2(1, 1) },
      uMouse:   { value: new THREE.Vector2(0.5, 0.5) },
      uCape:    { value: new THREE.Color("#B1123F") },
      uCapeSoft:{ value: new THREE.Color("#3a0612") },
      uBg:      { value: new THREE.Color("#0A0A0C") },
      uGold:    { value: new THREE.Color("#E0B352") },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2  uRes;
        uniform vec2  uMouse;
        uniform vec3  uCape, uCapeSoft, uBg, uGold;

        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p), f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        float fbm(vec2 p){
          float v = 0.0, a = 0.5;
          for(int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; }
          return v;
        }

        void main(){
          vec2 uv = vUv;
          float aspect = uRes.x / uRes.y;
          vec2 p = uv;
          p.x *= aspect;

          float t = uTime * 0.045;

          vec2 q = vec2(fbm(p * 1.5 + t), fbm(p * 1.5 - t + 5.2));
          vec2 r = vec2(
            fbm(p * 2.0 + q * 2.0 + vec2(1.7, 9.2) + t * 0.6),
            fbm(p * 2.0 + q * 2.0 + vec2(8.3, 2.8) - t * 0.5)
          );
          float f = fbm(p * 2.4 + r * 1.8);

          vec2 m = uMouse; m.x *= aspect;
          float md = distance(p, m);
          float mPull = smoothstep(0.5, 0.0, md) * 0.15;
          f += mPull;

          vec3 col = mix(uBg, uCapeSoft, smoothstep(0.30, 0.70, f));
          col = mix(col, uCape, smoothstep(0.58, 0.92, f) * 0.85);

          float ridge = smoothstep(0.66, 0.86, f) - smoothstep(0.86, 1.0, f);
          col += uGold * ridge * 0.22;

          vec2 sp = p * 8.0 + t;
          float spark = pow(noise(sp), 22.0);
          col += uGold * spark * 0.9;

          float vig = smoothstep(1.25, 0.35, length(uv - 0.5));
          col *= mix(0.55, 1.0, vig);
          col *= 0.92;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));

    function resize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w, h);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    let tmx = 0.5, tmy = 0.5;
    window.addEventListener("mousemove", (e) => {
      tmx = e.clientX / window.innerWidth;
      tmy = 1 - e.clientY / window.innerHeight;
    }, { passive: true });

    let visible = !document.hidden;
    document.addEventListener("visibilitychange", () => { visible = !document.hidden; });

    const start = performance.now();
    const render = () => {
      if (visible) {
        const now = (performance.now() - start) / 1000;
        uniforms.uTime.value = now;
        uniforms.uMouse.value.x += (tmx - uniforms.uMouse.value.x) * 0.04;
        uniforms.uMouse.value.y += (tmy - uniforms.uMouse.value.y) * 0.04;
        renderer.render(scene, camera);
      }
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  /* ----------------------------------------------------------
     3 · LOADER
     ---------------------------------------------------------- */
  function initLoader(done) {
    const loader = document.getElementById("loader");
    if (!loader || prefersReduced) {
      if (loader) loader.style.display = "none";
      done();
      return;
    }

    const countEl = document.getElementById("loaderCount");
    const skipBtn = document.getElementById("loaderSkip");
    const nameEl  = loader.querySelector(".loader__name");
    const wipe    = document.getElementById("loaderWipe");
    const tl = gsap.timeline();

    tl.to(nameEl, { y: "0%", duration: 1.1, ease: "expo.out" }, 0.2);

    const counter = { v: 0 };
    tl.to(counter, {
      v: 100, duration: 2.0, ease: "power2.inOut",
      onUpdate: () => { countEl.textContent = String(Math.round(counter.v)).padStart(3, "0"); }
    }, 0);

    tl.to({}, { duration: 0.25 });

    tl.to(wipe, {
      xPercent: 220, yPercent: 220, duration: 0.9, ease: "power3.inOut"
    }, "+=0.1");

    tl.set(loader, { className: "loader is-done" }, "-=0.4");
    tl.to(loader, { opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.4");
    tl.set(loader, { display: "none" });

    tl.add(() => done());

    skipBtn.addEventListener("click", () => {
      tl.totalDuration(tl.totalProgress() + 0.15).timeScale(4);
    });
  }

  /* ----------------------------------------------------------
     4 · HERO entrance — staggered unmask
     ---------------------------------------------------------- */
  function initHeroEntrance() {
    if (prefersReduced) return;
    const lines = document.querySelectorAll("[data-hero-line] .hero__line-text");
    const name  = document.querySelector("[data-hero-name]");
    const roles = document.querySelector("[data-hero-roles]");
    const stmt  = document.querySelector("[data-hero-stmt]");

    const tl = gsap.timeline({ delay: 0.2 });
    tl.to(lines, { y: "0%", duration: 1.2, ease: "expo.out", stagger: 0.14 });
    tl.to(name,  { opacity: 1, duration: 0.05 }, "-=0.5")
      .fromTo(name, { scale: 1.04, filter: "blur(4px)" },
              { scale: 1, filter: "blur(0px)", duration: 1.8, ease: "power3.out" }, "<");
    tl.to(roles, { opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.9");
    tl.from(stmt, { opacity: 0, y: 16, duration: 1.0, ease: "power3.out" }, "-=0.6");
  }

  /* ----------------------------------------------------------
     5 · SCROLL REVEALS — lines, headings, sections, chevrons
     ---------------------------------------------------------- */
  function initScrollReveals() {
    if (prefersReduced) return;

    // split-to-chars reveal for headings with [data-split]
    document.querySelectorAll("[data-split]").forEach((el) => {
      const text = el.textContent;
      el.setAttribute("aria-label", text);
      el.innerHTML = "";
      const wrap = document.createElement("span");
      wrap.className = "split-wrap";
      wrap.setAttribute("aria-hidden", "true");
      wrap.style.display = "inline-block";
      const words = text.split(/(\s+)/);
      words.forEach((w) => {
        if (/^\s+$/.test(w)) { wrap.appendChild(document.createTextNode(" ")); return; }
        const wspan = document.createElement("span");
        wspan.style.display = "inline-block";
        wspan.style.whiteSpace = "nowrap";
        [...w].forEach((ch) => {
          const c = document.createElement("span");
          c.className = "char";
          c.textContent = ch;
          c.style.display = "inline-block";
          c.style.transform = "translateY(110%)";
          wspan.appendChild(c);
        });
        wrap.appendChild(wspan);
      });
      el.appendChild(wrap);

      gsap.to(el.querySelectorAll(".char"), {
        y: "0%", duration: 0.9, ease: "expo.out", stagger: 0.018,
        scrollTrigger: { trigger: el, start: "top 85%", once: true }
      });
    });

    // about paragraph lines
    document.querySelectorAll("[data-reveal-line] span").forEach((span, i) => {
      gsap.to(span, {
        y: "0%", duration: 1.1, ease: "power3.out", delay: i * 0.06,
        scrollTrigger: { trigger: span.parentElement, start: "top 82%", once: true }
      });
    });

    // facts
    document.querySelectorAll("[data-reveal]").forEach((el, i) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.85, ease: "power3.out", delay: i * 0.08,
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

    // timeline items
    document.querySelectorAll("[data-tl]").forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.85, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 82%", once: true }
      });
    });

    // skill clusters
    document.querySelectorAll("[data-cluster]").forEach((el, i) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: i * 0.12,
        scrollTrigger: { trigger: el, start: "top 85%", once: true }
      });
    });

    // contact lines
    document.querySelectorAll(".contact__line span").forEach((span, i) => {
      gsap.to(span, {
        y: "0%", duration: 1.0, ease: "expo.out", delay: i * 0.12,
        scrollTrigger: { trigger: span.closest(".contact__big"), start: "top 78%", once: true }
      });
    });

    // chevron dividers — sweep in + CSS keyframe on is-visible
    document.querySelectorAll(".strike-divider").forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: () => el.classList.add("is-visible")
      });
      gsap.fromTo(el.querySelector(".strike-divider__chevron"), {
        opacity: 0, scale: 0.5
      }, {
        opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.4)",
        delay: 0.5,
        scrollTrigger: { trigger: el, start: "top 90%", once: true }
      });
    });

    // project cards stagger
    document.querySelectorAll(".proj").forEach((el, i) => {
      gsap.fromTo(el, { opacity: 0, y: 50 }, {
        opacity: 1, y: 0, duration: 1.0, ease: "power3.out", delay: i * 0.1,
        scrollTrigger: { trigger: el, start: "top 85%", once: true }
      });
    });
  }

  /* ----------------------------------------------------------
     6 · PARALLAX — foreground/background depth on scroll
     ---------------------------------------------------------- */
  function initParallax() {
    if (prefersReduced) return;

    // section heads move slightly slower than content
    document.querySelectorAll(".section-head").forEach((el) => {
      gsap.to(el, {
        y: -40,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("section"),
          start: "top bottom",
          end: "bottom top",
          scrub: 2.2
        }
      });
    });

    // chevron dividers drift at a different rate
    document.querySelectorAll(".strike-divider").forEach((el) => {
      gsap.to(el.querySelector(".strike-divider__chevron"), {
        x: 20,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 2
        }
      });
    });

    // about facts slide up slower
    const factsEl = document.querySelector(".about__facts");
    if (factsEl) {
      gsap.to(factsEl, {
        y: -30,
        ease: "none",
        scrollTrigger: {
          trigger: factsEl.closest("section"),
          start: "top bottom",
          end: "bottom top",
          scrub: 2.2
        }
      });
    }
  }

  /* ----------------------------------------------------------
     7 · MAGNETIC — buttons/links that follow cursor in radius
     ---------------------------------------------------------- */
  function initMagnetic() {
    if (!finePointer || prefersReduced) return;
    const magnetics = document.querySelectorAll(".magnetic");
    const strength = 0.35;
    const radius = 80;

    magnetics.forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
          const pull = (1 - dist / radius) * strength;
          gsap.to(el, {
            x: dx * pull, y: dy * pull,
            duration: 0.4, ease: "power2.out"
          });
        }
      });

      el.addEventListener("mouseleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
      });
    });
  }

  /* ----------------------------------------------------------
     8 · PROJECT HOVER — reveal panel follows cursor
     ---------------------------------------------------------- */
  function initProjectReveal() {
    if (!finePointer) return;
    const reveal = document.querySelector(".projects__reveal");
    if (!reveal) return;

    const revealKind = reveal.querySelector(".projects__reveal-kind");
    const projs = document.querySelectorAll("[data-proj]");
    let active = false;

    projs.forEach((link) => {
      const data = JSON.parse(link.dataset.proj || "{}");

      link.addEventListener("mouseenter", () => {
        active = true;
        reveal.style.opacity = "1";
        reveal.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%) scale(1)`;
        if (revealKind) revealKind.textContent = data.kind || "";
      });

      link.addEventListener("mouseleave", () => {
        active = false;
        reveal.style.opacity = "0";
        reveal.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%) scale(0.85)`;
      });
    });

    let mx = 0, my = 0;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (active) {
        reveal.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%) scale(1)`;
      }
    });
  }

  /* ----------------------------------------------------------
     9 · MOBILE MENU
     ---------------------------------------------------------- */
  function initMobileMenu() {
    const burger = document.getElementById("navBurger");
    const menu   = document.getElementById("mobileMenu");
    if (!burger || !menu) return;

    function toggle() {
      const opening = !menu.classList.contains("is-open");
      menu.classList.toggle("is-open", opening);
      burger.classList.toggle("is-open", opening);
      burger.setAttribute("aria-expanded", String(opening));
      menu.setAttribute("aria-hidden", String(!opening));
    }

    burger.addEventListener("click", toggle);
    menu.querySelectorAll("[data-mclose]").forEach((a) =>
      a.addEventListener("click", () => {
        menu.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
        menu.setAttribute("aria-hidden", "true");
      })
    );
  }

  /* ----------------------------------------------------------
     10 · NAV scroll styling
     ---------------------------------------------------------- */
  function initNavScroll() {
    const nav = document.getElementById("nav");
    if (!nav) return;

    const onScroll = () => {
      if (window.scrollY > 80) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", () => {
        const id = a.getAttribute("href").slice(1);
        const target = document.getElementById(id);
        if (target) {
          target.setAttribute("tabindex", "-1");
          setTimeout(() => target.focus({ preventScroll: true }), 60);
        }
      });
    });
  }

  /* ----------------------------------------------------------
     11 · PROJECT HOVER UNDERLINE ANIMATION
     ---------------------------------------------------------- */
  function initProjectHover() {
    if (prefersReduced) return;
    const projs = document.querySelectorAll(".proj");
    projs.forEach((proj) => {
      const underline = proj.querySelector(".proj__hover-line");
      if (!underline) return;
      proj.addEventListener("mouseenter", () => {
        gsap.fromTo(underline,
          { scaleX: 0, transformOrigin: "left center" },
          { scaleX: 1, duration: 0.5, ease: "power3.out" }
        );
      });
      proj.addEventListener("mouseleave", () => {
        gsap.to(underline, {
          scaleX: 0, duration: 0.35, ease: "power2.in",
          transformOrigin: "right center"
        });
      });
    });
  }

  /* ----------------------------------------------------------
     12 · FOOTER year
     ---------------------------------------------------------- */
  function initFooterYear() {
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ----------------------------------------------------------
     13 · INTERACTIVE 3D PARTICLE CONSTELLATION
     ---------------------------------------------------------- */
  function initParticleConstellation() {
    if (prefersReduced || typeof THREE === "undefined") return;
    const canvas = document.getElementById("particleCanvas");
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: false, powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;

    const count = finePointer ? 150 : 60;
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      velocities.push({
        x: (Math.random() - 0.5) * 0.003,
        y: (Math.random() - 0.5) * 0.003,
        z: (Math.random() - 0.5) * 0.001
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xE0B352,
      size: 0.04,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xB1123F,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    let mouseX = 0, mouseY = 0;
    window.addEventListener("mousemove", (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    const CONNECTION_DIST = 1.8;
    const MAX_CONNECTIONS = 80;

    function animate() {
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        pos[i * 3]     += velocities[i].x;
        pos[i * 3 + 1] += velocities[i].y;
        pos[i * 3 + 2] += velocities[i].z;

        if (Math.abs(pos[i * 3]) > 5)     velocities[i].x *= -1;
        if (Math.abs(pos[i * 3 + 1]) > 3) velocities[i].y *= -1;
        if (Math.abs(pos[i * 3 + 2]) > 2) velocities[i].z *= -1;

        const dx = pos[i * 3] - mouseX * 3;
        const dy = pos[i * 3 + 1] - mouseY * 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1.5) {
          const force = (1.5 - dist) * 0.008;
          pos[i * 3]     += dx * force;
          pos[i * 3 + 1] += dy * force;
        }
      }
      geometry.attributes.position.needsUpdate = true;

      const linePositions = [];
      let connections = 0;
      for (let i = 0; i < count && connections < MAX_CONNECTIONS; i++) {
        for (let j = i + 1; j < count && connections < MAX_CONNECTIONS; j++) {
          const dx = pos[i * 3] - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d < CONNECTION_DIST) {
            linePositions.push(
              pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2],
              pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]
            );
            connections++;
          }
        }
      }
      lineGeometry.setAttribute("position",
        new THREE.Float32BufferAttribute(linePositions, 3));

      points.rotation.y += 0.0003;
      points.rotation.x += 0.0001;

      renderer.render(scene, camera);
      if (isVisible && !document.hidden) requestAnimationFrame(animate);
      else setTimeout(() => requestAnimationFrame(animate), 100);
    }

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    let isVisible = true;
    if (hasScrollTrigger) {
      ScrollTrigger.create({
        trigger: document.getElementById("hero"),
        start: "top bottom",
        end: "bottom top",
        onEnter: () => { isVisible = true; },
        onLeave: () => { isVisible = false; },
        onEnterBack: () => { isVisible = true; },
        onLeaveBack: () => { isVisible = false; }
      });
    }

    requestAnimationFrame(animate);
  }

  /* ----------------------------------------------------------
     14 · SCROLL PROGRESS BAR
     ---------------------------------------------------------- */
  function initScrollProgress() {
    const bar = document.getElementById("scrollProgress");
    if (!bar) return;

    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      bar.style.transform = `scaleX(${progress})`;
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ----------------------------------------------------------
     15 · ENHANCED MICRO-INTERACTIONS
     ---------------------------------------------------------- */
  function initMicroInteractions() {
    if (prefersReduced) return;

    // Project card 3D tilt on hover (desktop only)
    if (finePointer) {
      document.querySelectorAll(".proj").forEach((proj) => {
        proj.addEventListener("mousemove", (e) => {
          const rect = proj.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          gsap.to(proj, {
            rotateY: x * 4,
            rotateX: -y * 3,
            duration: 0.4,
            ease: "power2.out",
            transformPerspective: 800
          });
        });
        proj.addEventListener("mouseleave", () => {
          gsap.to(proj, {
            rotateY: 0, rotateX: 0,
            duration: 0.7, ease: "elastic.out(1, 0.6)"
          });
        });
      });
    }

    // Skill tags spring on hover
    document.querySelectorAll(".cluster__tags li").forEach((tag) => {
      tag.addEventListener("mouseenter", () => {
        gsap.to(tag, {
          y: -3, scale: 1.02,
          duration: 0.3, ease: "power2.out"
        });
      });
      tag.addEventListener("mouseleave", () => {
        gsap.to(tag, {
          y: 0, scale: 1,
          duration: 0.5, ease: "elastic.out(1, 0.5)"
        });
      });
    });

    // Nav links gold fade on hover
    document.querySelectorAll(".nav__links a").forEach((link) => {
      link.addEventListener("mouseenter", () => {
        gsap.to(link, { color: "#E0B352", duration: 0.3, ease: "power2.out" });
      });
      link.addEventListener("mouseleave", () => {
        gsap.to(link, { color: "", duration: 0.4, ease: "power2.out" });
      });
    });

    // Magnetic scale pulse on enter
    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        gsap.to(el, { scale: 1.05, duration: 0.3, ease: "power2.out" });
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      });
    });

    // Section heading clip-path reveal
    document.querySelectorAll(".section-head__title").forEach((title) => {
      gsap.fromTo(title,
        { clipPath: "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: 1.2,
          ease: "power3.inOut",
          scrollTrigger: { trigger: title, start: "top 85%", once: true }
        }
      );
    });
  }

  /* ----------------------------------------------------------
     BOOT
     ---------------------------------------------------------- */
  function boot() {
    initCursor();
    initBackground();
    initParticleConstellation();
    initMobileMenu();
    initNavScroll();
    initScrollProgress();
    initFooterYear();

    initMagnetic();
    initProjectReveal();
    initProjectHover();
    initMicroInteractions();

    initLoader(() => {
      initHeroEntrance();
      initScrollReveals();
      initParallax();
      setTimeout(() => ScrollTrigger.refresh(), 200);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
