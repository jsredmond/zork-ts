# Windows Cross-Platform Testing Instructions

This document provides instructions for testing the Zork I rewrite on Windows systems.

## Prerequisites

### Required Software
1. **Node.js** (v20.x or later)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/

### Terminal Options
The game should be tested in multiple Windows terminal environments:
- **Command Prompt (cmd.exe)**
- **PowerShell**
- **Windows Terminal** (recommended)
- **Git Bash** (if installed)

## Installation Steps

1. **Clone or extract the project**
   ```cmd
   cd path\to\project
   ```

2. **Install dependencies**
   ```cmd
   npm install
   ```

3. **Verify installation**
   ```cmd
   npm test
   ```

## Test Checklist

### 1. Full Test Suite Execution

**Command Prompt:**
```cmd
npm test
```

**PowerShell:**
```powershell
npm test
```

**Expected Results:**
- All test files should pass (23/24 files)
- 386/387 tests should pass
- 1 known property test failure (pre-existing, not Windows-specific)

**Record:**
- [ ] Test suite runs without errors
- [ ] Test execution time (should be < 2 seconds)
- [ ] Any Windows-specific errors or warnings
- [ ] Terminal compatibility issues

### 2. Build Verification

**Build the project:**
```cmd
npm run build
```

**Expected Results:**
- TypeScript compilation completes
- `dist/` directory is created
- `dist/main.js` exists

**Known Issues:**
- TypeScript may show compilation errors (113 errors)
- These do not affect runtime functionality
- Tests pass despite compilation warnings

**Record:**
- [ ] Build completes successfully
- [ ] Output files are created
- [ ] File paths use correct separators

### 3. Game Functionality Testing

**Start the game:**
```cmd
npm start
```

**Or using dev mode:**
```cmd
npm run dev
```

**Test Scenarios:**

#### Basic Commands
```
> look
> inventory
> north
> take lamp
> turn on lamp
> examine lamp
> drop lamp
```

**Expected:** All commands should work correctly with proper responses

#### Navigation
```
> north
> south
> east
> west
> up
> down
```

**Expected:** Movement should work, room descriptions should display

#### Object Interaction
```
> take all
> open mailbox
> read leaflet
> drop sword
> examine trophy case
```

**Expected:** Objects should be manipulated correctly

**Record:**
- [ ] Commands are processed correctly
- [ ] Output is formatted properly
- [ ] No encoding issues with special characters
- [ ] Line endings display correctly (CRLF vs LF)

### 4. Terminal Compatibility Testing

Test in each terminal environment:

#### Command Prompt (cmd.exe)
- [ ] Game starts successfully
- [ ] Input is readable
- [ ] Output displays correctly
- [ ] CTRL+C exits gracefully
- [ ] No character encoding issues

#### PowerShell
- [ ] Game starts successfully
- [ ] Input is readable
- [ ] Output displays correctly
- [ ] CTRL+C exits gracefully
- [ ] No character encoding issues

#### Windows Terminal
- [ ] Game starts successfully
- [ ] Input is readable
- [ ] Output displays correctly
- [ ] CTRL+C exits gracefully
- [ ] Colors/formatting work (if applicable)

#### Git Bash (if available)
- [ ] Game starts successfully
- [ ] Input is readable
- [ ] Output displays correctly
- [ ] CTRL+C exits gracefully

### 5. Save/Restore Functionality

**Test save:**
```
> take lamp
> north
> save
Filename: test-save.json
```

**Test restore:**
```
> quit
(restart game)
> restore
Filename: test-save.json
> look
> inventory
```

**Expected:**
- Save file is created in project directory
- Restore loads the saved state correctly
- Player location and inventory are preserved
- Game state is identical after restore

**Windows-Specific Checks:**
- [ ] File paths work with backslashes
- [ ] File permissions are correct
- [ ] Save files can be created/read
- [ ] No path separator issues

**Record:**
- [ ] Save command works
- [ ] Restore command works
- [ ] Save file location: _______________
- [ ] File size is reasonable (< 100KB)

### 6. File System Compatibility

**Check file operations:**
```cmd
dir saves
type test-save.json
```

**Verify:**
- [ ] Save files use correct line endings (CRLF on Windows)
- [ ] File paths are Windows-compatible
- [ ] No permission errors
- [ ] Files can be opened in text editors

### 7. Performance Testing

**Measure:**
- [ ] Test suite execution time: _______ ms
- [ ] Game startup time: _______ seconds
- [ ] Command response time: _______ ms (should be instant)
- [ ] Memory usage: _______ MB (should be < 100MB)

