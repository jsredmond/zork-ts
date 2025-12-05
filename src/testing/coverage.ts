/**
 * Coverage calculation for test progress
 */

import { TestProgress } from './types';
import { ROOMS } from '../game/data/rooms';
import { OBJECTS } from '../game/data/objects';

/**
 * Calculate room coverage percentage
 */
export function calculateRoomCoverage(progress: TestProgress): number {
  const totalRooms = Object.keys(ROOMS).length;
  if (totalRooms === 0) return 0;
  
  const testedRooms = progress.testedRooms.length;
  return (testedRooms / totalRooms) * 100;
}

/**
 * Calculate object coverage percentage
 */
export function calculateObjectCoverage(progress: TestProgress): number {
  const totalObjects = Object.keys(OBJECTS).length;
  if (totalObjects === 0) return 0;
  
  const testedObjects = progress.testedObjects.length;
  return (testedObjects / totalObjects) * 100;
}

/**
 * Calculate interaction coverage percentage
 * Based on tested interactions vs potential interactions
 */
export function calculateInteractionCoverage(progress: TestProgress): number {
  // Count total tested interactions
  let totalTestedInteractions = 0;
  for (const objectId in progress.testedInteractions) {
    totalTestedInteractions += progress.testedInteractions[objectId].length;
  }
  
  // Estimate potential interactions (each object could have ~5 common verbs)
  const totalObjects = Object.keys(OBJECTS).length;
  const estimatedInteractions = totalObjects * 5;
  
  if (estimatedInteractions === 0) return 0;
  
  return Math.min((totalTestedInteractions / estimatedInteractions) * 100, 100);
}

/**
 * Update coverage in test progress
 */
export function updateCoverage(progress: TestProgress): TestProgress {
  return {
    ...progress,
    coverage: {
      rooms: calculateRoomCoverage(progress),
      objects: calculateObjectCoverage(progress),
      interactions: calculateInteractionCoverage(progress)
    }
  };
}

/**
 * Generate overall coverage summary
 */
export interface CoverageSummary {
  rooms: {
    tested: number;
    total: number;
    percentage: number;
  };
  objects: {
    tested: number;
    total: number;
    percentage: number;
  };
  interactions: {
    tested: number;
    estimated: number;
    percentage: number;
  };
  overall: number;
}

/**
 * Generate comprehensive coverage summary
 */
export function generateCoverageSummary(progress: TestProgress): CoverageSummary {
  const totalRooms = Object.keys(ROOMS).length;
  const totalObjects = Object.keys(OBJECTS).length;
  
  // Count total tested interactions
  let totalTestedInteractions = 0;
  for (const objectId in progress.testedInteractions) {
    totalTestedInteractions += progress.testedInteractions[objectId].length;
  }
  
  const estimatedInteractions = totalObjects * 5;
  
  const roomCoverage = calculateRoomCoverage(progress);
  const objectCoverage = calculateObjectCoverage(progress);
  const interactionCoverage = calculateInteractionCoverage(progress);
  
  // Overall coverage is weighted average
  const overall = (roomCoverage + objectCoverage + interactionCoverage) / 3;
  
  return {
    rooms: {
      tested: progress.testedRooms.length,
      total: totalRooms,
      percentage: roomCoverage
    },
    objects: {
      tested: progress.testedObjects.length,
      total: totalObjects,
      percentage: objectCoverage
    },
    interactions: {
      tested: totalTestedInteractions,
      estimated: estimatedInteractions,
      percentage: interactionCoverage
    },
    overall
  };
}

/**
 * Get list of untested rooms
 */
export function getUntestedRooms(progress: TestProgress): string[] {
  const allRooms = Object.keys(ROOMS);
  return allRooms.filter(roomId => !progress.testedRooms.includes(roomId));
}

/**
 * Get list of untested objects
 */
export function getUntestedObjects(progress: TestProgress): string[] {
  const allObjects = Object.keys(OBJECTS);
  return allObjects.filter(objectId => !progress.testedObjects.includes(objectId));
}

/**
 * Get objects with incomplete interaction testing
 */
export function getPartiallyTestedObjects(progress: TestProgress): string[] {
  return progress.testedObjects.filter(objectId => {
    const interactions = progress.testedInteractions[objectId] || [];
    // Consider an object partially tested if it has fewer than 3 interactions tested
    return interactions.length < 3;
  });
}
