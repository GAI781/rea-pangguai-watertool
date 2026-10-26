# Android 运行时代码发现（2026-10-26）

本轮已实际取得部分运行时代码，并通过 REA 读出官方扫码方法。现有产品不再依赖两张照片：网页与通用快捷指令说明都从新扫码结果动态读取 SN / NQT / IMEI。新的源码证据支持格式适配，但不证明所有饮水机支持支付宝路线。

## 实际执行与边界

原始官方 APK 身份、密码学验签结果见 [静态阶段记录](ANDROID-RESEARCH.md)。在独立 API 24 ARMv7 空白 AVD 中安装原始 APK，系统启动、包管理与安装均成功；Activity 等待曾返回 timeout，后来截图明确显示隐私同意弹窗。没有点击同意、登录、提交真实二维码、开水或支付。

Frida 16.5.9 附加到 ADB 明确给出的研究 App PID，服务只监听模拟器回环地址，通过 ADB 本机转发连接。未关闭 SELinux、伪装模拟器环境或修改 App 校验。首次只读类清单为 5,334 个已加载类，其中 18 个以 com.qiekj.user 开头。

常规 PathClassLoader 的 DEX 仍只有加载器的 4 个 class_defs。改为检查已加载 SplashActivity 和 PrivacyPopup 的 DexCache 指针，按 DEX 头声明的有界长度各读取一份代码数据；没有扫描全部进程内存、提取账号或支付密钥。研究结束已停止我们创建的 AVD。

| 私有研究文件 | 大小 | 头部 class_defs | SHA-256 |
|---|---:|---:|---|
| runtime-loaded-0.dex | 7,577,356 | 5,704 | 135738cccd3f75a7c812fa23812da7aef089bc04429b0faa37bcd57110251a58 |
| runtime-loaded-1.dex | 6,820,920 | 6,982 | bed1f03d9f19bd28288f6bdef2ce792589bfbe16a25d51d7c16a3a09e7cd8342 |

两份内存数据的头部 Adler-32 匹配，SHA-1 不匹配。没有重写头部或更改预期值使检查通过，原始 APK 签名也不为这些内存副本背书。它们只作为不完整的分析输入，不能安装或分发为官方客户端。

为 REA 的 APK 输入接口建立了明确标记的私有、未签名分析容器，包含原清单和这两份原样代码；未安装该容器。REA/JADX 报告 4,569 个顶层类表示，不能与 DEX class_defs 数直接相加比较。这里只取得部分代码，不宣称全部解包或完整还原。

## REA 读到的具体事实

REA 6.8.0、已核对发行哈希的 jadx-headless-mcp 0.7.1、JDK 21。以下方法返回 body_status=available、source.status=complete；这是反编译结果，不是动态执行这些方法。

| 方法 | 可确定的代码行为 | 产品含义 |
|---|---|---|
| HomeScanCodeAct.scanCodeResult | 读取 NQT、IMEI、SN，依次交给 ScanCodeVm.scanV2；另有 qeykid / 8 字符卡码、特殊网页与充值等分支 | 普通设备参数有原生源码佐证；卡码不能自动当成饮水机 |
| HomeScanCodeAct.createObserver | 扫码返回 jumpToAlipayFlag2 为真且装有支付宝时进入支付宝扫码入口；否则进入 LockingAct 并传入官方返回的设备 id | 后续路线依赖官方结果，不能保证所有设备都走同一小程序页 |
| ScanCodeVm.scanV2 | 将 key/value 组成映射交给异步业务；失败显示网络错误并关闭扫码页 | 解析格式不等于在线设备鉴权或成功出水 |
| LockingAct.createObserver | 读取官方设备详情的 categoryCode、payment、isBluetooth、错误状态及程序列表；水类分支可进入 AfterPayUseAct，另有 waterSync 状态同步路径 | 单个设备标记不足以重建所有机型业务；不能省略官方状态与计费分流 |
| ScanV2Bean.getJumpToAlipayFlag2 | 返回对象的 jumpToAlipayFlag2 字段 | 不是本工具可以自行推定或强制设置的兼容开关 |

Android 方法里出现的 alipayqr 扫码入口不是现有 iPhone 小程序直达 URL 的来源，也不替换现有直达 URL。现有 appId/page/query 仍来源于官方 H5 代码，并已有用户现场导航与使用反馈。Android 方法、iOS 路由和设备在线权限必须分开验证。

## 保留的失败与覆盖限制

- 先前遍历全部 ClassLoader / DEX 项过慢而取消，未产生可用结果；随后改用两个已加载类的 DexCache 有界读取。
- REA 的部分并行查询因 /proc 进程归属检查权限出现 cleanup_incomplete；保存失败记录，没有计入成功。ScanCodeVm.scanV2 和 LockingAct.createObserver 在获准的沙箱外只读分析后成功；其他查询按序执行。
- 原始静态 APK 的扫码类读取失败依然是真实历史，后续内存派生容器的成功不改写那个结果。
- 没有执行扫码后真实业务方法；未验证新学校、机型、蓝牙连接、离线设备或服务端全量分流。

公开 [派生证据摘要](evidence/runtime-code-summary.json) 记录输入哈希、REA evidence_id 和方法状态，明确不是原始 Evidence。原始 APK、完整运行时代码与 REA 输出留在私有工作区，不进入产品包或公开 Git 仓库。

## 当前交付结论

继续采用有官方 H5 来源且已实测的支付宝小程序导航。新设备可用网页扫码/照片/粘贴，或按 [通用扫码指令说明](SCAN-SHORTCUT.md) 搭建动态入口；后者原生动作仍待 iPhone 验收。未知码不猜测设备 id，不调用私有订单、支付或水阀接口。

本次真正推进了此前受加固阻挡的扫码源码分析，但没有新增未经验证的取水协议。若某设备的官方结果要求 App 内蓝牙或特殊路径，通用 HTTPS 页面无法仅靠替换参数承诺兼容；需要继续验证其官方支持入口。
