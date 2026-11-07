/* Explore Manipur — page features: map, trip planner, live Imphal weather & time,
   Sangai countdown, packing list, quiz. Each block runs only when its markup exists. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('em:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('em:' + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ===================== PLACES DATA (shared by map + planner) ===================== */
  var PLACES = [
    { id: 'kangla', name: 'Kangla Fort', lat: 24.8077, lng: 93.9440, tags: 'heritage imphal', blurb: 'Seat of Manipur’s kings for centuries, on the Imphal River.' },
    { id: 'ima', name: 'Ima Keithel', lat: 24.8086, lng: 93.9371, tags: 'culture food imphal', blurb: 'The Mothers’ Market, where every stall is run by a woman.' },
    { id: 'govindajee', name: 'Shree Govindajee Temple', lat: 24.7966, lng: 93.9447, tags: 'heritage culture imphal', blurb: 'Twin-domed Vaishnav temple beside the old palace.' },
    { id: 'polo', name: 'Mapal Kangjeibung', lat: 24.8094, lng: 93.9409, tags: 'sport heritage imphal', blurb: 'One of the oldest polo grounds in the world.' },
    { id: 'cemetery', name: 'Imphal War Cemetery', lat: 24.8263, lng: 93.9459, tags: 'heritage imphal', blurb: 'Graves of the 1944 Battle of Imphal, kept in quiet lawns.' },
    { id: 'loktak', name: 'Loktak Lake & Sendra', lat: 24.5180, lng: 93.7850, tags: 'nature water', blurb: 'North-East India’s largest freshwater lake, ringed with phumdis.' },
    { id: 'keibul', name: 'Keibul Lamjao National Park', lat: 24.4960, lng: 93.8270, tags: 'nature wildlife water', blurb: 'The floating park and home of the Sangai deer.' },
    { id: 'moirang', name: 'INA Memorial, Moirang', lat: 24.5003, lng: 93.7730, tags: 'heritage', blurb: 'Where the Indian National Army flag was raised on Indian soil in 1944.' },
    { id: 'andro', name: 'Andro village', lat: 24.7430, lng: 94.0360, tags: 'culture heritage craft', blurb: 'Hand-built black pottery and the Panam Ningthou sacred site.' },
    { id: 'kakching', name: 'Kakching Garden', lat: 24.4970, lng: 93.9950, tags: 'nature', blurb: 'Terraced gardens climbing Uyok Ching hill.' },
    { id: 'khongjom', name: 'Khongjom War Memorial', lat: 24.4420, lng: 94.0040, tags: 'heritage', blurb: 'Remembers the last stand of the 1891 Anglo-Manipur War.' },
    { id: 'ukhrul', name: 'Ukhrul & Shirui Kashung', lat: 25.1100, lng: 94.4400, tags: 'nature adventure culture', blurb: 'Tangkhul Naga hill country and the only home of the Shirui lily.' },
    { id: 'longpi', name: 'Longpi (Nungbi)', lat: 25.0580, lng: 94.3080, tags: 'craft culture', blurb: 'Village of the black stone-and-clay Longpi pottery.' },
    { id: 'dzukou', name: 'Dzükou Valley', lat: 25.5530, lng: 94.0880, tags: 'nature adventure', blurb: 'Grass-folded valley on the Manipur–Nagaland border.' }
  ];
  // On the places page the tiles are the source of truth, so the map and the list always agree.
  var tiles = $$('#place-grid [data-lat]');
  if (tiles.length) {
    PLACES = tiles.map(function (t) {
      return { id: t.id, name: t.querySelector('h3').textContent, lat: +t.getAttribute('data-lat'), lng: +t.getAttribute('data-lng'),
        tags: t.getAttribute('data-tags'), blurb: t.getAttribute('data-meta') };
    });
  }
  window.EM_PLACES = PLACES;

  /* ===================== MAP (Leaflet + OpenStreetMap) ===================== */
  var mapEl = $('#map');
  if (mapEl && window.L) {
    try {
      var map = L.map(mapEl, { dragging: !L.Browser.mobile, tap: false, scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView([24.85, 94.0], 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 16, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      var markers = {};
      var icon = function (active) {
        return L.divIcon({ className: 'pin' + (active ? ' on' : ''), html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] });
      };
      PLACES.forEach(function (p) {
        var m = L.marker([p.lat, p.lng], { icon: icon(false), title: p.name, keyboard: true }).addTo(map);
        m.bindPopup('<strong>' + p.name + '</strong><br>' + p.blurb);
        m.on('click', function () { highlight(p.id); });
        markers[p.id] = m;
      });
      var highlight = function (id) {
        Object.keys(markers).forEach(function (k) { markers[k].setIcon(icon(k === id)); });
        $$('[data-place]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-place') === id)); });
      };
      $$('[data-place]').forEach(function (b) {
        b.addEventListener('click', function () {
          var p = PLACES.filter(function (x) { return x.id === b.getAttribute('data-place'); })[0];
          if (!p) return;
          map.flyTo([p.lat, p.lng], 12, { duration: 1.2 });
          markers[p.id].openPopup();
          highlight(p.id);
        });
      });
      var bounds = L.latLngBounds(PLACES.map(function (p) { return [p.lat, p.lng]; }));
      map.fitBounds(bounds, { padding: [30, 30] });
      $('#map-reset') && $('#map-reset').addEventListener('click', function () { map.flyToBounds(bounds, { padding: [30, 30], duration: 1 }); highlight(null); map.closePopup(); });
      document.addEventListener('em:filter', function (e) {
        var f = e.detail.filter;
        PLACES.forEach(function (p) {
          var on = f === 'all' || p.tags.split(' ').indexOf(f) > -1;
          if (on && !map.hasLayer(markers[p.id])) markers[p.id].addTo(map);
          if (!on && map.hasLayer(markers[p.id])) map.removeLayer(markers[p.id]);
        });
      });
      mapEl.classList.add('ready');
    } catch (e) { mapEl.classList.add('failed'); }
  } else if (mapEl) { mapEl.classList.add('failed'); }

  /* ===================== IMPHAL TIME + WEATHER ===================== */
  var clock = $$('[data-imphal-time]');
  if (clock.length) {
    var fmt = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    var tick = function () { var s = fmt.format(new Date()); clock.forEach(function (c) { c.textContent = s; }); };
    tick(); setInterval(tick, 15000);
  }
  var wx = $('[data-weather]');
  if (wx) {
    var CODES = { 0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm' };
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=24.817&longitude=93.9368&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata&forecast_days=5';
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
    fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
      clearTimeout(to);
      var c = d.current;
      $('[data-wx-temp]', wx).textContent = Math.round(c.temperature_2m) + '°';
      $('[data-wx-desc]', wx).textContent = (CODES[c.weather_code] || 'Weather') + ' · humidity ' + c.relative_humidity_2m + '% · wind ' + Math.round(c.wind_speed_10m) + ' km/h';
      var days = $('[data-wx-days]', wx);
      if (days) {
        var dn = new Intl.DateTimeFormat('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' });
        days.innerHTML = d.daily.time.map(function (t, i) {
          return '<li><strong>' + (i === 0 ? 'Today' : dn.format(new Date(t + 'T12:00:00+05:30'))) + '</strong><span>' +
            Math.round(d.daily.temperature_2m_max[i]) + '° / ' + Math.round(d.daily.temperature_2m_min[i]) + '°</span><span class="muted">' +
            (CODES[d.daily.weather_code[i]] || '') + (d.daily.precipitation_probability_max[i] != null ? ', ' + d.daily.precipitation_probability_max[i] + '% rain' : '') + '</span></li>';
        }).join('');
      }
      wx.classList.add('live');
    }).catch(function () {
      clearTimeout(to);
      var m = new Date().getMonth();
      var HI = [21, 24, 28, 30, 30, 30, 30, 30, 30, 29, 26, 22], LO = [4, 7, 11, 15, 19, 22, 23, 23, 22, 18, 11, 5];
      $('[data-wx-temp]', wx).textContent = HI[m] + '°';
      $('[data-wx-desc]', wx).textContent = 'Typical daytime high this month (live weather unavailable). Nights fall to about ' + LO[m] + '°.';
      wx.classList.add('offline');
    });
  }

  /* ===================== SANGAI COUNTDOWN ===================== */
  var cd = $('[data-sangai]');
  if (cd) {
    var now = new Date();
    var y = now.getFullYear();
    var start = new Date(y + '-11-21T00:00:00+05:30'), end = new Date(y + '-11-30T23:59:59+05:30');
    if (now > end) { y++; start = new Date(y + '-11-21T00:00:00+05:30'); end = new Date(y + '-11-30T23:59:59+05:30'); }
    var num = $('[data-sangai-num]', cd), lbl = $('[data-sangai-label]', cd);
    if (now >= start && now <= end) { num.textContent = 'On now'; lbl.textContent = 'The Sangai Festival is under way in Imphal (usually 21–30 November).'; }
    else {
      var days = Math.ceil((start - now) / 86400000);
      num.textContent = days;
      lbl.textContent = (days === 1 ? 'day' : 'days') + ' until the Sangai Festival usually opens on 21 November ' + y + '.';
    }
  }

  /* ===================== TRIP PLANNER ===================== */
  var planner = $('#planner');
  if (planner) {
    var BLOCKS = [
      { id: 'imphal-heritage', tags: ['heritage', 'culture'], title: 'Imphal: palace, temple and market',
        plan: ['Morning at Kangla Fort and its Kangla Sha dragons', 'Shree Govindajee Temple for the noon aarti', 'Afternoon wandering Ima Keithel, the Mothers’ Market', 'Evening polo practice at Mapal Kangjeibung (when in season)'] },
      { id: 'loktak', tags: ['nature', 'wildlife'], title: 'Loktak Lake and the floating park',
        plan: ['Drive 45 km south to Moirang and the INA Memorial', 'Boat out among the phumdis from Sendra', 'Late afternoon at Keibul Lamjao watchtower for the Sangai', 'Sunset over the lake; stay in a lakeside homestay'] },
      { id: 'imphal-culture', tags: ['culture', 'food'], title: 'Imphal: dance, museums and food',
        plan: ['Manipur State Museum and the royal boat Hiyang Hiren', 'Imphal War Cemetery and the story of 1944', 'Lunch of eromba, singju and black-rice kheer', 'Evening Manipuri dance performance (check the academy’s schedule)'] },
      { id: 'andro', tags: ['culture', 'heritage', 'craft'], title: 'Andro and Kakching',
        plan: ['Andro village: watch hand-built black pottery being made', 'Panam Ningthou sacred site and its old fire', 'Terraced Kakching Garden on Uyok Ching hill', 'Back to Imphal by dusk'] },
      { id: 'ukhrul-1', tags: ['nature', 'adventure', 'culture', 'craft'], title: 'Into the hills: Ukhrul',
        plan: ['Morning drive north-east, about 3 hours', 'Stop in Longpi (Nungbi) for its black pottery', 'Settle into a Tangkhul Naga homestay', 'Evening walk around Ukhrul town'] },
      { id: 'ukhrul-2', tags: ['nature', 'adventure'], title: 'Shirui Kashung peak',
        plan: ['Early start for the Shirui Kashung trail', 'Look for the Shirui lily on the upper slopes (May–June)', 'Picnic with views across the Indo-Myanmar ranges', 'Return to Imphal by night or stay on'] },
      { id: 'khongjom', tags: ['heritage'], title: 'Khongjom and the southern valley',
        plan: ['Khongjom War Memorial and the story of 1891', 'Thoubal’s paddy fields and roadside markets', 'Lunch at a local hotel on the highway', 'Return via Kakching'] },
      { id: 'dzukou', tags: ['nature', 'adventure'], title: 'Dzükou Valley trek (2 days)',
        plan: ['Drive to the trailhead via Senapati with a registered guide', 'Climb through bamboo to the valley rest house', 'Sunrise over the grass folds; rare lilies in season', 'Descend and return (check permits for the Nagaland side)'] }
    ];
    var form = $('form', planner), out = $('#plan-out'), list = $('#plan-days'), sum = $('#plan-sum');
    var build = function () {
      var days = +form.querySelector('[name=days]:checked').value;
      var ints = $$('[name=interest]:checked', form).map(function (i) { return i.value; });
      if (!ints.length) ints = ['heritage', 'nature'];
      var core = ['imphal-heritage', 'loktak'];
      var rest = BLOCKS.filter(function (b) { return core.indexOf(b.id) < 0; }).map(function (b) {
        var s = b.tags.filter(function (t) { return ints.indexOf(t) > -1; }).length;
        return { b: b, s: s };
      }).sort(function (a, b) { return b.s - a.s; });
      var picked = core.map(function (id) { return BLOCKS.filter(function (b) { return b.id === id; })[0]; });
      for (var i = 0; picked.length < days && i < rest.length; i++) {
        var b = rest[i].b;
        if (b.id === 'ukhrul-2' && picked.indexOf(BLOCKS[4]) < 0) continue;
        if (b.id === 'dzukou' && days - picked.length < 1) continue;
        picked.push(b);
        if (b.id === 'ukhrul-1' && picked.length < days) picked.push(BLOCKS[5]);
      }
      // keep the two Ukhrul days together and the hills after the valley
      var order = ['imphal-heritage', 'imphal-culture', 'loktak', 'andro', 'khongjom', 'ukhrul-1', 'ukhrul-2', 'dzukou'];
      picked = picked.filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, days)
        .sort(function (a, b) { return order.indexOf(a.id) - order.indexOf(b.id); });
      while (picked.length < days) picked.push({ title: 'Slow day in Imphal', plan: ['Sleep in, then breakfast at a Khwairamband café', 'Shop for phanek and handloom at Ima Keithel', 'Rest before your onward journey'] });
      list.innerHTML = picked.map(function (b, i) {
        return '<li><h3>Day ' + (i + 1) + ': ' + b.title + '</h3><ul>' + b.plan.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul></li>';
      }).join('');
      sum.textContent = days + ' days, built around ' + ints.join(', ') + '.';
      out.hidden = false;
      store.set('plan', { days: days, ints: ints });
      var text = 'My ' + days + '-day Manipur trip\n\n' + picked.map(function (b, i) { return 'Day ' + (i + 1) + ': ' + b.title + '\n' + b.plan.map(function (p) { return '  - ' + p; }).join('\n'); }).join('\n\n') +
        '\n\nRemember: Inner Line Permit (Indian visitors) - https://manipurilponline.mn.gov.in/';
      out.dataset.text = text;
      $('#plan-mail').href = 'mailto:?subject=' + encodeURIComponent('My ' + days + '-day Manipur trip') + '&body=' + encodeURIComponent(text);
      if (window.gsap && window.EM && EM.hasGSAP) gsap.from('#plan-days > li', { y: 30, opacity: 0, duration: .9, ease: 'expo.out', stagger: .07 });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };
    form.addEventListener('submit', function (e) { e.preventDefault(); build(); });
    form.addEventListener('change', function () { if (!out.hidden) build(); });
    $('#plan-copy').addEventListener('click', function () {
      var b = this, t = out.dataset.text || '';
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy itinerary'; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () { window.prompt('Copy your itinerary:', t); });
      else window.prompt('Copy your itinerary:', t);
    });
    var saved = store.get('plan', null);
    if (saved) {
      var d = form.querySelector('[name=days][value="' + saved.days + '"]'); if (d) d.checked = true;
      $$('[name=interest]', form).forEach(function (i) { i.checked = saved.ints.indexOf(i.value) > -1; });
    }
    build(); // show a starting itinerary straight away; it updates as the choices change
  }

  /* ===================== PACKING LIST ===================== */
  var pack = $('#packing');
  if (pack) {
    var st = store.get('pack', {});
    var boxes = $$('input[type=checkbox]', pack);
    var meter = $('[data-pack-count]');
    var upd = function () { var n = boxes.filter(function (b) { return b.checked; }).length; if (meter) meter.textContent = n + ' of ' + boxes.length + ' packed'; };
    boxes.forEach(function (b) {
      b.checked = !!st[b.value];
      b.addEventListener('change', function () { st[b.value] = b.checked; store.set('pack', st); upd(); });
    });
    var reset = $('#pack-reset');
    if (reset) reset.addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); st = {}; store.set('pack', st); upd(); });
    upd();
  }

  /* ===================== QUIZ ===================== */
  var quiz = $('#quiz');
  if (quiz) {
    var Q = [
      { q: 'What are the floating islands of Loktak Lake called?', a: ['Phumdis', 'Jhooms', 'Chars', 'Kangs'], c: 0, e: 'Phumdis are mats of soil and vegetation that drift on Loktak. The largest forms Keibul Lamjao National Park.' },
      { q: 'Which endangered deer lives only in Keibul Lamjao?', a: ['Hangul', 'Sangai', 'Barasingha', 'Chital'], c: 1, e: 'The Sangai, or brow-antlered deer, is Manipur’s state animal and walks on the floating phumdis.' },
      { q: 'Modern polo grew from which Manipuri game?', a: ['Yubi Lakpi', 'Mukna', 'Sagol Kangjei', 'Hiyang Tannaba'], c: 2, e: 'Sagol Kangjei is played on Manipuri ponies. British officers took it up in the 1850s.' },
      { q: 'Ima Keithel is unique because it is run by…', a: ['Monks', 'Women', 'Children', 'Farmers’ unions'], c: 1, e: 'Ima means mother. Thousands of women traders keep its stalls.' },
      { q: 'Which flower grows wild only on Shirui Kashung in Ukhrul?', a: ['Shirui lily', 'Blue poppy', 'Neelakurinji', 'Brahma kamal'], c: 0, e: 'The Shirui lily (Lilium mackliniae) is Manipur’s state flower.' },
      { q: 'What is the name of Manipur’s classical dance drama about Krishna and Radha?', a: ['Kathakali', 'Ras Leela', 'Bihu', 'Chhau'], c: 1, e: 'Manipuri Ras Leela is one of India’s classical dance forms, performed in the barrel-shaped potloi skirt.' },
      { q: 'Chak-hao, used in a famous purple kheer, is a kind of…', a: ['Lentil', 'Black rice', 'Millet', 'Bamboo shoot'], c: 1, e: 'Chak-hao is an aromatic black rice with a Geographical Indication tag.' },
      { q: 'Thang-Ta is a Manipuri…', a: ['Martial art', 'Fermented fish', 'Drum', 'Boat race'], c: 0, e: 'Thang (sword) and Ta (spear): a martial art performed with grace and power.' },
      { q: 'Which festival in Manipur coincides with Holi?', a: ['Kut', 'Cheiraoba', 'Yaoshang', 'Ningol Chakouba'], c: 2, e: 'Yaoshang runs for five days, with the Thabal Chongba moonlight dance.' },
      { q: 'Which Manipuri boxer has won six world championship titles?', a: ['Sarita Devi', 'M. C. Mary Kom', 'Dingko Singh', 'Mirabai Chanu'], c: 1, e: 'Mary Kom, from Churachandpur district, also won Olympic bronze in London 2012.' }
    ];
    var i = 0, score = 0, answered = false;
    var QIMG = ["phumdi-aerial", "sangai", "polo-1875", "ima-vendor", "shirui-hills", "krishna", "rice", "thang-ta", "yaoshang", "stadium"];
    var qFig = $('.quiz-fig img');
    var qEl = $('[data-q]', quiz), aEl = $('[data-a]', quiz), fb = $('[data-fb]', quiz), nx = $('[data-next]', quiz), prog = $('[data-prog]', quiz), bar = $('[data-bar]', quiz), res = $('[data-result]', quiz), body = $('[data-body]', quiz);
    var best = store.get('quizBest', null);
    var render = function () {
      answered = false;
      var it = Q[i];
      prog.textContent = 'Question ' + (i + 1) + ' of ' + Q.length;
      bar.style.transform = 'scaleX(' + (i / Q.length) + ')';
      qEl.textContent = it.q;
      if (qFig && QIMG[i]) { qFig.src = 'assets/photos/' + QIMG[i] + '-m.jpg'; qFig.removeAttribute('srcset'); }
      aEl.innerHTML = it.a.map(function (t, k) { return '<li><button type="button" class="ans" data-k="' + k + '">' + t + '</button></li>'; }).join('');
      fb.textContent = ''; fb.className = 'quiz-fb';
      nx.hidden = true;
      if (window.gsap && EM.hasGSAP) gsap.from([qEl].concat($$('.ans', aEl)), { y: 20, opacity: 0, duration: .7, ease: 'expo.out', stagger: .05 });
    };
    aEl.addEventListener('click', function (e) {
      var b = e.target.closest('.ans'); if (!b || answered) return;
      answered = true;
      var k = +b.dataset.k, it = Q[i], ok = k === it.c;
      if (ok) score++;
      $$('.ans', aEl).forEach(function (x) { x.disabled = true; if (+x.dataset.k === it.c) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      fb.textContent = (ok ? 'Correct. ' : 'Not quite. ') + it.e;
      fb.className = 'quiz-fb ' + (ok ? 'ok' : 'no');
      nx.hidden = false; nx.textContent = i === Q.length - 1 ? 'See my score' : 'Next question';
      nx.focus({ preventScroll: true });
    });
    nx.addEventListener('click', function () {
      if (i < Q.length - 1) { i++; render(); return; }
      bar.style.transform = 'scaleX(1)';
      body.hidden = true; res.hidden = false;
      if (best === null || score > best) { best = score; store.set('quizBest', best); }
      $('[data-score]', res).textContent = score + '/' + Q.length;
      $('[data-verdict]', res).textContent = score >= 9 ? 'You know Manipur like a local. Khurumjari!' : score >= 6 ? 'A well-travelled answer sheet. A few more stories to discover.' : 'A perfect excuse to visit and learn the rest in person.';
      $('[data-best]', res).textContent = 'Your best: ' + best + '/' + Q.length;
      var share = 'I scored ' + score + '/' + Q.length + ' on the Explore Manipur quiz.';
      $('[data-share]', res).onclick = function () {
        if (navigator.share) navigator.share({ title: 'Explore Manipur quiz', text: share, url: location.href }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(share + ' ' + location.href).then(function () { $('[data-share]', res).textContent = 'Copied to clipboard'; });
      };
    });
    $('[data-restart]', quiz).addEventListener('click', function () { i = 0; score = 0; body.hidden = false; res.hidden = true; render(); });
    render();
  }
})();
