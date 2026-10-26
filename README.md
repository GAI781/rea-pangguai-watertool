# 校园取水入口助手 v0.7

本次楼层取水快捷入口已完成用户实机验收：冷、热水均可导航到对应官方设备页，用户进一步确认正常出水、正常扣费。实现方式是快捷指令直达支付宝中的官方小程序，跳过打开胖乖生活 App 首页及其自动跳转广告的流程。设备页仍有商品推广，因此准确定位是「减少广告与步骤的官方取水快捷入口」，而非完全无广告客户端。用户未逐项说明两台设备是否都完成出水/扣费，不能把该使用结果扩展到所有设备。

最终验收结论与适用范围见 [交付记录](docs/ACCEPTANCE.md)。

日常使用推荐 **iPhone 快捷指令**：不需要 Mac、越狱、服务器或部署网页。静态网页用于扫码、收藏、备份以及以后添加设备。真实设备 SN 与原图不进入公开源码/网站包，专属设备清单单独交付。

## iPhone：先用已验证的入口

每台设备新建一个快捷指令：

1. 添加「URL」，粘贴专属清单中该设备的整行 `alipays://…` 链接。
2. 再添加「打开 URL」，输入使用上一步 URL。**只添加 URL 动作不会唤起支付宝。**
3. 命名为「楼层冷水」或「楼层热水」，从指令菜单/详情选择「添加到主屏幕」。
4. 想只保留一个图标，可新建「楼层取水」指令，添加「从菜单中选取」，建冷水、热水两项，在各自分支加入其 URL 和打开 URL 两个动作。

不要误把原二维码 HTTPS 链接当作小程序直达链接；两种链接都在专属清单中明确区分。首页快捷指令只负责导航。首次只观察设备页；以后确实需要接水时，再在现场核对机器、价格及先享后付规则，自行决定点击「立即使用」。状态不明时查官方订单，避免重复发起。

完整的专属安装指南由下面的 Windows 命令生成，不是可一键导入的签名 `.shortcut` 包。

## 分享给其他 iPhone 用户

同楼层同设备可以直接分享已验证的快捷指令：打开指令编辑页 → 分享 → 复制 iCloud 链接 → 发给同学。对方打开链接添加即可，使用自己的支付宝账号在官方页面核对并确认。固定指令仅适用于对应设备，不需要他人安装开发工具。

不同设备使用通用网页版：网站发布后把首页链接发给同学，在 Safari 扫码或选照片，可添加到主屏幕、收藏自己的设备。完整可转发说明见 [手机分享指南](public/share-guide.html)。网站不包含你的设备清单；通用原生扫码指令仍待真机验证。

GitHub Pages 尚未启用。当前 GitHub 集成可读仓库管理状态和推送源码，但创建 Pages 的 API 返回 `Resource not accessible by integration`；repo admin 标记不代表该集成具有 Pages 管理权限。仓库所有者需打开 Settings → Pages，将 Source 设为 GitHub Actions，然后在 Actions → Publish GitHub Pages → Run workflow 发布。成功后以该工作流输出的真实地址为准；未发布前不要把预期地址作为可用产品链接转发。

## Windows 运行、生成指南与构建

安装 Node.js 24.19 或更高的 24 LTS，在项目目录 PowerShell 执行：

```powershell
npm ci
npm run dev
```

终端显示电脑浏览器开发地址。生成自己设备的快捷入口指南：

```powershell
npm run shortcuts -- --input "C:\Users\你的用户名\Downloads\floor-water-devices.json" --out ".\my-iphone-guide"
```

输出 `guide.txt`（安装步骤与链接）、`index.html`（可复制链接的手机排版说明）和 `devices.json`（备份）。输入必须是 1–30 条合法设备记录；生成器拒绝危险链接、重复码、不支持的小程序格式及覆盖已有目录。它不打开任何入口或请求设备。输入格式：

```json
[{"name":"设备名称","url":"机身二维码的完整 HTTPS 原文"}]
```

v0.5 根据官方代码支持 `h5.qiekj.com/skip` 与 `/pages/skip/skip` 中唯一的 SN、NQT 或 IMEI 参数；动态从新二维码生成入口，不依赖预置设备。其他来源、附加分流参数保留原始入口，未知非 URL 结构不自动打开。SN 路线已有用户实机证据；NQT / IMEI 仅完成源码适配和软件测试，不代表所有学校/型号都能取水。

生产构建：

```powershell
npm test
npm run build
npm run preview
```

`dist/` 是完整静态网站，无后端。开发/预览命令监听网卡，仅供可信网络测试。

## 网页版

- 相机扫码、照片识别（本机 jsQR 与 ZXing WASM 增强解码）、手动粘贴。
- 常用入口放在首页前面，已适配的设备码支持「打开支付宝」并显示名称/尾号确认，无需先滚动到扫码结果。
- 收藏、删除、设备 JSON 导入和备份导出；数据仅在当前浏览器。
- 导入先完整校验，错误清单不部分落库；重复记录明确报错。
- 旧照片异步解码不会覆盖后来选定的设备；离开页面释放相机。
- 不收集账号、token、支付凭证，不调用设备解锁、创建订单或预支付接口。

