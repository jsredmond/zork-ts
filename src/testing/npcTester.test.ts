/**
 * Tests for NPC testing functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NPCTester, testCyclopsFeeding, testTrollInteractions, testThiefStealing, testThiefMovement, testNPCRespawning, verifyNPCBehavior, executeNPCTests, executeNPCTestsForOne } from './npcTester';
import { createInitialGameState } from '../game/factories/gameFactory';
import { GameState } from '../game/state';
import { ActorState, BaseActorBehavior } from '../engine/actors';
import { CyclopsBehavior } from '../engine/cyclops';
import { TrollBehavior } from '../engine/troll';
import { ThiefBehavior } from '../engine/thief';
import { TestType } from './types';

describe('NPCTester', () => {
  let state: GameState;
  let tester: NPCTester;
  
  beforeEach(() => {
    state = createInitialGameState();
    tester = new NPCTester();
    
    // Register NPC actors
    state.actorManager.registerActor(new CyclopsBehavior());
    state.actorManager.registerActor(new TrollBehavior());
    state.actorManager.registerActor(new ThiefBehavior());
  });
  
  describe('testCombat', () => {
    it('should pass for NPC with combat configuration', () => {
      const result = tester.testCombat('TROLL', state);
      
      expect(result.passed).toBe(true);
      expect(result.testType).toBe(TestType.NPC_INTERACTION);
      expect(result.itemId).toBe('TROLL');
    });
    
    it('should fail for non-existent NPC', () => {
      const result = tester.testCombat('NONEXISTENT', state);
      
      expect(result.passed).toBe(false);
      expect(result.message).toContain('not found');
    });
    
    it('should fail for NPC without actor behavior', () => {
      // Create a mock NPC without registering actor
      state.actorManager.unregisterActor('CYCLOPS');
      
      const result = tester.testCombat('CYCLOPS', state);
      
      expect(result.passed).toBe(false);
      expect(result.message).toContain('no actor behavior');
    });
  });
  
  describe('testItemGiving', () => {
    it('should pass for NPC that can receive items', () => {
      const result = tester.testItemGiving('CYCLOPS', state);
      
      expect(result.passed).toBe(true);
      expect(result.testType).toBe(TestType.NPC_INTERACTION);
    });
    
    it('should fail for non-existent NPC', () => {
      const result = tester.testItemGiving('NONEXISTENT', state);
      
      expect(result.passed).toBe(false);
      expect(result.message).toContain('not found');
    });
    
    it('should fail for NPC without actor behavior', () => {
      state.actorManager.unregisterActor('TROLL');
      
      const result = tester.testItemGiving('TROLL', state);
      
      expect(result.passed).toBe(false);
      expect(result.message).toContain('no actor behavior');
    });
  });
  
  describe('testStateTransitions', () => {
    it('should pass for NPC with valid state', () => {
      const results = tester.testStateTransitions('THIEF', state);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.passed)).toBe(true);
    });
    
    it('should fail for non-existent NPC', () => {
      const results = tester.testStateTransitions('NONEXISTENT', state);
      
      expect(results.length).toBe(1);
      expect(results[0].passed).toBe(false);
      expect(results[0].message).toContain('not found');
    });
    
    it('should verify NPC has valid state', () => {
      const results = tester.testStateTransitions('CYCLOPS', state);
      
      const stateValidResult = results.find(r => r.testId.includes('state-valid'));
      expect(stateValidResult).toBeDefined();
      expect(stateValidResult?.passed).toBe(true);
    });
    
    it('should verify NPC can transition states', () => {
      const results = tester.testStateTransitions('TROLL', state);
      
      const transitionResult = results.find(r => r.testId.includes('state-transition'));
      expect(transitionResult).toBeDefined();
      expect(transitionResult?.passed).toBe(true);
    });
  });
  
  describe('testNPC', () => {
    it('should run all tests for an NPC', () => {
      const results = tester.testNPC('CYCLOPS', state);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.itemId === 'CYCLOPS')).toBe(true);
    });
    
    it('should include combat, item giving, and state tests', () => {
      const results = tester.testNPC('TROLL', state);
      
      const hasCombat = results.some(r => r.testId.includes('combat'));
      const hasGiving = results.some(r => r.testId.includes('give'));
      const hasStates = results.some(r => r.testId.includes('state'));
      
      expect(hasCombat).toBe(true);
      expect(hasGiving).toBe(true);
      expect(hasStates).toBe(true);
    });
  });
  
  describe('testNPCs', () => {
    it('should test multiple NPCs', () => {
      const results = tester.testNPCs(['TROLL', 'CYCLOPS', 'THIEF'], state);
      
      expect(results.length).toBeGreaterThan(0);
      
      const trollResults = results.filter(r => r.itemId === 'TROLL');
      const cyclopsResults = results.filter(r => r.itemId === 'CYCLOPS');
      const thiefResults = results.filter(r => r.itemId === 'THIEF');
      
      expect(trollResults.length).toBeGreaterThan(0);
      expect(cyclopsResults.length).toBeGreaterThan(0);
      expect(thiefResults.length).toBeGreaterThan(0);
    });
  });
});

describe('NPC-specific interaction tests', () => {
  let state: GameState;
  
  beforeEach(() => {
    state = createInitialGameState();
    state.actorManager.registerActor(new CyclopsBehavior());
    state.actorManager.registerActor(new TrollBehavior());
    state.actorManager.registerActor(new ThiefBehavior());
  });
  
  describe('testCyclopsFeeding', () => {
    it('should test cyclops feeding interactions', () => {
      const results = testCyclopsFeeding(state);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.itemId === 'CYCLOPS')).toBe(true);
    });
    
    it('should verify cyclops can receive lunch', () => {
      const results = testCyclopsFeeding(state);
      
      const lunchResult = results.find(r => r.testId.includes('lunch'));
      expect(lunchResult).toBeDefined();
    });
    
    it('should verify cyclops can receive water', () => {
      const results = testCyclopsFeeding(state);
      
      const waterResult = results.find(r => r.testId.includes('water'));
      expect(waterResult).toBeDefined();
    });
  });
  
  describe('testTrollInteractions', () => {
    it('should test troll interactions', () => {
      const results = testTrollInteractions(state);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.itemId === 'TROLL')).toBe(true);
    });
    
    it('should verify troll can be bribed', () => {
      const results = testTrollInteractions(state);
      
      const bribeResult = results.find(r => r.testId.includes('bribe'));
      expect(bribeResult).toBeDefined();
      expect(bribeResult?.passed).toBe(true);
    });
    
    it('should verify troll has axe', () => {
      const results = testTrollInteractions(state);
      
      const axeResult = results.find(r => r.testId.includes('axe'));
      expect(axeResult).toBeDefined();
    });
  });
  
  describe('testThiefStealing', () => {
    it('should test thief stealing behavior', () => {
      const results = testThiefStealing(state);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.itemId === 'THIEF')).toBe(true);
    });
    
    it('should verify thief has behavior', () => {
      const results = testThiefStealing(state);
      
      const behaviorResult = results.find(r => r.testId.includes('behavior'));
      expect(behaviorResult).toBeDefined();
      expect(behaviorResult?.passed).toBe(true);
    });
    
    it('should verify thief has weapon', () => {
      const results = testThiefStealing(state);
      
      // The weapon test is only included if stiletto exists
      const weaponResult = results.find(r => r.testId.includes('weapon'));
      // Test passes if either weapon result exists or stiletto doesn't exist
      if (state.getObject('STILETTO')) {
        expect(weaponResult).toBeDefined();
      }
    });
  });
});

describe('NPC movement and behavior tests', () => {
  let state: GameState;
  
  beforeEach(() => {
    state = createInitialGameState();
    state.actorManager.registerActor(new CyclopsBehavior());
    state.actorManager.registerActor(new TrollBehavior());
    state.actorManager.registerActor(new ThiefBehavior());
  });
  
  describe('testThiefMovement', () => {
    it('should test thief movement patterns', () => {
      const results = testThiefMovement(state);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.itemId === 'THIEF')).toBe(true);
    });
    
    it('should verify thief has location', () => {
      const results = testThiefMovement(state);
      
      const locationResult = results.find(r => r.testId.includes('location'));
      expect(locationResult).toBeDefined();
    });
    
    it('should verify thief can move', () => {
      const results = testThiefMovement(state);
      
      const moveResult = results.find(r => r.testId.includes('can-move'));
      expect(moveResult).toBeDefined();
    });
  });
  
  describe('testNPCRespawning', () => {
    it('should test NPC respawning capability', () => {
      const results = testNPCRespawning('TROLL', state);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.itemId === 'TROLL')).toBe(true);
    });
    
    it('should verify NPC can die', () => {
      const results = testNPCRespawning('CYCLOPS', state);
      
      const deathResult = results.find(r => r.testId.includes('death'));
      expect(deathResult).toBeDefined();
      expect(deathResult?.passed).toBe(true);
    });
    
    it('should verify NPC can disappear', () => {
      const results = testNPCRespawning('THIEF', state);
      
      const disappearResult = results.find(r => r.testId.includes('disappear'));
      expect(disappearResult).toBeDefined();
      expect(disappearResult?.passed).toBe(true);
    });
  });
  
  describe('verifyNPCBehavior', () => {
    it('should verify NPC has all required methods', () => {
      const result = verifyNPCBehavior('TROLL', state);
      
      expect(result.passed).toBe(true);
      expect(result.itemId).toBe('TROLL');
    });
    
    it('should fail for NPC without actor behavior', () => {
      state.actorManager.unregisterActor('CYCLOPS');
      
      const result = verifyNPCBehavior('CYCLOPS', state);
      
      expect(result.passed).toBe(false);
      expect(result.message).toContain('no actor behavior');
    });
    
    it('should verify all NPCs', () => {
      const trollResult = verifyNPCBehavior('TROLL', state);
      const cyclopsResult = verifyNPCBehavior('CYCLOPS', state);
      const thiefResult = verifyNPCBehavior('THIEF', state);
      
      expect(trollResult.passed).toBe(true);
      expect(cyclopsResult.passed).toBe(true);
      expect(thiefResult.passed).toBe(true);
    });
  });
});

describe('NPC test execution', () => {
  let state: GameState;
  
  beforeEach(() => {
    state = createInitialGameState();
    state.actorManager.registerActor(new CyclopsBehavior());
    state.actorManager.registerActor(new TrollBehavior());
    state.actorManager.registerActor(new ThiefBehavior());
  });
  
  describe('executeNPCTests', () => {
    it('should execute tests for all NPCs', () => {
      const result = executeNPCTests(state);
      
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.testedNPCs.length).toBeGreaterThan(0);
    });
    
    it('should test all known NPCs', () => {
      const result = executeNPCTests(state);
      
      expect(result.testedNPCs).toContain('TROLL');
      expect(result.testedNPCs).toContain('CYCLOPS');
      expect(result.testedNPCs).toContain('THIEF');
    });
    
    it('should generate bug reports for failures', () => {
      // Unregister an actor to cause failures
      state.actorManager.unregisterActor('TROLL');
      
      const result = executeNPCTests(state);
      
      expect(result.bugsFound.length).toBeGreaterThan(0);
    });
  });
  
  describe('executeNPCTestsForOne', () => {
    it('should execute tests for a specific NPC', () => {
      const result = executeNPCTestsForOne('CYCLOPS', state);
      
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.testedNPCs).toContain('CYCLOPS');
      expect(result.results.every(r => r.itemId === 'CYCLOPS')).toBe(true);
    });
    
    it('should include specific tests for cyclops', () => {
      const result = executeNPCTestsForOne('CYCLOPS', state);
      
      const hasFeeding = result.results.some(r => 
        r.testId.includes('lunch') || r.testId.includes('water')
      );
      expect(hasFeeding).toBe(true);
    });
    
    it('should include specific tests for troll', () => {
      const result = executeNPCTestsForOne('TROLL', state);
      
      const hasBribe = result.results.some(r => r.testId.includes('bribe'));
      expect(hasBribe).toBe(true);
    });
    
    it('should include specific tests for thief', () => {
      const result = executeNPCTestsForOne('THIEF', state);
      
      const hasStealing = result.results.some(r => r.testId.includes('steal') || r.testId.includes('behavior'));
      const hasMovement = result.results.some(r => r.testId.includes('movement') || r.testId.includes('location'));
      
      expect(hasStealing).toBe(true);
      expect(hasMovement).toBe(true);
    });
  });
});
