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

// Every original variation carries both its extracted soundtrack (audio) and a
// live-synth counterpart (synth) — the page offers them side by side. Voices
// and tunings are chosen to echo each variation's original character.
const VARIATIONS = [
  {v:0,  title:'chromatic - 48 tines',                    swf:'whitneyChromatic',   mode:'standard', n:48,  cycle:180, audio:{file:'whitneyChromatic.mp3',   samples:1984320, rate:11025, seek:1661},
   synth:{voice:'pluck', tuning:{type:'chromatic', base:36}}},
  {v:1,  title:'harmonics of 55hz',                       swf:'whitneyHarmonic',    mode:'standard', n:48,  cycle:180, audio:{file:'whitneyHarmonic.mp3',    samples:1984500, rate:11025, seek:1661},
   synth:{voice:'pure', tuning:{type:'harmonics', f0:55}}},
  {v:2,  title:'harmonics of 20hz',                       swf:'whitneyHarmonicLow', mode:'standard', n:48,  cycle:180, audio:{file:'whitneyHarmonicLow.mp3', samples:1984500, rate:11025, seek:1661},
   synth:{voice:'pure', tuning:{type:'harmonics', f0:20}}},
  {v:3,  title:'harmonics of 48hz, reversed',             swf:'whitneyHarmonicRev48', mode:'standard', n:48, cycle:180, audio:{file:'whitneyHarmonicRev48.mp3', samples:1984500, rate:11025, seek:1661},
   synth:{voice:'pure', tuning:{type:'harmonics', f0:48, reverse:true}}},
  {v:4,  title:'harmonics of 48hz, palindrome',           swf:'whitneyPalindrome',  mode:'standard', n:48,  cycle:180, audio:{file:'whitneyPalindrome.mp3',  samples:1984500, rate:11025, seek:1661},
   synth:{voice:'pure', tuning:{type:'harmonics', f0:48, palindrome:true}}},
  {v:5,  title:'chromatic - 88 tines',                    swf:'whitney88',          mode:'standard', n:88,  cycle:180, audio:{file:'whitney88.mp3',          samples:1984500, rate:11025, seek:1661},
   synth:{voice:'pluck', tuning:{type:'chromatic', base:21}}},
  {v:6,  title:'microtones',                              swf:'whitneyMTones',      mode:'standard', n:48,  cycle:180, audio:{file:'whitneyMTones.mp3',      samples:1984500, rate:11025, seek:1661},
   synth:{voice:'pure', tuning:{type:'microtones', fLow:220, octaves:2}}},
  {v:7,  title:'harmonics - 120 tines, reversed',         swf:'whitney120',         mode:'standard', n:120, cycle:180, audio:{file:'whitney120.mp3',         samples:1987200, rate:11025, seek:0},
   synth:{voice:'pure', tuning:{type:'harmonics', f0:16, reverse:true}}},
  {v:8,  title:'chromatic - 88 organ pipes, rev.',        swf:'whitney88b3',        mode:'standard', n:88,  cycle:180, audio:{file:'whitney88b3.mp3',        samples:1967776, rate:11025, seek:1661},
   synth:{voice:'organ', tuning:{type:'chromatic', base:21, reverse:true}}},
  {v:9,  title:'chromatic - 88 bars, rev.',               swf:'whitney88bars',      mode:'standard', n:88,  cycle:180, audio:{file:'whitney88bars.mp3',      samples:1967586, rate:11025, seek:1661},
   synth:{voice:'bell', tuning:{type:'chromatic', base:21, reverse:true}}},
  {v:10, title:'chromatic - 64 pipe crypto calliope',     swf:'whitney64Calliope',  mode:'standard', n:64,  cycle:180, audio:{file:'whitney64Calliope.mp3',  samples:1961244, rate:11025, seek:1661},
   synth:{voice:'organ', tuning:{type:'chromatic', base:36}}},
  {v:11, title:'minute waltz - 60 keys, 60 seconds',      swf:'whitneyMinute',      mode:'standard', n:60,  cycle:60,  audio:{file:'whitneyMinute.mp3',      samples:661831,  rate:11025, seek:1661},
   synth:{voice:'pluck', tuning:{type:'chromatic', base:24}}},
  {v:12, title:'chromatic - prime numbers only',          swf:'whitneyPrimes',      mode:'table',    n:48,  cycle:180, table:PRIMES,    audio:{file:'whitneyPrimes.mp3',    samples:1984320, rate:11025, seek:1661},
   synth:{voice:'pluck', tuning:{type:'chromatic', base:36}}},
  {v:13, title:'chromatic - non-primes only',             swf:'whitneyNonPrimes',   mode:'table',    n:48,  cycle:180, table:NONPRIMES, audio:{file:'whitneyNonPrimes.mp3', samples:1984320, rate:11025, seek:1661},
   synth:{voice:'pluck', tuning:{type:'chromatic', base:36}}},
  {v:14, title:'stereo',                                  swf:'whitneyStereo',      mode:'stereo',   n:48,  cycle:180, audio:{file:'whitneyStereo.mp3',      samples:1984500, rate:11025, seek:1670},
   synth:{voice:'pluck', tuning:{type:'chromatic', base:36}}},
  {v:15, title:'stereo - 120',                            swf:'whitneyStereo120',   mode:'stereo',   n:120, cycle:180, audio:{file:'whitneyStereo120.mp3',   samples:1984500, rate:11025, seek:1670},
   synth:{voice:'pure', tuning:{type:'harmonics', f0:16}}},
  {v:16, title:'stereo - 210',                            swf:'whitneyStereo210',   mode:'stereo',   n:210, cycle:180, audio:{file:'whitneyStereo210.mp3',   samples:1984500, rate:11025, seek:1670},
   synth:{voice:'pure', tuning:{type:'harmonics', f0:8}}},
  // The crank never had a soundtrack — it triggers its 25 embedded reed
  // samples interactively. Its "synth" twin swaps those for a synthesized
  // reed voice; same tuning (reed_60..84 = midi 60..84, lowest inside).
  {v:17, title:'hand cranked',                            swf:'whitneyCrank',       mode:'crank',    n:25,  cycle:60,
   synth:{voice:'reedsynth', tuning:{type:'chromatic', base:60, reverse:true}}},
  {v:18, title:'stereo drone (new)',                      swf:'whitneyStereoSweep', mode:'sweep',    n:50,  cycle:180, audio:{file:'whitneyStereoSweep.mp3', samples:1984500, rate:11025, seek:1670},
   synth:{voice:'pad', tuning:{type:'harmonics', f0:55}}},
  {v:19, title:'stereo sonar (new)',                      swf:'whitneySonar',       mode:'sonar',    n:48,  cycle:180, audio:{file:'whitneySonar.mp3',       samples:1984500, rate:11025, seek:1670},
   synth:{voice:'pure', tuning:{type:'chromatic', base:45}}},
  {v:20, title:'bell carol (new)',                        swf:'whitneyCarol',       mode:'standard', n:48,  cycle:180, audio:{file:'whitneyCarol.mp3',       samples:3969000, rate:22050, seek:1681},
   synth:{voice:'bell', tuning:{type:'chromatic', base:48}}},

  // --- new variations: synth-only, no 2006 counterpart ----------------------
  {v:21, group:'new variations — synth only', title:'bells - pentatonic - 25 tines', mode:'standard', n:25, cycle:120,
   synth:{voice:'bell', tuning:{type:'pentatonic', base:48}}},
  {v:22, group:'new variations — synth only', title:'reed organ - 25 tines', mode:'standard', n:25, cycle:60,
   synth:{voice:'reed', tuning:{type:'chromatic', base:60}}},

  // --- Digital Harmony reconstructions: Paul Rother's programs from the
  // appendix of John Whitney's book (1980), via Jim Bumgardner's Processing
  // transcriptions, given the music-box treatment (the book versions were
  // visuals-only). spec.plugin supplies the drawing and note events; spec.n
  // is the number of VOICES (columnBC/arabesque voice a subset of the dots).
  // Visual treatment matches the classic variations: a gray hairline where
  // notes strike, and each voiced dot brightens for its note's duration.
  {v:23, group:'digital harmony (1980) — the book\'s programs, music-boxed', title:'column A - 60 falling columns', mode:'plugin', n:59, cycle:90,
   blurb:'60 columns · 1:30 cycle · column k falls k times per cycle, sounding as it wraps past the top line · diagonal waves form and dissolve as columns align',
   synth:{voice:'pluck', tuning:{type:'chromatic', base:28, reverse:true}},
   plugin:{
     fade:'classic',   // or 'noteDur': dot glows for its note's audible length
     draw(p, dc) {
       const cycle = p.spec.cycle, step = p.elapsed / cycle;
       const x0 = 50, w = 400, y0 = 50, h = 400;
       // strike line: dots sound as they wrap back to the top
       dc.strokeStyle = '#555555'; dc.lineWidth = 1;
       dc.beginPath();
       dc.moveTo(x0 - 8, y0 + 0.5); dc.lineTo(x0 + w + 8, y0 + 0.5);
       dc.stroke();
       for (let i = 0; i < 60; i++) {
         const x = x0 + w * i / 60;
         const y = y0 + ((h * i * step) % h);
         const b = i > 0 ? p.dhBrightness((i * step) % 1, cycle / i, i - 1) : 0;
         // classic speed scale: fastest = getColor(0), 2px; slower = bigger
         const u = (59 - i) / 60;
         dc.fillStyle = lerpWhite(getColor(u), b);
         dc.beginPath();
         dc.arc(x, y, Math.max(2, u * 8) + 2 * b, 0, 2 * Math.PI);
         dc.fill();
       }
     },
     // voice j = column j+1, which wraps j+1 times per cycle
     events(p, j) {
       return {period: p.spec.cycle / (j + 1), offsets: [{frac: 0, pan: null}], k0: 1};
     },
   }},
  {v:24, group:'digital harmony (1980) — the book\'s programs, music-boxed', title:'column BC - the music box\'s ancestor', mode:'plugin', n:359, cycle:540,
   // ALL 359 dots voiced. Unlike the first all-voiced attempt (freq = speed
   // x 16 Hz, which pushed fast voices into tapered-to-silence treble), all
   // voices sit in a strong audible band: microtones across 165-930 Hz.
   // Short, present pings — at ~120 notes/s they fuse into a granular
   // stream, so congruence is "flash activity = sound activity".
   blurb:'360 dots on a spiral · 9:00 cycle · dot k orbits k times per cycle, sounding at the gray line — ~120 notes/s fuse into a granular stream that thickens and thins with the spiral\'s windings',
   synth:{voice:'pure', tuning:{type:'microtones', fLow:165, octaves:2.5, reverse:true}, velScale:0.6, durScale:0.35},
   plugin:{
     fade:'classic',   // or 'noteDur': dot glows for its note's audible length
     draw(p, dc) {
       const cycle = p.spec.cycle, step = p.elapsed / cycle;
       const cx = 250, cy = 250, R = 225;
       // strike line: center to 3 o'clock, like the music box
       dc.strokeStyle = '#555555'; dc.lineWidth = 1;
       dc.beginPath();
       dc.moveTo(cx, cy + 0.5); dc.lineTo(cx + R + 10, cy + 0.5);
       dc.stroke();
       for (let i = 0; i < 360; i++) {
         const a = 2 * Math.PI * step * i;
         const rad = (i / 360) * R;
         const b = i > 0 ? p.dhBrightness((step * i) % 1, cycle / i, i - 1) : 0;
         const u = (359 - i) / 360;
         dc.fillStyle = lerpWhite(getColor(u), b);
         dc.beginPath();
         dc.arc(cx + Math.cos(a) * rad, cy - Math.sin(a) * rad,
                Math.max(2, u * 8) + 2 * b, 0, 2 * Math.PI);
         dc.fill();
       }
     },
     // voice j = dot j+1, crossing the line j+1 times per cycle; k0=0 opens
     // with the grand-alignment chord like the classic variations
     events(p, j) {
       return {period: p.spec.cycle / (j + 1), offsets: [{frac: 0, pan: null}], k0: 0};
     },
   }},
  {v:25, group:'digital harmony (1980) — the book\'s programs, music-boxed', title:'arabesque', mode:'plugin', n:359, cycle:720,
   // every dot voiced: ~1-cent microtonal steps, quiet short plucks
   blurb:'360 dots on sine-spaced rows · 12:00 cycle · dot k drifts across and wraps k times per cycle, sounding at the left line · the curtain shears into arcs as speeds diverge',
   synth:{voice:'pluck', tuning:{type:'microtones', fLow:220, octaves:3, reverse:true}, velScale:0.3, durScale:0.5},
   plugin:{
     fade:'classic',   // or 'noteDur': dot glows for its note's audible length
     draw(p, dc) {
       const cycle = p.spec.cycle, step = p.elapsed / cycle;
       const cy = 250, R = 220, r3 = R * 3, xw = 20;
       // strike line: the wrap boundary, where dots re-enter from the left
       dc.strokeStyle = '#555555'; dc.lineWidth = 1;
       dc.beginPath();
       dc.moveTo(xw + 0.5, cy - R - 8); dc.lineTo(xw + 0.5, cy + R + 8);
       dc.stroke();
       for (let i = 0; i < 360; i++) {
         const ratio = i / 360;
         const a = (-90 + 360 * ratio) * DEG;
         const x = Math.cos(a) * ratio + i * step * r3;
         const ix = xw + (((x % r3) + r3) % r3);
         const iy = cy + Math.sin(a) * R;
         if (ix > 504) continue;
         const b = i > 0 ? p.dhBrightness(((x / r3) % 1 + 1) % 1, cycle / i, i - 1) : 0;
         const u = (359 - i) / 360;
         dc.fillStyle = lerpWhite(getColor(u), b);
         dc.beginPath();
         dc.arc(ix, iy, Math.max(2, u * 8) + 2 * b, 0, 2 * Math.PI);
         dc.fill();
       }
     },
     // voice j = dot j+1; its x wraps each time i*step passes an integer;
     // k0=0 opens with the grand-alignment chord like the classic variations
     events(p, j) {
       return {period: p.spec.cycle / (j + 1), offsets: [{frac: 0, pan: null}], k0: 0};
     },
   }},
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

// Blend a packed-int color toward white (t = 0 none, 1 full white).
// Used by the Digital Harmony plugins for the "note ringing" treatment.
function lerpWhite(rgb, t) {
  const r = (rgb >> 16) & 0xFF, g = (rgb >> 8) & 0xFF, b = rgb & 0xFF;
  return `rgb(${Math.round(r + (255 - r) * t)},${Math.round(g + (255 - g) * t)},${Math.round(b + (255 - b) * t)})`;
}

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

    if (this.spec.synth) {
      // Master chain for generated notes: gain -> compressor -> destination.
      // The compressor tames the grand-alignment chord (all tines at t=0).
      const comp = this.ctxAudio.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      this.gain.disconnect();
      this.gain.connect(comp);
      // Master level AFTER the compressor — the compressor's 4:1 ratio and
      // auto makeup gain largely cancel pre-compressor level changes, so
      // overall variation loudness must be set here (spec.synth.master).
      const master = this.ctxAudio.createGain();
      master.gain.value = this.spec.synth.master || 1;
      comp.connect(master);
      master.connect(this.ctxAudio.destination);
      this.gain.gain.value = 0.6;
      if (this.spec.synth.voice === 'reed') await this.loadReeds();
    } else if (this.spec.audio) {
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
    // pan = -50 + floor(i*100/(n-1)), Flash setPan units (-100..100)
    const pan = (-50 + Math.floor(i * 100 / (this.spec.n - 1))) / 100;
    if (this.spec.synth) {
      this.playSynthNote(i, this.ctxAudio.currentTime, pan);
      return;
    }
    if (!this.crankSounds || !this.crankSounds[i]) return;
    const src = this.ctxAudio.createBufferSource();
    src.buffer = this.crankSounds[i];
    if (this.ctxAudio.createStereoPanner) {
      const p = this.ctxAudio.createStereoPanner();
      p.pan.value = pan;
      src.connect(p); p.connect(this.gain);
    } else {
      src.connect(this.gain);
    }
    src.start();
  }

  // ---- live synth -----------------------------------------------------------

  async loadReeds() {
    // Reed samples extracted from whitneyCrank.swf: reed_60..reed_84 (midi 60-84)
    this.reedBuffers = {};
    const loads = [];
    for (let midi = 60; midi <= 84; midi++) {
      loads.push(fetch(`audio/whitneyCrank_reed_${midi}.mp3`)
        .then(r => r.arrayBuffer())
        .then(d => this.ctxAudio.decodeAudioData(d))
        .then(buf => { this.reedBuffers[midi] = buf; }));
    }
    await Promise.all(loads);
  }

  // Pitch for tine j (0 = innermost/fastest). By default the innermost tine is
  // highest, matching the originals; tuning.reverse flips that ("reversed"
  // variations), tuning.palindrome folds the range (up then back down).
  tineFreq(j) {
    const n = this.spec.n;
    const t = this.spec.synth.tuning;
    let idx = t.reverse ? j : n - 1 - j;    // pitch rank, 0 = lowest
    if (t.palindrome) {
      const s = idx + 1;
      idx = (s <= n / 2 ? s : n + 1 - s) - 1;
    }
    if (t.type === 'harmonics') return t.f0 * (idx + 1);
    if (t.type === 'microtones') {
      return t.fLow * Math.pow(2, t.octaves * idx / (n - 1));
    }
    let midi;
    if (t.type === 'pentatonic') {
      const deg = [0, 2, 4, 7, 9];
      midi = t.base + 12 * Math.floor(idx / 5) + deg[idx % 5];
    } else {                                // chromatic
      midi = t.base + idx;
    }
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Trigger pattern for tine j, derived from the variation's visual mode:
  //  standard/table: one note per revolution, at the zero-line crossing
  //  stereo: both crossings (0° right / 180° left), hard-panned
  //  sweep: the two side crossings (dots start at 12 o'clock), panned swells
  //  sonar: when the dot meets the counter-rotating sweep line (rate n+1-j)
  tineEvents(j) {
    const spec = this.spec, n = spec.n;
    if (spec.plugin && spec.plugin.events) return spec.plugin.events(this, j);
    let revsPerCycle = n - j;
    let k0 = 0;
    let offsets = [{frac: 0, pan: null}];
    if (spec.mode === 'table') revsPerCycle = spec.table[n - 1 - j];
    else if (spec.mode === 'sonar') { revsPerCycle = n + 1 - j; k0 = 1; }
    else if (spec.mode === 'stereo') offsets = [{frac: 0, pan: 0.8}, {frac: 0.5, pan: -0.8}];
    else if (spec.mode === 'sweep') offsets = [{frac: 0.25, pan: 0.7}, {frac: 0.75, pan: -0.7}];
    return {period: spec.cycle / revsPerCycle, offsets, k0};
  }

  // Schedule all notes falling inside the lookahead window.
  scheduleSynth() {
    const spec = this.spec, n = spec.n;
    // Lookahead long enough to ride out background-tab timer throttling
    // (interval clamps to ~1s when the tab is hidden; audio keeps playing).
    const horizon = this.ctxAudio.currentTime + 3.0;
    for (let j = 0; j < n; j++) {
      const ev = this.tineEvents(j);
      const per = ev.offsets.length;
      let k = this.schedK[j];
      for (;;) {
        const off = ev.offsets[k % per];
        const t = this.audioStartTime +
          (Math.floor(k / per) + off.frac + ev.k0) * ev.period;
        if (t >= horizon) break;
        this.playSynthNote(j, t, off.pan);
        k++;
      }
      this.schedK[j] = k;
    }
  }

  playSynthNote(j, when, panOverride) {
    const ctx = this.ctxAudio, n = this.spec.n;
    const freq = this.tineFreq(j);
    if (!isFinite(freq) || freq < 16 || freq > 9000) return;  // audible range only
    // 0 = fastest voice, 1 = slowest (slow notes ring louder and longer).
    // Standard modes: j=0 is the innermost/fastest tine. Plugin variations
    // order voices slowest-first, so invert.
    let outer = n > 1 ? j / (n - 1) : 0;
    if (this.spec.mode === 'plugin') outer = 1 - outer;
    // Outer (slow, low) notes are louder and ring longer, like the originals.
    // Dense variations (many tines / table speeds) are scaled down to keep
    // the mix and the CPU sane.
    let vel = (0.25 + 0.55 * outer) * Math.min(1, Math.sqrt(60 / n));
    if (this.spec.mode === 'table') vel *= 0.6;
    if (this.spec.synth.velScale) vel *= this.spec.synth.velScale;
    const env = ctx.createGain();
    env.gain.value = 0;
    let out = env;
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = panOverride !== null && panOverride !== undefined
        ? panOverride
        : -0.3 + 0.6 * outer;
      env.connect(p);
      out = p;
    }
    out.connect(this.gain);
    const voice = this.spec.synth.voice;
    const dur = this.noteDur(j);
    if (voice === 'reed') this.voiceReed(env, freq, when, vel);
    else if (voice === 'reedsynth') this.voiceReedSynth(env, freq, when, vel + 0.3, dur);
    else if (voice === 'pure') this.voicePure(env, freq, when, vel, dur);
    else if (voice === 'bell') this.voiceBell(env, freq, when, vel, dur);
    else if (voice === 'organ') this.voiceOrgan(env, freq, when, vel, dur);
    else if (voice === 'pad') this.voicePad(env, freq, when, vel, this.tineEvents(j).period);
    else this.voicePluck(env, freq, when, vel, dur);
  }

  // Audible length of voice j's note — also used by plugin visuals so a dot
  // stays bright for exactly as long as its note rings (noteDur fade mode).
  noteDur(j) {
    const n = this.spec.n;
    let outer = n > 1 ? j / (n - 1) : 0;
    if (this.spec.mode === 'plugin') outer = 1 - outer;
    let dur;
    switch (this.spec.synth.voice) {
      case 'pure':      dur = 0.9 + 4.1 * outer; break;
      case 'bell':      dur = 0.6 + 3.4 * outer; break;
      case 'organ':     dur = 0.4 + 1.6 * outer; break;
      case 'reedsynth': dur = 1 + 4 * outer; break;
      default:          dur = 0.7 + 3.3 * outer;  // pluck
    }
    return dur * (this.spec.synth.durScale || 1);
  }

  // Dot brightness for plugin variations, 0..1. frac = phase since the strike
  // (0..1 of the dot's period), period in seconds, voiceJ = voice index.
  // 'classic' reproduces vars 0-22: visible for the first 10% of the
  // revolution, alpha decaying x0.95/frame at 24 fps (stateless equivalent).
  // 'noteDur' fades linearly over the note's audible length.
  dhBrightness(frac, period, voiceJ) {
    const tSince = frac * period;
    if (this.spec.plugin.fade === 'noteDur') {
      return Math.max(0, 1 - tSince / this.noteDur(voiceJ));
    }
    return frac < 0.1 ? Math.pow(0.95, tSince * 24) : 0;
  }

  envelope(env, when, peak, dur) {
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(peak, when + 0.006);
    env.gain.exponentialRampToValueAtTime(0.001, when + dur);
  }

  voicePure(env, freq, when, vel, dur) {
    const ctx = this.ctxAudio;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(env);
    // mellow: soft attack (no click) and gentle treble taper so high
    // harmonics don't pierce
    const peak = vel * (2500 / (2500 + freq));
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(peak, when + 0.03);
    env.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.start(when); osc.stop(when + dur + 0.05);
  }

  voicePluck(env, freq, when, vel, dur) {
    const ctx = this.ctxAudio;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 1;
    lp.frequency.setValueAtTime(Math.min(freq * 6, 12000), when);
    lp.frequency.exponentialRampToValueAtTime(Math.max(freq, 200), when + dur);
    osc.connect(lp); lp.connect(env);
    this.envelope(env, when, vel * 0.8, dur);
    osc.start(when); osc.stop(when + dur + 0.05);
  }

  voiceBell(env, freq, when, vel, dur) {
    const ctx = this.ctxAudio;
    // fundamental + inharmonic partial, both decaying — a simple bell
    for (const [mult, amp, d] of [[1, 1, dur], [2.756, 0.4, dur * 0.6], [5.404, 0.15, dur * 0.3]]) {
      if (freq * mult > 11000) continue;  // keep partials well below Nyquist
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(vel * amp * 0.6, when + 0.004);
      g.gain.exponentialRampToValueAtTime(0.001, when + d);
      osc.connect(g); g.connect(env);
      osc.start(when); osc.stop(when + d + 0.05);
    }
    env.gain.value = 1;  // per-partial envelopes above; bypass the shared one
  }

  voiceOrgan(env, freq, when, vel, dur) {
    const ctx = this.ctxAudio;
    // pipe-ish additive tone: fundamental + octave + a whisper of the twelfth
    for (const [mult, amp] of [[1, 1], [2, 0.35], [3, 0.12]]) {
      if (freq * mult > 11000) continue;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.value = amp;
      osc.connect(g); g.connect(env);
      osc.start(when); osc.stop(when + dur + 0.1);
    }
    // soft chiff attack, sustained body, quick release
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(vel * 0.7, when + 0.03);
    env.gain.setValueAtTime(vel * 0.7, when + dur * 0.8);
    env.gain.linearRampToValueAtTime(0, when + dur);
  }

  voicePad(env, freq, when, vel, period) {
    const ctx = this.ctxAudio;
    // slow swell used by the drone variation: rises into the side crossing
    // and falls away, overlapping the next swell for a continuous drone
    const dur = Math.min(Math.max(period * 0.9, 1.2), 6);
    const attack = dur * 0.45;
    // swell starts before the crossing so it peaks AT the crossing
    const t0 = Math.max(ctx.currentTime, when - attack);
    for (const [mult, amp] of [[1, 1], [2, 0.2]]) {
      if (freq * mult > 11000) continue;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.value = amp;
      osc.connect(g); g.connect(env);
      osc.start(t0); osc.stop(when + dur);
    }
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(vel * 0.5, when);
    env.gain.linearRampToValueAtTime(0, when + dur * 0.55);
  }

  voiceReedSynth(env, freq, when, vel, dur) {
    const ctx = this.ctxAudio;
    // harmonium-ish reed: two slightly detuned saws through a lowpass,
    // durations mirroring the original samples (1s inner .. 5s outer)
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(freq * 5, 8000);
    lp.Q.value = 1.5;
    lp.connect(env);
    for (const detune of [0, 6]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(lp);
      osc.start(when); osc.stop(when + dur + 0.1);
    }
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(vel * 0.35, when + 0.025);
    env.gain.exponentialRampToValueAtTime(0.001, when + dur);
  }

  voiceReed(env, freq, when, vel) {
    const ctx = this.ctxAudio;
    const midi = Math.round(69 + 12 * Math.log2(freq / 440));
    // nearest available sample, pitch-shifted the remaining distance
    const sampleMidi = Math.max(60, Math.min(84, midi));
    const buf = this.reedBuffers && this.reedBuffers[sampleMidi];
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = Math.pow(2, (midi - sampleMidi) / 12);
    src.connect(env);
    env.gain.setValueAtTime(vel + 0.3, when);
    src.start(when);
  }

  // ---- lifecycle ------------------------------------------------------------

  async start() {
    if (this.running) return;
    await this.initAudio();
    if (this.ctxAudio.state === 'suspended') await this.ctxAudio.resume();
    if (this.spec.audio) this.startSoundtrack();
    if (this.spec.synth && this.spec.mode !== 'crank') {
      // Small pre-roll so the first grand-alignment chord isn't clipped.
      // (The crank is event-driven — no scheduler.)
      this.audioStartTime = this.ctxAudio.currentTime + 0.15;
      this.schedK = new Array(this.spec.n).fill(0);
      this.startSynthTimer();
    }
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

  // The scheduler runs on its own timer (not rAF) so hidden tabs keep playing.
  startSynthTimer() {
    this.stopSynthTimer();
    this.synthTimer = setInterval(() => {
      if (this.running && !this.paused) this.scheduleSynth();
    }, 250);
  }

  stopSynthTimer() {
    if (this.synthTimer) { clearInterval(this.synthTimer); this.synthTimer = null; }
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
    this.stopSynthTimer();
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
    } else if (spec.synth && this.ctxAudio) {
      // Notes are scheduled on the audio clock; visuals follow the same clock,
      // so a triggered note and its halo flash coincide exactly.
      this.scheduleSynth();
      this.elapsed = Math.max(0, this.ctxAudio.currentTime - this.audioStartTime) % spec.cycle;
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

    if (spec.mode === 'plugin') {
      spec.plugin.draw(this, dc);
      return;
    }

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

// ---------------------------------------------------------------------------
// Human-readable parameter readouts, generated from the manifest
// ---------------------------------------------------------------------------

function noteName(midi) {
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  return names[midi % 12] + (Math.floor(midi / 12) - 1);
}

function fmtCycle(s) {
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function describeTuning(spec) {
  const t = spec.synth.tuning, n = spec.n;
  const inside = t.reverse ? 'lowest inside' : 'highest inside';
  if (t.type === 'harmonics') {
    let s = `frequency = speed × ${t.f0} Hz (the harmonic series of ${t.f0} Hz)`;
    if (t.palindrome) s += ', rising to the middle tine then falling';
    return s;
  }
  if (t.type === 'microtones') {
    const step = Math.round(1200 * t.octaves / (n - 1));
    return `${t.octaves} octaves split into ${n - 1} equal microtone steps (~${step} cents), ${inside}`;
  }
  if (t.type === 'pentatonic') {
    return `pentatonic scale from ${noteName(t.base)}, ${inside}`;
  }
  return `chromatic, one semitone per tine: ${noteName(t.base)}–${noteName(t.base + n - 1)}, ${inside}`;
}

function describeMotion(spec) {
  const base = `${spec.n} tines · ${fmtCycle(spec.cycle)} cycle`;
  switch (spec.mode) {
    case 'table': {
      const t = spec.table.slice(0, spec.n);
      const kind = spec.v === 12 ? 'prime numbers' : 'composite numbers';
      return `${base} · tine speeds are ${kind}: ${t[t.length - 1]} revs/cycle innermost down to ${t[0]} outermost · each tine sounds as it crosses the gray line`;
    }
    case 'stereo':
      return `${base} · innermost tine spins ${spec.n} revs/cycle, outermost 1 · notes fire at BOTH line crossings — right side pans right, left side pans left`;
    case 'sweep':
      return `${base} · dots start at 12 o'clock; they pulse and sound at the 3 and 9 o'clock crossings, panned to their side · no strike line`;
    case 'sonar':
      return `${base} · the green line sweeps counterclockwise while dots orbit clockwise — a dot sounds when it meets the moving line`;
    case 'crank':
      return `${base} · you are the motor: drag the crank (100° of crank = 1 second of box time, momentum carries it) · tines sound crossing the line in your cranking direction`;
    default:
      return `${base} · innermost tine spins ${spec.n} revs/cycle, outermost 1 — each sounds as it crosses the gray line · all tines realign once per cycle`;
  }
}

function describeSound(spec, useSynth) {
  if (spec.mode === 'crank') {
    return useSynth
      ? 'sound: synthesized reeds (detuned saws through a lowpass), C4–C6 lowest inside, panned across the wheel'
      : 'sound: the original 25 reed samples embedded in the 2006 SWF (C4–C6), panned across the wheel';
  }
  if (!useSynth) {
    return 'sound: the original 2006 soundtrack, extracted byte-for-byte from the SWF (11 kHz mp3), gaplessly looped';
  }
  return `sound: live Web Audio — ${spec.synth.voice} voice · ${describeTuning(spec)}`;
}

function describeVariation(spec, useSynth) {
  const motion = spec.plugin && spec.blurb ? spec.blurb : describeMotion(spec);
  return [motion, describeSound(spec, useSynth)];
}

function currentVariation() {
  const m = /[?&]v=(\d+)/.exec(location.search);
  const v = m ? parseInt(m[1], 10) : 0;
  const spec = VARIATIONS.find(s => s.v === v) || VARIATIONS[0];
  let useSynth = /[?&]synth=1/.test(location.search);
  if (!spec.synth) useSynth = false;
  // synth-only variations (the crank is sample-based, not synth-only)
  if (!spec.audio && spec.synth && spec.mode !== 'crank') useSynth = true;
  return {spec, useSynth};
}

function setPlayButton(label) {
  document.getElementById('playpause').textContent = label;
}

// The manifest entry carries both audio (mp3) and synth specs; the player gets
// an effective spec with only the selected sound source.
function effectiveSpec(spec, useSynth) {
  return {...spec,
    audio: useSynth ? null : spec.audio,
    synth: useSynth ? spec.synth : null};
}

async function loadVariation(spec, useSynth, autostart) {
  if (player) player.destroy();
  const canvas = document.getElementById('stage');
  player = new WhitneyPlayer(canvas, effectiveSpec(spec, useSynth));
  window.whitneyPlayer = player;

  const kind = useSynth ? ' (synth)' : '';
  const label = `whitney music box var. ${spec.v} - ${spec.title}${kind}`;
  document.getElementById('title').textContent = label;
  document.title = label;
  document.getElementById('info').innerHTML =
    describeVariation(spec, useSynth).map(l => `<div>${l}</div>`).join('');
  for (const a of document.querySelectorAll('#nav a[data-v]')) {
    a.classList.toggle('active',
      parseInt(a.dataset.v, 10) === spec.v &&
      (a.dataset.kind === undefined || (a.dataset.kind === 'synth') === useSynth));
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

function navLink(spec, useSynth, text, kind) {
  const a = document.createElement('a');
  a.href = '?v=' + spec.v + (useSynth ? '&synth=1' : '');
  a.dataset.v = spec.v;
  if (kind) a.dataset.kind = kind;
  a.textContent = text;
  a.title = describeVariation(spec, useSynth).join('\n');
  a.addEventListener('click', (ev) => {
    ev.preventDefault();
    history.pushState(null, '', a.getAttribute('href'));
    loadVariation(spec, useSynth, true);  // click gesture unlocks audio
  });
  return a;
}

function buildNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = '';
  let lastGroup;
  for (const spec of VARIATIONS) {
    if (spec.group && spec.group !== lastGroup) {
      const h = document.createElement('div');
      h.className = 'navgroup';
      h.textContent = spec.group;
      nav.appendChild(h);
      lastGroup = spec.group;
    }
    const row = document.createElement('div');
    row.className = 'navrow';
    const title = document.createElement('span');
    title.className = 'navtitle';
    title.textContent = `var. ${spec.v} - ${spec.title}`;
    row.appendChild(title);
    const picks = document.createElement('span');
    picks.className = 'navpicks';
    if (spec.mode === 'crank') {
      picks.appendChild(navLink(spec, false, 'wavs', 'mp3'));
      picks.appendChild(navLink(spec, true, 'synth', 'synth'));
    } else {
      if (spec.audio) {
        picks.appendChild(navLink(spec, false, 'mp3', 'mp3'));
      }
      if (spec.synth) {
        picks.appendChild(navLink(spec, true, 'synth', 'synth'));
      }
    }
    row.appendChild(picks);
    nav.appendChild(row);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  buildNav();
  const cur = currentVariation();
  loadVariation(cur.spec, cur.useSynth, false);

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

window.addEventListener('popstate', () => {
  const cur = currentVariation();
  loadVariation(cur.spec, cur.useSynth, true);
});
window.addEventListener('pagehide', () => { if (player) player.destroy(); });