iPhone 相机需要 HTTPS。若要用网页版，可将 `dist` 内容上传至 Cloudflare Pages 等静态托管，用 Safari 访问 → 分享 → 添加到主屏幕。源码已推送至 GitHub，构建 CI 通过；Pages 尚未发布，暂未提供公网产品 URL。无需为日常两个设备的快捷入口部署网站。

同 Wi-Fi 下可用 iPhone 打开 Windows 开发服务（需防火墙允许），但局域网 HTTP 相机通常受限，可选择照片。iOS「文件」中的 HTML 预览不保证执行脚本，打不开复制按钮时长按完整链接或使用 `guide.txt`。此版本没有离线 service worker，网页初次加载需网络。

## 广告结论

两次真机截图中均存在商品推广。已减少的是手动进入胖乖生活 App 首页的步骤；截图不能证明整个启动过程没有短暂广告。

对官方脚本做了离线分支实验：`isShowAd=false` 来自「小程序封面广告」配置分支，没有证据证明能控制截图中的商品流。没有把它加入日常入口。详见 [广告行为记录](docs/AD-BEHAVIOR.md) 和 [来源证据](docs/RESEARCH.md)。

## 测试与已知范围

```powershell
npm test
npx playwright install chromium webkit
npm run build
npm run test:e2e
```

Linux 已有 Chromium 时：`CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e -- --project=chromium`。Windows 默认使用 Playwright 下载的浏览器。

自动测试使用模拟码和拦截的测试跳转，不使用资金；用户 iPhone 截图只作为导航验收。Windows 命令采用跨平台 Node 实现，尚未在真实 Windows 上运行。WebKit 自动化受浏览器下载网络限制而未运行。详见 [验证记录](docs/VALIDATION.md)。

依赖许可文本随静态构建保存在 `licenses/`。个人设备清单请妥善备份，不要公开上传；清除浏览器数据会清空收藏。

## REA 研究与多格式适配

本轮实际运行 REA 6.8.0 对三份官方 JS 做静态恢复，新增 SN / NQT / IMEI 的通用入口解析与支持等级。REA 的语义图仍有未知项，不宣称完整恢复客户端，更不承诺所有饮水机兼容。完整工具版本、证据摘要、trace 结果、适配矩阵和 Android APK 分析阻碍见 [REA 研究记录](docs/REA-RESEARCH.md)。

已适配的码可直接在网页版扫码，或批量导入设备清单后生成 iPhone 快捷链接。现有两个主屏幕快捷指令继续有效。新的字段/型号需在其官方设备页核对，软件合成测试不替代真实正常收费取水验收。

## v0.6 官方 APK 与兼容报告

已用 REA 对官方 APK（下载文件版本 1.81.4）做签名结构、清单、类清单及加载器方法分析，并用 Google apksig 通过 v1/v2 密码学验证。业务代码有加固，静态视图不能恢复扫码/蓝牙的完整实现；Android Scheme 也不能当作 iOS 路由使用。[完整分析范围与限制](docs/ANDROID-RESEARCH.md)。

网页版识别或尝试识别任意新二维码后，可点击「导出格式兼容报告」。报告不含二维码原文、设备标记值或查询参数值；记录格式与支持状态，不自动上传。域名仍可能标识学校，分享前可检查。此功能帮助后续扩展适配，不会将未知码当作已支持设备。

Android 研究已在隔离 ARM32 模拟器安装并运行原始官方 APK，停在未同意隐私条款的页面；取得两份部分运行时代码，REA 已读出此前静态不可见的扫码方法。具体来源、校验差异与结果见 [运行时发现](docs/ANDROID-RUNTIME-FINDINGS.md)。未登录或发起真实设备、订单与支付操作。

## v0.7 通用扫码指令与静态发布

新增 [通用扫码快捷指令搭建说明](docs/SCAN-SHORTCUT.md)：不预置 SN，扫描符合规则的官方 SN / NQT / IMEI 码，格式检查和用户确认后进入官方小程序。该原生流程尚未在 iPhone 实测；软件动作模型与网页适配器做了多种输入一致性测试。不是签名 .shortcut 文件，不会假称支持一键导入。现有两个固定入口可继续保留。

Windows 可运行 `npm run scan-guide` 重生成说明。生产资源使用相对路径，已在项目子目录下实测加载页面、增强解码 WASM 和原始照片，适合 GitHub Pages 等静态托管。

仓库附固定 commit 版本的 GitHub Actions 构建工作流，以及手动 Pages 发布工作流。若 Pages 未启用，仓库所有者需在 Settings → Pages → Build and deployment 中选择 GitHub Actions，再在 Actions 运行 Publish GitHub Pages。工作流不会上传私有照片、真实设备清单、APK 或研究用模拟器；仅上传 dist 静态文件。没有在代码中写入任何发布凭证。

Android 研究进一步取得部分运行时代码，REA 实际反编译 HomeScanCodeAct.scanCodeResult / createObserver 与 ScanCodeVm.scanV2，确认 NQT、IMEI、SN 的普通扫码分支及官方返回结果控制的后续分流。两份 DEX 不代表完整客户端，不能推出所有机型可用。详见 [运行时发现](docs/ANDROID-RUNTIME-FINDINGS.md)。
