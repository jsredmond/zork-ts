/**
 * Object System
 * Defines game objects and their properties
 */

import { ObjectFlag } from './data/flags.js';

/**
 * GameObject interface defines the structure of all game objects
 * Based on ZIL object definitions from 1dungeon.zil
 */
export interface GameObject {
  id: string;
  name: string;
  synonyms: string[];
  adjectives: string[];
  description: string;
  location: string | null;
  properties: Map<string, any>;
  flags: Set<ObjectFlag>;
  capacity?: number;
  size?: number;
  value?: number;
}

/**
 * GameObjectImpl provides a concrete implementation of GameObject
 * Manages object state including location, flags, and properties
 */
export class GameObjectImpl implements GameObject {
  id: string;
  name: string;
  synonyms: string[];
  adjectives: string[];
  description: string;
  location: string | null;
  properties: Map<string, any>;
  flags: Set<ObjectFlag>;
  capacity?: number;
  size?: number;
  value?: number;

  constructor(data: {
    id: string;
    name: string;
    synonyms?: string[];
    adjectives?: string[];
    description: string;
    location?: string | null;
    flags?: ObjectFlag[];
    capacity?: number;
    size?: number;
    value?: number;
    properties?: Map<string, any>;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.synonyms = data.synonyms || [];
    this.adjectives = data.adjectives || [];
    this.description = data.description;
    this.location = data.location || null;
    this.flags = new Set(data.flags || []);
    this.capacity = data.capacity;
    this.size = data.size;
    this.value = data.value;
    this.properties = data.properties || new Map();
  }

  /**
   * Check if object has a specific flag
   */
  hasFlag(flag: ObjectFlag): boolean {
    return this.flags.has(flag);
  }

  /**
   * Add a flag to the object
   */
  addFlag(flag: ObjectFlag): void {
    this.flags.add(flag);
  }

  /**
   * Remove a flag from the object
   */
  removeFlag(flag: ObjectFlag): void {
    this.flags.delete(flag);
  }

  /**
   * Toggle a flag on the object
   */
  toggleFlag(flag: ObjectFlag): void {
    if (this.flags.has(flag)) {
      this.flags.delete(flag);
    } else {
      this.flags.add(flag);
    }
  }

  /**
   * Get a property value
   */
  getProperty(key: string): any {
    return this.properties.get(key);
  }

  /**
   * Set a property value
   */
  setProperty(key: string, value: any): void {
    this.properties.set(key, value);
  }

  /**
   * Check if object is takeable
   */
  isTakeable(): boolean {
    return this.hasFlag(ObjectFlag.TAKEBIT);
  }

  /**
   * Check if object is a container
   */
  isContainer(): boolean {
    return this.hasFlag(ObjectFlag.CONTBIT);
  }

  /**
   * Check if container is open
   */
  isOpen(): boolean {
    return this.hasFlag(ObjectFlag.OPENBIT);
  }

  /**
   * Check if object provides light
   */
  providesLight(): boolean {
    return this.hasFlag(ObjectFlag.LIGHTBIT) && this.hasFlag(ObjectFlag.ONBIT);
  }
}
