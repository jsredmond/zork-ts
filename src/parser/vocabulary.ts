/**
 * Vocabulary - Word definitions
 * Manages game vocabulary and word lookup
 */

/**
 * ============================================================================
 * WORD TYPE CONFLICTS - Documentation
 * ============================================================================
 *
 * Some words in Zork can logically belong to multiple categories (verb, noun,
 * adjective, direction, preposition). This section documents these conflicts
 * and explains how they are resolved based on the original ZIL classification.
 *
 * RESOLUTION PRINCIPLE: When a word appears in multiple ZIL categories, we use
 * the PRIMARY type based on how the word is most commonly used in gameplay.
 * The parser handles context-sensitive disambiguation where needed.
 *
 * ----------------------------------------------------------------------------
 * CONFLICT: LIGHT (verb vs noun)
 * ----------------------------------------------------------------------------
 * - ZIL Classification: VERB (primary) - <SYNTAX LIGHT OBJECT = V-LAMP-ON>
 * - Alternative: NOUN - could refer to light sources (lamp, lantern)
 * - Resolution: VERB - "light lamp" is the primary use case
 * - Note: Objects use specific synonyms (LAMP, LANTERN) instead of LIGHT
 * - The word LIGHT is NOT added as a noun to avoid parser ambiguity
 *
 * ----------------------------------------------------------------------------
 * CONFLICT: WEST (direction vs adjective)
 * ----------------------------------------------------------------------------
 * - ZIL Classification: DIRECTION (primary) - movement command
 * - Alternative: ADJECTIVE - "west door" in wooden door description
 * - Resolution: DIRECTION - navigation is the primary use
 * - Note: The "west of house" door is identified by WOODEN, GOTHIC adjectives
 * - WEST is NOT added as an adjective to preserve direction parsing
 *
 * ----------------------------------------------------------------------------
 * CONFLICT: UP (direction vs noun)
 * ----------------------------------------------------------------------------
 * - ZIL Classification: DIRECTION (primary) - movement command
 * - Alternative: NOUN - "look up" could treat UP as a target
 * - Resolution: DIRECTION - "go up", "climb up" are primary uses
 * - Note: UP was previously in nouns but removed to avoid conflicts
 * - The parser handles "look up" as a direction-based look command
 *
 * ----------------------------------------------------------------------------
 * CONFLICT: OUT (direction vs preposition)
 * ----------------------------------------------------------------------------
 * - ZIL Classification: DIRECTION (primary) - <SYNONYM OUT EXIT LEAVE>
 * - Alternative: PREPOSITION - "blow out candle", "take out sword"
 * - Resolution: DIRECTION - "go out", "exit" are primary uses
 * - Note: OUT was moved from prepositions to directions for parity
 * - Commands like "blow out" work because BLOW is the verb
 *
 * ----------------------------------------------------------------------------
 * CONFLICT: IN (direction vs preposition)
 * ----------------------------------------------------------------------------
 * - ZIL Classification: PREPOSITION (primary) - "put X in Y", "look in box"
 * - Alternative: DIRECTION - "go in" to enter a location
 * - Resolution: PREPOSITION - container interactions are more common
 * - Note: "go in" works via ENTER verb or implicit direction handling
 * - IN remains a preposition; ENTER handles the direction case
 *
 * ----------------------------------------------------------------------------
 * CONFLICT: MATCH (noun vs adjective)
 * ----------------------------------------------------------------------------
 * - ZIL Classification: NOUN (primary) - the matchbook/matches object
 * - Alternative: ADJECTIVE - "match book" as descriptor
 * - Resolution: NOUN - the matchbook is a key inventory item
 * - Note: MATCH is also added as adjective for "match book" parsing
 * - Both types are registered; noun takes precedence in ambiguous cases
 *
 * ----------------------------------------------------------------------------
 * CONFLICT: GLASS (noun vs adjective)
 * ----------------------------------------------------------------------------
 * - ZIL Classification: NOUN (primary) - mirror synonym in ZIL
 * - Alternative: ADJECTIVE - "glass bottle" descriptor
 * - Resolution: NOUN - "examine glass" refers to the mirror
 * - Note: GLASS is also added as adjective for "glass bottle"
 * - Both types are registered; context determines usage
 *
 * ----------------------------------------------------------------------------
 * CONFLICT: STONE (noun vs adjective)
 * ----------------------------------------------------------------------------
 * - ZIL Classification: NOUN (primary) - rocks/stones in environment
 * - Alternative: ADJECTIVE - "stone wall", "stone floor"
 * - Resolution: Both registered - NOUN for objects, ADJECTIVE for descriptors
 * - Note: No conflict in practice; parser uses context
 *
 * ----------------------------------------------------------------------------
 * CONFLICT: IVORY (noun vs adjective)
 * ----------------------------------------------------------------------------
 * - ZIL Classification: ADJECTIVE (primary) - "ivory torch" descriptor
 * - Alternative: NOUN - ivory as a material
 * - Resolution: ADJECTIVE - the ivory torch is the primary reference
 * - Note: IVORY is registered as adjective; torch is the noun
 *
 * ----------------------------------------------------------------------------
 * CONFLICT: PLATINUM (noun vs adjective)
 * ----------------------------------------------------------------------------
 * - ZIL Classification: ADJECTIVE (primary) - "platinum bar" descriptor
 * - Alternative: NOUN - platinum as a material
 * - Resolution: Both registered - adjective for "platinum bar", noun for "the platinum"
 * - Note: No conflict in practice; both uses are valid
 *
 * ----------------------------------------------------------------------------
 * CONFLICT: GOLD/SILVER (noun vs adjective)
 * ----------------------------------------------------------------------------
 * - ZIL Classification: Both NOUN and ADJECTIVE
 * - NOUN: "pot of gold", "silver chalice" (the material/treasure)
 * - ADJECTIVE: "gold coin", "silver key" (descriptors)
 * - Resolution: Both registered in both categories
 * - Note: Context determines usage; no parser conflict
 *
 * ----------------------------------------------------------------------------
 * CONFLICT: SAPPHIRE (noun vs adjective)
 * ----------------------------------------------------------------------------
 * - ZIL Classification: ADJECTIVE (primary) - "sapphire bracelet"
 * - Alternative: NOUN - the gem itself
 * - Resolution: ADJECTIVE - bracelet is the primary object
 * - Note: SAPPHIRE registered as adjective; bracelet is the noun
 *
 * ----------------------------------------------------------------------------
 * CONFLICT: EXIT/LEAVE (verb vs direction)
 * ----------------------------------------------------------------------------
 * - ZIL Classification: DIRECTION (primary) - synonyms for OUT
 * - Alternative: VERB - "exit the room", "leave the house"
 * - Resolution: DIRECTION - movement is the primary use
 * - Note: EXIT and LEAVE are in directions, not verbs
 * - DISEMBARK verb handles vehicle exit cases
 *
 * ----------------------------------------------------------------------------
 * CONFLICT: PUMP (noun vs verb)
 * ----------------------------------------------------------------------------
 * - ZIL Classification: VERB (primary) - <SYNTAX PUMP UP OBJECT = V-PUMP>
 * - Alternative: NOUN - the hand-held air pump object
 * - Resolution: Both registered - VERB for action, NOUN for object
 * - Note: "pump boat" uses verb; "take pump" uses noun
 *
 * ----------------------------------------------------------------------------
 * CONFLICT: SLIDE (noun vs verb)
 * ----------------------------------------------------------------------------
 * - ZIL Classification: VERB (primary) - <SYNTAX SLIDE OBJECT UNDER OBJECT>
 * - Alternative: NOUN - the slide/chute in the cellar
 * - Resolution: Both registered - VERB for action, NOUN for object
 * - Note: Context determines usage; no parser conflict
 *
 * ============================================================================
 */

