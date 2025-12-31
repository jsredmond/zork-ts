================================================================================
PARITY DIFFERENCE ANALYSIS REPORT
================================================================================

Generated: 2025-12-31T00:54:02.714Z

OVERALL SUMMARY
----------------------------------------
Seeds tested: 5
Total commands: 1000
Total differences: 63
  - RNG-related: 43 (68.3%)
  - Logic-related: 20 (31.7%)

Average Total Parity: 93.7%
Average Logic Parity: 98.0%

PER-SEED RESULTS
----------------------------------------
Seed 12345:
  Total Parity: 95.0%
  Logic Parity: 99.5%
  Differences: 10 (RNG: 9, Logic: 1)

Seed 67890:
  Total Parity: 93.5%
  Logic Parity: 98.5%
  Differences: 13 (RNG: 10, Logic: 3)

Seed 54321:
  Total Parity: 97.0%
  Logic Parity: 99.0%
  Differences: 6 (RNG: 4, Logic: 2)

Seed 99999:
  Total Parity: 92.0%
  Logic Parity: 97.0%
  Differences: 16 (RNG: 10, Logic: 6)

Seed 11111:
  Total Parity: 91.0%
  Logic Parity: 96.0%
  Differences: 18 (RNG: 10, Logic: 8)

LOGIC DIFFERENCES BY CATEGORY
----------------------------------------
message_text: 20 occurrences
  Example: "south"
    TS: The windows are all boarded.
    ZM: 
  Example: "drop sword"
    TS: OBJECT_NOT_VISIBLE
    ZM: You don't have that!

RNG DIFFERENCES BY POOL
----------------------------------------
YUKS: 34 occurrences
HELLOS: 1 occurrences
HO_HUM: 8 occurrences

RECOMMENDATIONS
----------------------------------------
⚠️  Logic parity is below 99% - fixes needed

Priority fixes:
  1. message_text (20 occurrences)

================================================================================