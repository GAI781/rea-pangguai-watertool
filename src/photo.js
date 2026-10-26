// Bundle the decoder and WASM with the app; never upload QR photos to a service.
import {readBarcodes,prepareZXingModule} from 'zxing-wasm/reader';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';
prepareZXingModule({overrides:{locateFile:path=>path.endsWith('.wasm')?wasmUrl:path}});
const options={formats:['QRCode'],tryHarder:true,maxNumberOfSymbols:2};
// Avoid CanvasRenderingContext2D.filter: availability differs on iOS releases.
function blurRed(image,sigma){
 const {width:w,height:h,data}=image;const radius=Math.ceil(sigma*2);
 const weights=Array.from({length:2*radius+1},(_,i)=>Math.exp(-((i-radius)**2)/(2*sigma*sigma)));
 const total=weights.reduce((a,b)=>a+b,0);const tmp=new Float32Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let n=0;for(let k=-radius;k<=radius;k++)n+=data[(y*w+Math.max(0,Math.min(w-1,x+k)))*4]*weights[k+radius];tmp[y*w+x]=n/total;}
 const result=new ImageData(w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let n=0;for(let k=-radius;k<=radius;k++)n+=tmp[Math.max(0,Math.min(h-1,y+k))*w+x]*weights[k+radius];const i=(y*w+x)*4;result.data[i]=result.data[i+1]=result.data[i+2]=n/total;result.data[i+3]=255;}
 return result;
}
async function read(data){const results=await readBarcodes(data,options);if(results.length>1)throw Error('照片包含多个二维码，请裁剪到单个设备码');return results[0]?.text;}
export async function decodePhoto(image){
 const scale=Math.min(1,2000/Math.max(image.naturalWidth,image.naturalHeight));
 const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,canvas.width,canvas.height);
 const original=ctx.getImageData(0,0,canvas.width,canvas.height);let found=await read(original);if(found)return found;
 // LCD photographs can contain blue illumination and a moire pattern. Red-plane
 // luminance plus a small blur suppresses the screen subpixels before resampling.
 for(const radius of [0.5,0.8,1.2]){
  const filtered=document.createElement('canvas');filtered.width=canvas.width;filtered.height=canvas.height;
  filtered.getContext('2d').putImageData(blurRed(original,radius),0,0);
  const enlarged=document.createElement('canvas');const ratio=Math.min(1.5,2600/Math.max(canvas.width,canvas.height));enlarged.width=Math.round(canvas.width*ratio);enlarged.height=Math.round(canvas.height*ratio);
  const c=enlarged.getContext('2d');c.drawImage(filtered,0,0,enlarged.width,enlarged.height);found=await read(c.getImageData(0,0,enlarged.width,enlarged.height));if(found)return found;
  await new Promise(resolve=>setTimeout(resolve,0));
 }
}
