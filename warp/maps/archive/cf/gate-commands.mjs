export const EAST_GATE = 'galadon.map.gate.east';
export const OUTSIDE_EAST_GATE = 'galadon.map.r40c67';
export const OPEN_EAST_GATE = 'open east';

// A door action is not a movement. Insert it at the room inside the gate,
// immediately before the east move into the mapped room outside.
export function withEastGateAction(nodeIds, directions) {
  if (nodeIds.length !== directions.length + 1) throw Error('Route nodes and moves differ');
  const commands = [];
  for (let i = 0; i < directions.length; i++) {
    if (nodeIds[i] === EAST_GATE && nodeIds[i + 1] === OUTSIDE_EAST_GATE && directions[i] === 'e') {
      commands.push(OPEN_EAST_GATE);
    }
    commands.push(directions[i]);
  }
  return commands;
}
