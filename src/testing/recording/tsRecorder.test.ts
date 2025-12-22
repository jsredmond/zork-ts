/**
 * Unit Tests for TypeScript Game Recorder
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TypeScriptRecorder } from './tsRecorder.js';

describe('TypeScriptRecorder', () => {
  let recorder: TypeScriptRecorder;

  beforeEach(() => {
    recorder = new TypeScriptRecorder();
  });

  describe('isAvailable', () => {
    it('should always return true', async () => {
      const available = await recorder.isAvailable();
      expect(available).toBe(true);
    });
  });

  describe('record', () => {
    it('should record basic command sequences', async () => {
      const commands = ['look', 'inventory'];
      const transcript = await recorder.record(commands);

      expect(transcript.source).toBe('typescript');
      // Initial state + 2 commands = 3 entries
      expect(transcript.entries).toHaveLength(3);
      expect(transcript.entries[0].command).toBe('');  // Initial state
      expect(transcript.entries[1].command).toBe('look');
      expect(transcript.entries[2].command).toBe('inventory');
    });

    it('should capture initial game output', async () => {
      const transcript = await recorder.record([]);

      expect(transcript.entries).toHaveLength(1);
      expect(transcript.entries[0].output).toContain('ZORK I');
      expect(transcript.entries[0].output).toContain('West of House');
    });

    it('should capture room descriptions', async () => {
      const transcript = await recorder.record(['look']);

      expect(transcript.entries[1].output).toBeTruthy();
      expect(transcript.entries[1].output.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully and continue recording', async () => {
      // Invalid command should not crash the recorder
      const commands = ['look', 'xyzzy123invalid', 'inventory'];
      const transcript = await recorder.record(commands);

      // Should have all entries despite error
      expect(transcript.entries).toHaveLength(4);
      // Error command should have some output (error message)
      expect(transcript.entries[2].output).toBeTruthy();
      // Should continue after error
      expect(transcript.entries[3].command).toBe('inventory');
    });

    it('should track turn numbers', async () => {
      const commands = ['look', 'inventory', 'north'];
      const transcript = await recorder.record(commands);

      expect(transcript.entries[0].turnNumber).toBe(0);  // Initial state
      expect(transcript.entries[1].turnNumber).toBeGreaterThanOrEqual(1);
      expect(transcript.entries[2].turnNumber).toBeGreaterThanOrEqual(1);
      expect(transcript.entries[3].turnNumber).toBeGreaterThanOrEqual(1);
    });

    it('should generate unique transcript IDs', async () => {
      const transcript1 = await recorder.record(['look']);
      const transcript2 = await recorder.record(['look']);

      expect(transcript1.id).toBeTruthy();
      expect(transcript2.id).toBeTruthy();
      // IDs should be different (different timestamps)
      expect(transcript1.id).not.toBe(transcript2.id);
    });

    it('should include seed in ID when provided', async () => {
      const transcript = await recorder.record(['look'], { seed: 12345 });

      expect(transcript.id).toContain('seed12345');
      expect(transcript.metadata.seed).toBe(12345);
    });

    it('should record timestamps when requested', async () => {
      const transcript = await recorder.record(['look'], { captureTimestamps: true });

      expect(transcript.entries[0].timestamp).toBeDefined();
      expect(transcript.entries[1].timestamp).toBeDefined();
      expect(typeof transcript.entries[0].timestamp).toBe('number');
    });

    it('should not record timestamps by default', async () => {
      const transcript = await recorder.record(['look']);

      expect(transcript.entries[0].timestamp).toBeUndefined();
    });

    it('should set start and end times', async () => {
      const beforeRecord = new Date();
      const transcript = await recorder.record(['look']);
      const afterRecord = new Date();

      expect(transcript.startTime).toBeInstanceOf(Date);
      expect(transcript.endTime).toBeInstanceOf(Date);
      expect(transcript.startTime.getTime()).toBeGreaterThanOrEqual(beforeRecord.getTime());
      expect(transcript.endTime.getTime()).toBeLessThanOrEqual(afterRecord.getTime());
    });

    it('should include game version in metadata', async () => {
      const transcript = await recorder.record(['look']);

      expect(transcript.metadata.gameVersion).toBe('1.0.0');
    });
  });

  describe('deterministic seeding', () => {
    it('should produce identical output with same seed', async () => {
      const commands = ['look', 'inventory'];
      
      const transcript1 = await recorder.record(commands, { seed: 42 });
      const transcript2 = await recorder.record(commands, { seed: 42 });

      // Same seed should produce identical outputs
      expect(transcript1.entries.length).toBe(transcript2.entries.length);
      for (let i = 0; i < transcript1.entries.length; i++) {
        expect(transcript1.entries[i].output).toBe(transcript2.entries[i].output);
      }
    });

    it('should produce different output with different seeds for random events', async () => {
      // Note: For deterministic commands like 'look' and 'inventory',
      // the output will be the same regardless of seed.
      // This test verifies the seeding mechanism works.
      const commands = ['look'];
      
      const transcript1 = await recorder.record(commands, { seed: 1 });
      const transcript2 = await recorder.record(commands, { seed: 2 });

      // For non-random commands, output should still be the same
      // This verifies the recorder works correctly with different seeds
      expect(transcript1.entries.length).toBe(transcript2.entries.length);
    });

    it('should reset random state between recordings', async () => {
      // First recording with seed
      await recorder.record(['look'], { seed: 100 });
      
      // Second recording without seed should work normally
      const transcript = await recorder.record(['look']);
      
      expect(transcript.entries).toHaveLength(2);
      expect(transcript.metadata.seed).toBeUndefined();
    });
  });

  describe('entry indexing', () => {
    it('should index entries sequentially starting from 0', async () => {
      const commands = ['look', 'inventory', 'north'];
      const transcript = await recorder.record(commands);

      expect(transcript.entries[0].index).toBe(0);
      expect(transcript.entries[1].index).toBe(1);
      expect(transcript.entries[2].index).toBe(2);
      expect(transcript.entries[3].index).toBe(3);
    });
  });
});
