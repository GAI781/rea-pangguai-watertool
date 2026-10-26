const deviceKeys=['SN','NQT','IMEI'];
const officialPaths=new Set(['/skip','/pages/skip/skip']);
// Format support comes from official scanCodeInit, not from a guessed device ID.
export function inspectEntry(raw) {
 if(typeof raw!=='string'||raw.length>4096||/[\u0000-\u001f\u007f]/.test(raw))throw Error('二维码过长或含控制字符');
 let url;try{url=new URL(raw.trim());}catch{throw Error('暂不支持这种二维码格式；需要带 SN、NQT 或 IMEI 的完整设备链接');}
 const officialHost=url.hostname==='h5.qiekj.com';
 if(url.protocol==='http:'&&officialHost&&officialPaths.has(url.pathname)&&!url.port)url.protocol='https:';
 if(url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443'))throw Error('仅支持无账号信息的标准 HTTPS 链接，不执行支付 Scheme 或脚本');
 if(/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[)/i.test(url.hostname)||/^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname))throw Error('不支持本地网络地址');
 const keys=[...url.searchParams.keys()];
 if(['token','access_token','refresh_token','authorization','password','code','auth_code','sign'].some(k=>keys.some(v=>v.toLowerCase()===k)))throw Error('此链接可能含登录或支付凭证，请勿保存或转发');
 const present=deviceKeys.filter(key=>url.searchParams.has(key));
 if(present.length!==1)throw Error('需要唯一的 SN、NQT 或 IMEI 标记；不猜测含混设备码');
 const markerType=present[0],values=url.searchParams.getAll(markerType);
 if(values.length!==1||!values[0].trim()||values[0].length>512||/[\s\u0000-\u001f\u007f&#?]/u.test(values[0]))throw Error('设备标记为空、重复、过长或含歧义字符');
 if(url.hash)throw Error('暂不支持带片段路由的设备链接');
 // Existing external NQT codes remain original-link only. Never turn an
 // unverified host or special routing parameters into an official device link.
 if(!officialHost&&markerType!=='NQT')throw Error('该设备码的来源域名尚未适配，请使用官方扫码入口');
 const officialEligible=officialHost&&officialPaths.has(url.pathname)&&keys.length===1;
 return {url:url.href,host:url.hostname,marker:values[0],markerType,officialEligible,
  supportLevel:officialEligible?'source-supported':'original-only',
  supportNote:officialEligible?'官方源码支持此参数格式；设备类型、权限和计费由官方在线核验':'来源域名、路径或附加分流参数尚未适配，仅保留原始入口'};
}
export function readDevices(storage){
 try{const list=JSON.parse(storage.getItem('water-devices')||'[]');return Array.isArray(list)?list.slice(0,30).filter(x=>{try{return typeof x.name==='string'&&x.name.length<=60&&inspectEntry(x.url).url===x.url;}catch{return false;}}):[];}catch{return [];}
}
