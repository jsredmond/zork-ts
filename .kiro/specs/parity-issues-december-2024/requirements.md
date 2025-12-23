# Requirements Document: Fix Parity Issues (December 2024)

## Introduction

This document specifies requirements for fixing critical parity differences discovered through the record-and-compare system testing TypeScript vs Z-Machine (zork1.z3). The comparison revealed 136 differences across 3 test sequences with only 0.74% aggregate parity.

**Current State:**
- Basic Exploration: 29 differences, 0% parity
- Object Manipulation: 39 differences, 0% parity  
- Key Puzzle Solutions: 68 differences, 1.47% parity

**Goal:** Achieve 95%+ parity on all test sequences.

## Glossary

- **Z-Machine**: The original Zork I game running via dfrotz interpreter
- **TypeScript_Engine**: The TypeScript rewrite implementation
- **Parity**: Percentage of commands producing identical output between implementations
- **Room_Description**: Text shown when entering or looking at a room
- **Object_Visibility**: Whether an object appears in room descriptions and can be interacted with

## Requirements

### Requirement 1: Fix Mailbox and Leaflet Visibility

**User Story:** As a player, I want to see the mailbox at the start of the game, so that I can interact with it and get the leaflet.

#### Acceptance Criteria

1. WHEN a player is at West of House THEN THE TypeScript_Engine SHALL display "There is a small mailbox here." in the Room_Description
2. WHEN a player opens the mailbox THEN THE TypeScript_Engine SHALL reveal the leaflet inside
3. WHEN a player types "take leaflet" after opening mailbox THEN THE TypeScript_Engine SHALL respond "Taken."
4. WHEN a player types "read leaflet" while holding it THEN THE TypeScript_Engine SHALL display the welcome message

### Requirement 2: Implement "all" Object Reference

**User Story:** As a player, I want to use "drop all" and "take all" commands, so that I can manage inventory efficiently.

#### Acceptance Criteria

1. WHEN a player types "drop all" THEN THE TypeScript_Engine SHALL drop all inventory items and list each one
2. WHEN a player types "take all" THEN THE TypeScript_Engine SHALL take all visible takeable items and list each one
3. WHEN no items are available for "take all" THEN THE TypeScript_Engine SHALL respond "There's nothing here you can take."
4. IF a player types "drop all" with empty inventory THEN THE TypeScript_Engine SHALL respond appropriately

### Requirement 3: Implement "out" Command

**User Story:** As a player, I want to use "out" as a navigation command, so that I can exit locations naturally.

#### Acceptance Criteria

1. WHEN a player types "out" THEN THE TypeScript_Engine SHALL treat it as an exit/leave direction
2. WHEN "out" is not a valid direction THEN THE TypeScript_Engine SHALL respond "You can't go that way."
3. THE TypeScript_Engine SHALL NOT respond "I don't understand that command." for "out"

### Requirement 4: Enforce Darkness Restrictions

**User Story:** As a player, I want darkness to prevent object manipulation, so that the game mechanics work correctly.

#### Acceptance Criteria

1. WHEN a player is in a dark room without light THEN THE TypeScript_Engine SHALL prevent taking objects
2. WHEN a player tries to take an object in darkness THEN THE TypeScript_Engine SHALL respond "It's too dark to see!"
3. WHEN a player tries to examine an object in darkness THEN THE TypeScript_Engine SHALL respond "It's too dark to see!"
4. WHEN a player enters a dark room THEN THE TypeScript_Engine SHALL still display the room name in output

### Requirement 5: Fix Death and Resurrection

**User Story:** As a player, I want death and resurrection to work correctly, so that I can continue playing after dying.

#### Acceptance Criteria

1. WHEN a player dies THEN THE TypeScript_Engine SHALL preserve essential game state
2. WHEN a player is resurrected THEN THE TypeScript_Engine SHALL place them at the correct resurrection location
3. WHEN a player is resurrected THEN THE TypeScript_Engine SHALL handle inventory according to original game rules
4. THE TypeScript_Engine SHALL NOT corrupt game state after death/resurrection

### Requirement 6: Fix Container Content Display

**User Story:** As a player, I want to see container contents displayed correctly, so that I understand what's inside containers.

#### Acceptance Criteria

1. WHEN displaying a container with contents THEN THE TypeScript_Engine SHALL show contents indented under the container
2. WHEN the bottle contains water THEN THE TypeScript_Engine SHALL display "The glass bottle contains:\n  A quantity of water"
3. THE TypeScript_Engine SHALL NOT display container contents as separate room objects

### Requirement 7: Fix Examine Command

**User Story:** As a player, I want examine to show proper descriptions, so that I can learn about objects.

#### Acceptance Criteria

1. WHEN a player examines an object THEN THE TypeScript_Engine SHALL display the object's description
2. WHEN an object has no special description THEN THE TypeScript_Engine SHALL respond "There's nothing special about the <object>."
3. THE TypeScript_Engine SHALL NOT respond with just the object name when examining

### Requirement 8: Fix Object Naming Consistency

**User Story:** As a player, I want consistent object names, so that the game matches the original.

#### Acceptance Criteria

1. WHEN displaying the sword in inventory THEN THE TypeScript_Engine SHALL use "A sword" not "An elvish sword"
2. WHEN an object is dropped THEN THE TypeScript_Engine SHALL show appropriate "on floor" description
3. THE TypeScript_Engine SHALL NOT show "hanging" description for dropped objects

### Requirement 9: Fix Room Descriptions

**User Story:** As a player, I want room descriptions to match the original, so that navigation works correctly.

#### Acceptance Criteria

1. WHEN a player enters the Clearing from Forest THEN THE TypeScript_Engine SHALL show the correct Clearing description
2. THE TypeScript_Engine SHALL distinguish between different Clearing rooms if multiple exist
3. WHEN displaying Room_Description THEN THE TypeScript_Engine SHALL match Z-Machine text exactly

### Requirement 10: Add Atmospheric Messages

**User Story:** As a player, I want to experience atmospheric messages, so that the game feels immersive.

#### Acceptance Criteria

1. WHEN a player is in certain Forest rooms THEN THE TypeScript_Engine SHALL occasionally display "You hear in the distance the chirping of a song bird."
2. THE TypeScript_Engine SHALL implement atmospheric messages matching original game timing

## Success Metrics

- Basic Exploration sequence: 95%+ parity
- Object Manipulation sequence: 95%+ parity
- Key Puzzle Solutions sequence: 95%+ parity
- All P0 issues resolved
- All P1 issues resolved

## Out of Scope

- Status bar display (terminal implementation difference acceptable)
- Exact line wrapping (formatting difference acceptable)
- Performance optimization

## Verification

Run comparison tests:
```bash
npx tsx scripts/record-and-compare.ts --batch --format text scripts/sequences/
```
