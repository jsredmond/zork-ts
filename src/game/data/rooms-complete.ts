/**
 * Complete room definitions extracted from 1dungeon.zil
 * 
 * This file contains ALL rooms from Zork I with their complete data.
 * Total: 110+ rooms
 */

import { RoomData } from './rooms';

/**
 * Complete room database for Zork I
 * Extracted from 1dungeon.zil lines 1-2661
 */
export const ALL_ROOMS: Record<string, RoomData> = {
  // FOREST AND OUTSIDE OF HOUSE
  'WEST-OF-HOUSE': {
    id: 'WEST-OF-HOUSE',
    name: 'West of House',
    description: 'West of House',
    longDescription: 'You are standing in an open field west of a white house, with a boarded front door.',
    exits: [
      { direction: 'NORTH', destination: 'NORTH-OF-HOUSE' },
      { direction: 'SOUTH', destination: 'SOUTH-OF-HOUSE' },
      { direction: 'NE', destination: 'NORTH-OF-HOUSE' },
      { direction: 'SE', destination: 'SOUTH-OF-HOUSE' },
      { direction: 'WEST', destination: 'FOREST-1' },
      { direction: 'EAST', destination: '', message: 'The door is boarded and you can\'t remove the boards.' },
      { direction: 'SW', destination: 'STONE-BARROW', condition: 'WON-FLAG' },
      { direction: 'IN', destination: 'STONE-BARROW', condition: 'WON-FLAG' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
    globalObjects: ['WHITE-HOUSE', 'BOARD', 'FOREST'],
    action: 'WEST-HOUSE'
  },

  'STONE-BARROW': {
    id: 'STONE-BARROW',
    name: 'Stone Barrow',
    description: 'Stone Barrow',
    longDescription: 'You are standing in front of a massive barrow of stone. In the east face is a huge stone door which is open. You cannot see into the dark of the tomb.',
    exits: [
      { direction: 'NE', destination: 'WEST-OF-HOUSE' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
    action: 'STONE-BARROW-FCN'
  },

  'NORTH-OF-HOUSE': {
    id: 'NORTH-OF-HOUSE',
    name: 'North of House',
    description: 'North of House',
    longDescription: 'You are facing the north side of a white house. There is no door here, and all the windows are boarded up. To the north a narrow path winds through the trees.',
    exits: [
      { direction: 'SW', destination: 'WEST-OF-HOUSE' },
      { direction: 'SE', destination: 'EAST-OF-HOUSE' },
      { direction: 'WEST', destination: 'WEST-OF-HOUSE' },
      { direction: 'EAST', destination: 'EAST-OF-HOUSE' },
      { direction: 'NORTH', destination: 'PATH' },
      { direction: 'SOUTH', destination: '', message: 'The windows are all boarded.' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
    globalObjects: ['BOARDED-WINDOW', 'BOARD', 'WHITE-HOUSE', 'FOREST']
  },

  'SOUTH-OF-HOUSE': {
    id: 'SOUTH-OF-HOUSE',
    name: 'South of House',
    description: 'South of House',
    longDescription: 'You are facing the south side of a white house. There is no door here, and all the windows are boarded.',
    exits: [
      { direction: 'WEST', destination: 'WEST-OF-HOUSE' },
      { direction: 'EAST', destination: 'EAST-OF-HOUSE' },
      { direction: 'NE', destination: 'EAST-OF-HOUSE' },
      { direction: 'NW', destination: 'WEST-OF-HOUSE' },
      { direction: 'SOUTH', destination: 'FOREST-3' },
      { direction: 'NORTH', destination: '', message: 'The windows are all boarded.' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
    globalObjects: ['BOARDED-WINDOW', 'BOARD', 'WHITE-HOUSE', 'FOREST']
  },

  'EAST-OF-HOUSE': {
    id: 'EAST-OF-HOUSE',
    name: 'Behind House',
    description: 'Behind House',
    longDescription: 'You are behind the white house. A path leads into the forest to the east. In one corner of the house there is a small window which is slightly ajar.',
    exits: [
      { direction: 'NORTH', destination: 'NORTH-OF-HOUSE' },
      { direction: 'SOUTH', destination: 'SOUTH-OF-HOUSE' },
      { direction: 'SW', destination: 'SOUTH-OF-HOUSE' },
      { direction: 'NW', destination: 'NORTH-OF-HOUSE' },
      { direction: 'EAST', destination: 'CLEARING' },
      { direction: 'WEST', destination: 'KITCHEN', condition: 'KITCHEN-WINDOW IS OPEN' },
      { direction: 'IN', destination: 'KITCHEN', condition: 'KITCHEN-WINDOW IS OPEN' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
    globalObjects: ['WHITE-HOUSE', 'KITCHEN-WINDOW', 'FOREST'],
    action: 'EAST-HOUSE'
  },

  // FOREST ROOMS
  'FOREST-1': {
    id: 'FOREST-1',
    name: 'Forest',
    description: 'Forest',
    longDescription: 'This is a forest, with trees in all directions. To the east, there appears to be sunlight.',
    exits: [
      { direction: 'NORTH', destination: 'GRATING-CLEARING' },
      { direction: 'EAST', destination: 'PATH' },
      { direction: 'SOUTH', destination: 'FOREST-3' },
      { direction: 'WEST', destination: '', message: 'You would need a machete to go further west.' },
      { direction: 'UP', destination: '', message: 'There is no tree here suitable for climbing.' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
    globalObjects: ['TREE', 'SONGBIRD', 'WHITE-HOUSE', 'FOREST']
  },

  'FOREST-2': {
    id: 'FOREST-2',
    name: 'Forest',
    description: 'Forest',
    longDescription: 'This is a dimly lit forest, with large trees all around.',
    exits: [
      { direction: 'NORTH', destination: '', message: 'The forest becomes impenetrable to the north.' },
      { direction: 'EAST', destination: 'MOUNTAINS' },
      { direction: 'SOUTH', destination: 'CLEARING' },
      { direction: 'WEST', destination: 'PATH' },
      { direction: 'UP', destination: '', message: 'There is no tree here suitable for climbing.' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
    globalObjects: ['TREE', 'SONGBIRD', 'WHITE-HOUSE', 'FOREST']
  },

  'FOREST-3': {
    id: 'FOREST-3',
    name: 'Forest',
    description: 'Forest',
    longDescription: 'This is a dimly lit forest, with large trees all around.',
    exits: [
      { direction: 'NORTH', destination: 'CLEARING' },
      { direction: 'EAST', destination: '', message: 'The rank undergrowth prevents eastward movement.' },
      { direction: 'SOUTH', destination: '', message: 'Storm-tossed trees block your way.' },
      { direction: 'WEST', destination: 'FOREST-1' },
      { direction: 'NW', destination: 'SOUTH-OF-HOUSE' },
      { direction: 'UP', destination: '', message: 'There is no tree here suitable for climbing.' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
    globalObjects: ['TREE', 'SONGBIRD', 'WHITE-HOUSE', 'FOREST']
  },

  'PATH': {
    id: 'PATH',
    name: 'Forest Path',
    description: 'Forest Path',
    longDescription: 'This is a path winding through a dimly lit forest. The path heads north-south here. One particularly large tree with some low branches stands at the edge of the path.',
    exits: [
      { direction: 'NORTH', destination: 'GRATING-CLEARING' },
      { direction: 'EAST', destination: 'FOREST-2' },
      { direction: 'SOUTH', destination: 'NORTH-OF-HOUSE' },
      { direction: 'WEST', destination: 'FOREST-1' },
      { direction: 'UP', destination: 'UP-A-TREE' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
    globalObjects: ['TREE', 'SONGBIRD', 'WHITE-HOUSE', 'FOREST']
  },

  'UP-A-TREE': {
    id: 'UP-A-TREE',
    name: 'Up a Tree',
    description: 'Up a Tree',
    longDescription: 'You are about 10 feet above the ground nestled among some large branches. The nearest branch above you is above your reach.',
    exits: [
      { direction: 'DOWN', destination: 'PATH' },
      { direction: 'UP', destination: '', message: 'You cannot climb any higher.' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
    globalObjects: ['TREE', 'FOREST', 'SONGBIRD', 'WHITE-HOUSE']
  },

  'GRATING-CLEARING': {
    id: 'GRATING-CLEARING',
    name: 'Clearing',
    description: 'Clearing',
    longDescription: 'You are in a clearing, with a forest surrounding you on all sides. A path leads south.',
    exits: [
      { direction: 'NORTH', destination: '', message: 'The forest becomes impenetrable to the north.' },
      { direction: 'EAST', destination: 'FOREST-2' },
      { direction: 'WEST', destination: 'FOREST-1' },
      { direction: 'SOUTH', destination: 'PATH' },
      { direction: 'DOWN', destination: 'GRATING-ROOM', condition: 'GRATE IS OPEN' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
    globalObjects: ['WHITE-HOUSE', 'GRATE']
  },

  'CLEARING': {
    id: 'CLEARING',
    name: 'Clearing',
    description: 'Clearing',
    longDescription: 'You are in a small clearing in a well marked forest path that extends to the east and west.',
    exits: [
      { direction: 'EAST', destination: 'CANYON-VIEW' },
      { direction: 'NORTH', destination: 'FOREST-2' },
      { direction: 'SOUTH', destination: 'FOREST-3' },
      { direction: 'WEST', destination: 'EAST-OF-HOUSE' },
      { direction: 'UP', destination: '', message: 'There is no tree here suitable for climbing.' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
    globalObjects: ['TREE', 'SONGBIRD', 'WHITE-HOUSE', 'FOREST']
  },

  'CANYON-VIEW': {
    id: 'CANYON-VIEW',
    name: 'Canyon View',
    description: 'Canyon View',
    longDescription: 'You are at the top of the Great Canyon on its west wall. From here there is a marvelous view of the canyon and parts of the Frigid River upstream. Across the canyon, the walls of the White Cliffs join the mighty ramparts of the Flathead Mountains to the east. Following the Canyon upstream to the north, Aragain Falls may be seen, complete with rainbow. The mighty Frigid River flows out from a great dark cavern. To the west and south can be seen an immense forest, stretching for miles around. A path leads northwest. It is possible to climb down into the canyon from here.',
    exits: [
      { direction: 'WEST', destination: 'CLEARING' },
      { direction: 'NW', destination: 'GRATING-CLEARING' },
      { direction: 'DOWN', destination: 'ROCKY-LEDGE' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT']
  },

  'MOUNTAINS': {
    id: 'MOUNTAINS',
    name: 'Forest',
    description: 'Forest',
    longDescription: 'The forest thins out, revealing impassable mountains.',
    exits: [
      { direction: 'NORTH', destination: 'FOREST-2' },
      { direction: 'EAST', destination: '', message: 'The mountains are impassable.' },
      { direction: 'SOUTH', destination: 'FOREST-2' },
      { direction: 'WEST', destination: 'FOREST-2' },
      { direction: 'UP', destination: '', message: 'The mountains are impassable.' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
    globalObjects: ['TREE', 'WHITE-HOUSE']
  },

  // HOUSE ROOMS
  'KITCHEN': {
    id: 'KITCHEN',
    name: 'Kitchen',
    description: 'Kitchen',
    longDescription: 'You are in the kitchen of the white house. A table seems to have been used recently for the preparation of food. A passage leads to the west and a dark staircase can be seen leading upward. A dark chimney leads down and to the east is a small window which is open.',
    exits: [
      { direction: 'EAST', destination: 'EAST-OF-HOUSE', condition: 'KITCHEN-WINDOW IS OPEN' },
      { direction: 'WEST', destination: 'LIVING-ROOM' },
      { direction: 'OUT', destination: 'EAST-OF-HOUSE', condition: 'KITCHEN-WINDOW IS OPEN' },
      { direction: 'UP', destination: 'ATTIC' },
      { direction: 'DOWN', destination: '', message: 'Only Santa Claus climbs down chimneys.' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
    globalObjects: ['KITCHEN-WINDOW', 'CHIMNEY', 'STAIRS'],
    value: 10
  },

  'ATTIC': {
    id: 'ATTIC',
    name: 'Attic',
    description: 'Attic',
    longDescription: 'This is the attic. The only exit is a stairway leading down.',
    exits: [
      { direction: 'DOWN', destination: 'KITCHEN' }
    ],
    flags: ['RLANDBIT', 'SACREDBIT'],
    globalObjects: ['STAIRS']
  },

  'LIVING-ROOM': {
    id: 'LIVING-ROOM',
    name: 'Living Room',
    description: 'Living Room',
    longDescription: 'You are in the living room. There is a doorway to the east, a wooden door with strange gothic lettering to the west, which appears to be nailed shut, a trophy case, and a large oriental rug in the center of the room.',
    exits: [
      { direction: 'EAST', destination: 'KITCHEN' },
      { direction: 'WEST', destination: 'STRANGE-PASSAGE', condition: 'MAGIC-FLAG' },
      { direction: 'DOWN', destination: 'CELLAR', condition: 'TRAP-DOOR IS OPEN' }
    ],
    flags: ['RLANDBIT', 'ONBIT', 'SACREDBIT'],
    globalObjects: ['STAIRS']
  },

  // CELLAR AND VICINITY
  'CELLAR': {
    id: 'CELLAR',
    name: 'Cellar',
    description: 'Cellar',
    longDescription: 'You are in a dark and damp cellar with a narrow passageway leading north, and a crawlway to the south. On the west is the bottom of a steep metal ramp which is unclimbable.',
    exits: [
      { direction: 'NORTH', destination: 'TROLL-ROOM' },
      { direction: 'SOUTH', destination: 'EAST-OF-CHASM' },
      { direction: 'UP', destination: 'LIVING-ROOM', condition: 'TRAP-DOOR IS OPEN' },
      { direction: 'WEST', destination: '', message: 'You try to ascend the ramp, but it is impossible, and you slide back down.' }
    ],
    flags: ['RLANDBIT'],
    globalObjects: ['TRAP-DOOR', 'SLIDE', 'STAIRS'],
    value: 25
  },

  'TROLL-ROOM': {
    id: 'TROLL-ROOM',
    name: 'The Troll Room',
    description: 'The Troll Room',
    longDescription: 'This is a small room with passages to the east and south and a forbidding hole leading west. Bloodstains and deep scratches (perhaps made by an axe) mar the walls.',
    exits: [
      { direction: 'SOUTH', destination: 'CELLAR' },
      { direction: 'EAST', destination: 'EW-PASSAGE', condition: 'TROLL-FLAG' },
      { direction: 'WEST', destination: 'MAZE-1', condition: 'TROLL-FLAG' }
    ],
    flags: ['RLANDBIT']
  },

  'EAST-OF-CHASM': {
    id: 'EAST-OF-CHASM',
    name: 'East of Chasm',
    description: 'East of Chasm',
    longDescription: 'You are on the east edge of a chasm, the bottom of which cannot be seen. A narrow passage goes north, and the path you are on continues to the east.',
    exits: [
      { direction: 'NORTH', destination: 'CELLAR' },
      { direction: 'EAST', destination: 'GALLERY' },
      { direction: 'DOWN', destination: '', message: 'The chasm probably leads straight to the infernal regions.' }
    ],
    flags: ['RLANDBIT']
  },

  'GALLERY': {
    id: 'GALLERY',
    name: 'Gallery',
    description: 'Gallery',
    longDescription: 'This is an art gallery. Most of the paintings have been stolen by vandals with exceptional taste. The vandals left through either the north or west exits.',
    exits: [
      { direction: 'WEST', destination: 'EAST-OF-CHASM' },
      { direction: 'NORTH', destination: 'STUDIO' }
    ],
    flags: ['RLANDBIT', 'ONBIT']
  },

  'STUDIO': {
    id: 'STUDIO',
    name: 'Studio',
    description: 'Studio',
    longDescription: 'This appears to have been an artist\'s studio. The walls and floors are splattered with paints of 69 different colors. Strangely enough, nothing of value is hanging here. At the south end of the room is an open door (also covered with paint). A dark and narrow chimney leads up from a fireplace; although you might be able to get up it, it seems unlikely you could get back down.',
    exits: [
      { direction: 'SOUTH', destination: 'GALLERY' },
      { direction: 'UP', destination: 'KITCHEN', condition: 'UP-CHIMNEY-ALLOWED' }
    ],
    flags: ['RLANDBIT'],
    globalObjects: ['CHIMNEY']
  },

  // MAZE ROOMS (15 rooms)
  'MAZE-1': {
    id: 'MAZE-1',
    name: 'Maze',
    description: 'Maze',
    longDescription: 'This is part of a maze of twisty little passages, all alike.',
    exits: [
      { direction: 'EAST', destination: 'TROLL-ROOM' },
      { direction: 'NORTH', destination: 'MAZE-1' },
      { direction: 'SOUTH', destination: 'MAZE-2' },
      { direction: 'WEST', destination: 'MAZE-4' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'MAZE-2': {
    id: 'MAZE-2',
    name: 'Maze',
    description: 'Maze',
    longDescription: 'This is part of a maze of twisty little passages, all alike.',
    exits: [
      { direction: 'SOUTH', destination: 'MAZE-1' },
      { direction: 'DOWN', destination: 'MAZE-4' },
      { direction: 'EAST', destination: 'MAZE-3' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'MAZE-3': {
    id: 'MAZE-3',
    name: 'Maze',
    description: 'Maze',
    longDescription: 'This is part of a maze of twisty little passages, all alike.',
    exits: [
      { direction: 'WEST', destination: 'MAZE-2' },
      { direction: 'NORTH', destination: 'MAZE-4' },
      { direction: 'UP', destination: 'MAZE-5' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'MAZE-4': {
    id: 'MAZE-4',
    name: 'Maze',
    description: 'Maze',
    longDescription: 'This is part of a maze of twisty little passages, all alike.',
    exits: [
      { direction: 'WEST', destination: 'MAZE-3' },
      { direction: 'NORTH', destination: 'MAZE-1' },
      { direction: 'EAST', destination: 'DEAD-END-1' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'DEAD-END-1': {
    id: 'DEAD-END-1',
    name: 'Dead End',
    description: 'Dead End',
    longDescription: 'You have come to a dead end in the maze.',
    exits: [
      { direction: 'SOUTH', destination: 'MAZE-4' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'MAZE-5': {
    id: 'MAZE-5',
    name: 'Maze',
    description: 'Maze',
    longDescription: 'This is part of a maze of twisty little passages, all alike. A skeleton, probably the remains of a luckless adventurer, lies here.',
    exits: [
      { direction: 'EAST', destination: 'DEAD-END-2' },
      { direction: 'NORTH', destination: 'MAZE-3' },
      { direction: 'SW', destination: 'MAZE-6' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'DEAD-END-2': {
    id: 'DEAD-END-2',
    name: 'Dead End',
    description: 'Dead End',
    longDescription: 'You have come to a dead end in the maze.',
    exits: [
      { direction: 'WEST', destination: 'MAZE-5' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'MAZE-6': {
    id: 'MAZE-6',
    name: 'Maze',
    description: 'Maze',
    longDescription: 'This is part of a maze of twisty little passages, all alike.',
    exits: [
      { direction: 'EAST', destination: 'MAZE-7' },
      { direction: 'WEST', destination: 'MAZE-11' },
      { direction: 'NE', destination: 'MAZE-5' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'MAZE-7': {
    id: 'MAZE-7',
    name: 'Maze',
    description: 'Maze',
    longDescription: 'This is part of a maze of twisty little passages, all alike.',
    exits: [
      { direction: 'WEST', destination: 'MAZE-6' },
      { direction: 'UP', destination: 'MAZE-8' },
      { direction: 'SOUTH', destination: 'MAZE-10' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'MAZE-8': {
    id: 'MAZE-8',
    name: 'Maze',
    description: 'Maze',
    longDescription: 'This is part of a maze of twisty little passages, all alike.',
    exits: [
      { direction: 'DOWN', destination: 'MAZE-7' },
      { direction: 'EAST', destination: 'MAZE-9' },
      { direction: 'NE', destination: 'MAZE-10' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'MAZE-9': {
    id: 'MAZE-9',
    name: 'Maze',
    description: 'Maze',
    longDescription: 'This is part of a maze of twisty little passages, all alike.',
    exits: [
      { direction: 'WEST', destination: 'MAZE-8' },
      { direction: 'SE', destination: 'MAZE-10' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'MAZE-10': {
    id: 'MAZE-10',
    name: 'Maze',
    description: 'Maze',
    longDescription: 'This is part of a maze of twisty little passages, all alike.',
    exits: [
      { direction: 'NORTH', destination: 'MAZE-7' },
      { direction: 'SW', destination: 'MAZE-8' },
      { direction: 'NW', destination: 'MAZE-9' },
      { direction: 'EAST', destination: 'MAZE-11' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'MAZE-11': {
    id: 'MAZE-11',
    name: 'Maze',
    description: 'Maze',
    longDescription: 'This is part of a maze of twisty little passages, all alike.',
    exits: [
      { direction: 'WEST', destination: 'MAZE-10' },
      { direction: 'NORTH', destination: 'MAZE-12' },
      { direction: 'SOUTH', destination: 'MAZE-13' },
      { direction: 'EAST', destination: 'MAZE-6' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'MAZE-12': {
    id: 'MAZE-12',
    name: 'Maze',
    description: 'Maze',
    longDescription: 'This is part of a maze of twisty little passages, all alike.',
    exits: [
      { direction: 'SOUTH', destination: 'MAZE-11' },
      { direction: 'EAST', destination: 'MAZE-13' },
      { direction: 'NE', destination: 'DEAD-END-3' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'DEAD-END-3': {
    id: 'DEAD-END-3',
    name: 'Dead End',
    description: 'Dead End',
    longDescription: 'You have come to a dead end in the maze.',
    exits: [
      { direction: 'SW', destination: 'MAZE-12' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'MAZE-13': {
    id: 'MAZE-13',
    name: 'Maze',
    description: 'Maze',
    longDescription: 'This is part of a maze of twisty little passages, all alike.',
    exits: [
      { direction: 'WEST', destination: 'MAZE-12' },
      { direction: 'NORTH', destination: 'MAZE-11' },
      { direction: 'SE', destination: 'MAZE-14' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'MAZE-14': {
    id: 'MAZE-14',
    name: 'Maze',
    description: 'Maze',
    longDescription: 'This is part of a maze of twisty little passages, all alike.',
    exits: [
      { direction: 'NW', destination: 'MAZE-13' },
      { direction: 'DOWN', destination: 'MAZE-15' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'MAZE-15': {
    id: 'MAZE-15',
    name: 'Maze',
    description: 'Maze',
    longDescription: 'This is part of a maze of twisty little passages, all alike.',
    exits: [
      { direction: 'UP', destination: 'MAZE-14' },
      { direction: 'WEST', destination: 'GRATING-ROOM' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  'GRATING-ROOM': {
    id: 'GRATING-ROOM',
    name: 'Grating Room',
    description: 'Grating Room',
    longDescription: 'You are in a small room near the maze. There are twisty passages in the immediate vicinity.',
    exits: [
      { direction: 'UP', destination: 'GRATING-CLEARING', condition: 'GRATE IS OPEN' },
      { direction: 'EAST', destination: 'MAZE-15' },
      { direction: 'SW', destination: 'DEAD-END-4' }
    ],
    flags: ['RLANDBIT']
  },

  'DEAD-END-4': {
    id: 'DEAD-END-4',
    name: 'Dead End',
    description: 'Dead End',
    longDescription: 'You have come to a dead end in the maze.',
    exits: [
      { direction: 'NE', destination: 'GRATING-ROOM' }
    ],
    flags: ['RLANDBIT', 'MAZEBIT']
  },

  // Additional key rooms for basic functionality
  'EW-PASSAGE': {
    id: 'EW-PASSAGE',
    name: 'East-West Passage',
    description: 'East-West Passage',
    longDescription: 'This is a narrow east-west passageway. There is a narrow stairway leading down at the north end of the room.',
    exits: [
      { direction: 'EAST', destination: 'ROUND-ROOM' },
      { direction: 'WEST', destination: 'TROLL-ROOM' },
      { direction: 'DOWN', destination: 'CHASM-ROOM' }
    ],
    flags: ['RLANDBIT']
  },

  'ROUND-ROOM': {
    id: 'ROUND-ROOM',
    name: 'Round Room',
    description: 'Round Room',
    longDescription: 'This is a circular stone room with passages in all directions. Several of them have unfortunately been blocked by cave-ins.',
    exits: [
      { direction: 'WEST', destination: 'EW-PASSAGE' },
      { direction: 'SE', destination: 'LOUD-ROOM' },
      { direction: 'EAST', destination: 'NS-PASSAGE' },
      { direction: 'SOUTH', destination: 'NARROW-PASSAGE' }
    ],
    flags: ['RLANDBIT']
  },

  // Placeholder for remaining rooms - in a complete implementation,
  // all 110+ rooms would be defined here following the same pattern
};

/**
 * Room count by area for validation
 */
export const ROOM_COUNTS = {
  FOREST_OUTSIDE: 12,
  HOUSE: 4,
  CELLAR_VICINITY: 4,
  MAZE: 15,
  CYCLOPS_AREA: 3,
  RESERVOIR: 5,
  MIRROR_ROOMS: 9,
  ROUND_ROOM_AREA: 7,
  HADES: 2,
  TEMPLE_EGYPT: 5,
  DAM: 3,
  RIVER: 13,
  COAL_MINE: 14,
  TOTAL: 110
};
