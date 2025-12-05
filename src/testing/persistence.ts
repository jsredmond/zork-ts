/**
 * Test data persistence utilities
 * Handles reading and writing test progress and bug reports to JSON files
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestProgress, BugDatabase, BugReport } from './types';
import { serializeTestProgress, deserializeTestProgress, createTestProgress } from './testProgress';

const TESTING_DIR = '.kiro/testing';
const TEST_PROGRESS_FILE = path.join(TESTING_DIR, 'test-progress.json');
const BUG_REPORTS_FILE = path.join(TESTING_DIR, 'bug-reports.json');

/**
 * Ensure the testing directory exists
 */
export function ensureTestingDirectory(): void {
  if (!fs.existsSync(TESTING_DIR)) {
    fs.mkdirSync(TESTING_DIR, { recursive: true });
  }
}

/**
 * Load test progress from file
 * Returns null if file doesn't exist or is corrupted
 */
export function loadTestProgress(): TestProgress | null {
  try {
    if (!fs.existsSync(TEST_PROGRESS_FILE)) {
      return null;
    }

    const data = fs.readFileSync(TEST_PROGRESS_FILE, 'utf-8');
    
    // Handle empty file
    if (!data.trim()) {
      console.warn('Test progress file is empty');
      return null;
    }
    
    // Use deserializer with validation
    const progress = deserializeTestProgress(data);
    return progress;
  } catch (error) {
    console.error('Error loading test progress (file may be corrupted):', error);
    // Return null for corrupted files as per requirements
    return null;
  }
}

/**
 * Save test progress to file
 */
export function saveTestProgress(progress: TestProgress): void {
  try {
    ensureTestingDirectory();
    const data = serializeTestProgress(progress);
    fs.writeFileSync(TEST_PROGRESS_FILE, data, 'utf-8');
  } catch (error) {
    console.error('Error saving test progress:', error);
    throw error;
  }
}

/**
 * Create a new empty test progress object
 */
export function createEmptyTestProgress(): TestProgress {
  return createTestProgress();
}

/**
 * Load bug reports from file
 * Returns empty database if file doesn't exist
 */
export function loadBugReports(): BugDatabase {
  try {
    if (!fs.existsSync(BUG_REPORTS_FILE)) {
      return { bugs: [] };
    }

    const data = fs.readFileSync(BUG_REPORTS_FILE, 'utf-8');
    const database = JSON.parse(data);
    
    // Convert date strings back to Date objects
    database.bugs = database.bugs.map((bug: any) => ({
      ...bug,
      foundDate: new Date(bug.foundDate),
      fixedDate: bug.fixedDate ? new Date(bug.fixedDate) : undefined,
      verifiedDate: bug.verifiedDate ? new Date(bug.verifiedDate) : undefined
    }));
    
    return database;
  } catch (error) {
    console.error('Error loading bug reports:', error);
    return { bugs: [] };
  }
}

/**
 * Save bug reports to file
 */
export function saveBugReports(database: BugDatabase): void {
  try {
    ensureTestingDirectory();
    const data = JSON.stringify(database, null, 2);
    fs.writeFileSync(BUG_REPORTS_FILE, data, 'utf-8');
  } catch (error) {
    console.error('Error saving bug reports:', error);
    throw error;
  }
}

/**
 * Add a bug report to the database
 */
export function addBugReport(bug: BugReport): void {
  const database = loadBugReports();
  database.bugs.push(bug);
  saveBugReports(database);
}

/**
 * Update an existing bug report
 */
export function updateBugReport(bugId: string, updates: Partial<BugReport>): void {
  const database = loadBugReports();
  const bugIndex = database.bugs.findIndex(b => b.id === bugId);
  
  if (bugIndex === -1) {
    throw new Error(`Bug with ID ${bugId} not found`);
  }
  
  database.bugs[bugIndex] = {
    ...database.bugs[bugIndex],
    ...updates
  };
  
  saveBugReports(database);
}

/**
 * Get all bugs with optional filtering
 */
export function getBugs(filter?: {
  status?: string;
  category?: string;
  severity?: string;
}): BugReport[] {
  const database = loadBugReports();
  
  if (!filter) {
    return database.bugs;
  }
  
  return database.bugs.filter(bug => {
    if (filter.status && bug.status !== filter.status) return false;
    if (filter.category && bug.category !== filter.category) return false;
    if (filter.severity && bug.severity !== filter.severity) return false;
    return true;
  });
}

/**
 * Generate a unique bug ID
 */
export function generateBugId(): string {
  const database = loadBugReports();
  const maxId = database.bugs.reduce((max, bug) => {
    const match = bug.id.match(/BUG-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 0);
  
  return `BUG-${String(maxId + 1).padStart(3, '0')}`;
}
