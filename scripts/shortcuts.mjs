import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateDeviceList} from '../src/devices.js';
import {buildOfficialAlipayEntry} from '../src/official-entry.js';
const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function generateGuide(input){
 const devices=validateDeviceList(input).map(d=>({...d,launch:buildOfficialAlipayEntry(d.url)}));
 const steps=['打开 iPhone「快捷指令」，点 ＋ 新建。','搜索添加「URL」动作，将下面对应设备的完整 alipays 链接粘贴进去。','再搜索添加「打开 URL」动作，输入使用上一步的 URL。只有 URL 动作不会打开支付宝。','用设备名称命名指令；点名称旁菜单或详情，选择「添加到主屏幕」（位置随 iOS 版本变化）。','需要一个选择菜单时：新建指令，添加「从菜单中选取」，为每台设备建菜单项，并在各项中加入其 URL 和打开 URL 动作。无需在菜单结束后再添加打开动作。'];
 const text=['校园取水 · iPhone 快捷入口安装指南','这些链接只负责打开官方设备页，不提交订单；已有用户确认快捷指令可正常出水，最终费用结算待确认。','已在一组冷/热水设备上由用户 iPhone 截图验证导航，其他设备仍需核对。页面仍可能有推广。','',...steps.map((s,i)=>`${i+1}. ${s}`),'',...devices.flatMap(d=>[d.name,d.launch,`原码备用入口：${d.url}`,'']),'首次仅观察设备页；不要为了安装测试点击「立即使用」。需要用水时，在现场核对设备与官方计费规则后自行确认。','若状态不明，先查看官方订单，不重复发起用水。不要通过删改 URL 参数猜测其他设备。','这是安装说明，不是可一键导入的签名 .shortcut 文件。无需 Mac、越狱或长期服务器。','专属设备清单请勿公开上传。'].join('\n');
 const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>取水快捷入口安装指南</title><style>body{font:16px/1.7 system-ui;max-width:620px;margin:auto;padding:24px;background:#eff5ef;color:#183d36}section{background:white;border-radius:16px;padding:18px;margin:16px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px}button{font:inherit;background:#07695b;color:white;border:0;border-radius:10px;padding:12px 18px}small{display:block}li{margin:12px 0}</style><h1>取水快捷入口</h1><p>按下面步骤将常用设备添加到 iPhone 主屏幕。无需部署网页。页面仍可能有推广；用户已确认可正常出水和扣费。</p><ol>${steps.map(s=>`<li>${escape(s)}</li>`).join('')}</ol>${devices.map(d=>`<section><h2>${escape(d.name)}</h2><pre>${escape(d.launch)}</pre><button type="button">复制快捷入口</button><small>备用原码：${escape(d.url)}</small></section>`).join('')}<p id="status" role="status">复制后请确认 URL 和「打开 URL」两个动作都已添加。</p><p>该文档不会启动设备或发起网络交易。请勿公开发布专属设备清单。iPhone「文件」预览可能不运行网页脚本，此时长按选中完整链接复制，或查看同目录的 guide.txt。</p><script>document.querySelectorAll('button').forEach(b=>b.onclick=async()=>{const text=b.previousElementSibling.textContent;try{await navigator.clipboard.writeText(text);document.getElementById('status').textContent='已复制，请粘贴到快捷指令的 URL 动作';}catch{const range=document.createRange();range.selectNodeContents(b.previousElementSibling);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);document.getElementById('status').textContent='已选中入口，请使用系统复制菜单';}});</script></html>`;
 return {text,html,devices};
}
async function main(args){
 if(args.length!==4 || args[0]!=='--input'||args[2]!=='--out')throw Error('用法：npm run shortcuts -- --input 设备清单.json --out 新输出目录');
 const [input,out]=[args[1],args[3]];
 const raw=await readFile(input,'utf8');if(Buffer.byteLength(raw)>131072)throw Error('清单超过 128KB');
 const guide=generateGuide(JSON.parse(raw));
 try{await readdir(out);throw Error('输出目录已存在，请指定一个新目录，避免覆盖已有文件');}catch(e){if(e.code!=='ENOENT')throw e;}
 await mkdir(out,{recursive:true});
 await writeFile(path.join(out,'guide.txt'),guide.text,{flag:'wx'});await writeFile(path.join(out,'index.html'),guide.html,{flag:'wx'});await writeFile(path.join(out,'devices.json'),JSON.stringify(guide.devices.map(({name,url})=>({name,url})),null,2),{flag:'wx'});
 console.log(`已生成 ${guide.devices.length} 台设备的安装说明：${path.resolve(out)}（没有执行链接或网络交易）`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
