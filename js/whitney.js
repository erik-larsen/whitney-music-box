// Whitney Music Box — faithful web port of whitneymusicbox.org (2006 Flash version)
// Original music & animation by Jim Bumgardner (krazydad.com), from ideas by
// John Whitney Sr. ("Digital Harmony", 1980).
//
// This port reproduces the ActionScript 2 logic recovered from the original 21
// SWFs, and plays the original soundtracks extracted from those SWFs.
// Each variation's parameters (tine count, cycle length, mode quirks) were
// recovered from its DoAction bytecode; see README for provenance.

'use strict';

// ---------------------------------------------------------------------------
// Variation manifest.
// samples/rate describe the exact length of the embedded soundtrack loop;
// seek is the SWF DefineSound seekSamples value (leading encoder padding).
// ---------------------------------------------------------------------------

// First 48 used: speed (revolutions per cycle) of tine i counted from the
// OUTERMOST inward, i.e. construction index j uses table[n-1-j].
const PRIMES = [
  2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,
  103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,
  199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,
  313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,
  433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,
  563,569,571,577,587,593,599,601];

const NONPRIMES = [
  1,4,6,8,9,10,12,14,15,16,18,20,21,22,24,25,26,27,28,30,32,33,34,35,36,38,39,
  40,42,44,45,46,48,49,50,51,52,54,55,56,57,58,60,62,63,64,65,66,68,69,70,72,
  74,75,76,77,78,80,81,82,84,85,86,87,88,90,91,92,93,94,95,96,98,99,100,102];

const VARIATIONS = [
  {v:0,  title:'chromatic - 48 tines',                    swf:'whitneyChromatic',   mode:'standard', n:48,  cycle:180, audio:{file:'whitneyChromatic.mp3',   samples:1984320, rate:11025, seek:1661}},
  {v:1,  title:'harmonics of 55hz',                       swf:'whitneyHarmonic',    mode:'standard', n:48,  cycle:180, audio:{file:'whitneyHarmonic.mp3',    samples:1984500, rate:11025, seek:1661}},
  {v:2,  title:'harmonics of 20hz',                       swf:'whitneyHarmonicLow', mode:'standard', n:48,  cycle:180, audio:{file:'whitneyHarmonicLow.mp3', samples:1984500, rate:11025, seek:1661}},
  {v:3,  title:'harmonics of 48hz, reversed',             swf:'whitneyHarmonicRev48', mode:'standard', n:48, cycle:180, audio:{file:'whitneyHarmonicRev48.mp3', samples:1984500, rate:11025, seek:1661}},
  {v:4,  title:'harmonics of 48hz, palindrome',           swf:'whitneyPalindrome',  mode:'standard', n:48,  cycle:180, audio:{file:'whitneyPalindrome.mp3',  samples:1984500, rate:11025, seek:1661}},
  {v:5,  title:'chromatic - 88 tines',                    swf:'whitney88',          mode:'standard', n:88,  cycle:180, audio:{file:'whitney88.mp3',          samples:1984500, rate:11025, seek:1661}},
  {v:6,  title:'microtones',                              swf:'whitneyMTones',      mode:'standard', n:48,  cycle:180, audio:{file:'whitneyMTones.mp3',      samples:1984500, rate:11025, seek:1661}},
  {v:7,  title:'harmonics - 120 tines, reversed',         swf:'whitney120',         mode:'standard', n:120, cycle:180, audio:{file:'whitney120.mp3',         samples:1987200, rate:11025, seek:0}},
  {v:8,  title:'chromatic - 88 organ pipes, rev.',        swf:'whitney88b3',        mode:'standard', n:88,  cycle:180, audio:{file:'whitney88b3.mp3',        samples:1967776, rate:11025, seek:1661}},
  {v:9,  title:'chromatic - 88 bars, rev.',               swf:'whitney88bars',      mode:'standard', n:88,  cycle:180, audio:{file:'whitney88bars.mp3',      samples:1967586, rate:11025, seek:1661}},
  {v:10, title:'chromatic - 64 pipe crypto calliope',     swf:'whitney64Calliope',  mode:'standard', n:64,  cycle:180, audio:{file:'whitney64Calliope.mp3',  samples:1961244, rate:11025, seek:1661}},
  {v:11, title:'minute waltz - 60 keys, 60 seconds',      swf:'whitneyMinute',      mode:'standard', n:60,  cycle:60,  audio:{file:'whitneyMinute.mp3',      samples:661831,  rate:11025, seek:1661}},
  {v:12, title:'chromatic - prime numbers only',          swf:'whitneyPrimes',      mode:'table',    n:48,  cycle:180, table:PRIMES,    audio:{file:'whitneyPrimes.mp3',    samples:1984320, rate:11025, seek:1661}},
  {v:13, title:'chromatic - non-primes only',             swf:'whitneyNonPrimes',   mode:'table',    n:48,  cycle:180, table:NONPRIMES, audio:{file:'whitneyNonPrimes.mp3', samples:1984320, rate:11025, seek:1661}},
  {v:14, title:'stereo',                                  swf:'whitneyStereo',      mode:'stereo',   n:48,  cycle:180, audio:{file:'whitneyStereo.mp3',      samples:1984500, rate:11025, seek:1670}},
  {v:15, title:'stereo - 120',                            swf:'whitneyStereo120',   mode:'stereo',   n:120, cycle:180, audio:{file:'whitneyStereo120.mp3',   samples:1984500, rate:11025, seek:1670}},
  {v:16, title:'stereo - 210',                            swf:'whitneyStereo210',   mode:'stereo',   n:210, cycle:180, audio:{file:'whitneyStereo210.mp3',   samples:1984500, rate:11025, seek:1670}},
  {v:17, title:'hand cranked',                            swf:'whitneyCrank',       mode:'crank',    n:25,  cycle:60},
  {v:18, title:'stereo drone (new)',                      swf:'whitneyStereoSweep', mode:'sweep',    n:50,  cycle:180, audio:{file:'whitneyStereoSweep.mp3', samples:1984500, rate:11025, seek:1670}},
  {v:19, title:'stereo sonar (new)',                      swf:'whitneySonar',       mode:'sonar',    n:48,  cycle:180, audio:{file:'whitneySonar.mp3',       samples:1984500, rate:11025, seek:1670}},
  {v:20, title:'bell carol (new)',                        swf:'whitneyCarol',       mode:'standard', n:48,  cycle:180, audio:{file:'whitneyCarol.mp3',       samples:3969000, rate:22050, seek:1681}},
];

