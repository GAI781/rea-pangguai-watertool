# 取水入口调查（更新于 2026-10-26）

## 已确定的现场事实

用户照片图一为冷水、图二为热水。两张二维码分别解出 `https://h5.qiekj.com/skip?SN=<15位数字>`，SN 不同。Python ZXing 与网页 Chromium 独立识别结果一致；热水照片需抑制液晶屏纹理。实际 SN 和原图保留在仓库外，不进入公开源码/网站包。

最初依据第三方源码只支持 NQT 的实现不适配这两张码，v0.2 已修正。SN 没有被转换为 NQT、IMEI 或订单参数。

## 官方网站代码事实

网络许可生效后成功通过 TLS 获取官方站点 HTML 和以下公开脚本，未登录、未调用开水/交易接口：

| 公开资源 | SHA-256 |
|---|---|
| [app.f9e5b8f7.js](https://h5.qiekj.com/js/app.f9e5b8f7.js) | `96b0af38ae9d2a949cf90a845e7ada1308aa796e7e1e874fd6d9af98bc86bd4c` |
| [pages_skip.a9039bcd.js](https://h5.qiekj.com/js/pages_skip.a9039bcd.js) | `c0f8bd80d12ce1864e818082457891c4be4a3cbb8505d5670e736b260dcd164d` |
| [共用扫码模块](https://h5.qiekj.com/js/goods_newPreview~goods_orderDetail~pages_home~pages_orderDetail~pages_orderList~pages_skip.2168c3b9.js) | `ec01fae1f3f335cab8c96bcf8153f5477f8e51c0b3abb6413a3b5638e79bcfc9` |

`scanCodeInit` 从 URL 查询中读取 `NQT`、`SN` 或 `IMEI`；对于本次现场二维码，仅返回 `{SN: 原值}`。

`pages_skip` 的正常路径调用 `goods/scan/v2`、设备详情、商家配置等，然后构造：

```text
appId = 2018072460764274
page = pages/skipNew/skipNew
query = masterSwitch=0&keepUsing=1&SN=<现场原值>
```

其中 `masterSwitch` 在该代码分支初值为 0，`keepUsing=1` 是该站点自身生成的导航参数。`getAlipayMiniJumpUrl` 使用如下编码方式：

```js
`alipays://platformapi/startapp?appId=${appId}&page=${encodeURIComponent(page)}&query=${encodeURIComponent(query)}`
```

项目 `src/official-entry.js` 仅复现以上导航格式，不复现账号/设备 API，不添加登录凭证、订单号、金额、支付类型。只对已核实的 SN 格式生成该入口；其他扫码格式仍可原样打开。

**以上证明路由来自官方公开代码，不证明小程序仍接受该设备或当前账号已授权，更不证明完成取水。** 没有获取小程序内部代码，不能验证其启动行为、认证和计费界面。真实 iPhone 仍需验收。

官方脚本还包含：

- 微信小程序 `wx52cfa5fc8d32a43d`，通过微信开放标签打开 `pages/skip/skip`。普通 Safari 不能直接照搬开放标签；本版本不虚构微信 Scheme。
- 灰度分流：`clean-gateway.qiekj.com/api/gray/check` 可决定是否使用另一个支付宝小程序 `2021006136615166`、`pages/skip/skip`、`stableVersion=1`。未调用灰度接口，不能判定本校适用；未将它作为默认入口。
- `allowPayType`、设备/商家限制和服务端下载导流配置可能将访问者送至 `/download`。这解释了“支付宝扫码仍要求下载”的一种可能，但未查询你学校配置，不能确定就是原因。
- 启屏/广告配置查询和微信/支付宝不同广告位；代码存在 `isShowAd=false` 等条件参数，**本工具没有加入这些参数或覆盖服务端广告配置**。小程序可能仍展示广告。

## URL Scheme / Universal Link 的结论

已证实官方 H5 使用支付宝平台的 `alipays://` 启动协议。尚未证实胖乖生活自身的 iOS App Scheme。

`/.well-known/apple-app-site-association` 请求返回了 HTML SPA 页面，不能当作有效 AASA；根路径 AASA 请求曾发生上游超时。这些观察不证明官方所有域名均无 Universal Link，也不解释系统相机唤起 App 的完整链路。

早先请求出现代理 CONNECT 403；放行 h5.qiekj.com 后曾短暂上游 503，随后根页面、热水 /skip 和脚本成功。不能把代理拒绝或瞬时超时描述为官方功能不存在。

## 第三方源码：证据与适用限制

| 来源 | 固定提交 | 事实 |
|---|---|---|
| [light-life](https://github.com/Inonvation/light-life/tree/b362c3c7d4776c45f2432f2218622e49cffbde6c) | b362c3c | README 停止维护，接口可能改变，后继项目面向作者学校 |
| [wash](https://github.com/Night-stars-1/wash/tree/ffc25d25b980f8bef66b41d7d015936989ec825e) | ffc25d2 | Android 扫码、设备、订单、支付宝 SDK |
| [REA](https://github.com/morluto/rea/tree/1173c0a9dc1b352a60943a491462294db8f353ae) | 1173c0a | 分析框架，不是取水协议；本次公开 JS 可直接审阅，没有进行客户端二进制逆向 |

wash `ScanCodeScreen.kt` 提取 NQT；`ApiService.kt` 声明 `goods/scan/v2`、`trade/create`、`pay/unify/prePay`；`GoodsDetailScreen.kt` 调用 Android `PayTask.payV2`。支付 SDK 参数不是 Safari 网页支付 URL。

light-life `DeviceApi.kt` 声明 `goods/water/unlock`、`goods/water/sync`、`order/afterPay/creating`，以及设备/位置相关检查。接口存在不代表获得接入授权或当前仍可用；未调用这些控制接口。

## 方案与下一步

采用 A：官方小程序导航 + iPhone 快捷指令；静态网页负责扫码和收藏。避免 Mac、越狱、账号代理与服务器成本。此方案目前是**官方路由有证据，真机功能待验证**。

下一步仅在 iPhone 上打开冷水小程序入口，观察是否正确进入官方设备/登录页、是否出现广告或错误；不要点开水/支付。若成功，再核对热水映射。只有用户主动决定进行正常收费取水，才在官方页面确认交易。无设备授权或平台限制时停止，不通过猜接口规避。

## 后续用户 iPhone 验证：冷水导航通过

用户实际运行「URL → 打开 URL」快捷指令后，提供官方小程序设备页截图，显示本楼层直饮水及支付宝先享后付选项。设备页有商品广告。故结论更新为：**冷水直达官方设备页已实测，仍有推广，热水及出水/扣费待验证**。不据此推断其他学校/设备可用，也不宣称已跳过全部广告。下一步只验证热水入口映射；真实取水留给用户需要用水时主动确认。

## v0.4 验收更新

用户之后提供的第二张截图显示开水设备页，与热水入口一致；冷/热两条导航均已通过用户 iPhone 截图验证，仍有商品推广。出水、计费和完整启动广告时序均未验证。官方封面广告参数的合成分支实验见 AD-BEHAVIOR.md，不将合成结果当作本校服务端配置。

## 实际使用更新

用户确认快捷指令可以正常出水，证明本路线已实际用于取水；未指明冷/热水范围，也未确认最终订单及计费。商品推广仍存在，费用结算不能从出水成功推断。

## 最终计费验收

用户进一步确认正常扣费，且确认实际收益是经支付宝小程序取水，跳过胖乖生活 App 首页及其自动跳转广告。该路线已完成用户现场使用验收；仍有小程序商品推广，不是完全无广告。详见 ACCEPTANCE.md。
