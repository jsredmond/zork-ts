# Spec Creation Guidelines

## Task List Format

When creating a `tasks.md` file for a spec, follow these guidelines:

### Git Commit Checkpoints

Add a git commit step after completing each major task group (after the last subtask of each major number). This ensures incremental progress is saved and provides clear rollback points.

**Pattern**: After completing all subtasks for task N, add task N+0.5 for git commit.

**Example**:
```markdown
- [ ] 1. Set up environment
  - Description of task
  - _Requirements: X.X_

- [ ] 1.1 Install dependencies
  - Specific subtask
  - _Requirements: X.X_

- [ ] 1.2 Configure settings
  - Specific subtask
  - _Requirements: X.X_

- [ ] 1.5 Commit to Git
  - Commit message: "feat: Set up environment for [feature]"
  - Include all files from task 1
  - _Requirements: X.X_

---

- [ ] 2. Implement core functionality
  - Description of task
  - _Requirements: X.X_

- [ ] 2.1 Create main module
  - Specific subtask
  - _Requirements: X.X_

- [ ] 2.2 Add helper functions
  - Specific subtask
  - _Requirements: X.X_

- [ ] 2.3 Write tests
  - Specific subtask
  - _Requirements: X.X_

- [ ] 2.5 Commit to Git
  - Commit message: "feat: Implement core functionality for [feature]"
  - Include all files from task 2
  - _Requirements: X.X_
```

### Commit Message Format

Use conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `test:` for tests
- `refactor:` for refactoring
- `chore:` for maintenance

### When to Add Commit Steps

- After completing a major task group (all subtasks of a numbered task)
- After completing a phase or milestone
- Before moving to a significantly different type of work
- At natural breakpoints where you'd want to save progress

### Benefits

1. **Incremental Progress**: Save work frequently
2. **Clear History**: Each commit represents a complete unit of work
3. **Easy Rollback**: Can revert to any checkpoint
4. **Progress Tracking**: Git history shows implementation progress
5. **Collaboration**: Others can see what's been completed

## Task Numbering

- Major tasks: 1, 2, 3, etc.
- Subtasks: 1.1, 1.2, 1.3, etc.
- Git commits: 1.5, 2.5, 3.5, etc. (after last subtask)
- Use X.5 for git commits (leaves room for additional subtasks if needed)

## Example Full Task Structure

```markdown
## Phase 1: Setup (Week 1)

- [ ] 1. Initialize project
  - Set up project structure
  - _Requirements: 1.1, 1.2_

- [ ] 1.1 Create directory structure
  - Create all necessary folders
  - _Requirements: 1.1_

- [ ] 1.2 Initialize configuration
  - Set up config files
  - _Requirements: 1.2_

- [ ] 1.5 Commit to Git
  - Commit message: "feat: Initialize project structure"
  - Include all setup files
  - _Requirements: 1.1, 1.2_

---

- [ ] 2. Implement feature A
  - Core functionality for feature A
  - _Requirements: 2.1, 2.2_

- [ ] 2.1 Create module A
  - Implement main logic
  - _Requirements: 2.1_

- [ ] 2.2 Add tests for module A
  - Write comprehensive tests
  - _Requirements: 2.2_

- [ ] 2.5 Commit to Git
  - Commit message: "feat: Implement feature A"
  - Include module A and tests
  - _Requirements: 2.1, 2.2_

---

- [ ] 3. Implement feature B
  - Core functionality for feature B
  - _Requirements: 3.1, 3.2_

- [ ] 3.1 Create module B
  - Implement main logic
  - _Requirements: 3.1_

- [ ] 3.2 Add tests for module B
  - Write comprehensive tests
  - _Requirements: 3.2_

- [ ] 3.5 Commit to Git
  - Commit message: "feat: Implement feature B"
  - Include module B and tests
  - _Requirements: 3.1, 3.2_

---

## Phase 2: Integration (Week 2)

- [ ] 4. Integrate features
  - Combine A and B
  - _Requirements: 4.1_

- [ ] 4.1 Create integration layer
  - Wire features together
  - _Requirements: 4.1_

- [ ] 4.2 Add integration tests
  - Test combined functionality
  - _Requirements: 4.1_

- [ ] 4.5 Commit to Git
  - Commit message: "feat: Integrate features A and B"
  - Include integration code and tests
  - _Requirements: 4.1_

---

- [ ] 5. Final verification
  - Comprehensive testing
  - _Requirements: 5.1_

- [ ] 5.1 Run all tests
  - Verify everything works
  - _Requirements: 5.1_

- [ ] 5.2 Generate report
  - Document completion
  - _Requirements: 5.1_

- [ ] 5.5 Final commit and tag
  - Commit message: "feat: Complete [feature name]"
  - Tag: v1.0.0-[feature-name]
  - _Requirements: 5.1_
```

## Notes

- The X.5 numbering leaves room for additional subtasks (X.3, X.4) if needed
- Always include a descriptive commit message
- Reference the requirements being fulfilled
- Group related changes in a single commit
- Commit after completing a logical unit of work
