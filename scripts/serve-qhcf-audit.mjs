import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.txt':'text/plain; charset=utf-8','.webp':'image/webp','.png':'image/png'};
http.createServer((request,response)=>{
 let pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
 if(pathname.endsWith('/'))pathname+='index.html';
 const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)){response.writeHead(403).end();return}
 try{const body=fs.readFileSync(file);response.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'}).end(body)}catch{response.writeHead(404).end('Not found')}
}).listen(8123,'127.0.0.1',()=>console.log('QHCF audit server: http://127.0.0.1:8123/qhcf/'));
