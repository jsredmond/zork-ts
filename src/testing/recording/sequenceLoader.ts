/**
 * Command Sequence Loader
 * 
 * Loads and parses command sequence files for game recording and comparison.
 * Supports comments (# prefix) and file includes (@include directive).
 * 
 * @module testing/recording/sequenceLoader
 */

import * as fs from 'fs';
import * as path from 'path';
import { CommandSequence } from './types';

/**
 * Error thrown when parsing a command sequence file fails
 */
export class SequenceParseError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly lineNumber?: number
  ) {
    const location = lineNumber !== undefined 
      ? `${filePath}:${lineNumber}` 
      : filePath;
    super(`${message} at ${location}`);
    this.name = 'SequenceParseError';
  }
}

/**
 * Options for loading command sequences
 */
export interface LoadOptions {
  /** Maximum depth for recursive includes (default: 10) */
  maxIncludeDepth?: number;
  /** Base directory for resolving relative include paths */
  basePath?: string;
}

/**
 * Loads and parses command sequence files.
 * 
 * File format:
 * - One command per line
 * - Lines starting with # are comments (ignored)
 * - Empty lines are ignored
 * - @include <path> includes another file's commands
 * - Metadata can be specified with #! prefix (e.g., #!name: My Sequence)
 */
export class CommandSequenceLoader {
  private readonly defaultMaxIncludeDepth = 10;

  /**
   * Load a command sequence from a file
   * 
   * @param filePath - Path to the command sequence file
   * @param options - Loading options
   * @returns Parsed command sequence
   * @throws SequenceParseError if the file cannot be parsed
   */
  load(filePath: string, options?: LoadOptions): CommandSequence {
    const resolvedPath = path.resolve(filePath);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new SequenceParseError('File not found', resolvedPath);
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const basePath = options?.basePath ?? path.dirname(resolvedPath);
    const maxDepth = options?.maxIncludeDepth ?? this.defaultMaxIncludeDepth;

    const { commands, metadata } = this.parseContent(
      content, 
      resolvedPath, 
      basePath, 
      maxDepth, 
      new Set([resolvedPath])
    );

    // Generate ID from filename
    const id = path.basename(filePath, path.extname(filePath));
    
    return {
      id: metadata.id ?? id,
      name: metadata.name ?? id,
      description: metadata.description,
      commands,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
  }

  /**
   * Load all command sequence files from a directory
   * 
   * @param dirPath - Path to directory containing sequence files
   * @param options - Loading options
   * @returns Array of parsed command sequences
   */
  loadDirectory(dirPath: string, options?: LoadOptions): CommandSequence[] {
    const resolvedPath = path.resolve(dirPath);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new SequenceParseError('Directory not found', resolvedPath);
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      throw new SequenceParseError('Path is not a directory', resolvedPath);
    }

    const files = fs.readdirSync(resolvedPath)
      .filter(f => f.endsWith('.txt'))
      .sort();

    return files.map(file => 
      this.load(path.join(resolvedPath, file), options)
    );
  }

  /**
   * Parse file content into commands and metadata
   */
  private parseContent(
    content: string,
    filePath: string,
    basePath: string,
    maxDepth: number,
    visitedFiles: Set<string>
  ): { commands: string[]; metadata: Record<string, string> } {
    const lines = content.split(/\r?\n/);
    const commands: string[] = [];
    const metadata: Record<string, string> = {};

    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1;
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (trimmed === '') {
        continue;
      }

      // Handle metadata comments (#!key: value)
      if (trimmed.startsWith('#!')) {
        const metaContent = trimmed.slice(2).trim();
        const colonIndex = metaContent.indexOf(':');
        if (colonIndex > 0) {
          const key = metaContent.slice(0, colonIndex).trim();
          const value = metaContent.slice(colonIndex + 1).trim();
          metadata[key] = value;
        }
        continue;
      }

      // Skip regular comments
      if (trimmed.startsWith('#')) {
        continue;
      }

      // Handle @include directive
      if (trimmed.startsWith('@include')) {
        const includePath = trimmed.slice(8).trim();
        if (!includePath) {
          throw new SequenceParseError(
            'Missing file path in @include directive',
            filePath,
            lineNumber
          );
        }

        const resolvedInclude = path.resolve(basePath, includePath);
        
        // Check for circular includes
        if (visitedFiles.has(resolvedInclude)) {
          throw new SequenceParseError(
            `Circular include detected: ${includePath}`,
            filePath,
            lineNumber
          );
        }

        // Check include depth
        if (visitedFiles.size >= maxDepth) {
          throw new SequenceParseError(
            `Maximum include depth (${maxDepth}) exceeded`,
            filePath,
            lineNumber
          );
        }

        // Check if included file exists
        if (!fs.existsSync(resolvedInclude)) {
          throw new SequenceParseError(
            `Included file not found: ${includePath}`,
            filePath,
            lineNumber
          );
        }

        // Recursively parse included file
        const includeContent = fs.readFileSync(resolvedInclude, 'utf-8');
        const newVisited = new Set(visitedFiles);
        newVisited.add(resolvedInclude);
        
        const { commands: includedCommands } = this.parseContent(
          includeContent,
          resolvedInclude,
          path.dirname(resolvedInclude),
          maxDepth,
          newVisited
        );
        
        commands.push(...includedCommands);
        continue;
      }

      // Regular command line
      commands.push(trimmed);
    }

    return { commands, metadata };
  }

  /**
   * Serialize a command sequence back to file format
   * 
   * @param sequence - The command sequence to serialize
   * @returns String content suitable for writing to a file
   */
  serialize(sequence: CommandSequence): string {
    const lines: string[] = [];

    // Add metadata
    if (sequence.name && sequence.name !== sequence.id) {
      lines.push(`#!name: ${sequence.name}`);
    }
    if (sequence.description) {
      lines.push(`#!description: ${sequence.description}`);
    }
    if (sequence.metadata) {
      for (const [key, value] of Object.entries(sequence.metadata)) {
        if (key !== 'name' && key !== 'description' && key !== 'id') {
          lines.push(`#!${key}: ${value}`);
        }
      }
    }

    // Add blank line after metadata if there was any
    if (lines.length > 0) {
      lines.push('');
    }

    // Add commands
    lines.push(...sequence.commands);

    return lines.join('\n');
  }

  /**
   * Parse commands from a string (without file I/O)
   * 
   * @param content - String content to parse
   * @param id - ID to assign to the sequence
   * @returns Parsed command sequence
   */
  parseString(content: string, id: string = 'inline'): CommandSequence {
    const lines = content.split(/\r?\n/);
    const commands: string[] = [];
    const metadata: Record<string, string> = {};

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (trimmed === '') {
        continue;
      }

      // Handle metadata comments
      if (trimmed.startsWith('#!')) {
        const metaContent = trimmed.slice(2).trim();
        const colonIndex = metaContent.indexOf(':');
        if (colonIndex > 0) {
          const key = metaContent.slice(0, colonIndex).trim();
          const value = metaContent.slice(colonIndex + 1).trim();
          metadata[key] = value;
        }
        continue;
      }

      // Skip regular comments
      if (trimmed.startsWith('#')) {
        continue;
      }

      // @include not supported in string parsing
      if (trimmed.startsWith('@include')) {
        throw new Error('@include directive not supported in parseString');
      }

      // Regular command
      commands.push(trimmed);
    }

    return {
      id: metadata.id ?? id,
      name: metadata.name ?? id,
      description: metadata.description,
      commands,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
  }
}
