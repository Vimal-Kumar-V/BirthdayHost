(() => {
  'use strict';

  const MAX_PHOTOS = 12;
  const MAX_CANDLES = 10;
  // Shared photos are resized so pages load quickly and the repo stays small.
  const SHARE_PHOTO_MAX_SIDE = 1600;
  const SHARE_PHOTO_QUALITY = 0.85;
  // Where "Publish" saves celebrations. The site itself is served by GitHub Pages.
  const GITHUB = { owner: 'Vimal-Kumar-V', repo: 'BirthdayHost', branch: 'main' };
  const SITE_URL = `https://${GITHUB.owner.toLowerCase()}.github.io/${GITHUB.repo}/`;
  const TOKEN_KEY = 'birthdayhost.githubToken';
  const PHOTO_FILE_PATTERN = /^[a-z0-9-]{1,60}\.(jpe?g|png|webp|gif)$/i;
  const SLUG_PATTERN = /^[a-z0-9-]{1,60}$/;
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
    from: $('from'),
    downloadBtn: $('download-btn'),
    publishBtn: $('publish-btn'),
    tokenDialog: $('token-dialog'),
    tokenForm: $('token-form'),
    tokenInput: $('token-input'),
    tokenRemember: $('token-remember'),
    tokenError: $('token-error'),
    tokenCancel: $('token-cancel'),
    publishDialog: $('publish-dialog'),
    publishTitle: $('publish-title'),
    publishText: $('publish-text'),
    publishLinkRow: $('publish-link-row'),
    publishLink: $('publish-link'),
    publishCopy: $('publish-copy'),
    publishNote: $('publish-note'),
    publishForget: $('publish-forget'),
    publishClose: $('publish-close'),
    status: $('status'),
    statusEmoji: $('status-emoji'),
    statusText: $('status-text'),
    statusLink: $('status-link'),
    statusOpen: $('status-open'),
    party: $('party'),
    partyName: $('party-name'),
    partyAge: $('party-age'),
    partyWish: $('party-wish'),
    partySign: $('party-sign'),
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
    shareBtn: $('share-btn'),
    ownBtn: $('own-btn'),
    toast: $('toast'),
    lightbox: $('lightbox'),
    lightboxImg: $('lightbox-img'),
    lightboxClose: $('lightbox-close'),
  };

  /** Photos to show: { file, url }. Photos from a share file have no `file`. */
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

  function releasePhoto(p) {
    if (p.file) URL.revokeObjectURL(p.url);
  }

  function removePhoto(index) {
    releasePhoto(photos[index]);
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

  /** Validates the form and returns its values, or null if something is missing. */
  function readForm() {
    const name = els.name.value.trim();
    const wish = els.wish.value.trim();
    setInvalid(els.name, els.nameError, !name);
    setInvalid(els.wish, els.wishError, !wish);
    if (!name) {
      els.name.focus();
      return null;
    }
    if (!wish) {
      els.wish.focus();
      return null;
    }
    const age = parseInt(els.age.value, 10);
    return { name, wish, age: age > 0 ? age : null, from: els.from.value.trim() };
  }

  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = readForm();
    if (data) startParty(data);
  });

  /* ------------------------------------------------------------------
   * Party
   * ---------------------------------------------------------------- */

  function startParty({ name, wish, age, from }, { shared = false } = {}) {
    document.title = `Happy Birthday, ${name}! 🎉`;
    els.partyName.textContent = `${name}!`;
    els.partyWish.textContent = wish;
    els.partySign.textContent = from ? `With love, ${from} 💌` : 'With love 💌';

    // Someone opening a shared link only gets to enjoy it, not edit it.
    els.shareBtn.hidden = shared;
    els.editBtn.hidden = shared;
    els.newBtn.hidden = shared;
    els.ownBtn.hidden = !shared;

    els.partyAge.hidden = !age;
    if (age) els.partyAge.textContent = `🎈 Turning ${age} today 🎈`;

    buildBunting();
    buildBalloons();
    buildCandles(age ? Math.min(age, MAX_CANDLES) : 5);
    buildGallery();

    els.setup.hidden = true;
    els.status.hidden = true;
    els.party.hidden = false;
    document.body.classList.add('is-party');
    window.scrollTo({ top: 0 });

    confetti.burst(220);
    setTimeout(() => confetti.burst(140), 700);
    // Browsers only allow sound after a click or tap, which every caller follows.
    song.start();
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
    photos.forEach(releasePhoto);
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
      if (playing) return;
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

  /* ------------------------------------------------------------------
   * Sharing: a celebration lives in celebrations/<slug>/ as
   * celebration.json plus its photo files, and is opened with
   * ?for=<slug>, so the site stays fully static.
   * ---------------------------------------------------------------- */

  function shareLink(slug) {
    return `${SITE_URL}?for=${slug}`;
  }

  /**
   * Folder name for a new celebration: a random code, so neither the repo's
   * file names nor the link reveal who it's for, and links can't be guessed.
   */
  function newSlug() {
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789'; // no look-alikes such as l/1, o/0
    return Array.from(crypto.getRandomValues(new Uint8Array(10)), (n) => chars[n % chars.length]).join('');
  }

  /** Resizes an image file and returns it as a JPEG blob. */
  function shrinkPhoto(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const src = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, SHARE_PHOTO_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; // JPEG has no transparency
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(src);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error(`Could not convert ${file.name}`))),
          'image/jpeg',
          SHARE_PHOTO_QUALITY,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(src);
        reject(new Error(`Could not read ${file.name}`));
      };
      img.src = src;
    });
  }

  let toastTimer = null;

  function showToast(html) {
    els.toast.innerHTML = html;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.hidden = true;
    }, 15000);
  }

  /* Minimal ZIP writer (no compression: JPEGs don't shrink further). */

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  /** Builds a ZIP blob from [{ path, bytes: Uint8Array }]. */
  function makeZip(entries) {
    const encoder = new TextEncoder();
    const now = new Date();
    const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const parts = [];
    const central = [];
    let offset = 0;

    for (const { path, bytes } of entries) {
      const name = encoder.encode(path);
      const crc = crc32(bytes);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true); // local file header
      local.setUint16(4, 20, true); // version needed
      local.setUint16(6, 0x0800, true); // UTF-8 names
      local.setUint16(8, 0, true); // stored
      local.setUint16(10, time, true);
      local.setUint16(12, date, true);
      local.setUint32(14, crc, true);
      local.setUint32(18, bytes.length, true);
      local.setUint32(22, bytes.length, true);
      local.setUint16(26, name.length, true);
      parts.push(local, name, bytes);

      const dir = new DataView(new ArrayBuffer(46));
      dir.setUint32(0, 0x02014b50, true); // central directory header
      dir.setUint16(4, 20, true);
      dir.setUint16(6, 20, true);
      dir.setUint16(8, 0x0800, true);
      dir.setUint16(10, 0, true);
      dir.setUint16(12, time, true);
      dir.setUint16(14, date, true);
      dir.setUint32(16, crc, true);
      dir.setUint32(20, bytes.length, true);
      dir.setUint32(24, bytes.length, true);
      dir.setUint16(28, name.length, true);
      dir.setUint32(42, offset, true);
      central.push(dir, name);

      offset += 30 + name.length + bytes.length;
    }

    const centralSize = central.reduce((sum, part) => sum + part.byteLength, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); // end of central directory
    end.setUint16(8, entries.length, true);
    end.setUint16(10, entries.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, offset, true);

    return new Blob([...parts, ...central, end], { type: 'application/zip' });
  }

  /** Turns the form data and photos into the files of one celebration folder. */
  async function buildCelebration(data) {
    const slug = newSlug();
    const images = await Promise.all(photos.filter((p) => p.file).map((p) => shrinkPhoto(p.file)));
    const photoNames = images.map((_, i) => `photo-${i + 1}.jpg`);
    const json = JSON.stringify({ version: 2, ...data, photos: photoNames }, null, 2);
    const files = [{ name: 'celebration.json', bytes: new TextEncoder().encode(json) }];
    for (let i = 0; i < images.length; i++) {
      files.push({ name: photoNames[i], bytes: new Uint8Array(await images[i].arrayBuffer()) });
    }
    return { slug, files };
  }

  /** Reads the form for publishing or downloading; sends the user back to it if incomplete. */
  function readFormForSharing() {
    const data = readForm();
    if (!data && !els.party.hidden) endParty();
    return data;
  }

  function setShareButtonsDisabled(disabled) {
    [els.publishBtn, els.downloadBtn, els.shareBtn].forEach((b) => (b.disabled = disabled));
  }

  async function downloadZip() {
    const data = readFormForSharing();
    if (!data) return;
    setShareButtonsDisabled(true);
    try {
      const { slug, files } = await buildCelebration(data);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(makeZip(files.map((f) => ({ path: `${slug}/${f.name}`, bytes: f.bytes }))));
      a.download = `celebration-${slug}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      // slug only contains [a-z0-9-], so it is safe to put in HTML.
      showToast(
        `Saved <code>celebration-${slug}.zip</code>. Unzip it into the <code>celebrations</code> folder ` +
          `(you'll get <code>celebrations/${slug}/</code>) and push. ` +
          `Your link will be <code>${shareLink(slug)}</code>`,
      );
    } catch (err) {
      alert(`Couldn't create the zip: ${err.message}`);
    } finally {
      setShareButtonsDisabled(false);
    }
  }

  els.downloadBtn.addEventListener('click', downloadZip);

  /* ------------------------------------------------------------------
   * Publishing straight to the GitHub repo
   * ---------------------------------------------------------------- */

  // Browser storage can be unavailable (private mode, blocked site data).
  const store = {
    get(area, key) {
      try {
        return window[area].getItem(key);
      } catch {
        return null;
      }
    },
    set(area, key, value) {
      try {
        window[area].setItem(key, value);
      } catch {
        /* keep the token in memory only */
      }
    },
    remove(area, key) {
      try {
        window[area].removeItem(key);
      } catch {
        /* nothing to remove */
      }
    },
  };

  let memoryToken = null;

  function savedToken() {
    return memoryToken || store.get('sessionStorage', TOKEN_KEY) || store.get('localStorage', TOKEN_KEY);
  }

  function saveToken(token, remember) {
    memoryToken = token;
    store.set(remember ? 'localStorage' : 'sessionStorage', TOKEN_KEY, token);
  }

  function forgetToken() {
    memoryToken = null;
    store.remove('sessionStorage', TOKEN_KEY);
    store.remove('localStorage', TOKEN_KEY);
  }

  const repoName = `${GITHUB.owner}/${GITHUB.repo}`;
  $('token-repo').textContent = repoName;
  $('token-repo-name').textContent = repoName;

  /** Resolves with a token, asking for one if none is saved, or null if cancelled. */
  function askForToken(errorMessage) {
    const existing = !errorMessage && savedToken();
    if (existing) return Promise.resolve(existing);

    els.tokenInput.value = '';
    els.tokenError.textContent = errorMessage || '';
    els.tokenError.hidden = !errorMessage;
    els.tokenDialog.showModal();
    els.tokenInput.focus();

    return new Promise((resolve) => {
      const finish = (token) => {
        els.tokenForm.removeEventListener('submit', onSubmit);
        els.tokenCancel.removeEventListener('click', onCancel);
        els.tokenDialog.removeEventListener('cancel', onCancel);
        if (els.tokenDialog.open) els.tokenDialog.close();
        resolve(token);
      };
      const onSubmit = (e) => {
        e.preventDefault();
        const token = els.tokenInput.value.trim();
        if (!token) return;
        saveToken(token, els.tokenRemember.checked);
        finish(token);
      };
      const onCancel = (e) => {
        e.preventDefault();
        finish(null);
      };
      els.tokenForm.addEventListener('submit', onSubmit);
      els.tokenCancel.addEventListener('click', onCancel);
      els.tokenDialog.addEventListener('cancel', onCancel);
    });
  }

  async function githubApi(token, method, path, body) {
    const res = await fetch(`https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}${path}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      const err = new Error(detail.message || `GitHub returned ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  function toBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }

  /** Adds files to the repo as a single commit, so the site redeploys once. */
  async function commitFiles(token, files, message) {
    const blobs = await Promise.all(
      files.map((f) => githubApi(token, 'POST', '/git/blobs', { content: toBase64(f.bytes), encoding: 'base64' })),
    );
    // Retry if someone else pushed between reading the branch and updating it.
    for (let attempt = 1; ; attempt++) {
      const ref = await githubApi(token, 'GET', `/git/ref/heads/${GITHUB.branch}`);
      const head = await githubApi(token, 'GET', `/git/commits/${ref.object.sha}`);
      const tree = await githubApi(token, 'POST', '/git/trees', {
        base_tree: head.tree.sha,
        tree: files.map((f, i) => ({ path: f.path, mode: '100644', type: 'blob', sha: blobs[i].sha })),
      });
      const commit = await githubApi(token, 'POST', '/git/commits', {
        message,
        tree: tree.sha,
        parents: [ref.object.sha],
      });
      try {
        await githubApi(token, 'PATCH', `/git/refs/heads/${GITHUB.branch}`, { sha: commit.sha });
        return commit;
      } catch (err) {
        if (err.status !== 422 || attempt >= 3) throw err;
      }
    }
  }

  function showPublishDialog(title, text) {
    els.publishTitle.textContent = title;
    els.publishText.textContent = text;
    els.publishLinkRow.hidden = true;
    els.publishNote.hidden = true;
    els.publishForget.hidden = true;
    if (!els.publishDialog.open) els.publishDialog.showModal();
  }

  let livePoll = null;

  /** Tells the user when GitHub Pages has finished deploying the new celebration. */
  function watchUntilLive(slug) {
    clearInterval(livePoll);
    let tries = 0;
    els.publishNote.hidden = false;
    els.publishNote.textContent = '⏳ The site is updating. The link starts working in about a minute…';
    const check = async () => {
      tries++;
      try {
        const res = await fetch(`${SITE_URL}celebrations/${slug}/celebration.json?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          clearInterval(livePoll);
          els.publishNote.textContent = "✅ It's live. Send away!";
          return;
        }
      } catch {
        /* not deployed yet */
      }
      if (tries >= 48) {
        clearInterval(livePoll);
        els.publishNote.textContent =
          "Still deploying. Give it a few more minutes; if it doesn't appear, check the Actions tab of the GitHub repo.";
      }
    };
    livePoll = setInterval(check, 5000);
  }

  async function publish() {
    const data = readFormForSharing();
    if (!data) return;
    let token = await askForToken();
    if (!token) return;

    setShareButtonsDisabled(true);
    showPublishDialog('Publishing…', 'Getting your photos ready…');
    try {
      const { slug, files } = await buildCelebration(data);
      for (;;) {
        els.publishText.textContent = `Saving ${files.length - 1} photo(s) and your wish to GitHub…`;
        try {
          await commitFiles(
            token,
            files.map((f) => ({ path: `celebrations/${slug}/${f.name}`, bytes: f.bytes })),
            `Add ${data.name}'s birthday celebration`,
          );
          break;
        } catch (err) {
          if (![401, 403, 404].includes(err.status)) throw err;
          // Bad or under-powered token: ask for another and try again.
          forgetToken();
          els.publishDialog.close();
          token = await askForToken(
            err.status === 401
              ? "GitHub didn't accept that token. Check it was copied fully, or create a new one."
              : `That token can't edit ${repoName}. Make sure it has access to the repo with Contents set to “Read and write”.`,
          );
          if (!token) return;
          showPublishDialog('Publishing…', 'Trying again…');
        }
      }

      showPublishDialog('Published! 🎉', `${data.name}'s celebration is saved in the repo. Here's the link to send:`);
      els.publishLink.value = shareLink(slug);
      els.publishLinkRow.hidden = false;
      els.publishForget.hidden = !store.get('localStorage', TOKEN_KEY);
      watchUntilLive(slug);
    } catch (err) {
      console.error(err);
      showPublishDialog("Couldn't publish", `Something went wrong: ${err.message}. Please try again.`);
    } finally {
      setShareButtonsDisabled(false);
    }
  }

  els.publishBtn.addEventListener('click', publish);
  els.shareBtn.addEventListener('click', publish);

  els.publishCopy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(els.publishLink.value);
    } catch {
      els.publishLink.select();
      document.execCommand('copy');
    }
    els.publishCopy.textContent = 'Copied!';
    setTimeout(() => (els.publishCopy.textContent = 'Copy'), 2000);
  });

  els.publishForget.addEventListener('click', () => {
    forgetToken();
    els.publishForget.hidden = true;
    showToast('The saved GitHub token was removed from this browser.');
  });

  els.publishClose.addEventListener('click', () => els.publishDialog.close());
  els.publishDialog.addEventListener('close', () => clearInterval(livePoll));

  function isText(value, max) {
    return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
  }

  /** Checks a celebration file's shape so a bad file can't break the page. */
  function parseCelebration(json, folder) {
    if (!json || !isText(json.name, 40) || !isText(json.wish, 600)) return null;
    const age = Number.isInteger(json.age) && json.age > 0 && json.age <= 120 ? json.age : null;
    const from = isText(json.from, 40) ? json.from : '';
    const list = Array.isArray(json.photos) ? json.photos : [];
    // Only plain file names inside the celebration's own folder are allowed.
    const shared = list
      .filter((file) => typeof file === 'string' && PHOTO_FILE_PATTERN.test(file))
      .slice(0, MAX_PHOTOS)
      .map((file) => ({ url: `${folder}/${file}` }));
    return { celebration: { name: json.name.trim(), wish: json.wish.trim(), age, from }, photos: shared };
  }

  function showStatus(emoji, text, { link = false, open = null } = {}) {
    els.setup.hidden = true;
    els.party.hidden = true;
    els.status.hidden = false;
    els.statusEmoji.textContent = emoji;
    els.statusText.textContent = text;
    els.statusLink.hidden = !link;
    els.statusOpen.hidden = !open;
    els.statusOpen.onclick = open;
    if (open) els.statusOpen.focus();
  }

  async function openSharedCelebration(slug) {
    showStatus('🎁', 'Unwrapping your celebration…');
    try {
      const folder = `celebrations/${slug}`;
      const res = await fetch(`${folder}/celebration.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = parseCelebration(await res.json(), folder);
      if (!parsed) throw new Error('Invalid celebration file');
      photos = parsed.photos;
      // The tap on "Open it" is what lets the browser play the song.
      showStatus('🎁', `A birthday surprise for ${parsed.celebration.name}!`, {
        open: () => startParty(parsed.celebration, { shared: true }),
      });
    } catch (err) {
      console.error(err);
      showStatus('🙈', "We couldn't find this celebration. The link may be wrong, or it isn't published yet.", {
        link: true,
      });
    }
  }

  const sharedSlug = new URLSearchParams(window.location.search).get('for');
  if (sharedSlug && SLUG_PATTERN.test(sharedSlug)) {
    openSharedCelebration(sharedSlug);
  } else if (sharedSlug) {
    showStatus('🙈', "This celebration link doesn't look right.", { link: true });
  }

  document.documentElement.classList.remove('no-js');
})();
