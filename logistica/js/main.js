/* ══════════════════════════════════════════════════════════
   NicoTrack — Ops Control Room Landing Logic
   ══════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    /* ── Navbar scroll ──────────────────────────────────── */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 40) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    }, { passive: true });

    /* ── Mobile nav ─────────────────────────────────────── */
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
        navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('active')));
    }

    /* ── Smooth anchor scroll ───────────────────────────── */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const id = a.getAttribute('href');
            if (id === '#') return;
            const t = document.querySelector(id);
            if (t) {
                e.preventDefault();
                window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
            }
        });
    });

    /* ── Reveal observer ────────────────────────────────── */
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                revealObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    /* ── Counter animation ─────────────────────────────── */
    const counterObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.querySelectorAll('[data-count]').forEach(el => {
                    const target = parseFloat(el.dataset.count);
                    const decimals = parseInt(el.dataset.decimals || '0');
                    const start = performance.now();
                    const dur = 1800;
                    function tick(now) {
                        const p = Math.min((now - start) / dur, 1);
                        const eased = 1 - Math.pow(1 - p, 3);
                        const val = target * eased;
                        el.textContent = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString('es-AR');
                        if (p < 1) requestAnimationFrame(tick);
                    }
                    requestAnimationFrame(tick);
                });
                counterObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.4 });
    document.querySelectorAll('[data-counters]').forEach(el => counterObs.observe(el));

    /* ── Hero title word rotator (smooth swap) ─────────── */
    const rot = document.getElementById('heroRotator');
    if (rot) {
        const words = (rot.dataset.words || '').split('|').filter(Boolean);
        const cur = rot.querySelector('.rotator-current');
        let idx = 0;
        function swap() {
            idx = (idx + 1) % words.length;
            cur.classList.add('rot-out');
            setTimeout(() => {
                cur.textContent = words[idx];
                cur.classList.remove('rot-out');
                cur.classList.add('rot-in-start');
                // force reflow then drop the in-start class to animate in
                void cur.offsetWidth;
                cur.classList.remove('rot-in-start');
            }, 520);
        }
        setInterval(swap, 2600);
    }

    /* ── Mobile journey truck: SMIL auto-animation ─────── */
    const mql = window.matchMedia('(max-width: 960px)');
    const jPath = document.getElementById('journeyPath');
    const jTruck = document.getElementById('journeyTruck');
    function applyMobileTruck() {
        if (!jPath || !jTruck) return;
        // Remove any existing animateMotion
        const existing = jTruck.querySelector('animateMotion');
        if (existing) existing.remove();
        if (mql.matches) {
            const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
            anim.setAttribute('dur', '8s');
            anim.setAttribute('repeatCount', 'indefinite');
            anim.setAttribute('rotate', 'auto');
            anim.setAttribute('path', jPath.getAttribute('d'));
            jTruck.appendChild(anim);
        }
    }
    applyMobileTruck();
    mql.addEventListener ? mql.addEventListener('change', applyMobileTruck) : mql.addListener(applyMobileTruck);

    /* ── Hero truck animation along route path ────────── */
    const routePath = document.getElementById('routePath');
    const truck = document.getElementById('truckGroup');
    if (routePath && truck) {
        const total = routePath.getTotalLength();
        let t = 0;
        function moveTruck() {
            t = (t + 0.0012) % 1;
            const p = routePath.getPointAtLength(t * total);
            const pNext = routePath.getPointAtLength(((t + 0.001) % 1) * total);
            const angle = Math.atan2(pNext.y - p.y, pNext.x - p.x) * 180 / Math.PI;
            truck.setAttribute('transform', `translate(${p.x}, ${p.y}) rotate(${angle})`);
            requestAnimationFrame(moveTruck);
        }
        moveTruck();
    }

    /* ── Animated hero telemetry readouts ─────────────── */
    const telemetry = {
        speed: { el: document.getElementById('telSpeed'), bar: document.getElementById('telSpeedBar'), min: 72, max: 98, unit: 'km/h', max_bar: 120 },
        fuel:  { el: document.getElementById('telFuel'),  bar: document.getElementById('telFuelBar'),  min: 62, max: 74, unit: '%',    max_bar: 100 },
        temp:  { el: document.getElementById('telTemp'),  bar: document.getElementById('telTempBar'),  min: 78, max: 92, unit: '°C',   max_bar: 120 }
    };
    function tickTelemetry() {
        Object.values(telemetry).forEach(t => {
            if (!t.el) return;
            const v = Math.round(t.min + Math.random() * (t.max - t.min));
            t.el.innerHTML = `${v}<span class="unit">${t.unit}</span>`;
            if (t.bar) t.bar.style.width = (v / t.max_bar * 100) + '%';
        });
    }
    tickTelemetry();
    setInterval(tickTelemetry, 1600);

    /* ── Hero KPI sparklines ────────────────────────────── */
    document.querySelectorAll('[data-sparkline]').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.offsetWidth * 2;
        const h = canvas.height = canvas.offsetHeight * 2;
        const pts = 16;
        const data = Array.from({length: pts}, () => 0.3 + Math.random() * 0.7);
        ctx.scale(2, 2);
        const ww = canvas.offsetWidth;
        const hh = canvas.offsetHeight;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = canvas.dataset.color || '#22d3ee';
        ctx.beginPath();
        data.forEach((v, i) => {
            const x = (i / (pts - 1)) * ww;
            const y = hh - v * hh;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        // glow
        ctx.strokeStyle = (canvas.dataset.color || '#22d3ee') + '40';
        ctx.lineWidth = 3;
        ctx.stroke();
        // fill under
        ctx.lineTo(ww, hh);
        ctx.lineTo(0, hh);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 0, 0, hh);
        grad.addColorStop(0, (canvas.dataset.color || '#22d3ee') + '30');
        grad.addColorStop(1, (canvas.dataset.color || '#22d3ee') + '00');
        ctx.fillStyle = grad;
        ctx.fill();
    });

    /* ── Journey road — scroll driven progress ─────────── */
    const journeyPath = document.getElementById('journeyPath');
    const journeyTruck = document.getElementById('journeyTruck');
    const journeyDots = document.querySelectorAll('.journey-milestone');
    const journeySteps = document.querySelectorAll('.journey-step');
    const journeyContainer = document.getElementById('journeyContainer');

    if (journeyPath && journeyTruck && journeyContainer && !mql.matches) {
        const len = journeyPath.getTotalLength();
        journeyPath.style.strokeDasharray = len;
        journeyPath.style.strokeDashoffset = len;

        function updateJourney() {
            const rect = journeyContainer.getBoundingClientRect();
            const vh = window.innerHeight;
            const total = rect.height - vh;
            const raw = (0 - rect.top) / total;
            const progress = Math.max(0, Math.min(1, raw));

            journeyPath.style.strokeDashoffset = len * (1 - progress);
            const pt = journeyPath.getPointAtLength(progress * len);
            const ptNext = journeyPath.getPointAtLength(Math.min(len, progress * len + 2));
            const ang = Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x) * 180 / Math.PI;
            journeyTruck.setAttribute('transform', `translate(${pt.x}, ${pt.y}) rotate(${ang})`);

            // Milestone dots light up
            journeyDots.forEach((d, i) => {
                const threshold = (i + 1) / (journeyDots.length + 0.5);
                if (progress > threshold - 0.08) d.classList.add('lit');
                else d.classList.remove('lit');
            });

            // Step highlights
            const stepIdx = Math.min(journeySteps.length - 1, Math.floor(progress * journeySteps.length));
            journeySteps.forEach((s, i) => s.classList.toggle('in-view', i === stepIdx));
        }
        updateJourney();
        window.addEventListener('scroll', updateJourney, { passive: true });
        window.addEventListener('resize', updateJourney);
    }

    /* ── Explorer tabs ─────────────────────────────────── */
    document.querySelectorAll('.explorer-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const id = tab.dataset.module;
            document.querySelectorAll('.explorer-tab').forEach(t => t.classList.toggle('active', t === tab));
            document.querySelectorAll('.explorer-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === id));
        });
    });

    /* ── Live dashboard tickers ────────────────────────── */
    const liveVals = document.querySelectorAll('[data-live]');
    function tickLive() {
        liveVals.forEach(el => {
            const base = parseFloat(el.dataset.live);
            const jitter = parseFloat(el.dataset.jitter || '0.05');
            const v = base * (1 + (Math.random() - 0.5) * 2 * jitter);
            const dec = parseInt(el.dataset.decimals || '0');
            const unit = el.dataset.unit || '';
            el.innerHTML = (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('es-AR')) + (unit ? `<span class="unit">${unit}</span>` : '');
        });
    }
    tickLive();
    setInterval(tickLive, 2000);

    /* ── Diff card mouse tracker ───────────────────────── */
    document.querySelectorAll('.diff-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
            card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
        });
    });

    /* ── Nav link active state ─────────────────────────── */
    const sections = document.querySelectorAll('section[id]');
    const navLinksAll = document.querySelectorAll('.nav-link:not(.btn-cta)');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(s => {
            if (window.pageYOffset >= s.offsetTop - 120) current = s.id;
        });
        navLinksAll.forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === '#' + current);
        });
    }, { passive: true });

    /* ── CTA form ──────────────────────────────────────── */
    const form = document.getElementById('ctaForm');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const original = btn.innerHTML;
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite"><circle cx="12" cy="12" r="9" stroke-dasharray="50" stroke-dashoffset="10" stroke-linecap="round"/></svg> Enviando…';
            btn.disabled = true;
            setTimeout(() => {
                btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg> Mensaje recibido';
                btn.style.background = '#34d399';
                setTimeout(() => {
                    btn.innerHTML = original;
                    btn.style.background = '';
                    btn.disabled = false;
                    form.reset();
                }, 2400);
            }, 900);
        });
    }

    /* ── Spin keyframe ─────────────────────────────────── */
    const st = document.createElement('style');
    st.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(st);

    /* ── Console signature ─────────────────────────────── */
    console.log('%c NicoTrack %c TMS · Ops Control Room', 'background:#22d3ee;color:#051015;padding:6px 10px;font-weight:700;border-radius:4px 0 0 4px', 'background:#10141d;color:#9aa4b2;padding:6px 10px;border-radius:0 4px 4px 0');
})();
