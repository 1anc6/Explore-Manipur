/* Explore Manipur — shared interactions for every page.
   GSAP + ScrollTrigger + Lenis when available; otherwise a static, fully readable page. */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var EM = window.EM = { lenis: null, hasGSAP: hasGSAP && !reduce, reduce: reduce };

  document.querySelectorAll('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });
  if (!EM.hasGSAP) root.classList.add('no-gsap');

  /* ---------------- smooth scroll ---------------- */
  if (!reduce && !navigator.webdriver && typeof window.Lenis !== 'undefined') {
    try {
      EM.lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
      if (hasGSAP) {
        EM.lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (t) { EM.lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        var raf = function (t) { EM.lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    } catch (e) { EM.lenis = null; }
  }
  EM.scrollTo = function (target) {
    if (EM.lenis) EM.lenis.scrollTo(target, { duration: 1.6 });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = id === '#top' ? 0 : document.querySelector(id);
      if (el === null) return;
      e.preventDefault();
      if (body.classList.contains('menu-open')) toggleMenu(false);
      EM.scrollTo(el);
    });
  });

  /* ---------------- menu ---------------- */
  var menuBtn = document.querySelector('.dock-menu');
  var menu = document.getElementById('menu');
  function toggleMenu(force, viaKeyboard) {
    if (!menu) return;
    var open = typeof force === 'boolean' ? force : !body.classList.contains('menu-open');
    body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    if (EM.lenis) open ? EM.lenis.stop() : EM.lenis.start();
    if (open && viaKeyboard) setTimeout(function () { var f = menu.querySelector('a'); if (f) f.focus({ preventScroll: true }); }, 400);
  }
  EM.toggleMenu = toggleMenu;
  if (menuBtn) menuBtn.addEventListener('click', function (e) { toggleMenu(undefined, e.detail === 0); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('menu-open')) { toggleMenu(false); menuBtn.focus(); }
  });

  /* ---------------- dock contrast ---------------- */
  var dock = document.querySelector('.dock');
  var dockTick = false;
  function checkDock() {
    dockTick = false;
    if (!dock) return;
    var r = dock.getBoundingClientRect();
    dock.style.pointerEvents = 'none';
    var el = document.elementFromPoint(Math.max(2, r.left - 4), r.top + r.height / 2);
    dock.style.pointerEvents = '';
    body.classList.toggle('on-light', !!(el && el.closest('.light, .warm')));
    var hdr = document.querySelector('.site-header');
    if (hdr) {
      var hb = hdr.getBoundingClientRect();
      var he = document.elementFromPoint(4, hb.top + hb.height / 2);
      body.classList.toggle('hdr-light', !!(he && he.closest('.light, .warm')));
      // phones: the header gets the colour of the surface under it, so it never sits over text
      var surf = he && he.closest('.light, .warm, .dark, .ph, .site-footer');
      var bg = surf ? getComputedStyle(surf).backgroundColor : '';
      if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') bg = '#2b1a2b';
      hdr.style.setProperty('--hdr-bg', bg);
    }
    // phones: header and dock slide away while scrolling down and come back on the way up
    var y = window.scrollY || 0;
    if (!body.classList.contains('menu-open')) {
      if (y > lastY + 6 && y > 140) body.classList.add('chrome-hide');
      else if (y < lastY - 6 || y <= 140) body.classList.remove('chrome-hide');
    }
    body.classList.toggle('scrolled', y > 8);
    lastY = y;
  }
  var lastY = window.scrollY || 0;
  function queueDock() { if (!dockTick) { dockTick = true; requestAnimationFrame(checkDock); } }
  window.addEventListener('scroll', queueDock, { passive: true });
  window.addEventListener('resize', queueDock);
  checkDock();

  /* ---------------- sliders ---------------- */
  document.querySelectorAll('.slider').forEach(function (slider) {
    var vp = slider.querySelector('.slider-viewport');
    var prev = slider.querySelector('.arrow-prev');
    var next = slider.querySelector('.arrow-next');
    if (!vp) return;
    var step = function () {
      var s = vp.querySelector('.slide');
      var gap = parseFloat(getComputedStyle(vp.querySelector('.slider-track')).columnGap) || 20;
      return s ? s.getBoundingClientRect().width + gap : vp.clientWidth * .8;
    };
    var update = function () {
      if (prev) prev.disabled = vp.scrollLeft <= 4;
      if (next) next.disabled = vp.scrollLeft >= vp.scrollWidth - vp.clientWidth - 4;
    };
    if (prev) prev.addEventListener('click', function () { vp.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { vp.scrollBy({ left: step(), behavior: 'smooth' }); });
    vp.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    vp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' && next) { e.preventDefault(); next.click(); }
      if (e.key === 'ArrowLeft' && prev) { e.preventDefault(); prev.click(); }
    });
    update();
    var down = false, sx = 0, sl = 0, moved = false;
    vp.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = vp.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; vp.classList.add('dragging'); }
      if (moved) vp.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      if (moved) {
        vp.classList.remove('dragging');
        var s = step();
        vp.scrollTo({ left: Math.round(vp.scrollLeft / s) * s, behavior: 'smooth' });
        setTimeout(function () { moved = false; }, 50);
      }
    });
    vp.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  /* ---------------- list hover image ---------------- */
  var float = document.querySelector('.float-img');
  if (float && window.matchMedia('(hover: hover) and (min-width: 901px)').matches) {
    var fimg = float.querySelector('img');
    var mx = 0, my = 0, fx = 0, fy = 0, running = false;
    var loop = function () {
      fx += (mx - fx) * .14; fy += (my - fy) * .14;
      float.style.left = fx + 'px'; float.style.top = fy + 'px';
      if (running) requestAnimationFrame(loop);
    };
    document.querySelectorAll('[data-img]').forEach(function (f) {
      var pre = new Image(); pre.src = f.getAttribute('data-img');
      f.addEventListener('mouseenter', function (e) {
        var src = f.getAttribute('data-img');
        if (fimg.getAttribute('src') !== src) { fimg.src = src; fimg.alt = ''; }
        if (!running) { fx = mx = e.clientX; fy = my = e.clientY; running = true; requestAnimationFrame(loop); }
        float.classList.add('on');
      });
      f.addEventListener('mouseleave', function () { float.classList.remove('on'); setTimeout(function () { if (!float.classList.contains('on')) running = false; }, 600); });
      f.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
    });
  }

  /* ---------------- filters: [data-filter-group] buttons filter [data-tags] items ---------------- */
  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var target = document.querySelector(group.getAttribute('data-filter-group'));
    if (!target) return;
    var btns = group.querySelectorAll('[data-filter]');
    var count = document.querySelector(group.getAttribute('data-count') || '#__none');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter');
        btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var shown = 0;
        target.querySelectorAll('[data-tags]').forEach(function (it) {
          var ok = f === 'all' || it.getAttribute('data-tags').split(' ').indexOf(f) > -1;
          it.hidden = !ok;
          if (ok) shown++;
        });
        if (count) count.textContent = shown + (shown === 1 ? ' place' : ' places');
        if (window.ScrollTrigger) ScrollTrigger.refresh();
        document.dispatchEvent(new CustomEvent('em:filter', { detail: { filter: f } }));
      });
    });
  });

  /* ---------------- lightbox for [data-lb] items ---------------- */
  var lb = document.querySelector('.lb');
  if (lb) {
    var items = [].slice.call(document.querySelectorAll('[data-lb]'));
    var idx = 0, lastFocus = null;
    var lImg = lb.querySelector('img'), lTitle = lb.querySelector('h2'), lMeta = lb.querySelector('.meta'),
        lText = lb.querySelector('.lb-text'), lDl = lb.querySelector('dl'), lLink = lb.querySelector('.lb-link');
    var visible = function () { return items.filter(function (i) { return !i.hidden; }); };
    var show = function (it) {
      var d = it.dataset;
      lImg.src = d.full || it.querySelector('img').src;
      lImg.alt = it.querySelector('img').alt;
      lTitle.textContent = d.title || it.querySelector('h3').textContent;
      lMeta.textContent = d.meta || '';
      lText.innerHTML = d.text || '';
      lDl.innerHTML = '';
      (d.facts || '').split('|').filter(Boolean).forEach(function (pair) {
        var p = pair.split('::');
        lDl.insertAdjacentHTML('beforeend', '<dt>' + p[0] + '</dt><dd>' + (p[1] || '') + '</dd>');
      });
      if (lLink) {
        if (d.lat) { lLink.hidden = false; lLink.href = 'https://www.openstreetmap.org/?mlat=' + d.lat + '&mlon=' + d.lng + '#map=13/' + d.lat + '/' + d.lng; }
        else lLink.hidden = true;
      }
    };
    var open = function (it) {
      lastFocus = document.activeElement;
      idx = visible().indexOf(it);
      show(it);
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
      if (EM.lenis) EM.lenis.stop();
      body.style.overflow = 'hidden';
      setTimeout(function () { lb.querySelector('.lb-close').focus(); }, 50);
    };
    var close = function () {
      lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
      if (EM.lenis) EM.lenis.start();
      body.style.overflow = '';
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };
    var go = function (d) { var v = visible(); idx = (idx + d + v.length) % v.length; show(v[idx]); };
    EM.openLightbox = open;
    items.forEach(function (it) {
      it.addEventListener('click', function (e) { e.preventDefault(); open(it); });
    });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { go(-1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { go(1); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    });
  }

  if (!EM.hasGSAP) { document.dispatchEvent(new Event('em:ready')); return; }

  /* =====================================================================
     Motion
     ===================================================================== */
  gsap.registerPlugin(ScrollTrigger);
  var E = 'expo.out';

  /* ---------- line splitting ---------- */
  var splits = [].slice.call(document.querySelectorAll('.split'));
  splits.forEach(function (el) { el._src = el.innerHTML; });
  function splitLines(el) {
    el.innerHTML = el._src;
    var tokens = [];
    [].slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(function (w) { if (w) tokens.push(/^\s+$/.test(w) ? ' ' : w); });
      else if (n.nodeName === 'BR') tokens.push('\n');
      else tokens.push(n.outerHTML);
    });
    el.innerHTML = tokens.map(function (t) {
      if (t === '\n') return '<br>';
      if (t === ' ') return ' ';
      return '<span class="w" style="display:inline-block">' + t + '</span>';
    }).join('');
    var lines = [], cur = [], lastTop = null;
    [].slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeName === 'BR') { if (cur.length) lines.push(cur); cur = []; lastTop = null; return; }
      if (n.nodeType === 3) { if (cur.length) cur.push(' '); return; }
      var top = n.offsetTop;
      if (lastTop !== null && Math.abs(top - lastTop) > 4) { lines.push(cur); cur = []; }
      cur.push(n.innerHTML); lastTop = top;
    });
    if (cur.length) lines.push(cur);
    el.innerHTML = lines.map(function (l) {
      return '<span class="ln"><span>' + l.join('').replace(/^ +| +$/g, '').replace(/ {2,}/g, ' ') + '</span></span>';
    }).join('');
  }
  var revealed = new WeakSet();
  function runSplits() {
    splits.forEach(function (el) {
      splitLines(el);
      gsap.set(el.querySelectorAll('.ln > span'), { y: 0, yPercent: revealed.has(el) ? 0 : 105 });
    });
  }
  function whenFonts(cb) {
    var done = false, go = function () { if (!done) { done = true; cb(); } };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    setTimeout(go, 1500);
  }

  whenFonts(function () {
    runSplits();
    splits.forEach(function (el) {
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: function () {
          revealed.add(el);
          gsap.fromTo(el.querySelectorAll('.ln > span'), { yPercent: 105 }, { yPercent: 0, duration: 1.3, ease: E, stagger: .08, delay: +(el.getAttribute('data-delay') || 0) });
        }
      });
    });
    var lastW = window.innerWidth, t;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(function () { runSplits(); ScrollTrigger.refresh(); }, 200);
    });
    ScrollTrigger.refresh();
    document.dispatchEvent(new Event('em:ready'));
  });

  /* ---------- counters ---------- */
  document.querySelectorAll('[data-count-to]').forEach(function (c) {
    var to = +c.getAttribute('data-count-to'), o = { v: 0 };
    ScrollTrigger.create({
      trigger: c, start: 'top 88%', once: true,
      onEnter: function () {
        gsap.to(o, { v: to, duration: 2, ease: 'power3.out', onUpdate: function () { c.textContent = Math.round(o.v).toLocaleString('en-IN'); } });
      }
    });
  });

  /* ---------- staggered entrances: children of [data-stagger] ---------- */
  document.querySelectorAll('[data-stagger]').forEach(function (g) {
    var kids = g.children;
    gsap.from(kids, {
      y: +(g.getAttribute('data-stagger') || 40), opacity: 0, duration: 1.2, ease: E, stagger: .08,
      scrollTrigger: { trigger: g, start: 'top 88%', once: true },
      clearProps: 'transform,opacity'
    });
  });

  /* ---------- reveal pictures ---------- */
  document.querySelectorAll('[data-reveal]').forEach(function (f) {
    gsap.fromTo(f, { clipPath: 'inset(12% 12% 12% 12%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
      scrollTrigger: { trigger: f, start: 'top 95%', end: 'top 35%', scrub: true }
    });
  });

  /* ---------- parallax: [data-parallax] img moves inside its frame ---------- */
  document.querySelectorAll('[data-parallax]').forEach(function (p) {
    var img = p.tagName === 'IMG' ? p : p.querySelector('img');
    var amt = +(p.getAttribute('data-parallax') || 12);
    gsap.fromTo(img, { yPercent: -amt }, {
      yPercent: amt, ease: 'none',
      scrollTrigger: { trigger: p.closest('section, figure, a, div') || p, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ---------- big marquee (scroll-linked) ---------- */
  document.querySelectorAll('.big-marquee-track').forEach(function (tr) {
    gsap.fromTo(tr, { xPercent: 0 }, {
      xPercent: -30, ease: 'none',
      scrollTrigger: { trigger: tr.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ---------- inner page hero ---------- */
  var ph = document.querySelector('.ph');
  if (ph) {
    gsap.from('.ph-title', { yPercent: 40, opacity: 0, duration: 1.6, ease: E, delay: .1 });
    gsap.from('.ph-row > *', { y: 30, opacity: 0, duration: 1.2, ease: E, stagger: .1, delay: .35 });
    gsap.fromTo('.ph-media', { clipPath: 'inset(18% 6% 0% 6%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut', delay: .3 });
  }
  gsap.from('.site-header > *', { y: -24, opacity: 0, duration: 1.1, ease: E, stagger: .07, delay: .2 });
  gsap.from('.dock', { y: 40, opacity: 0, duration: 1.1, ease: E, delay: .6 });

  /* ---------- home hero: phumdi circle opens to the whole screen ---------- */
  var stage = document.querySelector('.hero-stage');
  if (stage) {
    var hero = stage.querySelector('.hero'), media = stage.querySelector('.hero-media'), heroImg = media.querySelector('img');
    var track = stage.querySelector('.marquee-track');
    var mq = gsap.to(track, { xPercent: -50, ease: 'none', duration: 30, repeat: -1 });
    ScrollTrigger.create({
      trigger: stage, start: 'top top', end: 'bottom bottom',
      onUpdate: function (self) {
        var v = Math.min(Math.abs(self.getVelocity()) / 400, 4);
        gsap.to(mq, { timeScale: 1 + v, duration: .3, overwrite: true, onComplete: function () { gsap.to(mq, { timeScale: 1, duration: 1 }); } });
      }
    });
    var radius = function () {
      var probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;visibility:hidden;width:' + getComputedStyle(media).getPropertyValue('--sq').trim();
      hero.appendChild(probe);
      var w = probe.getBoundingClientRect().width; probe.remove();
      return (w || 220) / 2;
    };
    var full = function () { return Math.hypot(hero.clientWidth, hero.clientHeight) / 2 + 2; };
    var intro = gsap.timeline({ defaults: { ease: E } });
    intro.from(track.children, { yPercent: 110, duration: 1, stagger: .03 }, 0)
      .fromTo(media, { clipPath: 'circle(0px at 50% 50%)' }, { clipPath: function () { return 'circle(' + radius() + 'px at 50% 50%)'; }, duration: 1.6 }, .35)
      .from(heroImg, { scale: 1.7, duration: 2.2 }, .35)
            .add(function () {
        gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: stage, start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true }
        })
          .fromTo(media, { clipPath: function () { return 'circle(' + radius() + 'px at 50% 50%)'; } }, { clipPath: function () { return 'circle(' + full() + 'px at 50% 50%)'; }, duration: 1 }, 0)
          .fromTo(heroImg, { scale: 1.25 }, { scale: 1, duration: 1 }, 0)
          .to('.hero-copy', { opacity: 0, y: -30, duration: .2 }, 0)
          .to('.hero-marquee', { opacity: 0, duration: .3 }, .55)
          .fromTo('.hero-cap', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .25 }, .75);
        ScrollTrigger.refresh();
      });
  }

  /* ---------- up next ---------- */
  document.querySelectorAll('.up-next').forEach(function (n) {
    gsap.fromTo(n.querySelector('.next-vp img'), { yPercent: -10, scale: 1.1 }, {
      yPercent: 10, scale: 1, ease: 'none', scrollTrigger: { trigger: n, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); checkDock(); });
})();
