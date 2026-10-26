import jsQR from 'jsqr';
import {inspectEntry,readDevices} from './entry.js';
import './style.css';
import {buildOfficialAlipayEntry} from './official-entry.js';
import {validateDeviceList} from './devices.js';
import {makeCompatibilityReport} from './compatibility.js';
const $=id=>document.getElementById(id);
let current=null, stream=null, busy=false, generation=0, lastScan=null;
const status=message=>{$('status').textContent=message;};
function inspect(raw){stop();lastScan=typeof raw==='string'&&raw.length<=4096?raw:null;$('diagnose').disabled=lastScan===null;current=null;$('result').hidden=true;$('trust').checked=false;$('open').disabled=true;$('mini').disabled=true;$('miniSection').hidden=true;try{current=inspectEntry(raw);$('info').textContent=`目标域名：${current.host}\n原始链接：${current.url}\n${current.markerType} 为二维码标记，尚未在线核验设备身份\n${current.supportNote}`; $('result').hidden=false;$('miniSection').hidden=!current.officialEligible;if(current.officialEligible)$('miniUrl').textContent=buildOfficialAlipayEntry(current.url);status('已在本机解析，未访问设备接口');}catch(e){if(typeof raw==='string'&&raw.length<=4096)$('raw').value=raw;status(e.message+'；原文保留在粘贴框，未尝试打开或控制设备。');}}
function stop(){generation++;stream?.getTracks().forEach(t=>t.stop());stream=null;$('video').srcObject=null;$('video').hidden=true;$('stop').hidden=true;$('scan').disabled=false;}
function decode(source,width,height){const scale=Math.min(1,1200/Math.max(width,height));const canvas=document.createElement('canvas');canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0,canvas.width,canvas.height);const img=ctx.getImageData(0,0,canvas.width,canvas.height);return jsQR(img.data,img.width,img.height,{inversionAttempts:'attemptBoth'})?.data;}
$('scan').onclick=async()=>{stop();const run=generation;$('scan').disabled=true;try{if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)throw Error('相机需要 HTTPS；可先选择二维码照片');const acquired=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280}}});if(run!==generation){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;const video=$('video');video.srcObject=stream;video.hidden=false;$('stop').hidden=false;await video.play();status('请将机身二维码放入画面');function frame(){if(run!==generation)return;try{if(video.readyState>=2){const data=decode(video,video.videoWidth,video.videoHeight);if(data){inspect(data);return;}}setTimeout(frame,200);}catch(e){stop();status(e.message);}}frame();}catch(e){if(run===generation){stop();status(`相机未启动：${e.message}。可使用照片或粘贴链接。`);}}};
$('stop').onclick=stop;
$('photo').onchange=async e=>{stop();const run=generation;const file=e.target.files[0];e.target.value='';if(!file)return;let src;try{if(file.size>20*1024*1024)throw Error('请选择小于 20MB 的图片');src=URL.createObjectURL(file);const img=new Image();img.src=src;await img.decode();if(run!==generation)return;status('正在本机识别照片…');let data=decode(img,img.naturalWidth,img.naturalHeight);if(!data){const {decodePhoto}=await import('./photo.js');if(run!==generation)return;data=await decodePhoto(img);}if(run!==generation)return;if(!data)throw Error('未识别到二维码，请裁剪到单个二维码后重试');inspect(data);}catch(error){if(run===generation)status(error.message);}finally{if(src)URL.revokeObjectURL(src);}};
$('parse').onclick=()=>inspect($('raw').value);
$('trust').onchange=()=>{$('open').disabled=!$('trust').checked;$('mini').disabled=!$('trust').checked;};
$('open').onclick=()=>{if(!current||!$('trust').checked||busy)return;busy=true;$('open').disabled=true;$('mini').disabled=true;status('即将交给原始入口；未创建或确认任何订单。');window.location.assign(current.url);};
window.addEventListener('pageshow',()=>{busy=false;$('open').disabled=!$('trust').checked;$('mini').disabled=!$('trust').checked;});
let storage;try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('不可用');}};}
function persist(list){try{storage.setItem('water-devices',JSON.stringify(list));render();return true;}catch{status('浏览器不允许保存，本次仍可打开入口');return false;}}
$('save').onclick=()=>{if(!current)return;const name=$('name').value.trim();if(!name){status('先为设备填写名称');return;}const list=readDevices(storage).filter(x=>x.url!==current.url);if(list.length>=30){status('最多保存 30 个入口，请先删除旧记录');return;}if(persist([...list,{name,url:current.url}]))status('已保存原始入口；设备身份和广告情况仍待实机确认');};
function render(){const box=$('devices');box.replaceChildren();const list=readDevices(storage);if(!list.length)box.textContent='还没有保存入口。';list.forEach(d=>{const row=document.createElement('div');row.className='device';const button=document.createElement('button');button.className='secondary';button.textContent=d.name;button.onclick=()=>{inspect(d.url);$('name').value=d.name;$('result').scrollIntoView({behavior:'smooth'});};const del=document.createElement('button');del.className='delete';del.textContent='删除';del.onclick=()=>persist(list.filter(x=>x.url!==d.url));row.append(button);
 if(inspectEntry(d.url).officialEligible){
  const launch=document.createElement('button');launch.className='launch';launch.textContent='打开支付宝';launch.setAttribute('aria-label',`打开支付宝：${d.name}`);
  launch.onclick=()=>{const entry=inspectEntry(d.url);if(!confirm(`打开「${d.name}」的官方设备页？\n${entry.markerType} 尾号 ${entry.marker.slice(-6)}\n请核对现场设备和官方页面。这里只打开入口，实际用水仍需在官方操作。`))return;stop();window.location.assign(buildOfficialAlipayEntry(d.url));};
  row.append(launch);
 }
 row.append(del);box.append(row);});}
