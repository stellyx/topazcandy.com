// Use the same crop for the DOM video and the refracted 3D background. Narrow
// stages bias left so the reclining feet remain visible instead of being cut off.
export function beachFrame({surfaceWidth,surfaceHeight,width,height,imageWidth=1280,imageHeight=720,left=0,top=0}){
  const ratio=surfaceWidth/surfaceHeight,position=ratio<1.05?0:ratio<1.33?.2:.42;
  const scale=Math.max(surfaceWidth/imageWidth,surfaceHeight/imageHeight),contentWidth=imageWidth*scale,contentHeight=imageHeight*scale;
  const x=(surfaceWidth-contentWidth)*position,y=(surfaceHeight-contentHeight)*.5;
  return {position,repeat:[width/contentWidth,height/contentHeight],offset:[(left-x)/contentWidth,1-(top-y+height)/contentHeight],sourceLeft:-x/scale,sourceRight:(surfaceWidth-x)/scale};
}
