/**
 * AmbientMixer — Web Audio API-based ambient sound generator.
 * Generates all sounds procedurally using oscillators, noise buffers, and filters.
 * No external audio files needed.
 */

export interface SoundConfig {
  id: string
  label: string
  color: string
}

export const SOUND_CONFIGS: SoundConfig[] = [
  { id: 'rain', label: 'Rain', color: '#00f0ff' },
  { id: 'ocean', label: 'Ocean Waves', color: '#0ea5e9' },
  { id: 'fireplace', label: 'Fireplace', color: '#f59e0b' },
  { id: 'forest', label: 'Forest', color: '#22c55e' },
  { id: 'coffee', label: 'Coffee Shop', color: '#a16207' },
  { id: 'wind', label: 'Wind', color: '#94a3b8' },
  { id: 'thunder', label: 'Thunder', color: '#6366f1' },
  { id: 'night', label: 'Night', color: '#a855f7' },
]

interface SoundNodes {
  gain: GainNode
  sources: (AudioBufferSourceNode | OscillatorNode)[]
  intervals: ReturnType<typeof setInterval>[]
  timeouts: ReturnType<typeof setTimeout>[]
  lfo?: OscillatorNode
  lfoGain?: GainNode
}

class AmbientMixer {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private sounds: Map<string, SoundNodes> = new Map()
  private volumes: Map<string, number> = new Map()
  private active: Map<string, boolean> = new Map()
  private masterVolume = 0.5
  private initialized = false

