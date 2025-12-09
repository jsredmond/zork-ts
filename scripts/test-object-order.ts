import { ALL_OBJECTS } from '../src/game/data/objects-complete.js';

// Check the order of objects in LIVING-ROOM
const livingRoomObjects = Object.entries(ALL_OBJECTS)
  .filter(([id, obj]) => obj.initialLocation === 'LIVING-ROOM')
  .map(([id, obj]) => ({ id, name: obj.name, firstDescription: obj.firstDescription }));

console.log('Objects in LIVING-ROOM (in definition order):');
livingRoomObjects.forEach((obj, index) => {
  console.log(`${index + 1}. ${obj.id} - ${obj.name}`);
  if (obj.firstDescription) {
    console.log(`   First: ${obj.firstDescription.substring(0, 60)}...`);
  }
});