$('clear').onclick=()=>{if(confirm('清除本浏览器保存的所有入口？'))persist([]);};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);render();

$('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>131072)throw Error('设备清单过大');const checked=validateDeviceList(JSON.parse(await file.text()));const merged=new Map(readDevices(storage).map(d=>[d.url,d]));checked.forEach(d=>merged.set(d.url,d));if(merged.size>30)throw Error('合并后超过 30 个入口');if(persist([...merged.values()]))status('已导入设备入口；打开前仍需核对并确认，未访问设备接口');}catch(error){status(`未导入：${error.message}`);}finally{e.target.value='';}};

$('mini').onclick=()=>{if(!current||!$('trust').checked||busy)return;const launch=buildOfficialAlipayEntry(current.url);busy=true;$('open').disabled=true;$('mini').disabled=true;status('已请求打开官方支付宝小程序，未核实是否成功唤起。请在小程序内核对设备、价格与支付确认。');window.location.assign(launch);setTimeout(()=>{busy=false;$('open').disabled=!$('trust').checked;$('mini').disabled=!$('trust').checked;},2500);};
$('copyMini').onclick=async()=>{if(!current)return;try{await navigator.clipboard.writeText(buildOfficialAlipayEntry(current.url));status('已复制小程序入口，可粘贴到 iPhone 快捷指令的 URL 动作；实机效果待验证');}catch{status('无法访问剪贴板，可长按上方完整入口复制');}};

$('export').onclick=()=>{const list=readDevices(storage);if(!list.length){status('还没有设备可导出');return;}const blob=new Blob([JSON.stringify(list,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='water-devices.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status('已请求下载设备备份；请妥善保存，不要公开分享设备码');};

$('diagnose').onclick=()=>{if(lastScan===null)return;const report=makeCompatibilityReport(lastScan);const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='water-compatibility.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status('已请求下载格式报告，不含二维码原文、设备编号或查询参数值；未发送给任何服务器');};