// ---------------------------------------------------------------------------
// Color helpers (exact port of whitney.as getColor)
// ---------------------------------------------------------------------------

function getColor(ratio) {
  const a = 2 * Math.PI * ratio;
  const r = 128 + Math.cos(a) * 127;
  const g = 128 + Math.cos(a + 2 * Math.PI / 3) * 127;
  const b = 128 + Math.cos(a + 4 * Math.PI / 3) * 127;
  return (r << 16) | (g << 8) | b;
}

function cssColor(rgb, alpha) {
  const r = (rgb >> 16) & 0xFF, g = (rgb >> 8) & 0xFF, b = rgb & 0xFF;
  return alpha === undefined
    ? `rgb(${r},${g},${b})`
    : `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

class WhitneyPlayer {
  constructor(canvas, spec) {
    this.canvas = canvas;
    this.dc = canvas.getContext('2d');
    this.spec = spec;
    this.W = 500; this.H = 500;
    this.cx = 250; this.cy = 250;

    // Stage geometry per mode (recovered from each SWF's bytecode)
    this.maxRad = 8;                       // dot radius cap: max(2, r*maxRad)
    this.cRad = this.W / 2 * 0.95;         // 237.5
    if (spec.mode === 'sonar') { this.maxRad = 16; this.cRad = this.W / 2 - 17; }
    if (spec.mode === 'sweep') { this.maxRad = 16; this.cRad = this.W / 2 - 17; }

    this.running = false;
    this.audioReady = false;
    this.ctxAudio = null;
    this.buffer = null;
    this.crankSounds = null;

    // Tines
    const n = spec.n;
    this.tines = [];
    for (let i = 0; i < n; i++) {
      const r = i / n;
      this.tines.push({
        r,
        len: (i + 1) * this.cRad / n,
        rad: Math.max(2, r * this.maxRad),
        color: getColor(r),
        haloColor: getColor(r) | 0xF0F0F0,
        haloVisible: false,
        haloAlpha: 0,
        // sonar
        notesPlayed: 0, lastNotesPlayed: 0,
        // crank
        lastSide: false,
      });
    }

    // Clocks
    this.elapsed = 0;         // seconds into the visual cycle
    this.lastFrame = null;    // performance.now() of last rAF
    this.audioStartTime = 0;  // AudioContext time when playback started

    // Crank state
    if (spec.mode === 'crank') {
      // Original SWF placed the crank at (118.3, 363.5) with a ~100px arm,
      // overlapping the dot field. Shrunk and tucked into the bottom-left
      // corner pocket so its full sweep stays outside the dots' swept disc
      // (radius ~245 from stage center).
      this.crank = {
        x: 44, y: 455,
        wheelRad: 12, armLen: 38, knobRad: 8,
        rotation: 0, oldAng: 0, angD: 0, isRotating: false,
      };
      this.installCrankHandlers();
    }

    this.drawFrame(0);
  }

  // ---- audio ----------------------------------------------------------------

  async initAudio() {
    if (this.ctxAudio) return;
    this.ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
    this.gain = this.ctxAudio.createGain();
    this.gain.connect(this.ctxAudio.destination);

    if (this.spec.audio) {
      const resp = await fetch('audio/' + this.spec.audio.file);
      const data = await resp.arrayBuffer();
      this.buffer = await this.ctxAudio.decodeAudioData(data);
    } else if (this.spec.mode === 'crank') {
      // reed_60 .. reed_84 (the SWF attaches 25 of the 26 embedded samples)
      this.crankSounds = [];
      const loads = [];
      for (let i = 0; i < this.spec.n; i++) {
        const note = 60 + i;
        loads.push(fetch(`audio/whitneyCrank_reed_${note}.mp3`)
          .then(r => r.arrayBuffer())
          .then(d => this.ctxAudio.decodeAudioData(d))
          .then(buf => { this.crankSounds[i] = buf; }));
      }
      await Promise.all(loads);
    }
    this.audioReady = true;
  }

  startSoundtrack() {
    if (!this.buffer) return;
    const a = this.spec.audio;
    const want = a.samples / a.rate;               // exact loop length in seconds
    const dur = this.buffer.duration;
    const src = this.ctxAudio.createBufferSource();
    src.buffer = this.buffer;
    src.loop = true;
    // The encoded stream is (seek padding + soundtrack); the decoder adds its own
    // priming samples. Trim to the exact original loop, clamped to what we got.
    let loopStart = (a.seek / a.rate) + Math.max(0, (dur - a.seek / a.rate - want) / 2);
    let loopEnd = loopStart + want;
    if (loopEnd > dur) { loopEnd = dur; loopStart = Math.max(0, dur - want); }
    src.loopStart = loopStart;
    src.loopEnd = loopEnd;
    src.connect(this.gain);
    src.start(0, loopStart);
    this.source = src;
    this.audioStartTime = this.ctxAudio.currentTime;
  }

  playCrankNote(i) {
    if (!this.crankSounds || !this.crankSounds[i]) return;
    const src = this.ctxAudio.createBufferSource();
    src.buffer = this.crankSounds[i];
    // pan = -50 + floor(i*100/(n-1)), Flash setPan units (-100..100)
    const pan = -50 + Math.floor(i * 100 / (this.spec.n - 1));
    if (this.ctxAudio.createStereoPanner) {
      const p = this.ctxAudio.createStereoPanner();
      p.pan.value = pan / 100;
      src.connect(p); p.connect(this.gain);
    } else {
      src.connect(this.gain);
    }
    src.start();
  }

  // ---- lifecycle ------------------------------------------------------------

  async start() {
    if (this.running) return;
    await this.initAudio();
    if (this.ctxAudio.state === 'suspended') await this.ctxAudio.resume();
    if (this.spec.audio) this.startSoundtrack();
    this.running = true;
    this.paused = false;
    this.elapsed = 0;
    this.startLoop();
  }

  startLoop() {
    this.lastFrame = null;
    const step = (ts) => {
      if (!this.running || this.paused) return;
      let dt = 0;
      if (this.lastFrame !== null) dt = Math.min(0.25, (ts - this.lastFrame) / 1000);
      this.lastFrame = ts;
      this.tick(dt);
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  // Suspending the AudioContext freezes ctxAudio.currentTime, so the visual
  // clock (derived from it) freezes in sync and resumes seamlessly.
  async pause() {
    if (!this.running || this.paused) return;
    this.paused = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.ctxAudio) await this.ctxAudio.suspend();
  }

  async resume() {
    if (!this.running || !this.paused) return;
    this.paused = false;
    if (this.ctxAudio) await this.ctxAudio.resume();
    this.startLoop();
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.source) { try { this.source.stop(); } catch (e) {} this.source = null; }
    if (this.ctxAudio) this.ctxAudio.suspend();
  }

  destroy() {
    this.stop();
    if (this.ctxAudio) { this.ctxAudio.close(); this.ctxAudio = null; }
  }

  // ---- per-frame ------------------------------------------------------------

  tick(dt) {
    const spec = this.spec;
    if (spec.mode === 'crank') {
      this.tickCrank(dt);
    } else {
      // Drive the visual clock from the audio clock when we have one, exactly
      // like the SWF drove both from t=0 (audio looped independently).
      if (this.ctxAudio && this.source) {
        this.elapsed = (this.ctxAudio.currentTime - this.audioStartTime) % spec.cycle;
      } else {
        this.elapsed = (this.elapsed + dt) % spec.cycle;
      }
    }
    this.drawFrame(dt);
  }

  tickCrank(dt) {
    const c = this.crank;
    if (!c.isRotating) {
      // momentum: angD *= 0.9 per frame (24 fps in the original)
      if (Math.abs(c.angD) > 0.01) {
        this.advanceCrank(c.angD * decayScale(dt));
        c.rotation += c.angD * decayScale(dt);
        c.angD *= Math.pow(0.9, dt * 24);
      }
    }
    // wrap
    if (this.elapsed >= this.spec.cycle) this.elapsed -= this.spec.cycle;
    if (this.elapsed < 0) this.elapsed += this.spec.cycle;
  }

  advanceCrank(angD) {
    this.elapsed += angD * 0.01;   // 100 degrees of crank = 1 second
    this.lastAngD = angD;
    this.checkCrankNotes(angD);
  }

  checkCrankNotes(angD) {
    // The original checks crossings inside onEnterFrame; we do it whenever the
    // crank advances. ad = frac(rotation/360) per tine; trigger when crossing
    // the zero line in the direction of cranking.
    const spec = this.spec;
    const t0 = this.elapsed * spec.n / spec.cycle * 360;
    const ti = t0 / spec.n;
    let t = t0;
    for (let i = 0; i < spec.n; i++) {
      const tine = this.tines[i];
      let ad = (t / 360) % 1; if (ad < 0) ad += 1;
      const side = ad > 0.5;
      if ((angD > 0 && tine.lastSide && ad < 0.5) ||
          (angD < 0 && !tine.lastSide && ad > 0.5)) {
        tine.haloVisible = true;
        tine.haloAlpha = 100;
        this.playCrankNote(i);
      }
      tine.lastSide = side;
      t -= ti;
    }
  }

  // ---- rendering ------------------------------------------------------------

  drawFrame(dt) {
    const dc = this.dc, spec = this.spec, n = spec.n;
    dc.setTransform(1, 0, 0, 1, 0, 0);
    dc.fillStyle = '#000';
    dc.fillRect(0, 0, this.W, this.H);

    const fade = Math.pow(0.95, dt * 24); // Flash's per-frame *=0.95 at 24 fps

    // --- background line(s), drawn behind the dots like _root graphics ---
    if (spec.mode === 'sonar') {
      const tr = this.elapsed * 2 * Math.PI / spec.cycle;
      // Flash renders line widths <=1 as full-color 1px hairlines
      dc.strokeStyle = '#55FF55';
      dc.lineWidth = 1;
      dc.beginPath();
      dc.moveTo(this.cx, this.cy);
      dc.lineTo(this.cx + this.cRad * Math.cos(tr), this.cy - this.cRad * Math.sin(tr));
      dc.stroke();
    } else if (spec.mode !== 'sweep') {
      // Flash renders line widths <=1 as full-color 1px hairlines; draw at a
      // half-pixel offset so the 1px line stays crisp instead of blurring.
      dc.strokeStyle = '#555555';
      dc.lineWidth = 1;
      dc.beginPath();
      if (spec.mode === 'stereo') dc.moveTo(0, this.cy + 0.5);
      else dc.moveTo(this.cx, this.cy + 0.5);
      dc.lineTo(this.W, this.cy + 0.5);
      dc.stroke();
    }

    // --- tine angles ---
    // Standard/stereo/sweep/crank: t = elapsed*(n/cycle)*360, tine j gets
    // t - j*(t/n)  (innermost fastest). Table mode: tine j gets
    // t1 * table[n-1-j] where t1 = elapsed*360/cycle (outermost slowest).
    const isTable = spec.mode === 'table';
    const t0 = isTable
      ? this.elapsed * 360 / spec.cycle
      : this.elapsed * (n / spec.cycle) * 360;
    const ti = t0 / n;

    for (let j = 0; j < n; j++) {
      const tine = this.tines[j];
      const deg = isTable ? t0 * spec.table[n - 1 - j] : t0 - j * ti;
      let ad = (deg / 360) % 1; if (ad < 0) ad += 1;

      // Dot position. Flash rotates a clip whose dot sits at (+len, 0), i.e.
      // angle 0 = 3 o'clock, increasing clockwise (y-down). The sweep variation
      // parks the dot at (0, -len): angle 0 = 12 o'clock.
      let theta = ad * 2 * Math.PI;
      let x, y;
      if (spec.mode === 'sweep') {
        x = this.cx + tine.len * Math.sin(theta);
        y = this.cy - tine.len * Math.cos(theta);
      } else {
        x = this.cx + tine.len * Math.cos(theta);
        y = this.cy + tine.len * Math.sin(theta);
      }

      // Halo state per mode
      if (spec.mode === 'standard' || spec.mode === 'stereo') {
        const inWindow = spec.mode === 'stereo'
          ? (ad < 0.1 || (ad >= 0.5 && ad < 0.6))
          : ad < 0.1;
        if (inWindow) {
          if (!tine.haloVisible) { tine.haloVisible = true; tine.haloAlpha = 100; }
          else tine.haloAlpha *= fade;
        } else tine.haloVisible = false;
      } else if (spec.mode === 'table') {
        tine.haloVisible = ad < 0.1;
        tine.haloAlpha = 100;
      } else if (spec.mode === 'sonar') {
        // note fires when the (clockwise) dot meets the (counterclockwise) sweep
        const played = Math.floor(this.elapsed / (spec.cycle / (n + 1 - j)));
        if (played !== tine.lastNotesPlayed) {
          tine.haloVisible = true; tine.haloAlpha = 100;
        } else if (tine.haloVisible) {
          tine.haloAlpha *= fade;
          if (tine.haloAlpha < 1) tine.haloVisible = false;
        }
        tine.lastNotesPlayed = played;
      } else if (spec.mode === 'sweep') {
        // triangular pulse peaking at ad=0.25 and 0.75 (the two stereo sides)
        tine.haloVisible = true;
        tine.haloAlpha = ad < 0.5
          ? 100 * (1 - 4 * Math.abs(ad - 0.25))
          : 100 * (1 - 4 * Math.abs(ad - 0.75));
      } else if (spec.mode === 'crank') {
        if (tine.haloVisible) {
          tine.haloAlpha *= fade;
          if (tine.haloAlpha < 0.5) tine.haloVisible = false;
        }
      }

      // Draw dot, then halo above it (Flash depth order: dot 1, outline 2)
      dc.fillStyle = cssColor(tine.color);
      dc.beginPath();
      dc.arc(x, y, tine.rad, 0, 2 * Math.PI);
      dc.fill();

      if (tine.haloVisible && tine.haloAlpha > 0.5) {
        if (spec.mode === 'sweep' && j === n - 4) {
          this.drawPumpkin(dc, x, y, tine.rad + 1);
        } else {
          dc.fillStyle = cssColor(tine.haloColor, tine.haloAlpha / 100);
          dc.beginPath();
          dc.arc(x, y, tine.rad + 1, 0, 2 * Math.PI);
          dc.fill();
        }
      }
    }

    if (spec.mode === 'crank') this.drawCrank(dc);
  }

  // The original attaches a small vector pumpkin sprite to tine n-4, kept
  // upright by counter-rotation. We draw an upright pumpkin at matching size.
  drawPumpkin(dc, x, y, rad) {
    const s = (rad + 1) * 2;
    dc.save();
    dc.font = `${s * 1.4}px serif`;
    dc.textAlign = 'center';
    dc.textBaseline = 'middle';
    dc.fillText('\u{1F383}', x, y);
    dc.restore();
  }

  drawCrank(dc) {
    const c = this.crank;
    dc.save();
    dc.translate(c.x, c.y);
    // wheel
    dc.strokeStyle = '#888';
    dc.lineWidth = 2;
    dc.beginPath();
    dc.arc(0, 0, c.wheelRad, 0, 2 * Math.PI);
    dc.stroke();
    dc.fillStyle = '#444';
    dc.beginPath();
    dc.arc(0, 0, 3, 0, 2 * Math.PI);
    dc.fill();
    // arm + knob
    dc.rotate(c.rotation * DEG);
    dc.strokeStyle = '#AAA';
    dc.lineWidth = 4;
    dc.lineCap = 'round';
    dc.beginPath();
    dc.moveTo(0, 0);
    dc.lineTo(c.armLen, 0);
    dc.stroke();
    dc.fillStyle = '#C33';
    dc.beginPath();
    dc.arc(c.armLen, 0, c.knobRad * 0.7, 0, 2 * Math.PI);
    dc.fill();
    dc.restore();
  }

  // ---- crank input ----------------------------------------------------------

  installCrankHandlers() {
    const canvas = this.canvas;
    const c = this.crank;
    const toLocal = (ev) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (ev.clientX - rect.left) * (this.W / rect.width),
        y: (ev.clientY - rect.top) * (this.H / rect.height),
      };
    };
    canvas.addEventListener('pointerdown', (ev) => {
      const p = toLocal(ev);
      const dx = p.x - c.x, dy = p.y - c.y;
      if (Math.hypot(dx, dy) <= c.armLen + c.knobRad + 10) {
        c.isRotating = true;
        c.oldAng = Math.atan2(dy, dx) * 180 / Math.PI;
        c.angD = 0;
        canvas.setPointerCapture(ev.pointerId);
      }
    });
    canvas.addEventListener('pointermove', (ev) => {
      if (!c.isRotating) return;
      const p = toLocal(ev);
      const ang = Math.atan2(p.y - c.y, p.x - c.x) * 180 / Math.PI;
      let angD = ang - c.oldAng;
      if (angD <= -180) angD += 360;
      else if (angD >= 180) angD -= 360;
      c.angD = angD;
      c.rotation = ang;
      c.oldAng = ang;
      this.advanceCrank(angD);
    });
    const release = () => { c.isRotating = false; };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
  }
}

function decayScale(dt) { return dt * 24; } // per-frame amounts at the SWF's 24 fps

// ---------------------------------------------------------------------------
// Page wiring
// ---------------------------------------------------------------------------

let player = null;

function currentVariation() {
  const m = /[?&]v=(\d+)/.exec(location.search);
  const v = m ? parseInt(m[1], 10) : 0;
  return VARIATIONS.find(s => s.v === v) || VARIATIONS[0];
}

function setPlayButton(label) {
  document.getElementById('playpause').textContent = label;
}

async function loadVariation(spec, autostart) {
  if (player) player.destroy();
  const canvas = document.getElementById('stage');
  player = new WhitneyPlayer(canvas, spec);
  window.whitneyPlayer = player;

  const label = `whitney music box var. ${spec.v} - ${spec.title}`;
  document.getElementById('title').textContent = label;
  document.title = label;
  for (const a of document.querySelectorAll('#nav a')) {
    a.className = (parseInt(a.dataset.v, 10) === spec.v) ? 'active' : '';
  }

  if (autostart) {
    await player.start();
    // If the browser refused to unlock audio (no valid gesture), load paused
    // with the play button ready.
    if (player.ctxAudio && player.ctxAudio.state === 'suspended') {
      player.stop();
      setPlayButton('▶');
    } else {
      setPlayButton('❚❚');
    }
  } else {
    setPlayButton('▶');
  }
}

function buildNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = '';
  for (const spec of VARIATIONS) {
    const a = document.createElement('a');
    a.href = '?v=' + spec.v;
    a.dataset.v = spec.v;
    a.textContent = `var. ${spec.v} - ${spec.title}`;
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      history.pushState(null, '', '?v=' + spec.v);
      loadVariation(spec, true);   // click gesture unlocks audio: start now
    });
    nav.appendChild(a);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  buildNav();
  loadVariation(currentVariation(), false);

  document.getElementById('playpause').addEventListener('click', async () => {
    if (!player.running) {           // fresh page or after a failed autostart
      await player.start();
      setPlayButton('❚❚');
    } else if (player.paused) {
      await player.resume();
      setPlayButton('❚❚');
    } else {
      await player.pause();
      setPlayButton('▶');
    }
  });
});

window.addEventListener('popstate', () => loadVariation(currentVariation(), true));
window.addEventListener('pagehide', () => { if (player) player.destroy(); });
