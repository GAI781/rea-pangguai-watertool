import {inspectEntry} from './entry.js';
export function validateDeviceList(input){
 if(!Array.isArray(input)||input.length<1||input.length>30)throw Error('需要 1–30 条设备记录');
 const seen=new Set();
 return input.map(d=>{
  if(!d||typeof d.name!=='string'||!d.name.trim()||d.name.length>60)throw Error('设备名称格式错误');
  const entry=inspectEntry(d.url);
  if(seen.has(entry.url))throw Error('清单中包含重复入口，请先合并记录');
  seen.add(entry.url);return {name:d.name.trim(),url:entry.url};
 });
}
