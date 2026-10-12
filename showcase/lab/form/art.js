// Original vector artwork. The same paths draw the swatches and the printed 3D
// surfaces; no remote textures or third-party artwork are copied.
const ellipse=(x,y,rx,ry,n=64)=>Array.from({length:n+1},(_,i)=>{const a=i/n*Math.PI*2;return [x+Math.cos(a)*rx,y+Math.sin(a)*ry];});
const line=(points,ink=0,width=.009)=>({points,ink,width});
const fill=(points,ink=0)=>({points,ink,fill:true});
function star(x,y,r,ink=2){return fill(Array.from({length:8},(_,i)=>{const a=i/8*Math.PI*2-Math.PI/2,d=i%2?r*.28:r;return [x+Math.cos(a)*d,y+Math.sin(a)*d];}),ink);}
export function artPaths(kind) {
  const paths=[];
  if(kind==='orbit'){
    for(const [x,y,r]of [[.22,.38,.105],[.70,.69,.072],[.73,.22,.045]]){
      paths.push(line(ellipse(x,y,r,r),0,.010));
      const ring=ellipse(0,0,r*1.65,r*.30).map(([a,b])=>[x+a*.93-b*.36,y+a*.36+b*.93]);paths.push(line(ring,1,.012));
    }
    for(const [x,y,r]of [[.46,.77,.052],[.85,.43,.035],[.10,.76,.023],[.48,.18,.035],[.43,.52,.026]])paths.push(star(x,y,r));
    paths.push(line([[.08,.08],[.90,.08]],1,.006),line([[.08,.92],[.9,.92]],0,.006));
  }else if(kind==='checker'){
    for(let y=0;y<8;y++)for(let x=0;x<10;x++){
      if((x+y)%2)continue;
      const warp=(a,b)=>[a+.023*Math.sin(b*Math.PI*4+a*6),.12+b*.76];
      const points=[];
      for(let edge=0;edge<4;edge++)for(let n=0;n<5;n++){
        const t=n/5,a=edge===0?(x+t)/10:edge===1?(x+1)/10:edge===2?(x+1-t)/10:x/10,b=edge===0?y/8:edge===1?(y+t)/8:edge===2?(y+1)/8:(y+1-t)/8;
        points.push(warp(a,b));
      }
      paths.push(fill(points,y<4?0:1));
    }
    paths.push(line([[0,.08],[1,.08]],2,.009),line([[0,.92],[1,.92]],2,.009));
  }else if(kind==='botanical'||kind==='flower'){
    paths.push(line(ellipse(.72,.68,.13,.13),0,.013));
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;paths.push(line([[.72+Math.cos(a)*.16,.68+Math.sin(a)*.16],[.72+Math.cos(a)*.185,.68+Math.sin(a)*.185]],0,.007));}
    paths.push(line([[.20,.17],[.22,.28],[.25,.44],[.32,.59],[.34,.78]],1,.015));
    for(let i=0;i<6;i++){
      const y=.29+i*.072,x=.22+i*.021;
      paths.push(fill([[x,y],[x-.10,y+.09],[x-.15,y+.11],[x-.12,y+.04],[x,y-.005]],i%2),fill([[x,y+.035],[x+.09,y+.13],[x+.14,y+.14],[x+.12,y+.065],[x,y+.025]],i%2));
    }
    if(kind==='flower')for(const [x,y]of [[.60,.23],[.85,.40]]){
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2;paths.push(line(ellipse(x+Math.cos(a)*.055,y+Math.sin(a)*.055,.036,.036,24),1,.010));}paths.push(line(ellipse(x,y,.024,.024,24),2,.010));
    }
    for(let i=0;i<3;i++)paths.push(line(Array.from({length:50},(_,n)=>[n/49,.06+i*.027+Math.sin(n/49*9+i)*.015]),2,.006));
  }else if(kind==='topo'){
    for(let i=0;i<11;i++){
      const r=.035+i*.042,points=Array.from({length:140},(_,j)=>{const a=j/139*Math.PI*2,rr=r*(1+.15*Math.sin(3*a+.7*i));return [.49+Math.cos(a)*rr,.49+Math.sin(a)*rr*.87];});
      paths.push(line(points,i%3,.007));
    }
  }else if(kind==='flash'){
    for(const [x,y,s]of [[.15,.15,1],[.58,.43,.9],[.76,.11,.58]])paths.push(fill([[x+.14*s,y],[x+.06*s,y+.18*s],[x+.15*s,y+.18*s],[x,y+.43*s],[x+.055*s,y+.24*s],[x-.02*s,y+.24*s]],0));
    for(const [x,y]of [[.30,.83],[.60,.14],[.88,.74]])paths.push(star(x,y,.044,1));
    paths.push(line([[.10,.92],[.90,.92]],2,.008));
  }else if(kind==='skull'){
    for(const [x,y,s]of [[.25,.34,.82],[.73,.65,.72]]){
      const p=ellipse(x,y,.15*s,.17*s,64).filter(([,b])=>b>y-.115*s);
      p.push([x+.09*s,y-.18*s],[x-.09*s,y-.18*s]);paths.push(line([...p,p[0]],2,.013));
      paths.push(line(ellipse(x-.055*s,y,.033*s,.039*s,28),2,.012),line(ellipse(x+.055*s,y,.033*s,.039*s,28),2,.012));
      paths.push(line([[x-.02*s,y-.067*s],[x,y-.043*s],[x+.02*s,y-.067*s]],2,.010));
      for(let j=-1;j<=1;j++)paths.push(line([[x+j*.04*s,y-.115*s],[x+j*.04*s,y-.17*s]],2,.009));
    }
    paths.push(star(.30,.80,.042,0),star(.70,.21,.038,0));
  }
  return paths;
}
export function artThumbnail(kind,colors=['#dcff76','#ab82ff','#faf4df']) {
  if(kind==='none')return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="22" stroke="#a4b69a" stroke-width="1.4" fill="none"/><path d="M34 66 66 34" stroke="#a4b69a" stroke-width="1.4"/></svg>';
  if(kind==='catalog')return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="m50 19 8 20 23 11-23 10-8 21-8-21-23-10 23-11Z" fill="none" stroke="#dcff76" stroke-width="1.8"/><circle cx="50" cy="50" r="12" fill="none" stroke="#ab82ff" stroke-width="1.5"/></svg>';
  return '<svg viewBox="0 0 100 100" aria-hidden="true">'+artPaths(kind).map(p=>'<path d="'+p.points.map(([x,y],i)=>(i?'L':'M')+(x*100).toFixed(2)+' '+((1-y)*100).toFixed(2)).join(' ')+(p.fill?'Z':'')+'" fill="'+(p.fill?colors[p.ink]:'none')+'" stroke="'+(p.fill?'none':colors[p.ink])+'" stroke-width="'+((p.width||.009)*100).toFixed(2)+'"/>').join('')+'</svg>';
}
