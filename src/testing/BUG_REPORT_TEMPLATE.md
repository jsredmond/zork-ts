# Bug Report Template and Guidelines

## Standard Bug Report Format

When manually creating or reviewing bug reports, use this template:

```markdown
## Bug ID: BUG-XXX

### Title
[Brief, descriptive title of the issue]

### Description
[Detailed explanation of what's wrong and what should happen instead]

### Category
[One of: PARSER_ERROR, ACTION_ERROR, MISSING_CONTENT, INCORRECT_BEHAVIOR, CRASH, TEXT_ERROR]

### Severity
[One of: CRITICAL, MAJOR, MINOR, TRIVIAL]

### Status
[One of: OPEN, IN_PROGRESS, FIXED, VERIFIED, WONT_FIX]

### Reproduction Steps
1. [First step]
2. [Second step]
3. [Third step]
...

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Game State
- **Current Room**: [Room ID]
- **Inventory**: [List of items]
- **Score**: [Current score]
- **Moves**: [Number of moves]
- **Relevant Flags**: [Any relevant game flags]

### Additional Notes
[Any other relevant information]

### Found Date
[YYYY-MM-DD]

### Fixed Date
[YYYY-MM-DD or N/A]

### Verified Date
[YYYY-MM-DD or N/A]
```

## Bug Categorization Guidelines

### PARSER_ERROR

**When to use**: The parser fails to understand valid input or incorrectly parses commands.