import { TokenType } from './lexer.js';

/**
 * Word entry in the vocabulary
 */
interface WordEntry {
  word: string;
  type: TokenType;
  canonicalForm?: string; // For synonyms, points to the canonical word
}

/**
 * Vocabulary class manages all game words and their types
 */
export class Vocabulary {
  private words: Map<string, WordEntry> = new Map();
  private abbreviations: Map<string, string> = new Map();

  constructor() {
    this.initializeVocabulary();
    this.initializeAbbreviations();
  }

  /**
   * Look up a word in the vocabulary
   * @param word - The word to look up (should be lowercase)
   * @returns The token type, or UNKNOWN if not found
   */
  lookupWord(word: string): TokenType {
    const entry = this.words.get(word.toLowerCase());
    return entry ? entry.type : TokenType.UNKNOWN;
  }

  /**
   * Get the canonical form of a word (for synonyms)
   * @param word - The word to look up
   * @returns The canonical form, or the word itself if not a synonym
   */
  getCanonicalForm(word: string): string {
    const entry = this.words.get(word.toLowerCase());
    return entry?.canonicalForm || word;
  }

  /**
   * Check if a word is in the vocabulary
   * @param word - The word to check
   * @returns true if the word is known
   */
  hasWord(word: string): boolean {
    return this.words.has(word.toLowerCase());
  }

  /**
   * Expand abbreviations to their full forms
   * @param word - The word to expand
   * @returns The expanded word, or the original if not an abbreviation
   */
  expandAbbreviation(word: string): string {
    const expanded = this.abbreviations.get(word.toLowerCase());
    return expanded || word;
  }

  /**
   * Check if a word is an abbreviation
   * @param word - The word to check
   * @returns true if the word is a known abbreviation
   */
  isAbbreviation(word: string): boolean {
    return this.abbreviations.has(word.toLowerCase());
  }

  /**
   * Add a word to the vocabulary
   * @param word - The word to add
   * @param type - The token type
   * @param canonicalForm - Optional canonical form for synonyms
   */
  private addWord(word: string, type: TokenType, canonicalForm?: string): void {
    this.words.set(word.toLowerCase(), {
      word: word.toLowerCase(),
      type,
      canonicalForm,
    });
  }

  /**
   * Initialize the vocabulary with all game words
   */
  private initializeVocabulary(): void {
    this.loadVerbs();
    this.loadPrepositions();
    this.loadDirections();
    this.loadArticles();
    this.loadPronouns();
    this.loadConjunctions();
    this.loadNouns();
    this.loadAdjectives();
  }

  /**
   * Initialize common abbreviations
   * Maps abbreviations to their full forms
   */
  private initializeAbbreviations(): void {
    // Direction abbreviations
    this.abbreviations.set('n', 'north');
    this.abbreviations.set('s', 'south');
    this.abbreviations.set('e', 'east');
    this.abbreviations.set('w', 'west');
    this.abbreviations.set('u', 'up');
    this.abbreviations.set('d', 'down');
    this.abbreviations.set('ne', 'northeast');
    this.abbreviations.set('nw', 'northwest');
    this.abbreviations.set('se', 'southeast');
    this.abbreviations.set('sw', 'southwest');

    // Command abbreviations
    this.abbreviations.set('i', 'inventory');
    this.abbreviations.set('x', 'examine');
    this.abbreviations.set('l', 'look');
    this.abbreviations.set('z', 'wait');
    this.abbreviations.set('q', 'quit');
    this.abbreviations.set('y', 'yes');

    // Common verb abbreviations
    this.abbreviations.set('g', 'again');
  }

