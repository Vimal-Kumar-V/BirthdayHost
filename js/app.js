(() => {
  'use strict';

  const MAX_PHOTOS = 12;
  const MAX_CANDLES = 10;
  const COLORS = ['#ff5c8a', '#ffa34d', '#ffd23f', '#3ddc97', '#4cc9f0', '#9b5de5'];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (id) => document.getElementById(id);

  const els = {
    setup: $('setup'),
    form: $('birthday-form'),
    name: $('name'),
    nameError: $('name-error'),
    age: $('age'),
    photos: $('photos'),
    dropzone: $('dropzone'),
    previews: $('previews'),
    wish: $('wish'),
    wishError: $('wish-error'),
    wishCount: $('wish-count'),
    party: $('party'),
    partyName: $('party-name'),
    partyAge: $('party-age'),
    partyWish: $('party-wish'),
    bunting: $('bunting'),
    balloons: $('balloons'),
    cake: $('cake'),
    candles: $('candles'),
    blowBtn: $('blow-btn'),
    gallerySection: $('gallery-section'),
    gallery: $('gallery'),
    musicBtn: $('music-btn'),
    editBtn: $('edit-btn'),
    newBtn: $('new-btn'),
    lightbox: $('lightbox'),
    lightboxImg: $('lightbox-img'),
    lightboxClose: $('lightbox-close'),
  };

  /** Selected photos: { file, url } */
  let photos = [];

  /* ------------------------------------------------------------------
   * Form
   * ---------------------------------------------------------------- */

  function addFiles(fileList) {
    const images = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    const room = MAX_PHOTOS - photos.length;
    images.slice(0, room).forEach((file) => {
      photos.push({ file, url: URL.createObjectURL(file) });
    });
    if (images.length > room) {
      alert(`You can add up to ${MAX_PHOTOS} photos.`);
    }
    renderPreviews();
  }

  function removePhoto(index) {
    URL.revokeObjectURL(photos[index].url);
    photos.splice(index, 1);
    renderPreviews();
  }

  function renderPreviews() {
    els.previews.replaceChildren(
      ...photos.map((p, i) => {
        const li = document.createElement('li');
        li.className = 'preview';
        const img = document.createElement('img');
        img.src = p.url;
        img.alt = `Photo ${i + 1}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'preview__remove';
        btn.setAttribute('aria-label', `Remove photo ${i + 1}`);
        btn.textContent = '×';
        btn.addEventListener('click', () => removePhoto(i));
        li.append(img, btn);
        return li;
      }),
    );
  }

  els.photos.addEventListener('change', (e) => {
    addFiles(e.target.files);
    e.target.value = ''; // allow picking the same file again
  });

  ['dragenter', 'dragover'].forEach((type) =>
    els.dropzone.addEventListener(type, (e) => {
      e.preventDefault();
      els.dropzone.classList.add('is-dragover');
    }),
  );
  ['dragleave', 'drop'].forEach((type) =>
    els.dropzone.addEventListener(type, (e) => {
      e.preventDefault();
      els.dropzone.classList.remove('is-dragover');
    }),
  );
  els.dropzone.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));

  function updateCount() {
    els.wishCount.textContent = `${els.wish.value.length} / ${els.wish.maxLength}`;
  }
  els.wish.addEventListener('input', () => {
    updateCount();
    if (els.wish.value.trim()) setInvalid(els.wish, els.wishError, false);
  });
  els.name.addEventListener('input', () => {
    if (els.name.value.trim()) setInvalid(els.name, els.nameError, false);
  });

  document.querySelectorAll('.chip').forEach((chip) =>
    chip.addEventListener('click', () => {
      els.wish.value = chip.dataset.wish;
      updateCount();
      setInvalid(els.wish, els.wishError, false);
      els.wish.focus();
    }),
  );

  function setInvalid(input, error, invalid) {
    input.setAttribute('aria-invalid', String(invalid));
    error.hidden = !invalid;
  }

  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = els.name.value.trim();
    const wish = els.wish.value.trim();
    setInvalid(els.name, els.nameError, !name);
    setInvalid(els.wish, els.wishError, !wish);
    if (!name) return els.name.focus();
    if (!wish) return els.wish.focus();

    const age = parseInt(els.age.value, 10);
    startParty({ name, wish, age: age > 0 ? age : null });
  });

  /* ------------------------------------------------------------------
   * Party
   * ---------------------------------------------------------------- */

  function startParty({ name, wish, age }) {
    document.title = `Happy Birthday, ${name}! 🎉`;
    els.partyName.textContent = `${name}!`;
    els.partyWish.textContent = wish;

    els.partyAge.hidden = !age;
    if (age) els.partyAge.textContent = `🎈 Turning ${age} today 🎈`;

    buildBunting();
    buildBalloons();
    buildCandles(age ? Math.min(age, MAX_CANDLES) : 5);
    buildGallery();

    els.setup.hidden = true;
    els.party.hidden = false;
    document.body.classList.add('is-party');
    window.scrollTo({ top: 0 });

    confetti.burst(220);
    setTimeout(() => confetti.burst(140), 700);
  }

  function endParty() {
    song.stop();
    confetti.clear();
    els.party.hidden = true;
    els.setup.hidden = false;
    document.body.classList.remove('is-party');
    document.title = 'Birthday Host';
    window.scrollTo({ top: 0 });
  }

  function buildBunting() {
    const letters = 'HAPPY BIRTHDAY'.split('');
    const count = Math.max(letters.length, Math.ceil(window.innerWidth / 50));
    const offset = Math.floor((count - letters.length) / 2);
    els.bunting.replaceChildren(
      ...Array.from({ length: count }, (_, i) => {
        const flag = document.createElement('span');
        flag.className = 'flag';
        flag.style.background = COLORS[i % COLORS.length];
        flag.style.animationDelay = `${(i % 5) * -0.4}s`;
        const letter = letters[i - offset];
        if (letter && letter !== ' ') flag.textContent = letter;
        return flag;
      }),
    );
  }

  function buildBalloons() {
    const count = window.innerWidth < 600 ? 7 : 12;
    els.balloons.replaceChildren(
      ...Array.from({ length: count }, (_, i) => {
        const b = document.createElement('span');
        b.className = 'balloon';
        b.style.left = `${(i / count) * 100 + Math.random() * 6}%`;
        b.style.setProperty('--c', COLORS[i % COLORS.length]);
        b.style.setProperty('--dur', `${12 + Math.random() * 10}s`);
        b.style.setProperty('--delay', `${-Math.random() * 20}s`);
        b.style.setProperty('--sway', `${(Math.random() - 0.5) * 80}px`);
        b.addEventListener('click', (e) => popBalloon(b, e));
        return b;
      }),
    );
  }

  function popBalloon(balloon, event) {
    if (balloon.classList.contains('is-popped')) return;
    balloon.classList.add('is-popped');
    confetti.burst(40, event.clientX, event.clientY);
    // Respawn the balloon so the sky never empties.
    setTimeout(() => {
      balloon.classList.remove('is-popped');
      balloon.style.setProperty('--delay', '0s');
    }, 1500);
  }

  function buildCandles(n) {
    els.cake.classList.remove('is-blown');
    els.blowBtn.disabled = false;
    els.blowBtn.textContent = '🌬️ Make a wish & blow!';
    els.candles.replaceChildren(
      ...Array.from({ length: n }, (_, i) => {
        const candle = document.createElement('span');
        candle.className = 'candle';
        candle.style.setProperty('--c', COLORS[i % COLORS.length]);
        const flame = document.createElement('span');
        flame.className = 'flame';
        flame.style.animationDelay = `${Math.random() * -0.15}s`;
        candle.append(flame);
        return candle;
      }),
    );
  }

  els.blowBtn.addEventListener('click', () => {
    els.cake.classList.add('is-blown');
    els.blowBtn.disabled = true;
    els.blowBtn.textContent = '🎉 Your wish is on its way!';
    const r = els.cake.getBoundingClientRect();
    confetti.burst(200, r.left + r.width / 2, r.top + r.height / 3);
  });

  function buildGallery() {
    els.gallerySection.hidden = photos.length === 0;
    els.gallery.replaceChildren(
      ...photos.map((p, i) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'polaroid';
        btn.style.setProperty('--r', `${(Math.random() - 0.5) * 10}deg`);
        btn.style.setProperty('--d', `${0.6 + i * 0.12}s`);
        btn.setAttribute('aria-label', `Open photo ${i + 1}`);
        const img = document.createElement('img');
        img.src = p.url;
        img.alt = `Birthday memory ${i + 1}`;
        btn.append(img);
        btn.addEventListener('click', () => openLightbox(p.url, img.alt));
        li.append(btn);
        return li;
      }),
    );
  }

  els.editBtn.addEventListener('click', endParty);

  els.newBtn.addEventListener('click', () => {
    endParty();
    els.form.reset();
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    photos = [];
    renderPreviews();
    updateCount();
    els.name.focus();
  });

  /* ------------------------------------------------------------------
   * Lightbox
   * ---------------------------------------------------------------- */

  let lastFocus = null;

  function openLightbox(src, alt) {
    lastFocus = document.activeElement;
    els.lightboxImg.src = src;
    els.lightboxImg.alt = alt;
    els.lightbox.hidden = false;
    els.lightboxClose.focus();
  }

  function closeLightbox() {
    els.lightbox.hidden = true;
    if (lastFocus) lastFocus.focus();
  }

  els.lightboxClose.addEventListener('click', closeLightbox);
  els.lightbox.addEventListener('click', (e) => {
    if (e.target === els.lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.lightbox.hidden) closeLightbox();
  });

  /* ------------------------------------------------------------------
   * Confetti (canvas)
   * ---------------------------------------------------------------- */

  const confetti = (() => {
    const canvas = $('confetti');
    const ctx = canvas.getContext('2d');
    let pieces = [];
    let running = false;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize);
    resize();

    function burst(count, x = window.innerWidth / 2, y = window.innerHeight / 3) {
      if (reducedMotion) count = Math.min(count, 30);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 9;
        pieces.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 6,
          w: 6 + Math.random() * 6,
          h: 8 + Math.random() * 8,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          round: Math.random() < 0.3,
          life: 0,
        });
      }
      if (!running) {
        running = true;
        requestAnimationFrame(tick);
      }
    }

    function tick() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const h = window.innerHeight;
      pieces = pieces.filter((p) => p.y < h + 40 && p.life < 600);
      for (const p of pieces) {
        p.life++;
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + 0.22;
        p.x += p.vx + Math.sin(p.life / 12) * 0.6;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // scaleY fakes the paper flipping over
          ctx.scale(1, Math.cos(p.life / 6));
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      if (pieces.length) {
        requestAnimationFrame(tick);
      } else {
        running = false;
      }
    }

    function clear() {
      pieces = [];
    }

    return { burst, clear };
  })();

  /* ------------------------------------------------------------------
   * "Happy Birthday" tune (Web Audio, no files needed)
   * ---------------------------------------------------------------- */

  const song = (() => {
    // [midi note, beats]
    const MELODY = [
      [67, 0.75], [67, 0.25], [69, 1], [67, 1], [72, 1], [71, 2],
      [67, 0.75], [67, 0.25], [69, 1], [67, 1], [74, 1], [72, 2],
      [67, 0.75], [67, 0.25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 2],
      [77, 0.75], [77, 0.25], [76, 1], [72, 1], [74, 1], [72, 2.5],
    ];
    const BEAT = 0.42;
    let audio = null;
    let timer = null;
    let playing = false;

    const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);

    function playOnce() {
      let t = audio.currentTime + 0.05;
      for (const [note, beats] of MELODY) {
        const dur = beats * BEAT;
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq(note);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95);
        osc.connect(gain).connect(audio.destination);
        osc.start(t);
        osc.stop(t + dur);
        t += dur;
      }
      const total = MELODY.reduce((s, [, b]) => s + b, 0) * BEAT;
      timer = setTimeout(() => playing && playOnce(), (total + 1) * 1000);
    }

    function start() {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      audio.resume();
      playing = true;
      playOnce();
      els.musicBtn.setAttribute('aria-pressed', 'true');
      els.musicBtn.textContent = '🔇 Stop song';
    }

    function stop() {
      playing = false;
      clearTimeout(timer);
      if (audio) {
        // Closing drops any notes already scheduled.
        audio.close();
        audio = null;
      }
      els.musicBtn.setAttribute('aria-pressed', 'false');
      els.musicBtn.textContent = '🎵 Play song';
    }

    return { start, stop, toggle: () => (playing ? stop() : start()) };
  })();

  els.musicBtn.addEventListener('click', () => song.toggle());

  document.documentElement.classList.remove('no-js');
})();
