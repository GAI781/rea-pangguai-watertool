# REA 实际分析与多格式适配（v0.5）

本轮实际使用 **rea-agents 6.8.0 CLI**，而非只阅读其 README。分析对象是合法公开取得的官方 H5 JavaScript，不是 Android/iOS 安装包；未执行官方 bundle、登录账号、创建设备订单或调用水阀接口。

## 工具与运行记录

云环境原有 Node 24.19.0 不满足 REA 6.8.0 的版本要求，另在仓库外安装 Node 24.22.1 与 REA，不改变应用依赖或全局 Node。npm 按锁定版本与包完整性校验安装，没有关闭 TLS/签名校验。

```bash
/workspace/research-tools/node-runtime/node_modules/node/bin/node \
 /workspace/research-tools/rea/node_modules/rea-agents/scripts/rea.mjs \
 analyze-javascript-application /workspace/research/official-h5/corpus \
 --max-heap-mb 2048 --format json \
 > /workspace/research/official-h5/evidence.json
```

输入是此前下载、校验哈希的三份官方 JS；资源地址及 SHA-256 见 RESEARCH.md。完整原始 Evidence 约 48MB 保留在当前工作区；源码包内提供未改写的 summary 和小型 trace Evidence，避免打包整份官方应用代码。

REA 记录：

- 3 个相关文件，3 个 JS 成功解析，0 个跳过、0 个解析失败。
- 遍历 43,709 个 AST 节点，216 条 findings。
- 根 artifact SHA-256：`da8fbf12e93064e40a733f97c8ce3d999baba998544fd735154a8f79e967f7ed`。
- 父 Evidence：`ev_ef24c6f9e0a5821feb843e9ec1154cd43265503c24002f7a637414acaaf617ab`。
- 应用图 coverage 为 **partial**，语义 coverage 为 **unknown**，保留 9,592 条语义未知项，未发生输出截断。这不是整个客户端的完整恢复。

证据文件：`evidence/rea-summary.json`、`rea-scan-function.json`、`rea-sn-flow.json`、`rea-launch-trace.json`。

`scanCodeInit` 函数的 REA 定位为共用扫码模块第 1 行 4764–5458 列，semantic node 为 `jsrg_node_f121187966a41903cdad38c09b4ae9396ab2fcc5e91ff73fd2570a12d0488078`。所有权 trace 找到该函数，但不等于证明全部调用链。对 SN 属性的 forward-influence 查询返回 **ambiguous / partial**，只有 2 个种子节点，关系未完全解析；对小程序页面字符串的应用级 trace 为 **no-match**。这些负结果保留，不据此声称不存在该页面或已自动恢复完整协议。字段、分流和编码的实现仍逐语句人工核对，并用本地行为测试验证。

## 源码事实与实现选择

官方 `scanCodeInit` 接受 URL 内的 **SN、NQT、IMEI**，不只接受现场照片中的 15 位 SN；它本身没有把所有设备限定为 15 位。解析结果交给官方扫码/设备服务，再根据 `machine`/`goods`、品类、支付能力和商家配置决定后续页面。

官方另有非 URL 的中卡设备解析函数：从结构化载荷切出 id/data/mac；部分设备涉及 BLE。这段 substring 代码不能单独证明载荷格式、设备授权或蓝牙协议，不据此生成开水控制包。

v0.5 因此：

1. 在已核对的 `h5.qiekj.com/skip` 与 `/pages/skip/skip` 路径，动态解析唯一的 SN/NQT/IMEI，不依赖用户两张照片或固定 SN。
2. 仅在纯设备标记入口生成官方小程序跳转；特殊 `companyType`、qeykid、channel 等参数保留原链接，不删掉后假装兼容。
3. 嵌套编码字段值，保留 NQT 的 `+`、`/`、`=`；拒绝多标记、重复值、控制字符及参数注入。
4. 官方旧 HTTP 设备页可升级到 HTTPS；不猜测其他主机。未知域名的既有 NQT 码仅保留原码，不能生成官方小程序入口。
5. 未知非 URL 码明确拒绝并在本地保留原文供研究，不自动启动设备。
6. 所有新格式标注 **source-supported**；不是在线身份核验，也不代表已有实机交易证据。现场 SN 路线原输出保持兼容。

## 实际适配范围

| 范围 | 当前证据 | 产品状态 |
|---|---|---|
| 用户楼层 SN 冷/热水 | 两张设备页截图；用户确认实际出水与正常扣费，未逐项区分每台交易 | 已有实机使用证据 |
| 其他 SN 设备 | 官方解析逻辑及合成测试 | 可动态生成入口，需实机验证 |
| NQT / IMEI 官方 URL 码 | REA 函数定位、源码逐语句核对、合成软件测试 | 已实现适配，未做真实取水验证 |
| 特殊公司/灰度分流码 | 官方存在专门分支 | 保留原始链接，不套用普通入口 |
| 非 URL 中卡载荷、BLE 型号 | 只观察到部分解析和 BLE 相关代码 | 未实现控制，不宣称适用 |
| 其他品牌平台、全部学校 | 无对应官方集成或设备样本 | 不支持“所有饮水机都适用”的结论 |

REA 是分析工具，不是能自动生成通用设备协议或赋予平台权限的工具。对跨型号的正确做法是增加有证据的格式适配器，并让官方服务核验设备/用户/计费，不能把一个学校的接口当作全平台协议。

## Android 本体逆向进展（v0.6 更新）

下载网络已放行，官方 APK 已取得，并完成 REA 清单/可见类/加载器方法分析及独立 Google apksig 签名验证。业务代码受加固，直接静态反编译尚未恢复完整业务。详情见 [Android 研究记录](ANDROID-RESEARCH.md)。此前的代理 403 是历史记录，不再作为当前阻碍；当前限制是受保护业务载荷及尚无受控 Android 运行时观察环境。

## Windows 重现

仅做应用开发仍可使用 Node 24.19+；要运行本轮 REA，需 Node 24.22.1+ 的受支持 24.x 版本（或 REA 声明支持的其他版本）。在独立研究目录安装 `npm install --save-exact rea-agents@6.8.0`，将官方三份公开 JS 下载到 `official-h5`，核对哈希，再运行：

```powershell
npx rea-agents@6.8.0 analyze-javascript-application .\official-h5 --detail summary --evidence_output .\rea-evidence --format json
```

此命令使用工具保存 Evidence，避免旧 PowerShell 重定向默认编码影响 JSON。输出目录应为新目录；以上 CLI 选项已核对，真实 Windows 机器尚未执行。

## 解析器一致性实验

使用 REA 输出的 `scanCodeInit` 函数 source range 从原始脚本提取该单个方法，在隔离 Node VM 中注入本地 query-string 解析桩，并输入合成 SN、NQT（含 + / =）、8 位 IMEI 三例。官方方法的解析结果与新适配器字段和值逐一一致。报告保存在 `evidence/parser-conformance.json`。

这是纯解析方法的隔离执行，区别于运行完整官方 bundle 或客户端；没有发出网络请求，也没有走账户、订单、设备或支付分支。该实验不验证小程序接收新格式后的设备可用性、学校权限或计费。
