import {writeFile} from 'node:fs/promises';
import {scanMatchPattern,scanStripPattern,scanLaunchPrefix} from '../src/scan-shortcut.js';
const steps=[
 ['扫描二维码或条形码','扫描机身设备码；不需要预先提供照片或手填 SN。'],
 ['匹配文本',`输入选第 1 步「扫描结果」，匹配规则粘贴下方「规则 A」。保持区分大小写。`],
 ['如果','条件选择第 2 步「匹配文本」→「没有任何值」。在这个分支里添加「显示提醒」（提示：此码暂不支持，请用官方扫码），再添加「停止此快捷指令」。然后保留「结束如果」。不在这个分支里打开任何 URL。'],
 ['替换文本','放在「结束如果」后，输入选第 2 步「匹配文本」。查找内容粘贴「规则 B」，替换为留空，并开启「正则表达式」。'],
 ['文本','先输入 masterSwitch=0&keepUsing=1&，紧接着插入第 4 步的蓝色「替换后的文本」变量。不要输入变量名称的字面文字或方括号。'],
 ['URL 编码','操作选择「编码」，输入选第 5 步「文本」。不是解码。'],
 ['URL',`先粘贴下方「启动前缀」，紧接着插入第 6 步的蓝色「URL 编码」结果。`],
 ['显示提醒','提示：准备进入官方设备页，请在官方页面核对机器与计费。打开「显示取消按钮」；取消即停止快捷指令。'],
 ['打开 URL','输入明确选择第 7 步的蓝色「URL」，不要误选扫码结果、原始文本或提醒。'],
 ['命名与安装','命名「校园扫码取水」，添加到主屏幕。以后点它扫描新机器即可；官方设备页仍由你确认使用。']
];
const intro='这是一份可以在 iPhone 上搭建的通用扫码快捷指令说明，不是已签名的一键导入文件。规则由软件测试验证，整条原生扫码指令尚未在真 iPhone 验证。已有冷/热水固定指令仍可保留。';
const limits='范围：h5.qiekj.com 的普通 SN / NQT / IMEI 设备码，数字、常见 ASCII 标记及编码后的 + / =。特殊公司分流、附加参数、未知域名、非 URL / 蓝牙载荷会停止；这不是所有型号的兼容保证。源码参数支持不等于实机交易成功。';
const md=`# 通用扫码取水 · iPhone 快捷指令\n\n${intro}\n\n${limits}\n\n${steps.map(([name,description],i)=>`${i+1}. **${name}**：${description}`).join('\n\n')}\n\n## 规则 A：完整设备码匹配\n\n\`\`\`text\n${scanMatchPattern}\n\`\`\`\n\n## 规则 B：删除已验证的 URL 前缀\n\n\`\`\`text\n${scanStripPattern}\n\`\`\`\n\n## 启动前缀\n\n\`\`\`text\n${scanLaunchPrefix}\n\`\`\`\n\n首次测试只扫描你已验证的冷水或热水码，观察是否到达相应设备页；无需为了验收再次出水或付款。不要删掉格式检查与取消分支。\n\n该规则没有关闭广告参数，也不添加订单、金额或支付授权。iOS 动作的 UI 名称与编码行为仍需真机验收；测试发现差异时保留原固定指令作为备用。\n`;
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>通用扫码取水指令</title><style>body{font:16px/1.8 system-ui;max-width:640px;margin:auto;padding:24px;color:#183d36;background:#eff5ef}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:white;padding:16px;border-radius:12px;font-size:13px}li{margin:16px 0}a{color:#07695b}</style><a href="./">返回工具</a><h1>通用扫码取水</h1><p>${escape(intro)}</p><p>${escape(limits)}</p><ol>${steps.map(([n,d])=>`<li><strong>${escape(n)}</strong>：${escape(d)}</li>`).join('')}</ol><h2>规则 A</h2><pre>${escape(scanMatchPattern)}</pre><h2>规则 B</h2><pre>${escape(scanStripPattern)}</pre><h2>启动前缀</h2><pre>${escape(scanLaunchPrefix)}</pre><p>长按完整代码复制，勿漏掉反斜杠。首次只扫描已验证的设备码检查导航，不用为了测试消费。这不是签名 .shortcut 安装包；原生扫码流程仍需真机验证。</p></html>`;
await writeFile('docs/SCAN-SHORTCUT.md',md);await writeFile('public/scan-shortcut-guide.html',html);console.log('已生成不含预置设备编号的扫码指令搭建说明（原生流程待真机验证）');
