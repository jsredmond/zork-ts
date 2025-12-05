/**
 * TestProgress data model with serialization/deserialization
 */

import { TestProgress } from './types';

/**
 * Serialize TestProgress to JSON-compatible format
 */
export function serializeTestProgress(progress: TestProgress): string {
  return JSON.stringify(progress, null, 2);
}

/**
 * Deserialize TestProgress from JSON string
 * Handles date conversion and validation
 */
export function deserializeTestProgress(json: string): TestProgress {
  const data = JSON.parse(json);
  
  // Validate required fields
  if (!data.version || !data.lastUpdated) {
    throw new Error('Invalid test progress data: missing required fields');
  }
  
  // Helper to normalize coverage values (NaN, null, undefined -> 0)
  const normalizeCoverage = (value: any): number => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 0;
    }
    return value;
  };
  
  // Convert date strings to Date objects
  const progress: TestProgress = {
    version: data.version,
    lastUpdated: new Date(data.lastUpdated),
    testedRooms: data.testedRooms || [],
    testedObjects: data.testedObjects || [],
    testedInteractions: data.testedInteractions || {},
    totalTests: data.totalTests || 0,
    coverage: {
      rooms: normalizeCoverage(data.coverage?.rooms),
      objects: normalizeCoverage(data.coverage?.objects),
      interactions: normalizeCoverage(data.coverage?.interactions)
    }
  };
  
  return progress;
}

/**
 * Create a new empty TestProgress object
 */
export function createTestProgress(): TestProgress {
  return {
    version: '1.0',
    lastUpdated: new Date(),
    testedRooms: [],
    testedObjects: [],
    testedInteractions: {},
    totalTests: 0,
    coverage: {
      rooms: 0,
      objects: 0,
      interactions: 0
    }
  };
}

/**
 * Add a tested room to progress
 */
export function addTestedRoom(progress: TestProgress, roomId: string): TestProgress {
  if (!progress.testedRooms.includes(roomId)) {
    return {
      ...progress,
      testedRooms: [...progress.testedRooms, roomId],
      lastUpdated: new Date()
    };
  }
  return progress;
}

/**
 * Add a tested object to progress
 */
export function addTestedObject(progress: TestProgress, objectId: string): TestProgress {
  if (!progress.testedObjects.includes(objectId)) {
    return {
      ...progress,
      testedObjects: [...progress.testedObjects, objectId],
      lastUpdated: new Date()
    };
  }
  return progress;
}

/**
 * Add a tested interaction to progress
 */
export function addTestedInteraction(
  progress: TestProgress,
  objectId: string,
  verb: string
): TestProgress {
  const interactions = { ...progress.testedInteractions };
  
  // Ensure interactions[objectId] is an array
  if (!interactions[objectId] || !Array.isArray(interactions[objectId])) {
    interactions[objectId] = [];
  }
  
  if (!interactions[objectId].includes(verb)) {
    interactions[objectId] = [...interactions[objectId], verb];
  }
  
  return {
    ...progress,
    testedInteractions: interactions,
    lastUpdated: new Date()
  };
}

/**
 * Increment total test count
 */
export function incrementTestCount(progress: TestProgress): TestProgress {
  return {
    ...progress,
    totalTests: progress.totalTests + 1,
    lastUpdated: new Date()
  };
}

/**
 * Check if a room has been tested
 */
export function isRoomTested(progress: TestProgress, roomId: string): boolean {
  return progress.testedRooms.includes(roomId);
}

/**
 * Check if an object has been tested
 */
export function isObjectTested(progress: TestProgress, objectId: string): boolean {
  return progress.testedObjects.includes(objectId);
}

/**
 * Check if an interaction has been tested
 */
export function isInteractionTested(
  progress: TestProgress,
  objectId: string,
  verb: string
): boolean {
  return progress.testedInteractions[objectId]?.includes(verb) || false;
}

/**
 * Get all tested interactions for an object
 */
export function getTestedInteractions(
  progress: TestProgress,
  objectId: string
): string[] {
  return progress.testedInteractions[objectId] || [];
}