  /** Initialize AudioContext on first user gesture */
  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this.masterVolume
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  /** Create a white noise buffer of given duration */
  private createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const sampleRate = ctx.sampleRate
    const length = sampleRate * duration
    const buffer = ctx.createBuffer(2, length, sampleRate)
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1)
      }
    }
    return buffer
  }

  /** Create a brown noise buffer of given duration */
  private createBrownNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const sampleRate = ctx.sampleRate
    const length = sampleRate * duration
    const buffer = ctx.createBuffer(2, length, sampleRate)
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      let lastOut = 0
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + 0.02 * white) / 1.02
        lastOut = data[i]
        data[i] *= 3.5
      }
    }
    return buffer
  }

  /** Create a pink noise buffer of given duration */
  private createPinkNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const sampleRate = ctx.sampleRate
    const length = sampleRate * duration
    const buffer = ctx.createBuffer(2, length, sampleRate)
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926
      }
    }
    return buffer
  }

  /** Play a looping buffer source through a gain node */
  private playLoopingBuffer(
    ctx: AudioContext,
    buffer: AudioBuffer,
    gainNode: AudioNode
  ): AudioBufferSourceNode {
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.connect(gainNode)
    source.start()
    return source
  }

  /** --- Sound Creation Methods --- */

  private createRain(ctx: AudioContext): SoundNodes {
    const gain = ctx.createGain()
    gain.gain.value = 0
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 400
    filter.Q.value = 0.5
    filter.connect(gain)
    gain.connect(this.masterGain!)

    const buffer = this.createBrownNoiseBuffer(ctx, 4)
    const source = this.playLoopingBuffer(ctx, buffer, filter)

    return { gain, sources: [source], intervals: [], timeouts: [] }
  }

  private createOcean(ctx: AudioContext): SoundNodes {
    const gain = ctx.createGain()
    gain.gain.value = 0

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 500
    filter.Q.value = 0.3

    // LFO for wave-like modulation
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.type = 'sine'
    lfo.frequency.value = 0.15
    lfoGain.gain.value = 0.3
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    lfo.start()

    filter.connect(gain)
    gain.connect(this.masterGain!)

    const buffer = this.createBrownNoiseBuffer(ctx, 6)
    const source = this.playLoopingBuffer(ctx, buffer, filter)

    return { gain, sources: [source, lfo], intervals: [], timeouts: [], lfo, lfoGain }
  }

  private createFireplace(ctx: AudioContext): SoundNodes {
    const gain = ctx.createGain()
    gain.gain.value = 0

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 800
    filter.Q.value = 0.4

    // LFO for crackling
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.type = 'sawtooth'
    lfo.frequency.value = 8
    lfoGain.gain.value = 0.15
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    lfo.start()

    filter.connect(gain)
    gain.connect(this.masterGain!)

    const buffer = this.createBrownNoiseBuffer(ctx, 3)
    const source = this.playLoopingBuffer(ctx, buffer, filter)

    return { gain, sources: [source, lfo], intervals: [], timeouts: [], lfo, lfoGain }
  }

  private createForest(ctx: AudioContext): SoundNodes {
    const gain = ctx.createGain()
    gain.gain.value = 0

    // Pink noise filtered for wind-through-trees
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 600
    filter.Q.value = 0.3
    filter.connect(gain)
    gain.connect(this.masterGain!)

    const noiseBuffer = this.createPinkNoiseBuffer(ctx, 6)
    const noiseSource = this.playLoopingBuffer(ctx, noiseBuffer, filter)

    const sources: (AudioBufferSourceNode | OscillatorNode)[] = [noiseSource]
    const intervals: ReturnType<typeof setInterval>[] = []
    const timeouts: ReturnType<typeof setTimeout>[] = []

    // Bird chirp oscillator — scheduled chirps
    let chirpIndex = 0
    const chirpOsc = ctx.createOscillator()
    const chirpGain = ctx.createGain()
    chirpOsc.type = 'sine'
    chirpOsc.frequency.value = 2200
    chirpGain.gain.value = 0
    chirpOsc.connect(chirpGain)
    chirpGain.connect(gain)
    chirpOsc.start()
    sources.push(chirpOsc)

    // Schedule bird chirps at intervals
    const chirpInterval = setInterval(() => {
      chirpIndex++
      if (chirpIndex % 4 === 0) return // skip some for variety
      const now = ctx.currentTime
      chirpGain.gain.setValueAtTime(0, now)
      // Rising trill
      for (let t = 0; t < 3; t++) {
        chirpOsc.frequency.setValueAtTime(1800 + t * 400, now + t * 0.08)
        chirpGain.gain.setValueAtTime(0.06, now + t * 0.08)
        chirpGain.gain.linearRampToValueAtTime(0, now + t * 0.08 + 0.06)
      }
    }, 3500)

    intervals.push(chirpInterval)

    return { gain, sources, intervals, timeouts }
  }

  private createCoffee(ctx: AudioContext): SoundNodes {
    const gain = ctx.createGain()
    gain.gain.value = 0

    // Pink noise with mid-frequency emphasis
    const filter = ctx.createBiquadFilter()
    filter.type = 'peaking'
    filter.frequency.value = 1500
    filter.Q.value = 0.5
    filter.gain.value = 6

    const filter2 = ctx.createBiquadFilter()
    filter2.type = 'lowpass'
    filter2.frequency.value = 3000
    filter2.Q.value = 0.3

    filter.connect(filter2)
    filter2.connect(gain)
    gain.connect(this.masterGain!)

    const buffer = this.createPinkNoiseBuffer(ctx, 5)
    const source = this.playLoopingBuffer(ctx, buffer, filter)

    return { gain, sources: [source], intervals: [], timeouts: [] }
  }

  private createWind(ctx: AudioContext): SoundNodes {
    const gain = ctx.createGain()
    gain.gain.value = 0

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 300
    filter.Q.value = 0.2

    // Slow modulation
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.type = 'sine'
    lfo.frequency.value = 0.08
    lfoGain.gain.value = 200
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    lfo.start()

    filter.connect(gain)
    gain.connect(this.masterGain!)

    const buffer = this.createWhiteNoiseBuffer(ctx, 5)
    const source = this.playLoopingBuffer(ctx, buffer, filter)

    return { gain, sources: [source, lfo], intervals: [], timeouts: [], lfo, lfoGain }
  }

  private createThunder(ctx: AudioContext): SoundNodes {
    const gain = ctx.createGain()
    gain.gain.value = 0

    // Low rumble
    const rumble = ctx.createOscillator()
    rumble.type = 'sawtooth'
    rumble.frequency.value = 40
    const rumbleGain = ctx.createGain()
    rumbleGain.gain.value = 0.3
    const rumbleFilter = ctx.createBiquadFilter()
    rumbleFilter.type = 'lowpass'
    rumbleFilter.frequency.value = 100
    rumble.connect(rumbleFilter)
    rumbleFilter.connect(rumbleGain)
    rumbleGain.connect(gain)

    // Noise burst for thunder crack
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 200
    noiseFilter.connect(gain)
    gain.connect(this.masterGain!)

    rumble.start()

    const noiseBuffer = this.createWhiteNoiseBuffer(ctx, 2)

    const sources: (AudioBufferSourceNode | OscillatorNode)[] = [rumble]
    const intervals: ReturnType<typeof setInterval>[] = []

    // Thunder crack at random intervals
    let burstCount = 0
    const thunderInterval = setInterval(() => {
      burstCount++
      // Only trigger on certain counts for irregular pattern
      if (burstCount % 5 !== 0 && burstCount % 7 !== 0) return

      const burstSource = ctx.createBufferSource()
      burstSource.buffer = noiseBuffer
      const burstGain = ctx.createGain()
      burstGain.gain.setValueAtTime(0.8, ctx.currentTime)
      burstGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5)
      burstSource.connect(burstGain)
      burstGain.connect(gain)
      burstSource.start()
      burstSource.stop(ctx.currentTime + 1.5)

      // Add to sources for tracking (will stop automatically)
      sources.push(burstSource)
    }, 2000)

    intervals.push(thunderInterval)

    return { gain, sources, intervals, timeouts: [] }
  }

  private createNight(ctx: AudioContext): SoundNodes {
    const gain = ctx.createGain()
    gain.gain.value = 0

    // Very soft pink noise base
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 300
    filter.Q.value = 0.5
    filter.connect(gain)
    gain.connect(this.masterGain!)

    const buffer = this.createPinkNoiseBuffer(ctx, 6)
    const noiseSource = this.playLoopingBuffer(ctx, buffer, filter)

    // Cricket chirp oscillator
    const cricketOsc = ctx.createOscillator()
    const cricketGain = ctx.createGain()
    cricketOsc.type = 'sine'
    cricketOsc.frequency.value = 4200
    cricketGain.gain.value = 0
    cricketOsc.connect(cricketGain)
    cricketGain.connect(gain)
    cricketOsc.start()

    const sources: (AudioBufferSourceNode | OscillatorNode)[] = [noiseSource, cricketOsc]
    const intervals: ReturnType<typeof setInterval>[] = []

    // Cricket chirps
    let chirpCount = 0
    const cricketInterval = setInterval(() => {
      chirpCount++
      if (chirpCount % 3 !== 0) return
      const now = ctx.currentTime
      for (let t = 0; t < 5; t++) {
        cricketOsc.frequency.setValueAtTime(3800 + (chirpCount % 2) * 800, now + t * 0.05)
        cricketGain.gain.setValueAtTime(0.04, now + t * 0.05)
        cricketGain.gain.linearRampToValueAtTime(0, now + t * 0.05 + 0.04)
      }
    }, 4000)

    intervals.push(cricketInterval)

    return { gain, sources, intervals, timeouts: [] }
  }

  /** --- Public API --- */

  private createSound(id: string): SoundNodes | null {
    const ctx = this.ensureContext()
    switch (id) {
      case 'rain': return this.createRain(ctx)
      case 'ocean': return this.createOcean(ctx)
      case 'fireplace': return this.createFireplace(ctx)
      case 'forest': return this.createForest(ctx)
      case 'coffee': return this.createCoffee(ctx)
      case 'wind': return this.createWind(ctx)
      case 'thunder': return this.createThunder(ctx)
      case 'night': return this.createNight(ctx)
      default: return null
    }
  }

  /** Toggle a sound on/off */
  toggle(id: string): void {
    const isActive = this.active.get(id) || false
    if (isActive) {
      this.stopSound(id)
    } else {
      this.startSound(id)
    }
  }

  /** Start playing a sound */
  private startSound(id: string): void {
    if (this.sounds.has(id)) {
      // Already created, just fade in
      const nodes = this.sounds.get(id)!
      const vol = this.volumes.get(id) ?? 50
      const ctx = this.ensureContext()
      const targetGain = (vol / 100) * this.masterVolume * 0.5
      nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, ctx.currentTime)
      nodes.gain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.3)
      this.active.set(id, true)
      return
    }

    const nodes = this.createSound(id)
    if (!nodes) return

    const vol = this.volumes.get(id) ?? 50
    const ctx = this.ensureContext()
    const targetGain = (vol / 100) * this.masterVolume * 0.5
    nodes.gain.gain.setValueAtTime(0, ctx.currentTime)
    nodes.gain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.5)

    this.sounds.set(id, nodes)
    this.active.set(id, true)
  }

  /** Stop a specific sound */
  private stopSound(id: string): void {
    const nodes = this.sounds.get(id)
    if (!nodes) {
      this.active.set(id, false)
      return
    }

    const ctx = this.ensureContext()
    nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, ctx.currentTime)
    nodes.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)

    // Clean up after fade out
    setTimeout(() => {
      this.cleanupSound(id)
    }, 400)

    this.active.set(id, false)
  }

  /** Clean up sound nodes */
  private cleanupSound(id: string): void {
    const nodes = this.sounds.get(id)
    if (!nodes) return

    nodes.sources.forEach(s => {
      try { s.stop() } catch { /* already stopped */ }
    })
    nodes.intervals.forEach(i => clearInterval(i))
    nodes.timeouts.forEach(t => clearTimeout(t))
    if (nodes.lfo) {
      try { nodes.lfo.stop() } catch { /* already stopped */ }
    }
    nodes.gain.disconnect()

    this.sounds.delete(id)
  }

  /** Set volume for a specific sound (0-100) */
  setVolume(id: string, value: number): void {
    this.volumes.set(id, value)
    if (!this.sounds.has(id) || !this.active.get(id)) return

    const nodes = this.sounds.get(id)!
    const ctx = this.ensureContext()
    const targetGain = (value / 100) * this.masterVolume * 0.5
    nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, ctx.currentTime)
    nodes.gain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.1)
  }

  /** Set master volume (0-1) */
  setMasterVolume(value: number): void {
    this.masterVolume = value
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime)
      this.masterGain.gain.linearRampToValueAtTime(value, this.ctx.currentTime + 0.1)
    }
  }

  /** Stop all sounds */
  stopAll(): void {
    SOUND_CONFIGS.forEach(s => {
      if (this.active.get(s.id)) {
        this.stopSound(s.id)
      }
    })
  }

  /** Check if a sound is active */
  isActive(id: string): boolean {
    return this.active.get(id) || false
  }

  /** Get volume for a sound */
  getVolume(id: string): number {
    return this.volumes.get(id) ?? 50
  }

  /** Check if context is initialized */
  isInitialized(): boolean {
    return this.initialized
  }

  /** Initialize on first user interaction */
  async init(): Promise<void> {
    if (this.initialized) return
    this.ensureContext()
    this.initialized = true
  }
}

export const ambientMixer = new AmbientMixer()
