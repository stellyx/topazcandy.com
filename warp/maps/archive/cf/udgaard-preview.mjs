import {mountSourceGridPreview} from '/warp/maps/archive/cf/source-grid-preview.mjs';
import {anchors,boundaries,roomKey,route,sourceGraph} from './udgaard-route.mjs';

const names={a:"Saldria's Supplies",A:'Scribing by Averius',b:'Bank',B:'Bloodstone Lane',c:"Cartographer's Store",C:'Conjurer Guild',d:"Udgaard's Apothecary",D:'Diamond Boulevard',e:"Crellun's House of Grog",E:'Emerald Avenue',f:"Branthu's Custom Footwear",F:'Fountain',g:"Ivy's Greenhouse",G:"Jorgen's Elegant Gemstones",h:'Inside a house',H:"Halrilz's Bounty Office",i:'Galladrin the Pious',I:'Invoker Guild',J:'Jade Court',k:"Krildul's Breads and Cakes",K:"Kron's Spits",l:'Thieves Guild',m:'Magical Supplies',M:'Marble Alley',n:'Assassins Guild',N:'Necromancer Guild',o:'Underground River reference',O:"Ol' One-Eye's",p:'Bards Guild',P:'Pit and healer',R:'Registry',s:"Scholar's Repose",S:'Sapphire Lane',t:"Torden's Finest Armor",T:"Thorne's Armaments",u:"Jhelrhia's Emporium",U:'Alchemical Reagents',v:"Frilgor's Smithy",V:'The Paper Mill',W:'Warriors Guild',w:'Shapeshifter Guild',x:"Grilgoul's Mercenaries",X:"Delvuir's Tannery",Y:'Anti-paladin Guild',y:'Shaman Guild',Z:'Healer Guild',z:'Court of Judgement'};
mountSourceGridPreview({
 dataUrl:'/warp/maps/archive/cf/data/areas/udgaard.json',expectedRevision:4963,sourceGraph,route,anchors,roomKey,names,
 width:820,height:1080,position:room=>({x:55+(room.col-19)*21,y:42+(room.row-3)*21}),boundaries,
 sourceDescription:'Orthogonal routes use only printed - and | connectors in Udgaard revision 4963. Diagonals, dense adjacent plus cells, the underground-river note, special exits, and boundary crossings remain unresolved.'
});
