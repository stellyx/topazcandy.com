import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const [payloadFile, publicTownFile = 'warp/maps/public-town.json'] = process.argv.slice(2);
if (!payloadFile) throw new Error('Usage: node scripts/sync-warp-installed-snapshot.mjs <sanitized-payload.json> [public-town.json]');

const payloadBytes = fs.readFileSync(payloadFile);
const payload = JSON.parse(payloadBytes);
const town = JSON.parse(fs.readFileSync(publicTownFile, 'utf8'));
const sha = value => crypto.createHash('sha256').update(value).digest('hex').toUpperCase();
const expectedFileSha = 'B1AAE01805B3BE4EE5CAAFFE4AFCFA26CE4269F4D2DC65EA0F9862A1CE860FAD';
const expectedDataSha = 'D22BD904B4E8B2EFF9D668605BCB5D0E91043DE13102676C43EFB1E97B181A5B';
const allowedDirections = new Set(['north', 'south', 'east', 'west', 'up', 'down']);

if (sha(payloadBytes) !== expectedFileSha) throw new Error('Sanitized payload file hash does not match the accepted release');
if (payload.schema !== 'warp-atlas-public-v1' || payload.area !== 'WarpGaladonSeed') throw new Error('Unexpected payload schema or area');
if (payload.verification?.sha256_of_data !== expectedDataSha) throw new Error('Unexpected payload data hash');
if (payload.rooms.length !== 204 || payload.verification.rooms !== 204 || payload.verification.directed_exits !== 440) throw new Error('Unexpected payload graph totals');

const payloadRooms = new Map(payload.rooms.map(room => [room.id, room]));
if (payloadRooms.size !== 204 || town.rooms.length !== 204) throw new Error('Unexpected or duplicate room IDs');
let exits = 0;
for (const room of payload.rooms) {
  const current = town.rooms.find(candidate => candidate.id === room.id);
  if (!current) throw new Error(`Missing current room ${room.id}`);
  if (current.title !== room.title) throw new Error(`Title mismatch for ${room.id}`);
  for (const [direction, target] of Object.entries(room.exits)) {
    exits += 1;
    if (!allowedDirections.has(direction)) throw new Error(`Unsupported direction ${direction} on ${room.id}`);
    if (!payloadRooms.has(target)) throw new Error(`Missing target ${target} from ${room.id}`);
  }
  current.exits = room.exits;
}
if (exits !== 440) throw new Error(`Expected 440 exits, found ${exits}`);

const byId = new Map(town.rooms.map(room => [room.id, room]));
byId.get('WarpGaladonSeed#39').description = 'A high stone overlook is striped by old rain marks running at an impossible angle across the parapet. The only public descent runs WEST toward the lower civic streets.';
byId.get('WarpGaladonSeed#62').description = 'Old rain bands, wind arrows, and one sun-faded snow marker share a three-way junction without predicting anything. NORTH reaches Far-Gauge End. SOUTH reaches Northeast Measure. EAST climbs to Slant-Rain Overlook.';

const sanitizedContent = town.rooms.map(({id, title, description}) => ({id, title, description}));
const payloadProjection = town.rooms.map(({id, title, exits: roomExits}) => ({id, title, exits: roomExits}));
town.dataset_id = 'warp.public-town.galadon-installed-snapshot.2026-10-20';
town.status = 'INSTALLED_RELEASE_PUBLIC_MAP_SNAPSHOT';
town.live_gameplay_verified = false;
town.executable_routes = false;
town.generated_at_utc = '2026-10-20T23:00:00Z';
town.release = {
  identity: 'warp-integrated-successor-2026-10-20+description-reconcile-DE32B531',
  installed_snapshot_verified: true,
  live_connection: false,
  public_payload_file_sha256: expectedFileSha,
  public_payload_data_sha256: expectedDataSha,
  public_payload_rooms_sha256: sha(JSON.stringify(payloadProjection)),
  allowed_directions: [...allowedDirections]
};
town.contract = {
  topology_sha256: expectedDataSha,
  room_count: 204,
  directed_internal_exit_count: 440,
  components: [196, 8],
  direction_configuration: 'Installed release uses north, south, east, west, up, and down only.',
  reconciled_cardinal_pair: [
    'WarpGaladonSeed#39 west -> WarpGaladonSeed#62',
    'WarpGaladonSeed#62 east -> WarpGaladonSeed#39'
  ]
};
town.content_contract.source_candidate = 'Reviewed sanitized WARP public-town content, synchronized to the installed successor payload';
town.content_contract.sanitized_room_content_sha256 = sha(JSON.stringify(sanitizedContent));
town.content_contract.live_gameplay_verified = false;
town.content_contract.installed_snapshot_verified = true;
town.content_contract.protected_rooms_modified = 0;
town.route_previews.note = 'Routes are shortest paths inside the installed-release public snapshot. The website is not connected to the running game and cannot execute movement.';
town.route_previews.installed_snapshot_verified = true;

const forbidden = ['password', 'auth_token', 'player_record', 'family_tree', 'private_home', 'timeline_event', 'williswarpritual'];
const publicText = JSON.stringify(town).toLowerCase();
for (const token of forbidden) if (publicText.includes(token)) throw new Error(`Forbidden public token: ${token}`);

fs.writeFileSync(publicTownFile, `${JSON.stringify(town, null, 2)}\n`);
console.log(JSON.stringify({
  status: 'PASS_WARP_INSTALLED_SNAPSHOT_SYNC',
  rooms: town.rooms.length,
  directed_exits: exits,
  payload_file_sha256: expectedFileSha,
  payload_data_sha256: expectedDataSha,
  payload_rooms_sha256: town.release.public_payload_rooms_sha256,
  sanitized_room_content_sha256: town.content_contract.sanitized_room_content_sha256
}, null, 2));