  /**
   * Load verb definitions from ZIL source (gverbs.zil, gsyntax.zil)
   */
  private loadVerbs(): void {
    // Core verbs from gverbs.zil and gsyntax.zil
    const verbs = [
      // === Taking and dropping ===
      'TAKE', 'GET', 'HOLD', 'CARRY', 'REMOVE', 'GRAB', 'CATCH',
      'DROP', 'PUT', 'PLACE', 'INSERT', 'STUFF', 'HIDE',
      'APPLY',  // Synonym for PUT (from ZIL: <SYNTAX APPLY OBJECT TO OBJECT = V-PUT>)

      // === Opening and closing ===
      'OPEN', 'CLOSE',
      'SHUT',  // Synonym for TURN/CLOSE (from ZIL: <SYNONYM TURN SET FLIP SHUT>)

      // === Examining and looking ===
      'EXAMINE', 'X', 'LOOK', 'L', 'READ', 'DESCRIBE',
      'WHAT', 'WHATS',  // Synonyms for EXAMINE (from ZIL: <SYNONYM EXAMINE DESCRIBE WHAT WHATS>)
      'STARE', 'GAZE',  // Synonyms for LOOK (from ZIL: <SYNONYM LOOK L STARE GAZE>)
      'SKIM',  // Synonym for READ (from ZIL: <SYNONYM READ SKIM>)

      // === Finding and searching ===
      'SEARCH', 'FIND', 'SEEK',
      'WHERE', 'SEE',  // Synonyms for FIND (from ZIL: <SYNONYM FIND WHERE SEEK SEE>)

      // === Game commands ===
      'INVENTORY', 'I',
      'WAIT', 'Z',
      'QUIT', 'Q',
      'SAVE', 'RESTORE',
      'SCORE', 'RESTART',
      'VERBOSE', 'BRIEF', 'SUPERBRIEF',
      'SUPER',  // Synonym for SUPERBRIEF (from ZIL: <SYNONYM SUPER SUPERBRIEF>)
      'DIAGNOSE',
      'SCRIPT', 'UNSCRIPT',  // Transcript commands (from ZIL: <SYNTAX SCRIPT = V-SCRIPT>)
      'AGAIN', 'G',  // Repeat last command
      'VERSION',  // Show version information
      'BACK',  // Go back command (from ZIL: <SYNTAX BACK = V-BACK>)

      // === Movement ===
      'GO', 'WALK', 'RUN', 'PROCEED', 'STEP',
      'FOLLOW', 'PURSUE', 'CHASE', 'COME',  // Follow commands (from ZIL: <SYNONYM FOLLOW PURSUE CHASE COME>)
      'CROSS', 'FORD',  // Cross water (from ZIL: <SYNONYM CROSS FORD>)
      'SKIP', 'HOP',  // Skip/hop (from ZIL: <SYNONYM SKIP HOP>)

      // === Combat and attacking ===
      'ATTACK', 'FIGHT', 'KILL', 'HURT', 'INJURE', 'HIT', 'MURDER', 'SLAY',
      'DISPATCH',  // Synonym for KILL (from ZIL: <SYNONYM KILL MURDER SLAY DISPATCH>)
      'STAB',  // Stab attack (from ZIL: <SYNTAX STAB OBJECT>)
      'POKE', 'PUNCTURE',  // Attack synonyms (from ZIL: <SYNTAX POKE/PUNCTURE OBJECT>)

      // === Eating and drinking ===
      'EAT', 'DRINK', 'CONSUME', 'TASTE', 'BITE',
      'IMBIBE', 'SWALLOW',  // Synonyms for DRINK (from ZIL: <SYNONYM DRINK IMBIBE SWALLOW>)

      // === Giving and trading ===
      'GIVE', 'OFFER', 'FEED', 'DONATE',
      'HAND',  // Synonym for GIVE (from ZIL: <SYNONYM GIVE HAND>)

      // === Throwing ===
      'THROW', 'TOSS', 'HURL', 'CHUCK',

      // === Turning and manipulating ===
      'TURN', 'FLIP', 'SET',
      'SPIN',  // Spin object (from ZIL: <SYNTAX SPIN OBJECT = V-SPIN>)

      // === Pushing and pulling ===
      'PUSH', 'PRESS', 'PULL', 'TUG', 'YANK',
      'SLIDE',  // Slide object (from ZIL: <SYNTAX SLIDE OBJECT UNDER OBJECT>)

      // === Moving objects ===
      'MOVE', 'ROLL',

      // === Climbing ===
      'CLIMB', 'SIT',

      // === Lighting ===
      'LIGHT', 'EXTINGUISH', 'DOUSE',
      'ACTIVATE',  // Synonym for turning on lights (from ZIL: <SYNTAX ACTIVATE OBJECT = V-LAMP-ON>)
      'BLOW',  // Blow out/up (from ZIL: <SYNTAX BLOW OUT OBJECT = V-LAMP-OFF>)

      // === Locking ===
      'UNLOCK', 'LOCK',

      // === Tying and untying ===
      'TIE', 'UNTIE', 'FASTEN', 'UNFASTEN',
      'ATTACH', 'SECURE',  // Synonyms for TIE (from ZIL: <SYNONYM TIE FASTEN SECURE ATTACH>)
      'FREE', 'RELEASE', 'UNATTACH', 'UNHOOK',  // Synonyms for UNTIE (from ZIL: <SYNONYM UNTIE FREE RELEASE UNFASTEN UNATTACH UNHOOK>)

      // === Greetings and communication ===
      'HELLO', 'HI',
      'GOODBYE', 'BYE',
      'THANK',
      'YES', 'Y', 'NO',
      'TELL', 'ASK', 'ANSWER', 'REPLY',
      'TALK',  // Talk to actor (from ZIL: <SYNTAX TALK TO OBJECT = V-TELL>)
      'SAY', 'ECHO',
      'MUMBLE', 'SIGH',  // Mumble commands (from ZIL: <SYNONYM MUMBLE SIGH>)

      // === Boarding and vehicles ===
      'BOARD', 'ENTER', 'DISEMBARK',  // Removed 'EXIT', 'LEAVE' - now directions
      'LAUNCH',  // Launch boat (from ZIL: <SYNTAX LAUNCH OBJECT = V-LAUNCH>)

      // === Filling and pouring ===
      'FILL', 'EMPTY', 'POUR', 'SPILL',

      // === Breaking and destroying ===
      'BREAK', 'SMASH', 'DESTROY', 'DAMAGE',
      'BLOCK',  // Synonym for DESTROY (from ZIL: <SYNONYM DESTROY DAMAGE BREAK BLOCK SMASH>)
      'BLAST',  // Blow up (from ZIL: <SYNTAX BLAST = V-BLAST>)

      // === Burning ===
      'BURN', 'IGNITE', 'INCINERATE',

      // === Cutting ===
      'CUT', 'SLICE', 'PIERCE',

      // === Digging ===
      'DIG',

      // === Inflating ===
      'INFLATE', 'DEFLATE',
      'INFLAT',  // ZIL truncated form (from ZIL: <SYNTAX INFLAT OBJECT WITH OBJECT = V-INFLATE>)
      'PUMP',  // Pump up (from ZIL: <SYNTAX PUMP UP OBJECT = V-PUMP>)

      // === Physical actions ===
      'KICK', 'KISS',
      'TAUNT',  // Synonym for KICK (from ZIL: <SYNONYM KICK TAUNT>)
      'KNOCK', 'RAP',
      'LISTEN',
      'MAKE',
      'MELT',
      'LIQUIFY',  // Synonym for MELT (from ZIL: <SYNONYM MELT LIQUIFY>)
      'OIL', 'GREASE', 'LUBRICATE',
      'PLAY',
      'PRAY',
      'REPENT',  // Repent command (from ZIL: <SYNTAX REPENT = V-REPENT>)
      'RAISE', 'LIFT', 'LOWER',
      'RING',
      'PEAL',  // Synonym for RING (from ZIL: <SYNONYM RING PEAL>)
      'RUB', 'TOUCH', 'FEEL',
      'PAT', 'PET',  // Synonyms for RUB (from ZIL: <SYNONYM RUB TOUCH FEEL PAT PET>)
      'SHAKE',
      'SMELL', 'SNIFF',
      'SQUEEZE',
      'SPRAY',  // Spray object (from ZIL: <SYNTAX SPRAY OBJECT ON OBJECT = V-SPRAY>)
      'STAND',
      'STAY',  // Stay command (from ZIL: <SYNTAX STAY = V-STAY>)
      'STRIKE',
      'SWIM', 'WADE',
      'BATHE',  // Synonym for SWIM (from ZIL: <SYNONYM SWIM BATHE WADE>)
      'SWING',
      'THRUST',  // Synonym for SWING (from ZIL: <SYNONYM SWING THRUST>)
      'WAVE',
      'BRANDISH',  // Synonym for WAVE (from ZIL: <SYNONYM WAVE BRANDISH>)
      'WEAR',
      'WIND',
      'YELL', 'SCREAM', 'SHOUT',
      'DANCE', 'SLEEP', 'WAKE',
      'AWAKE', 'SURPRISE', 'STARTLE',  // Synonyms for WAKE (from ZIL: <SYNONYM WAKE AWAKE SURPRISE STARTLE>)
      'JUMP', 'LEAP', 'DIVE',
      'LEAN',  // Lean on object (from ZIL: <SYNTAX LEAN ON OBJECT = V-LEAN-ON>)

      // === Cleaning ===
      'BRUSH', 'CLEAN',  // Cleaning commands (from ZIL: <SYNONYM BRUSH CLEAN>)

      // === Repairing ===
      'FIX', 'REPAIR', 'PATCH', 'GLUE', 'PLUG',  // Repair commands (from ZIL: <SYNONYM PLUG GLUE PATCH REPAIR FIX>)

      // === Picking ===
      'PICK',  // Pick lock/pick up (from ZIL: <SYNTAX PICK OBJECT = V-PICK>)

      // === Counting ===
      'COUNT',  // Count objects (from ZIL: <SYNTAX COUNT OBJECT = V-COUNT>)

      // === Hatching ===
      'HATCH',  // Hatch egg (from ZIL: <SYNTAX HATCH OBJECT = V-HATCH>)

      // === Sending ===
      'SEND',  // Send for object (from ZIL: <SYNTAX SEND FOR OBJECT = V-SEND>)

      // === Commanding ===
      'COMMAND',  // Command actor (from ZIL: <SYNTAX COMMAND OBJECT = V-COMMAND>)

      // === Profanity (handled with rejection messages) ===
      'CURSE', 'SHIT', 'FUCK', 'DAMN',
      'RAPE', 'MOLEST',  // Inappropriate commands (from ZIL: <SYNONYM RAPE MOLEST>)

      // === Frustration/joke commands ===
      'CHOMP', 'LOSE', 'BARF',  // Joke commands (from ZIL: <SYNONYM CHOMP LOSE BARF>)
      'BUG',  // Report bug (from ZIL: <SYNTAX BUG = V-BUG>)

      // === Magic and special commands ===
      'ULYSSES', 'ODYSSEUS',  // Magic words for cyclops puzzle
      'XYZZY', 'PLUGH', 'PLOVER',  // Magic words from Adventure
      'FROBOZZ',  // Magic word (from ZIL: <SYNTAX FROBOZZ = V-FROBOZZ>)
      'ZORK',  // Magic word (from ZIL: <SYNTAX ZORK = V-ZORK>)
      'TREASURE', 'TEMPLE',  // Magic words (from ZIL: <SYNONYM TREASURE TEMPLE>)
      'WIN', 'WINNAGE',  // Win command (from ZIL: <SYNONYM WIN WINNAGE>)
      'WISH',  // Wish command (from ZIL: <SYNTAX WISH = V-WISH>)
      'SING',

      // === Magic/spell commands ===
      'INCANT', 'CHANT',  // Incantation (from ZIL: <SYNONYM INCANT CHANT>)
      'ENCHANT',  // Enchant object (from ZIL: <SYNTAX ENCHANT OBJECT = V-ENCHANT>)
      'DISENCHANT',  // Disenchant object (from ZIL: <SYNTAX DISENCHANT OBJECT = V-DISENCHANT>)
      'EXORCISE', 'BANISH', 'CAST', 'DRIVE', 'BEGONE',  // Exorcise spirits (from ZIL: <SYNONYM EXORCISE BANISH CAST DRIVE BEGONE>)
    ];

    verbs.forEach(verb => this.addWord(verb, TokenType.VERB));
  }

