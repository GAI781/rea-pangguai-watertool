import {inspectEntry} from './entry.js';
// This report is for format triage only. It never contains raw QR text,
// identifier values, credentials, URL paths, fragments or query values.
export function makeCompatibilityReport(raw){
 const report={schema:'water-entry-compatibility/v1',inputKind:'non-url',inputLength:typeof raw==='string'?raw.length:0,routeStatus:'unsupported',deviceVerified:false};
 if(typeof raw!=='string'||raw.length>4096){report.reason='输入为空或超过诊断长度限制';return report;}
 try{
  const url=new URL(raw.trim());report.inputKind='url';
  report.scheme=url.protocol;report.host=url.hostname;
  report.pathClass=['/skip','/pages/skip/skip'].includes(url.pathname)?'known-scan-route':'other';
  report.hasUserInfo=Boolean(url.username||url.password);report.hasFragment=Boolean(url.hash);
  const keys=[...url.searchParams.keys()];report.queryFieldNames=[...new Set(keys.filter(k=>/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(k)))].slice(0,30);
  report.markerTypes=['SN','NQT','IMEI'].filter(k=>url.searchParams.has(k));
  report.hasMultipleMarkerFields=report.markerTypes.length>1||report.markerTypes.some(k=>url.searchParams.getAll(k).length>1);
  report.hasAdditionalFields=keys.some(k=>!['SN','NQT','IMEI'].includes(k));
 }catch{report.reason='非 URL 码；尚未适配结构或蓝牙载荷，未尝试打开';return report;}
 try{const entry=inspectEntry(raw);report.routeStatus=entry.supportLevel;report.reason=entry.supportNote;}catch(e){report.reason=e.message;}
 return report;
}