**Examples**:
- "CLIMB TREE" is not recognized as a valid command
- "PUT LAMP IN CASE" is parsed incorrectly
- Synonyms don't work (e.g., "EXAMINE" works but "LOOK AT" doesn't)
- Pronouns fail (e.g., "TAKE IT" doesn't work after examining an object)

**Good Bug Report**:
```markdown
## Bug ID: BUG-042

### Title
Parser doesn't recognize "CLIMB TREE" command

### Description
The parser fails to recognize "CLIMB TREE" as a valid command in the Forest Path,
even though the tree is mentioned in the room description and should be climbable.

### Category
PARSER_ERROR

### Severity
MAJOR

### Reproduction Steps
1. Start new game
2. Go north from West of House
3. Go north to Forest Path
4. Type "CLIMB TREE"

### Expected Behavior
Player should climb the tree or receive a message explaining why they can't.

### Actual Behavior
Parser responds with "I don't understand that command."

### Game State
- **Current Room**: PATH
- **Inventory**: []
- **Score**: 0
- **Moves**: 3
```

### ACTION_ERROR

**When to use**: An action handler fails, behaves incorrectly, or produces wrong output.

**Examples**:
- "TAKE LAMP" doesn't add lamp to inventory
- "OPEN DOOR" opens the wrong door
- "ATTACK TROLL" doesn't trigger combat
- Action succeeds but game state doesn't update

**Good Bug Report**:
```markdown
## Bug ID: BUG-073

### Title
Taking lamp doesn't add it to inventory

### Description
When taking the brass lantern in the Living Room, the game displays "Taken"
but the lamp doesn't appear in inventory and isn't removed from the room.

### Category
ACTION_ERROR

### Severity
CRITICAL

### Reproduction Steps
1. Start new game
2. Open mailbox, take leaflet
3. Go east to Behind House
4. Open window, go west to Kitchen
5. Go west to Living Room
6. Type "TAKE LAMP"
7. Type "INVENTORY"

### Expected Behavior
Lamp should be in inventory and removed from room.

### Actual Behavior
Game says "Taken" but lamp remains in room and isn't in inventory.

### Game State
- **Current Room**: LIVING-ROOM
- **Inventory**: [LEAFLET]
- **Score**: 0
- **Moves**: 7
```

### MISSING_CONTENT

**When to use**: Content is missing, incomplete, or empty.

**Examples**:
- Room description is empty or placeholder text
- Object has no description when examined
- Action produces no output when it should
- Required game text is missing

**Good Bug Report**:
```markdown
## Bug ID: BUG-015

### Title
Painting has no description when examined

### Description
The painting in the Gallery has no description. When examined, the game
displays nothing or a generic "You see nothing special."

### Category
MISSING_CONTENT

### Severity
MINOR

### Reproduction Steps
1. Navigate to Gallery
2. Type "EXAMINE PAINTING"

### Expected Behavior
Should display a description of the painting (from original game:
"The painting depicts a pastoral scene of great beauty.")

### Actual Behavior
Displays "You see nothing special about the painting."

### Game State
- **Current Room**: GALLERY
- **Inventory**: [LAMP, SWORD]
- **Score**: 25
- **Moves**: 45
```

### INCORRECT_BEHAVIOR

**When to use**: Game behavior doesn't match the original Zork I or violates game rules.

**Examples**:
- Troll doesn't attack when player enters room
- Puzzle can be solved in wrong order
- NPC behavior doesn't match original game
- Game state changes incorrectly

**Good Bug Report**:
```markdown
## Bug ID: BUG-089

### Title
Troll doesn't attack player on entry

### Description
When entering the Troll Room with the troll present, the troll should
attack immediately. Instead, the troll does nothing until the player
takes an action.

### Category
INCORRECT_BEHAVIOR

### Severity
MAJOR

### Reproduction Steps
1. Navigate to Troll Room (TROLL-ROOM)
2. Observe troll behavior

### Expected Behavior
Troll should attack immediately upon player entry, displaying combat message.

### Actual Behavior
Troll does nothing. Player can look around and take actions without being attacked.

### Game State
- **Current Room**: TROLL-ROOM
- **Inventory**: [LAMP, SWORD]
- **Score**: 10
- **Moves**: 25
- **Relevant Flags**: troll-alive: true
```

### CRASH

**When to use**: Game crashes, throws an error, or becomes unresponsive.

**Examples**:
- Null pointer exception
- Infinite loop
- Stack overflow
- Unhandled error that stops execution

**Good Bug Report**:
```markdown
## Bug ID: BUG-003

### Title
Game crashes when attacking thief with bare hands

### Description
Attempting to attack the thief without a weapon causes the game to crash
with a null pointer exception.

### Category
CRASH

### Severity
CRITICAL

### Reproduction Steps
1. Navigate to room with thief
2. Drop all weapons
3. Type "ATTACK THIEF"

### Expected Behavior
Game should display message about fighting with bare hands and proceed with combat.

### Actual Behavior
Game crashes with error: "TypeError: Cannot read property 'damage' of undefined"

### Game State
- **Current Room**: MAZE-5
- **Inventory**: [LAMP, ROPE]
- **Score**: 35
- **Moves**: 67
- **Relevant Flags**: thief-alive: true

### Additional Notes
Error occurs in combat.ts line 45. Weapon is undefined when player has no weapon.
```

### TEXT_ERROR

**When to use**: Typos, grammar errors, or text formatting issues.

**Examples**:
- Spelling mistakes
- Grammar errors
- Incorrect punctuation
- Text formatting problems

**Good Bug Report**:
```markdown
## Bug ID: BUG-128

### Title
Typo in mailbox description: "lammp" instead of "lamp"

### Description
The mailbox description contains a typo: "You see a lammp inside" should be
"You see a lamp inside".

### Category
TEXT_ERROR

### Severity
TRIVIAL

### Reproduction Steps
1. Start new game
2. Type "OPEN MAILBOX"

### Expected Behavior
Text should read "Opening the mailbox reveals a leaflet."

### Actual Behavior
Text reads "Opening the mailbx reveals a leaflet." (missing 'o')

### Game State
- **Current Room**: WEST-OF-HOUSE
- **Inventory**: []
- **Score**: 0
- **Moves**: 1
```

## Severity Guidelines

### CRITICAL

**Definition**: Game-breaking issues that prevent progress or cause crashes.

**Characteristics**:
- Prevents game completion
- Causes crashes or data loss
- Makes major features unusable
- No workaround available

**Examples**:
- Game crashes when entering a required room
- Cannot pick up item needed to complete game
- Save/load functionality doesn't work
- Parser completely fails for common commands

**Action**: Fix immediately before any other work.

### MAJOR

**Definition**: Significant issues that break features but don't prevent completion.

**Characteristics**:
- Feature doesn't work as intended
- Workaround is difficult or non-obvious
- Affects multiple users
- Deviates significantly from original game

**Examples**:
- Puzzle can't be solved correctly
- NPC behavior is completely wrong
- Important object interactions don't work
- Parser fails for specific but common commands

**Action**: Fix soon, prioritize over minor issues.

### MINOR

**Definition**: Small issues with easy workarounds.

**Characteristics**:
- Feature mostly works
- Workaround is easy and obvious
- Affects few users
- Minor deviation from original game

**Examples**:
- Synonym doesn't work but main word does
- Object description is incomplete but present
- Minor text inconsistency
- Edge case behavior is wrong

**Action**: Fix when convenient, after major issues.

### TRIVIAL

**Definition**: Cosmetic issues that don't affect gameplay.

**Characteristics**:
- No impact on gameplay
- Purely cosmetic
- Very minor text issues
- Extremely rare edge cases

**Examples**:
- Typos in descriptions
- Minor formatting issues
- Inconsistent capitalization
- Rare edge case with no gameplay impact

**Action**: Fix if time permits, lowest priority.

## Examples of Good Bug Reports

### Example 1: Complete Bug Report

```markdown
## Bug ID: BUG-156

### Title
Cannot open trophy case in Living Room

### Description
The trophy case in the Living Room cannot be opened with the "OPEN CASE" command.
The game responds with "You can't open that" even though the case should be openable
according to the original game.

### Category
ACTION_ERROR

### Severity
MAJOR

### Status
OPEN

### Reproduction Steps
1. Start new game
2. Navigate to Living Room (WEST-OF-HOUSE → EAST → WEST → WEST)
3. Type "EXAMINE CASE" (confirms case is present)
4. Type "OPEN CASE"

### Expected Behavior
The trophy case should open, allowing items to be placed inside. Message should be
"Opened." or similar.

### Actual Behavior
Game responds with "You can't open that."

### Game State
- **Current Room**: LIVING-ROOM
- **Inventory**: [LEAFLET]
- **Score**: 0
- **Moves**: 5
- **Relevant Flags**: case-opened: false

### Additional Notes
The trophy case object has the CONTAINER flag but may be missing the OPENABLE flag.
Check object definition in objects.ts.

### Found Date
2024-12-04

### Fixed Date
N/A

### Verified Date
N/A
```

### Example 2: Parser Error

```markdown
## Bug ID: BUG-201

### Title
"PUT X IN Y" command not recognized for containers

### Description
Multi-word commands using the pattern "PUT [object] IN [container]" are not
recognized by the parser. This is a core command pattern in Zork.

### Category
PARSER_ERROR

### Severity
CRITICAL

### Status
IN_PROGRESS

### Reproduction Steps
1. Start new game
2. Take leaflet from mailbox
3. Navigate to Living Room
4. Type "PUT LEAFLET IN CASE"

### Expected Behavior
Parser should understand the command and attempt to put the leaflet in the case.

### Actual Behavior
Parser responds with "I don't understand that command."

### Game State
- **Current Room**: LIVING-ROOM
- **Inventory**: [LEAFLET]
- **Score**: 0
- **Moves**: 6

### Additional Notes
The parser may be missing the preposition handling for "IN". Check syntax.ts
for preposition definitions and parser.ts for multi-word command handling.

### Found Date
2024-12-03

### Fixed Date
N/A

### Verified Date
N/A
```

### Example 3: Missing Content

```markdown
## Bug ID: BUG-087

### Title
Cellar room has no description

### Description
The Cellar room displays no description when entered. The room should have
a description matching the original game.

### Category
MISSING_CONTENT

### Severity
MAJOR

### Status
FIXED

### Reproduction Steps
1. Navigate to Cellar (WEST-OF-HOUSE → EAST → WEST → DOWN)
2. Observe room description

### Expected Behavior
Should display: "You are in a dark and damp cellar with a narrow passageway
leading north, and a crawlway to the south. On the west is the bottom of a
steep metal ramp which is unclimbable."

### Actual Behavior
Displays only: "Cellar" with no description text.

### Game State
- **Current Room**: CELLAR
- **Inventory**: [LAMP]
- **Score**: 0
- **Moves**: 4

### Additional Notes
Room definition in rooms.ts is missing the description property.

### Found Date
2024-12-02

### Fixed Date
2024-12-04

### Verified Date
N/A
```

## Bug Report Checklist

Before submitting or reviewing a bug report, verify:

- [ ] Title is clear and descriptive
- [ ] Description explains what's wrong and what should happen
- [ ] Category is correct and specific
- [ ] Severity matches the impact guidelines
- [ ] Reproduction steps are complete and numbered
- [ ] Expected behavior is clearly stated
- [ ] Actual behavior is clearly stated
- [ ] Game state includes room, inventory, and relevant flags
- [ ] Additional notes provide context or debugging hints
- [ ] Dates are filled in appropriately

## Common Mistakes to Avoid

### ❌ Vague Title
"Something is broken"

### ✅ Specific Title
"Cannot open trophy case in Living Room"

---

### ❌ Missing Reproduction Steps
"The lamp doesn't work"

### ✅ Complete Reproduction Steps
1. Take lamp from Living Room
2. Go to dark room
3. Type "TURN ON LAMP"
4. Observe that room remains dark

---

### ❌ Wrong Category
Bug: "Game crashes when attacking troll"
Category: ACTION_ERROR (should be CRASH)

### ✅ Correct Category
Bug: "Game crashes when attacking troll"
Category: CRASH

---

### ❌ Wrong Severity
Bug: "Typo in room description"
Severity: CRITICAL (should be TRIVIAL)

### ✅ Correct Severity
Bug: "Typo in room description"
Severity: TRIVIAL

---

### ❌ No Game State
"The puzzle doesn't work"

### ✅ Complete Game State
- **Current Room**: DAM-ROOM
- **Inventory**: [WRENCH, SCREWDRIVER]
- **Score**: 45
- **Moves**: 89
- **Relevant Flags**: dam-open: false, bolt-turned: true

## Automated vs Manual Bug Reports

### Automated Bug Reports

The testing system automatically generates bug reports when tests fail. These reports:
- Are created in `.kiro/testing/bug-reports.json`
- Include all required fields
- Have consistent formatting
- Are assigned sequential IDs

### Manual Bug Reports

When manually reporting bugs:
- Follow the template above
- Be as detailed as possible
- Include all reproduction steps
- Provide context and debugging hints
- Use the bug tracker CLI to add them:

```bash
# The system doesn't have a direct "add bug" command,
# but you can manually edit bug-reports.json following the format
```

## Bug Status Workflow

```
OPEN → IN_PROGRESS → FIXED → VERIFIED
  ↓
WONT_FIX
```

1. **OPEN**: Bug is newly reported, not yet being worked on
2. **IN_PROGRESS**: Someone is actively working on fixing the bug
3. **FIXED**: Code changes have been made to fix the bug
4. **VERIFIED**: Fix has been tested and confirmed to work
5. **WONT_FIX**: Bug will not be fixed (document reason in notes)

## Tips for Effective Bug Reporting

1. **Be Specific**: "Cannot open case" is better than "Something is broken"
2. **Include Context**: Provide game state and relevant flags
3. **Test Thoroughly**: Verify the bug is reproducible
4. **Check Duplicates**: Search existing bugs before reporting
5. **Provide Hints**: If you know the cause, mention it in notes
6. **Update Status**: Keep bug status current as work progresses
7. **Verify Fixes**: Always test that fixes actually work
8. **Document Workarounds**: If a workaround exists, document it

## Related Documentation

- [Testing Guide](TESTING_GUIDE.md) - How to run tests and find bugs
- [Test Examples](TEST_EXAMPLES.md) - Example test outputs and reports
- [README](README.md) - System overview and component details
