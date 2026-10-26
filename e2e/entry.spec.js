import {test,expect} from '@playwright/test';
import QRCode from 'qrcode';
const entry='https://example.com/device?NQT=TEST_ONLY';
async function importDevices(page,file){
 if(!(await page.locator('#import').isVisible()))await page.getByText('备份与设备管理',{exact:true}).click();
 await page.locator('#import').setInputFiles(file);
}

test('照片扫码、确认、保存、刷新和原样转交；没有后台交易请求',async({page})=>{
 const external=[];page.on('request',req=>{if(/^https?:/.test(req.url()) && !req.url().startsWith('http://127.0.0.1:4173'))external.push(req.url());});
 await page.goto('/');
 const png=await QRCode.toBuffer(entry,{width:400});
 await page.locator('#photo').setInputFiles({name:'test.png',mimeType:'image/png',buffer:png});
 await expect(page.locator('#info')).toContainText(entry);
 await expect(page.locator('#open')).toBeDisabled();
 await page.locator('#name').fill('宿舍一楼 <img src=x>');await page.locator('#save').click();
 await page.reload();await page.getByRole('button',{name:'宿舍一楼 <img src=x>',exact:true}).click();
 await expect(page.locator('#info')).toContainText(entry);expect(external).toEqual([]);
 await page.route('https://example.com/**',route=>route.fulfill({status:200,body:'TEST HANDOFF ONLY'}));
 await page.locator('#trust').check();await page.locator('#open').click();await expect(page).toHaveURL(entry);
});
test('拒绝危险链接，移除旧确认，单手屏幕无横向溢出',async({page})=>{
 await page.goto('/');await page.getByText('粘贴链接',{exact:true}).click();await page.locator('#raw').fill(entry);await page.locator('#parse').click();await page.locator('#trust').check();
 await page.locator('#raw').fill('javascript:alert(1)');await page.locator('#parse').click();await expect(page.locator('#result')).toBeHidden();await expect(page.locator('#open')).toBeDisabled();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('实时相机帧扫码并关闭媒体流',async({page})=>{
 const data=await QRCode.toDataURL(entry,{width:400});
 await page.addInitScript(({data})=>{navigator.mediaDevices.getUserMedia=async()=>{const canvas=document.createElement('canvas');canvas.width=400;canvas.height=400;const ctx=canvas.getContext('2d');const img=new Image();img.src=data;await img.decode();ctx.drawImage(img,0,0);const stream=canvas.captureStream(10);window.testStream=stream;return stream;};},{data});
 await page.goto('/');await page.locator('#scan').click();await expect(page.locator('#info')).toContainText(entry);await expect(page.locator('#video')).toBeHidden();expect(await page.evaluate(()=>window.testStream.getTracks().every(t=>t.readyState==='ended'))).toBe(true);
});
test('SN 清单导入冷/热入口，保持原文且打开前需确认',async({page})=>{
 await page.goto('/');const devices=[{name:'冷水测试',url:'https://h5.qiekj.com/skip?SN=123456789012345'},{name:'热水测试',url:'https://h5.qiekj.com/skip?SN=123456789012346'}];
 await importDevices(page,{name:'devices.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(devices))});
 await page.getByRole('button',{name:'热水测试',exact:true}).click();await expect(page.locator('#info')).toContainText(devices[1].url);await expect(page.locator('#open')).toBeDisabled();
});
test('官方小程序入口仍需用户确认，复制入口包含准确设备 SN',async({page})=>{
 await page.goto('/');await page.getByText('粘贴链接',{exact:true}).click();await page.locator('#raw').fill('https://h5.qiekj.com/skip?SN=123456789012345');await page.locator('#parse').click();await expect(page.locator('#miniSection')).toBeVisible();await expect(page.locator('#mini')).toBeDisabled();await page.locator('#trust').check();await expect(page.locator('#mini')).toBeEnabled();await expect(page.locator('#miniUrl')).toContainText('SN%3D123456789012345');
});
test('备份可导入恢复，快捷打开取消后不跳转且不请求交易',async({page})=>{
 const devices=[{name:'冷水测试',url:'https://h5.qiekj.com/skip?SN=123456789012345'}];
 await page.goto('/');await importDevices(page,{name:'devices.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(devices))});
 const downloaded=page.waitForEvent('download');await page.locator('#export').click();const download=await downloaded;const stream=await download.createReadStream();let raw='';for await(const chunk of stream)raw+=chunk;expect(JSON.parse(raw)).toEqual(devices);
 const before=page.url();let confirmed=false;page.once('dialog',async dialog=>{confirmed=true;expect(dialog.message()).toContain('012345');await dialog.dismiss();});await page.getByRole('button',{name:'打开支付宝：冷水测试',exact:true}).click();expect(confirmed).toBe(true);expect(page.url()).toBe(before);
 page.once('dialog',dialog=>dialog.accept());await page.locator('#clear').click();await expect(page.getByRole('button',{name:'冷水测试',exact:true})).toHaveCount(0);
 await importDevices(page,{name:'restored.json',mimeType:'application/json',buffer:Buffer.from(raw)});
 await page.reload();await page.getByRole('button',{name:'冷水测试',exact:true}).click();await expect(page.locator('#info')).toContainText(devices[0].url);
});
test('旧照片的异步识别不能覆盖用户后来选定的设备',async({page})=>{
 await page.addInitScript(()=>{const original=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=async function(){await original.call(this);await new Promise(resolve=>setTimeout(resolve,700));};});
 await page.goto('/');const png=await QRCode.toBuffer('https://h5.qiekj.com/skip?SN=123456789012345',{width:400});await page.locator('#photo').setInputFiles({name:'slow.png',mimeType:'image/png',buffer:png});
 await page.getByText('粘贴链接',{exact:true}).click();await page.locator('#raw').fill('https://h5.qiekj.com/skip?SN=123456789012346');await page.locator('#parse').click();await page.waitForTimeout(1000);await expect(page.locator('#info')).toContainText('123456789012346');await expect(page.locator('#info')).not.toContainText('123456789012345');
});
test('通用扫码：不同 NQT/IMEI 码各自生成官方入口，特殊分流保持原码',async({page})=>{
 await page.goto('/');await page.getByText('粘贴链接',{exact:true}).click();
 for(const [key,value] of [['NQT','Test+abc/=='],['IMEI','12345678']]){await page.locator('#raw').fill(`https://h5.qiekj.com/skip?${key}=${encodeURIComponent(value)}`);await page.locator('#parse').click();await expect(page.locator('#miniSection')).toBeVisible();const launch=new URL(await page.locator('#miniUrl').textContent());expect(new URLSearchParams(launch.searchParams.get('query')).get(key)).toBe(value);await expect(page.locator('#mini')).toBeDisabled();}
 await page.locator('#raw').fill('https://h5.qiekj.com/skip?SN=123456789012345&companyType=apwork');await page.locator('#parse').click();await expect(page.locator('#result')).toBeVisible();await expect(page.locator('#miniSection')).toBeHidden();await expect(page.locator('#info')).toContainText('companyType=apwork');
});
test('不支持的码可本机导出脱敏格式报告，不自动跳转或上传',async({page})=>{
 const external=[];page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:4173'))external.push(r.url());});
 await page.goto('/');await page.getByText('粘贴链接',{exact:true}).click();await page.locator('#raw').fill('https://h5.qiekj.com/skip?SN=123456789012345&token=private-value');await page.locator('#parse').click();await expect(page.locator('#result')).toBeHidden();
 const event=page.waitForEvent('download');await page.locator('#diagnose').click();const download=await event;const stream=await download.createReadStream();let raw='';for await(const b of stream)raw+=b;expect(raw).not.toContain('private-value');expect(raw).not.toContain('123456789012345');expect(JSON.parse(raw).routeStatus).toBe('unsupported');expect(external).toEqual([]);
});
