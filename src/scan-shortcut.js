// A portable subset for iPhone Shortcuts' Match Text / Replace Text actions.
// More complex routing remains in the web adapter; this recipe never drops it.
export const scanMatchPattern=String.raw`^https?://h5\.qiekj\.com/(?:skip|pages/skip/skip)\?(?:SN|NQT|IMEI)=(?:[A-Za-z0-9._~/-]|=|%2[Bb]|%2[Ff]|%3[Dd]){1,512}$(?![\s\S])`;
export const scanStripPattern=String.raw`^https?://h5\.qiekj\.com/(?:skip|pages/skip/skip)\?`;
export const scanLaunchPrefix='alipays://platformapi/startapp?appId=2018072460764274&page=pages%2FskipNew%2FskipNew&query=';
// Software model of the documented native actions, not a claim that iOS ran it.
export function modelScanShortcut(raw){
 if(typeof raw!=='string'||raw.length>4096||!new RegExp(scanMatchPattern).test(raw))throw Error('此码不在通用快捷指令的已适配格式内，请使用官方扫码入口');
 const pair=raw.replace(new RegExp(scanStripPattern),'');
 return scanLaunchPrefix+encodeURIComponent('masterSwitch=0&keepUsing=1&'+pair);
}