  /**
   * Load preposition definitions from ZIL source (gsyntax.zil)
   * 
   * CONFLICTS DOCUMENTED IN HEADER:
   * - IN: Also could be direction - PREPOSITION is primary
   * - OUT was moved to directions (see "OUT (direction vs preposition)" in header)
   */
  private loadPrepositions(): void {
    const prepositions = [
      'WITH', 'USING', 'THROUGH', 'THRU',
      'IN', 'INSIDE', 'INTO',  // CONFLICT: See "IN (direction vs preposition)" in header
      'ON', 'ONTO',
      'UNDER', 'UNDERNEATH', 'BENEATH', 'BELOW',
      'AT', 'TO', 'FROM',
      'FOR', 'ABOUT',
      'OFF', 'OVER',  // Note: OUT moved to directions - see conflict documentation
      'BEHIND',
      'ACROSS',
      'AROUND',
      'AGAINST',
      'BETWEEN',
      'AWAY',  // Used in "EXORCISE AWAY OBJECT" (from ZIL: <SYNTAX EXORCISE AWAY OBJECT>)
    ];

    prepositions.forEach(prep => this.addWord(prep, TokenType.PREPOSITION));
  }

  /**
   * Load direction words from ZIL source (gsyntax.zil)
   * 
   * CONFLICTS DOCUMENTED IN HEADER:
   * - UP: Also could be noun - DIRECTION is primary
   * - OUT: Also could be preposition - DIRECTION is primary (ZIL: <SYNONYM OUT EXIT LEAVE>)
   * - EXIT/LEAVE: Also could be verbs - DIRECTION is primary
   */
  private loadDirections(): void {
    const directions = [
      'NORTH', 'N',
      'SOUTH', 'S',
      'EAST', 'E',
      'WEST', 'W',  // CONFLICT: See "WEST (direction vs adjective)" in header
      'UP', 'U',    // CONFLICT: See "UP (direction vs noun)" in header
      'DOWN', 'D',
      'NORTHEAST', 'NE',
      'NORTHWEST', 'NW',
      'SOUTHEAST', 'SE',
      'SOUTHWEST', 'SW',
      'OUT', 'EXIT', 'LEAVE',  // CONFLICT: See "OUT (direction vs preposition)" and "EXIT/LEAVE" in header
    ];

    directions.forEach(dir => this.addWord(dir, TokenType.DIRECTION));
  }