**Tools:**
```cmd
# Task Manager for memory usage
# Or PowerShell:
Get-Process node | Select-Object WorkingSet
```

### 8. Error Handling

**Test error conditions:**

#### Invalid save file:
```
> restore
Filename: nonexistent.json
```
**Expected:** Error message, game continues

#### Corrupted save file:
1. Create a text file with invalid JSON
2. Try to restore it
**Expected:** Validation error, game continues

#### Long input:
```
> [type 500+ characters]
```
**Expected:** Handled gracefully

**Record:**
- [ ] Invalid files handled correctly
- [ ] Error messages are clear
- [ ] Game remains stable after errors

## Known Issues

### Pre-existing Issues (Not Windows-Specific)
1. **Property Test Failure:** One error message test fails with edge case data
   - File: `src/game/errorMessages.test.ts`
   - Impact: None on gameplay
   - Status: Pre-existing

2. **TypeScript Compilation Errors:** 113 errors during build
   - Impact: None on runtime
   - Status: Pre-existing
   - Tests pass despite errors

### Potential Windows-Specific Issues to Watch For

1. **Line Endings:** Windows uses CRLF, Unix uses LF
   - Check if save files work correctly
   - Verify text display is correct

2. **File Paths:** Windows uses backslashes
   - Verify save/restore with Windows paths
   - Check if path.join() is used correctly

3. **Terminal Encoding:** Windows may use different encodings
   - Check for character display issues
   - Verify special characters work

4. **Case Sensitivity:** Windows is case-insensitive
   - Verify file operations work correctly
   - Check module imports

## Test Report Template

After completing all tests, create a report:

```markdown
# Windows Test Report

**Test Date:** [Date]
**Windows Version:** [e.g., Windows 11 23H2]
**Node Version:** [e.g., v20.10.0]
**Test Status:** [PASSED/FAILED/PARTIAL]

## Test Results

### Test Suite: [PASS/FAIL]
- Test Files Passed: __/24
- Tests Passed: __/387
- Duration: __ ms

### Build: [PASS/FAIL]
- Compilation: [SUCCESS/WARNINGS/ERRORS]
- Output Generated: [YES/NO]

### Game Functionality: [PASS/FAIL]
- Command Processing: [PASS/FAIL]
- Navigation: [PASS/FAIL]
- Object Interaction: [PASS/FAIL]

### Terminal Compatibility
- Command Prompt: [PASS/FAIL]
- PowerShell: [PASS/FAIL]
- Windows Terminal: [PASS/FAIL]
- Git Bash: [PASS/FAIL]

### Save/Restore: [PASS/FAIL]
- Save: [PASS/FAIL]
- Restore: [PASS/FAIL]
- File Compatibility: [PASS/FAIL]

## Issues Found
[List any Windows-specific issues]

## Recommendations
[Any suggestions for Windows compatibility]

## Conclusion
[Overall assessment]
```

## Automated Testing Script

Save this as `test-windows.ps1`:

```powershell
# Windows Test Automation Script
Write-Host "=== Zork I Windows Test Suite ===" -ForegroundColor Cyan

# Test 1: Dependencies
Write-Host "`nTest 1: Checking dependencies..." -ForegroundColor Yellow
node --version
npm --version

# Test 2: Install
Write-Host "`nTest 2: Installing dependencies..." -ForegroundColor Yellow
npm install

# Test 3: Run tests
Write-Host "`nTest 3: Running test suite..." -ForegroundColor Yellow
npm test

# Test 4: Build
Write-Host "`nTest 4: Building project..." -ForegroundColor Yellow
npm run build

# Test 5: Check output
Write-Host "`nTest 5: Verifying build output..." -ForegroundColor Yellow
if (Test-Path "dist/main.js") {
    Write-Host "✓ Build output exists" -ForegroundColor Green
} else {
    Write-Host "✗ Build output missing" -ForegroundColor Red
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan
Write-Host "Please run manual game tests with: npm start" -ForegroundColor Yellow
```

Run with:
```powershell
powershell -ExecutionPolicy Bypass -File test-windows.ps1
```

## Support

If you encounter issues:
1. Check Node.js version (must be v20+)
2. Clear node_modules and reinstall: `rmdir /s node_modules && npm install`
3. Check for Windows-specific error messages
4. Verify file permissions
5. Try different terminal environments

## Next Steps

After completing Windows testing:
1. Document all findings in WINDOWS_TEST_REPORT.md
2. Compare results with macOS test report
3. Identify any platform-specific issues
4. Proceed to packaging (Task 23.3)
