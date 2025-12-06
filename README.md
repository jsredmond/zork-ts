# Zork I Source Code Collection

Zork I is a 1980 interactive fiction game written by Marc Blank, Dave Lebling, Bruce Daniels and Tim Anderson and published by Infocom.

Further information on Zork I:

* [Wikipedia](https://en.wikipedia.org/wiki/Zork_I)
* [The Digital Antiquarian](https://www.filfre.net/2012/01/selling-zork/)
* [The Interactive Fiction Database](https://ifdb.tads.org/viewgame?id=0dbnusxunq7fw5ro)
* [The Infocom Gallery](http://gallery.guetech.org/zork1/zork1.html)
* [IFWiki](http://www.ifwiki.org/index.php/Zork_I)

__What is this Repository?__

This repository is a directory of source code for the Infocom game "Zork I", including a variety of files both used and discarded in the production of the game. It is written in ZIL (Zork Implementation Language), a refactoring of MDL (Muddle), itself a dialect of LISP created by MIT students and staff.

The source code was contributed anonymously and represents a snapshot of the Infocom development system at time of shutdown - there is no remaining way to compare it against any official version as of this writing, and so it should be considered canonical, but not necessarily the exact source code arrangement for production.

__Basic Information on the Contents of This Repository__

It is mostly important to note that there is currently no known way to compile the source code in this repository into a final "Z-machine Interpreter Program" (ZIP) file using an official Infocom-built compiler. There is a user-maintained compiler named [ZILF](http://zilf.io) that has been shown to successfully compile these .ZIL files with minor issues. There are .ZIP files in some of the Infocom Source Code repositories but they were there as of final spin-down of the Infocom Drive and the means to create them is currently lost.

Throughout its history, Infocom used a TOPS20 mainframe with a compiler (ZILCH) to create and edit language files - this repository is a mirror of the source code directory archive of Infocom but could represent years of difference from what was originally released.

In general, Infocom games were created by taking previous Infocom source code, copying the directory, and making changes until the game worked the way the current Implementor needed. Structure, therefore, tended to follow from game to game and may or may not accurately reflect the actual function of the code.

There are also multiple versions of the "Z-Machine" and code did change notably between the first years of Infocom and a decade later. Addition of graphics, sound and memory expansion are all slowly implemented over time.

__TypeScript Rewrite Status__

This repository includes a modern TypeScript rewrite of Zork I, providing a playable version with comprehensive testing and validation.

**Current Status:**
- ✅ **Gameplay**: 100% complete - all puzzles solvable, all NPCs functional
- ✅ **Test Accuracy**: 100% - all automated tests passing
- ⚠️ **Text Accuracy**: 72.77% (676/929 messages) - core gameplay messages complete
  - 100% special object behaviors
  - 100% high-priority messages
  - 85.7% scenery interactions
  - 83.7% critical messages
  - Target: 95% coverage

**Key Features:**
- Full game implementation in TypeScript
- Comprehensive test suite with property-based testing
- Message validation against original ZIL source
- Save/restore functionality
- Terminal-based interface

**Documentation:**
- [Final Accuracy Report](.kiro/testing/final-accuracy-report.md)
- [Implementation Status](.kiro/testing/text-validation-status.md)
- [Message Accuracy Summary](.kiro/testing/message-accuracy-summary.md)

**Known Limitations:**
- Some conditional message variations not yet implemented (188 messages)
- Generic message variations partially complete (32 messages remaining)
- Edge case error messages may use generic fallbacks (12 messages remaining)

The rewrite provides an authentic Zork I experience with all core gameplay features working correctly. Remaining messages are primarily edge cases and variations that do not affect gameplay completeness.

---

__What is the Purpose of this Repository__

This collection is meant for education, discussion, and historical work, allowing researchers and students to study how code was made for these interactive fiction games and how the system dealt with input and processing.

The TypeScript rewrite demonstrates modern software engineering practices applied to classic interactive fiction, including systematic testing, validation, and documentation.

Researchers are encouraged to share their discoveries about the information in this source code and the history of Infocom and its many innovative employees.