  /**
   * Load articles
   */
  private loadArticles(): void {
    const articles = ['THE', 'A', 'AN'];
    articles.forEach(article => this.addWord(article, TokenType.ARTICLE));
  }

  /**
   * Load pronouns
   */
  private loadPronouns(): void {
    const pronouns = ['IT', 'THEM', 'ALL', 'EVERYTHING', 'YOU'];
    pronouns.forEach(pronoun => this.addWord(pronoun, TokenType.PRONOUN));
  }

  /**
   * Load conjunctions
   */
  private loadConjunctions(): void {
    const conjunctions = ['AND', 'THEN'];
    conjunctions.forEach(conj => this.addWord(conj, TokenType.CONJUNCTION));
  }

  /**
   * Load noun synonyms from object definitions
   * These are extracted from the objects in the game
   */
  private loadNouns(): void {
    // Common nouns from Zork I objects
    const nouns = [
      'MYSELF', 'ME',  // Self-reference for easter eggs
      // 'UP',  // CONFLICT: See "UP (direction vs noun)" in header - DIRECTION is primary
      'SKULL', 'HEAD',
      'CHALICE', 'CUP',
      'TRIDENT', 'FORK',
      'DIAMOND',
      'EMERALD',
      'FIGURINE',
      'SWORD', 'BLADE', 'WEAPON',
      'LAMP', 'LANTERN', // CONFLICT: See "LIGHT (verb vs noun)" in header - LIGHT not added as noun
      'ROPE',
      'KNIFE',
      'TORCH',
      'TREASURE', 'TREASURES',
      'TEST',  // For echo test command
      'DOOR', 'DOORS',
      'WINDOW', 'WINDOWS',
      'WALL', 'WALLS',
      'FLOOR', 'GROUND',
      'CEILING',
      'SKY',
      'HOUSE', 'BUILDING',
      'TREE', 'TREES', 'TRUNK',
      'FOREST',
      'WATER', 'STREAM', 'RIVER',
      'MAILBOX', 'BOX',
      'LEAFLET', 'BOOKLET', 'PAMPHLET',
      'MAT', 'RUG',
      'TRAP', 'TRAPDOOR',
      'GRATING',
      'LEAVES', 'LEAF',
      'NEST', 'BIRD',
      'EGG', 'EGGS',
      'JEWEL', 'JEWELS', 'JEWELRY',
      'COINS', 'COIN',
      'COFFIN', 'CASKET',
      'SCEPTRE', 'SCEPTER',
      'BRACELET',
      'NECKLACE',
      'PAINTING', 'PICTURE',
      'BOTTLE', 'FLASK',
      'FOOD', 'LUNCH', 'DINNER',
      'GARLIC', 'CLOVE',
      'BOOK', 'BOOKS', 'GUIDEBOOK',
      'CANDLES', 'CANDLE',
      'MATCH', 'MATCHES', 'MATCHBOOK', // CONFLICT: See "MATCH (noun vs adjective)" in header - both registered
      'WRENCH',
      'SCREWDRIVER',
      'HANDS', 'HAND',
      'LUNGS',
      'SELF', 'ME', 'MYSELF',
      'THIEF', 'ROBBER', 'BURGLAR',
      'TROLL', 'MONSTER',
      'CYCLOPS', 'GIANT',
      'CASE', 'TROPHY',
      'BAG', 'SACK',
      'CHEST',
      'BASKET',
      'BUCKET', 'PAIL',
      'POT',
      'SHOVEL', 'SPADE',
      'AXE', 'HATCHET',
      'BELL',
      'BUOY',
      'PUMP',  // CONFLICT: See "PUMP (noun vs verb)" in header - both registered
      'SLIDE', // CONFLICT: See "SLIDE (noun vs verb)" in header - both registered
      'MACHINE',
      'SWITCH', 'BUTTON', 'LEVER',
      'MIRROR', 'GLASS', // CONFLICT: See "GLASS (noun vs adjective)" in header - both registered
      'POLE',
      'BOARD', 'BOARDS', 'PLANK',
      'BOLT',
      'BUBBLE', 'BUBBLES',
      'COAL',
      'DIAMOND',
      'PILE',
      'SAND',
      'STONE', 'ROCK', 'STONES', 'ROCKS', // CONFLICT: See "STONE (noun vs adjective)" in header - both registered
      'TEETH', 'TOOTH',
      'TIMBER',
      'TOOL', 'TOOLS',
      'CHIMNEY', 'FIREPLACE',
      'RAILING', 'RAIL',
      'STAIRS', 'STAIRCASE', 'STAIRWAY',

      // === Missing nouns from ZIL vocabulary audit ===

      // People and creatures
      'ADVENTURER',  // Player reference
      'AVIATOR',     // Skeleton in maze
      'CRETIN',      // Insult reference
      'FOOTPAD',     // Thief synonym
      'GRUE',        // The infamous grue
      'MAN', 'PERSON',  // Generic person references
      'SAILOR',      // Skeleton reference
      'VAMPIRE',     // Bat synonym

      // Supernatural entities
      'GHOSTS', 'FIENDS', 'SPIRITS',  // Spirits in dungeon

      // Body parts
      'BODY', 'BODIES',  // Corpse references
      'BONES', 'SKELETON',  // Skeletal remains
      'EYE',          // Cyclops eye
      'MOUTH',        // Various uses
      'BREATH',       // Breathing reference

      // Structures and locations
      'ALTAR',        // Temple altar
      'BARROW',       // Barrow location
      'TOMB',         // Barrow synonym
      'DAM',          // Flood control dam
      'GATE', 'GATES',  // Dam gates
      'GRATE',        // Grating synonym
      'PEDESTAL',     // Pedestal in various rooms
      'TABLE',        // Kitchen/attic table
      'CLIFF', 'CLIFFS', 'LEDGE',  // Cliff locations
      'MOUNTAIN', 'RANGE',  // Mountain range
      'PATH', 'TRAIL',  // Forest paths
      'RAMP',         // Slide synonym
      'STEPS',        // Stairway synonym

      // Containers and storage
      'CAGE',         // Basket synonym (dumbwaiter)
      'DUMBWAITER',   // Basket mechanism
      'CHESTS',       // Tool chest plural
      'TOOLCHESTS',   // Tool chest synonym
      'CONTAINER',    // Generic container

      // Documents and writing
      'ADVERTISEMENT', 'MAIL',  // Mailbox contents
      'INSCRIPTION',  // Engravings synonym
      'ENGRAVINGS',   // Wall engravings
      'LABEL',        // Boat label
      'FINEPRINT', 'PRINT',  // Label text
      'LETTERING', 'WRITING',  // Door writing
      'MANUAL',       // Owner's manual
      'MAP', 'PARCHMENT',  // Ancient map
      'PAGE',         // Book page
      'PAPER',        // Paper material
      'PRAYER',       // Prayer book/inscription
      'GUIDE', 'GUIDEBOOKS',  // Tour guide

      // Treasures and valuables
      'BAUBLE',       // Bauble treasure
      'GOLD',         // CONFLICT: See "GOLD/SILVER (noun vs adjective)" in header - both registered
      'SILVER',       // CONFLICT: See "GOLD/SILVER (noun vs adjective)" in header - both registered
      'PLATINUM',     // CONFLICT: See "PLATINUM (noun vs adjective)" in header - both registered
      'SAPPHIRE',     // Sapphire bracelet
      'IVORY',        // CONFLICT: See "IVORY (noun vs adjective)" in header - adjective is primary
      'SCARAB',       // Jeweled scarab
      'ZORKMID',      // Zork currency

      // Weapons and tools
      'AX',           // Axe alternate spelling
      'STILETTO',     // Thief's weapon
      'KNIVES',       // Knife plural
      'GLAMDRING', 'ORCRIST',  // Sword references (Tolkien)
      'DRIVER',       // Screwdriver synonym
      'AIR-PUMP',     // Pump synonym

      // Boat and water related
      'BOAT', 'RAFT',  // Inflatable boat
      'VALVE',        // Boat valve
      'LEAK', 'DRIP', 'PIPE',  // Dam leak
      'LIQUID', 'H2O', 'QUANTITY',  // Water synonyms
      'RAINBOW',      // Rainbow over falls

      // Nature and environment
      'AIR',          // Atmosphere
      'DIRT',         // Ground material
      'HEMLOCKS', 'PINES',  // Forest trees
      'BRANCH',       // Tree branch
      'HEMP', 'COIL',  // Rope synonyms

      // Mechanical and industrial
      'CHUTE',        // Slide synonym
      'COVER',        // Trap door cover
      'LID',          // Machine lid
      'PANEL',        // Control panel
      'TUBE', 'PASTE',  // Tube of putty
      'DRYER',        // Machine synonym (PDP10)
      'PDP10',        // Machine easter egg

      // Miscellaneous objects
      'ART', 'CANVAS',  // Painting synonyms
      'BAR',          // Platinum bar
      'BEETLE', 'BUG',  // Scarab synonyms
      'CANARY', 'SONGBIRD',  // Bird in egg
      'CARPET',       // Rug synonym
      'CRACK',        // Narrow crack
      'ENORMOUS',     // Mirror description (used as noun)
      'FORCE',        // Spirits force
      'GROUP',        // Tool chest group
      'GUNK', 'SLAG',  // Slag/gunk material
      'HEAP',         // Coal heap
      'KEY',          // Skeleton key
      'LADDER',       // Rickety ladder
      'MATERIAL',     // Putty material
      'NUT',          // Bolt nut
      'OVERBOARD',    // Teeth location
      'PAIR',         // Candle pair
      'PIECE',        // Piece of material
      'REFLECTION',   // Mirror reflection
      'SANDWICH',     // Lunch synonym
      'TIMBERS',      // Wooden timbers
      'TRAP-DOOR',    // Trap door (hyphenated)

      // Special/magic words
      'BLESSINGS', 'GRACES',  // Prayer responses
      'FCD#3',        // Dam designation
      'INTNUM',       // Internal number reference
      'ZZMGCK',       // Magic word

      // === Additional missing nouns from vocabulary completeness tests ===
      'REMAINS',      // Bodies synonym (corpse remains)
      'BAT',          // Bat creature (vampire bat)
    ];

    nouns.forEach(noun => this.addWord(noun, TokenType.NOUN));
  }

