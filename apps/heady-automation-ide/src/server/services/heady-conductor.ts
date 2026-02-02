
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { headyLens } from './heady-lens-service.js';

export type Tempo = 'adagio' | 'andante' | 'allegro' | 'presto';
export type TimeSignature = [number, number];

interface ConductorState {
  bpm: number;
  tempo: Tempo;
  measure: number;
  beat: number;
  startTime: number;
}

export class HeadyConductor extends EventEmitter {
  private static instance: HeadyConductor;
  private state: ConductorState;
  private interval: NodeJS.Timeout | null = null;
  
  // Harmonic intervals (in ms) derived from BPM
  private intervals: Map<string, number> = new Map();

  private constructor() {
    super();
    this.state = {
      bpm: 60, // Default 60 BPM (1 beat per sec)
      tempo: 'andante',
      measure: 1,
      beat: 1,
      startTime: Date.now()
    };
    this.recalculateIntervals();
  }

  static getInstance(): HeadyConductor {
    if (!HeadyConductor.instance) {
      HeadyConductor.instance = new HeadyConductor();
    }
    return HeadyConductor.instance;
  }

  /**
   * Set the global system tempo
   * @param bpm Beats per minute
   */
  setTempo(bpm: number) {
    this.state.bpm = bpm;
    
    if (bpm < 60) this.state.tempo = 'adagio';
    else if (bpm < 100) this.state.tempo = 'andante';
    else if (bpm < 140) this.state.tempo = 'allegro';
    else this.state.tempo = 'presto';

    this.recalculateIntervals();
    this.emit('tempo_changed', this.state);
    
    // Restart loop if running
    if (this.interval) {
      this.stop();
      this.start();
    }
  }

  private recalculateIntervals() {
    const beatMs = 60000 / this.state.bpm;
    this.intervals.set('whole', beatMs * 4);
    this.intervals.set('half', beatMs * 2);
    this.intervals.set('quarter', beatMs);
    this.intervals.set('eighth', beatMs / 2);
    this.intervals.set('sixteenth', beatMs / 4);
    
    // Phi-based throttling interval
    this.intervals.set('phi', beatMs * 1.618);
  }

  start() {
    if (this.interval) return;
    
    const tickRate = this.intervals.get('sixteenth') || 125;
    
    logger.info(`Conductor started. Tempo: ${this.state.tempo} (${this.state.bpm} BPM)`);
    
    this.interval = setInterval(() => {
      this.tick();
    }, tickRate);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private tick() {
    const now = Date.now();
    // Logic to calculate current beat/measure would go here
    
    // Emit the metronome tick
    this.emit('tick', {
      timestamp: now,
      ...this.state
    });

    // Sync with Lens
    // Ideally this would be debounced or on a specific beat
    if (Math.random() > 0.9) { // Placeholder for "on measure start"
        // headyLens.captureSnapshot(); // Or sync signal
    }
  }

  /**
   * Get a harmonically resonant retry delay
   * @param attempt Current retry attempt
   * @returns Delay in ms
   */
  getHarmonicBackoff(attempt: number): number {
    const base = this.intervals.get('quarter') || 1000;
    // Instead of exponential 2^n, use harmonic series or musical intervals
    // e.g., Octave (2x), Perfect Fifth (1.5x), etc.
    // For simplicity/stability: Backoff by measures
    return base * attempt; 
  }

  /**
   * Throttling gate based on Golden Ratio
   */
  async throttle(load: number): Promise<void> {
    if (load > 0.8) {
        const delay = this.intervals.get('phi') || 1618;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export const conductor = HeadyConductor.getInstance();
