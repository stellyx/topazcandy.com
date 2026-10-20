import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'warp','maps','legacy-redirect-manifest.json'),'utf8'));
const sha256=body=>crypto.createHash('sha256').update(body).digest('hex').toUpperCase();

test('every legacy map HTML shell redirects to its exact archived counterpart',()=>{
 assert.equal(manifest.redirect_count,190);
 assert.equal(manifest.redirects.filter(record=>record.legacy_path.startsWith('/qhcf/areas/')).length,170);
 for(const record of manifest.redirects){
  const legacy=path.join(root,...record.legacy_path.split('/').filter(Boolean));
  const counterpart=path.join(root,...record.destination.split('/').filter(Boolean));
  assert.ok(fs.existsSync(legacy),record.legacy_path);
  assert.ok(fs.existsSync(counterpart),record.destination);
  const html=fs.readFileSync(legacy,'utf8');
  assert.equal(sha256(html),record.sha256,record.legacy_path);
  assert.match(html,new RegExp(`<meta http-equiv="refresh" content="0; url=${record.destination.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}">`));
  assert.match(html,new RegExp(`<link rel="canonical" href="${record.canonical.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}">`));
  assert.match(html,/location\.replace\(/);
 }
});

test('ranking, Academy, JSON, TXT, CSS, and module endpoints are not redirect shells',()=>{
 const protectedPaths=[
  'qhcf/references/ranking-items.html','qhcf/references/ranking-items.json','qhcf/references/ranking-items.csv','qhcf/references/ranking-items-SOURCE-NOTES.md',
  'qhcf/academy-temple-coverage.html','qhcf/maps.json','qhcf/manifest.json','qhcf/reference.txt','qhcf/atlas.css','qhcf/enhanced-area-links.mjs','qhcf/navigation/galadon-v1.json','qhcf/data/index.json'
 ];
 for(const relative of protectedPaths){const text=fs.readFileSync(path.join(root,...relative.split('/')),'utf8');assert.doesNotMatch(text,/http-equiv="refresh"/,relative)}
 assert.match(fs.readFileSync(path.join(root,'qhcf','references','ranking-items.html'),'utf8'),/QHCF \/ Carrion Fields preservation reference/);
});

test('legacy overview lands in historical archive while current WARP remains separate',()=>{
 const overview=manifest.redirects.find(record=>record.legacy_path==='/qhcf/index.html');
 assert.equal(overview.destination,'/warp/maps/archive/cf/');
 const current=fs.readFileSync(path.join(root,'warp','maps','index.html'),'utf8');
 assert.match(current,/Galadon graphical snapshot/);
 assert.match(current,/not a live game connection/);
});
