const W=48,H=27;
 const floor=[[78,210],[410,190],[1090,190],[1160,190],[1160,220],[1335,220],[1370,240],[1370,330],[1505,405],[1570,410],[1570,770],[847,770],[847,843],[710,843],[710,770],[78,770]];
 const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
 const obstacles=[rect(77,170,205,85),[[410,165],[1021,165],[1021,300],[970,316],[490,316],[430,295],[410,257]],rect(515,263,54,72),rect(608,263,49,72),rect(699,263,50,72),rect(790,263,49,72),rect(880,263,50,72),rect(1073,165,108,40),rect(1190,166,132,47),rect(1340,254,66,73),[[203,268],[254,245],[340,249],[368,282],[365,374],[328,405],[227,400],[205,370]],rect(164,420,246,168),[[305,621],[345,594],[446,596],[475,634],[477,708],[452,758],[328,751],[299,708]],[[1023,350],[1070,332],[1160,333],[1190,360],[1185,459],[1150,493],[1050,490],[1020,445]],rect(1008,545,181,167),[[1300,605],[1340,578],[1427,574],[1462,617],[1468,692],[1437,747],[1324,745],[1297,690]],[[1314,345],[1360,341],[1402,377],[1398,421],[1361,437],[1311,403]],[[1392,405],[1441,399],[1450,444],[1403,456],[1392,440]],[[1449,422],[1505,410],[1540,447],[1516,500],[1470,487],[1445,463]]];
 function inside(x,y,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let [a,b]=poly[i],[u,v]=poly[j];if((b>y)!==(v>y)&&x<(u-a)*(y-b)/(v-b)+a)yes=!yes}return yes}
 function near(x,y,poly,r){return poly.some(([a,b],i)=>{let [u,v]=poly[(i+1)%poly.length],dx=u-a,dy=v-b,t=Math.max(0,Math.min(1,((x-a)*dx+(y-b)*dy)/(dx*dx+dy*dy)));return (x-a-t*dx)**2+(y-b-t*dy)**2<r*r})}
 const cells=new Set();for(let y=0;y<H;y++)for(let x=0;x<W;x++){let a=(x+.5)*1648/W,b=(y+.5)*928/H;if(inside(a,b,floor)&&!near(a,b,floor,13)&&!obstacles.some(o=>inside(a,b,o)||near(a,b,o,13)))cells.add(x+','+y)}
 // Retain only the connected walkable area around the centre of the tavern.
 const reachable=new Set(),queue=[[21,14]];while(queue.length){let [x,y]=queue.pop(),k=x+','+y;if(reachable.has(k)||!cells.has(k))continue;reachable.add(k);queue.push([x+1,y],[x-1,y],[x,y+1],[x,y-1])}
 const walkable=(x,y)=>reachable.has(x+','+y);
 const spawnCells=[...reachable].map(k=>k.split(',').map(Number)).sort((a,b)=>(a[0]-21)**2+(a[1]-14)**2-(b[0]-21)**2-(b[1]-14)**2);

module.exports={walkable,spawnCells};
