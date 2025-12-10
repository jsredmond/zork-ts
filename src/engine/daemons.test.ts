/**
 * Daemon Tests
 * Tests for lamp and candle timer daemons
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  lampTimerInterrupt, 
  candleTimerInterrupt,
  initializeLampTimer,
  disableLampTimer,
  initializeCandleTimer,
  disableCandleTimer,
  resetLampTimer,
  resetCandleTimer
} from './daemons.js';
import { GameState } from '../game/state.js';
import { GameObjectImpl } from '../game/objects.js';
import { ObjectFlag } from '../game/data/flags.js';

describe('Lamp Timer Daemon', () => {
  let state: GameState;
  let lamp: GameObjectImpl;

  beforeEach(() => {
    state = new GameState();
    
    // Create a lamp object
    lamp = new GameObjectImpl({
      id: 'LAMP',
      name: 'brass lantern',
      synonyms: ['lamp', 'lantern', 'light'],
      adjectives: ['brass'],
      description: 'A battery-powered brass lantern.',
      location: 'PLAYER',
      flags: new Set([ObjectFlag.TAKEBIT, ObjectFlag.LIGHTBIT, ObjectFlag.ONBIT]),
      size: 15
    });
    
    state.objects.set('LAMP', lamp);
    state.addToInventory('LAMP');
    
    // Register the lamp timer interrupt (normally done by gameFactory)
    state.eventSystem.registerInterrupt('I-LANTERN', (s) => lampTimerInterrupt(s), 0);
  });

  it('should initialize lamp timer correctly', () => {
    initializeLampTimer(state);
    
    // The implementation uses LAMP_STAGE_INDEX, not LAMP_TICKS
    expect(state.getGlobalVariable('LAMP_STAGE_INDEX')).toBe(0);
    expect(state.eventSystem.hasEvent('I-LANTERN')).toBe(true);
  });

  it('should not run when lamp is off', () => {
    lamp.flags.delete(ObjectFlag.ONBIT);
    initializeLampTimer(state);
    
    const result = lampTimerInterrupt(state);
    
    expect(result).toBe(false);
  });

  it('should advance stage when lamp is on', () => {
    initializeLampTimer(state);
    
    // Run the interrupt
    lampTimerInterrupt(state);
    
    // Stage should advance
    expect(state.getGlobalVariable('LAMP_STAGE_INDEX')).toBe(1);
  });

  it('should disable lamp timer when requested', () => {
    initializeLampTimer(state);
    
    disableLampTimer(state);
    
    const status = state.eventSystem.getEventStatus('I-LANTERN');
    expect(status?.enabled).toBe(false);
  });

  it('should turn off lamp when battery runs out', () => {
    initializeLampTimer(state);
    
    // Run through all stages to reach burnout (4 stages: 100, 70, 15, 0)
    for (let i = 0; i < 4; i++) {
      lampTimerInterrupt(state);
    }
    
    expect(lamp.flags.has(ObjectFlag.ONBIT)).toBe(false);
  });
});

describe('Candle Timer Daemon', () => {
  let state: GameState;
  let candles: GameObjectImpl;

  beforeEach(() => {
    state = new GameState();
    
    // Create candles object
    candles = new GameObjectImpl({
      id: 'CANDLES',
      name: 'pair of candles',
      synonyms: ['candles', 'candle'],
      adjectives: ['pair'],
      description: 'A pair of candles.',
      location: 'PLAYER',
      flags: new Set([ObjectFlag.TAKEBIT, ObjectFlag.LIGHTBIT, ObjectFlag.ONBIT]),
      size: 5
    });
    
    state.objects.set('CANDLES', candles);
    state.addToInventory('CANDLES');
    
    // Register the candle timer interrupt (normally done by gameFactory)
    state.eventSystem.registerInterrupt('I-CANDLES', (s) => candleTimerInterrupt(s), 0);
  });

  it('should initialize candle timer correctly', () => {
    initializeCandleTimer(state);
    
    // The implementation uses CANDLE_STAGE_INDEX, not CANDLE_TICKS
    expect(state.getGlobalVariable('CANDLE_STAGE_INDEX')).toBe(0);
    expect(state.eventSystem.hasEvent('I-CANDLES')).toBe(true);
  });

  it('should not run when candles are off', () => {
    candles.flags.delete(ObjectFlag.ONBIT);
    initializeCandleTimer(state);
    
    const result = candleTimerInterrupt(state);
    
    expect(result).toBe(false);
  });

  it('should advance stage when candles are on', () => {
    initializeCandleTimer(state);
    
    // Run the interrupt
    candleTimerInterrupt(state);
    
    // Stage should advance
    expect(state.getGlobalVariable('CANDLE_STAGE_INDEX')).toBe(1);
  });

  it('should mark candles as touched when lit', () => {
    initializeCandleTimer(state);
    
    candleTimerInterrupt(state);
    
    expect(candles.flags.has('TOUCHBIT' as any)).toBe(true);
  });

  it('should disable candle timer when requested', () => {
    initializeCandleTimer(state);
    
    disableCandleTimer(state);
    
    const status = state.eventSystem.getEventStatus('I-CANDLES');
    expect(status?.enabled).toBe(false);
  });

  it('should turn off candles when they burn out', () => {
    initializeCandleTimer(state);
    
    // Run through all stages to reach burnout (4 stages: 20, 10, 5, 0)
    for (let i = 0; i < 4; i++) {
      candleTimerInterrupt(state);
    }
    
    expect(candles.flags.has(ObjectFlag.ONBIT)).toBe(false);
  });
});

describe('Timer Integration', () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
    
    // Register both timer interrupts (normally done by gameFactory)
    state.eventSystem.registerInterrupt('I-LANTERN', (s) => lampTimerInterrupt(s), 0);
    state.eventSystem.registerInterrupt('I-CANDLES', (s) => candleTimerInterrupt(s), 0);
  });

  it('should handle both timers running simultaneously', () => {
    // Create lamp
    const lamp = new GameObjectImpl({
      id: 'LAMP',
      name: 'brass lantern',
      synonyms: ['lamp'],
      adjectives: ['brass'],
      description: 'A lamp.',
      location: 'PLAYER',
      flags: new Set([ObjectFlag.TAKEBIT, ObjectFlag.LIGHTBIT, ObjectFlag.ONBIT]),
      size: 15
    });
    state.objects.set('LAMP', lamp);
    state.addToInventory('LAMP');

    // Create candles
    const candles = new GameObjectImpl({
      id: 'CANDLES',
      name: 'candles',
      synonyms: ['candles'],
      adjectives: [],
      description: 'Candles.',
      location: 'PLAYER',
      flags: new Set([ObjectFlag.TAKEBIT, ObjectFlag.LIGHTBIT, ObjectFlag.ONBIT]),
      size: 5
    });
    state.objects.set('CANDLES', candles);
    state.addToInventory('CANDLES');

    // Initialize both timers
    initializeLampTimer(state);
    initializeCandleTimer(state);

    // Both should be registered
    expect(state.eventSystem.hasEvent('I-LANTERN')).toBe(true);
    expect(state.eventSystem.hasEvent('I-CANDLES')).toBe(true);

    // Both should have stage indices
    expect(state.getGlobalVariable('LAMP_STAGE_INDEX')).toBeDefined();
    expect(state.getGlobalVariable('CANDLE_STAGE_INDEX')).toBeDefined();
  });
});
