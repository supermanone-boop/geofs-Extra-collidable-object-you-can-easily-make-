
javascript:(()=>{"use strict";
const HF="https://huggingface.co/supermanone-boop/ITAMI/resolve/main/";
const GH="https://raw.githubusercontent.com/supermanone-boop/model/main/";
const BRIGHTNESS=1.18;
const configs=[
{name:"KADO1",url:HF+"kado_01.glb",lon:135.442825,lat:34.788936,height:8.888973662526322,scale:9.9,rx:0,ry:0,rz:-135},
{name:"KADO2",url:GH+"kado_02.glb",lon:135.437349,lat:34.793579,height:8.888973662526322,scale:9.9,rx:0,ry:0,rz:-135},
{name:"KADO4",url:GH+"kado_04.glb",lon:135.442945,lat:34.791555,height:8.888973662526322,scale:9.9,rx:0,ry:0,rz:-135}
];
const wait=setInterval(()=>{
if(!window.geofs?.api?.viewer||!window.Cesium)return;
clearInterval(wait);
const g=window.geofs;
const C=window.Cesium;
const provider="google",multiplayerServer="default";
gNewHD();
function gNewHD(){
window.geofsNewHDState=true;
g.geoIpUpdate=function(){
delete g.api.analytics;
document.body.classList.add("geofs-hd");
if(multiplayerServer!=="default")g.multiplayerHost=multiplayerServer;
if(provider==="google"){
g.api.imageryProvider=new C.UrlTemplateImageryProvider({
maximumLevel:21,
hasAlphaChannel:false,
subdomains:["mt0","mt1","mt2","mt3"],
url:"https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
});
}
g.api.setImageryProvider(g.api.imageryProvider,false);
g.api.viewer.terrainProvider=g.api.flatRunwayTerrainProviderInstance=
new g.api.FlatRunwayTerrainProvider({
baseProvider:new C.CesiumTerrainProvider({
url:"https://data.geo-fs.com/srtm/",
requestWaterMask:false,
requestVertexNormals:true
}),
bypass:false,
maximumLevel:12
});
};
g.geoIpUpdate();
g.api.hdOn=true;
if(window.jQuery)jQuery("body").trigger("terrainProviderUpdate");
};
g.executeOnEventDone("afterDeferredload",()=>{
g.mapXYZ="https://data.geo-fs.com/osm/{z}/{x}/{y}.png";
});
(async()=>{
for(const cfg of configs){
try{
const position=C.Cartesian3.fromDegrees(cfg.lon,cfg.lat,cfg.height);
const hpr=new C.HeadingPitchRoll(
C.Math.toRadians(cfg.rz),
C.Math.toRadians(cfg.rx),
C.Math.toRadians(cfg.ry)
);
const rotation=C.Transforms.headingPitchRollQuaternion(position,hpr);
const matrix=C.Matrix4.fromTranslationQuaternionRotationScale(
position,rotation,new C.Cartesian3(cfg.scale,cfg.scale,cfg.scale)
);
const model=await C.Model.fromGltf({
url:cfg.url,
modelMatrix:matrix,
scale:1
});
model.color=new C.Color(BRIGHTNESS,BRIGHTNESS,BRIGHTNESS,1);
if(C.ModelColorBlendMode&&C.ModelColorBlendMode.HIGHLIGHT!==undefined){
model.colorBlendMode=C.ModelColorBlendMode.HIGHLIGHT;
model.colorBlendAmount=0.18;
}
g.api.viewer.scene.primitives.add(model);
console.log("[KADO] Loaded:",cfg.name);
}catch(e){console.error("[KADO] Failed:",cfg.name,e);}
}
console.log("[KADO] Complete.");
})();
},500);
})();
