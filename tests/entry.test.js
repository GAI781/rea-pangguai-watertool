import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectEntry, readDevices} from '../src/entry.js';
test('保留原始扫码参数，不拼造订单或设备链接',()=>{const url='https://example.com/device?NQT=TEST_ONLY&x=1';assert.equal(inspectEntry(url).url,url);assert.equal(inspectEntry(url).marker,'TEST_ONLY');});
for(const raw of ['javascript:alert(1)','alipays://platformapi/startapp','https://a.com/?NQT=','https://a.com/?NQT=a&NQT=b','https://a.com/?NQT=a&token=secret','https://u:p@a.com/?NQT=a','https://127.0.0.1/?NQT=a','https://a.com/','https://a.com/?NQT=a\n'])test(`拒绝不支持内容 ${raw.slice(0,45)}`,()=>assert.throws(()=>inspectEntry(raw)));
test('损坏或污染存储不会变成可打开入口',()=>{assert.deepEqual(readDevices({getItem:()=>'{bad'}),[]);assert.deepEqual(readDevices({getItem:()=>JSON.stringify([{name:'x',url:'javascript:alert(1)'},null])}),[]);});
test('支持现场 SN 入口，不把 SN 转换成 NQT 或订单参数',()=>{const url='https://h5.qiekj.com/skip?SN=123456789012345';const result=inspectEntry(url);assert.equal(result.url,url);assert.equal(result.markerType,'SN');});
for(const url of ['https://evil.example/skip?SN=123456789012345','https://h5.qiekj.com/skip?SN=','https://h5.qiekj.com/skip?SN=123456789012345&SN=123456789012345','https://h5.qiekj.com/skip?SN=123456789012345&NQT=x'])test(`拒绝混淆 SN 入口 ${url}`,()=>assert.throws(()=>inspectEntry(url)));