  /**
   * Load adjectives from object definitions
   */
  private loadAdjectives(): void {
    const adjectives = [
      'WHITE',  // Z-Machine parity: WHITE is an adjective for WHITE-HOUSE
      'CRYSTAL',
      'SILVER',
      'GOLD', 'GOLDEN', // CONFLICT: See "GOLD/SILVER (noun vs adjective)" in header - both registered
      'BRASS',
      'WOODEN',
      'RUSTY',
      'SMALL', 'TINY', 'LITTLE',
      'LARGE', 'BIG', 'HUGE', 'ENORMOUS',
      'OLD', 'ANCIENT',
      'NEW',
      'BROKEN',
      'SHARP',
      'DULL',
      'HEAVY',
      // CONFLICT: See "LIGHT (verb vs noun)" in header - LIGHT not added as adjective
      // Objects use "BRASS LANTERN" not "LIGHT LANTERN"
      'DARK',
      'BLACK',
      'BRIGHT',
      'SHINY',
      'DIRTY',
      'CLEAN',
      'WET',
      'DRY',
      'HOT',
      'COLD',
      'WARM',
      'COOL',
      'BEAUTIFUL',
      'UGLY',
      'STRANGE',
      'NORMAL',
      'MAGIC', 'MAGICAL',
      'DEAD',
      'LIVING',
      'LOCKED',
      'UNLOCKED',
      'EMPTY',
      'FULL',
      'JADE',
      'IVORY', // CONFLICT: See "IVORY (noun vs adjective)" in header - adjective is primary
      'PLATINUM', // CONFLICT: See "PLATINUM (noun vs adjective)" in header - both registered
      'JEWELED',
      'ENGRAVED',
      'CARVED',
      'PAINTED',
      'LEATHER',
      'CLOTH',
      'STEEL',
      'IRON',
      'COPPER',
      'BRONZE',
      'STONE', // CONFLICT: See "STONE (noun vs adjective)" in header - both registered
      'MARBLE',
      'GRANITE',
      'SANDY',
      'ROCKY',
      'LEAFY',
      'GRASSY',
      'MUDDY',
      'DUSTY',
      'RUSTY',
      'MOLDY',
      'ROTTEN',
      'FRESH',
      'STALE',
      'SWEET',
      'SOUR',
      'BITTER',
      'SALTY',
      'SPICY',
      'BLAND',
      'DELICIOUS',
      'DISGUSTING',
      'FRAGRANT',
      'SMELLY',
      'LOUD',
      'QUIET',
      'SILENT',
      'NOISY',

      // === Missing adjectives from ZIL vocabulary audit ===

      // Colors
      'BLUE',       // Blue button
      'BROWN',      // Brown button, sandwich bag
      'GREEN',      // Bubble
      'RED',        // Buoy, hot bell, red button
      'TAN',        // Boat label
      'YELLOW',     // Yellow button

      // Materials and textures
      'CLEAR',      // Bottle (glass)
      'GLASS',      // CONFLICT: See "GLASS (noun vs adjective)" in header - both registered
      'METAL',      // Bolt, slide
      'PLASTIC',    // Bubble, inflatable boat
      'SOLID',      // Coffin
      'VITREOUS',   // Gunk (glassy)
      'VISCOUS',    // Putty

      // Conditions and states
      'ANTIQUE',    // Map, sword
      'BARE',       // Room description
      'BLOODY',     // Axe
      'BOARDED',    // Boarded window, front door
      'BURNED',     // Burned-out lantern
      'BURNING',    // Candles
      'ENCRUSTED',  // Egg (jewel-encrusted)
      'ENAMELED',   // Sceptre
      'FLAMING',    // Torch
      'FRIGID',     // River
      'LOWERED',    // Lowered basket
      'MANGLED',    // Bodies
      'NARROW',     // Chimney, crack, ladder
      'PUNCTURE',   // Punctured boat
      'RICKETY',    // Ladder
      'STEEP',      // Slide
      'TWISTING',   // Slide
      'USELESS',    // Burned-out lantern
      'WINDING',    // Path/passage description

      // Sizes and shapes
      'ELONGATED',  // Sandwich bag
      'GIANT',      // Cyclops
      'LONG',       // Various descriptions
      'MASSIVE',    // Barrow

      // Qualities and characteristics
      'BEAUTI',     // Beautiful (ZIL truncated form) - bauble, painting, scarab, white house
      'CLOCKWORK',  // Canary
      'COLONI',     // Colonial (ZIL truncated form) - white house
      'DERANGED',   // Bat
      'EGYPTIAN',   // Sceptre
      'ELVISH',     // Sword
      'EVIL',       // Ghosts
      'EXQUISITE',  // Jade
      'FINE',       // Boat label (fine print)
      'FORBIDDING', // Room/location description
      'GOTHIC',     // Wooden door
      'HAND-HELD',  // Pump
      'HUNGRY',     // Cyclops
      'IMPASSABLE', // Mountain range
      'INFLAT',     // Inflatable (ZIL truncated form) - boat
      'INVISIBLE',  // Ghosts
      'LURKING',    // Creature description
      'NASTY',      // Knife, troll
      'ORIENTAL',   // Rug
      'SEAWORTHY',  // Inflated boat
      'SEEDY',      // Thief
      'SHADY',      // Thief
      'SHEER',      // Cliff
      'SINISTER',   // Atmosphere description
      'SKELETON',   // Keys (skeleton key)
      'SONG',       // Songbird
      'STORM',      // Tree (storm-tossed)
      'SURROUNDING', // Wall
      'SUSPICIOUS', // Thief
      'UNRUSTY',    // Knife (not rusty)
      'VICIOUS',    // Stiletto

      // Ownership and association
      'BIRDS',      // Nest, egg (bird's nest)
      'FLATHEAD',   // Mountain range (Flathead Mountains)
      'FOREST',     // Forest description
      'FRONT',      // Front door
      'KITCHEN',    // Kitchen table, kitchen window
      'OWN',        // Trident (Poseidon's own)
      'OWNERS',     // Owner's manual
      'POSEIDON',   // Trident
      'THIEFS',     // Large bag (thief's bag)
      'TOOL',       // Tool chest
      'TRAP',       // Trap door
      'TROPHY',     // Trophy case
      'VAMPIRE',    // Bat
      // CONFLICT: See "WEST (direction vs adjective)" in header - DIRECTION is primary
      // 'WEST',    // Wooden door - not added as adjective to preserve direction parsing
      'ZORK',       // Owner's manual

      // Functional/descriptive
      'BIRD',       // Nest (bird's nest - singular form)
      'CONTROL',    // Control panel
      'ENGRAVINGS', // Chalice (with engravings)
      'GUIDE',      // Tour guide
      'JEWEL',      // Egg (jewel-encrusted)
      'MATCH',      // CONFLICT: See "MATCH (noun vs adjective)" in header - both registered
      'SAPPHIRE',   // CONFLICT: See "SAPPHIRE (noun vs adjective)" in header - adjective is primary
      'SCREW',      // Screwdriver
      'TOUR',       // Tour guide

      // === Additional missing adjectives from vocabulary completeness tests ===
      'PEPPER',     // Lunch (hot pepper sandwich)
    ];

    adjectives.forEach(adj => this.addWord(adj, TokenType.ADJECTIVE));
  }
}
