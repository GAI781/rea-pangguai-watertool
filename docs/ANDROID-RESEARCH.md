# 官方 Android APK 静态分析（v0.6）

本轮下载并分析了官方网页直接指向的 `https://static.qiekj.com/soft/user/QeUser.apk`。此前的代理 403 已解除。只将 APK 作为数据读取，没有安装、启动、调试或登录官方 App，没有请求设备或支付接口。

## 文件与工具身份

| 项目 | 结果 |
|---|---|
| 文件大小 | 140,641,957 字节 |
| APK SHA-256 | `070de36f21e1128cea1bdc25a49241b3381276ff75b23974a477907fa44e971a` |
| 包名 | `com.qiekj.user` |
| 下载文件的版本 | 1.81.4 / versionCode 147，不能据此声称所有渠道的最新版本 |
| min/target SDK | 21 / 30 |
| REA | 6.8.0，Node 24.22.1 |
| 反编译引擎 | REA 包元数据锁定的 jadx-headless-mcp 0.7.1 |
| JADX JAR SHA-256 | `6e5eacf500b64292bfb73c49797c1958f6ee44646e43e868039ae7feb573ff75`，执行前逐字匹配通过 |
| Java | OpenJDK 21，确认 jdk.compiler 模块可用 |

ZIP 目录 6,454 项，CRC 完整检查通过。REA 检查声明的签名结构并重算摘要，但其自身明确不做签名密码学验证，因此另使用 Google Maven 发布的 `com.android.tools.build:apksig:9.4.1` 验证 APK。

apksig 从 Google Maven 经 TLS 获取，匹配该站点发布的 .sha1；另记录工具 SHA-256 为 `7ae2e5980c77d853e3513074ee7c822bbdcdcde1668889d17faa7fe8bc8aa821`。结果 `verified=true, v1=true, v2=true, v3=false`。证书 SHA-256 为 `9a3dc727a28c713f4fb2a0e0be17fadf2f5a6b50093860a5affa7e112c7e4319`。

验证器对部分 META-INF 项给出 v1 覆盖告警，未修改 APK 或关闭检查来消除它们。完整告警随 `evidence/android-signature-google.txt` 保存。签名与内容一致不证明版本最新、iOS 使用相同逻辑、或任意设备可用；文件来源依据为官方网页公开下载地址。

## 实际执行的 REA 操作

- `inspect-apk-signature`：签名结构、签名者和摘要声明。
- `inspect-android-package`：解码清单、版本、组件与权限。
- `search-android-classes` 空查询：可见类全清单。
- `inspect-android-class com.stub.StubApp`：加载器成员。
- `inspect-android-method com.stub.StubApp attachBaseContext`：实际得到加载器 Java 方法体，不是只搜索类名。
- `inspect-android-class com.qiekj.user.ui.activity.scan.HomeScanCodeAct`：该类在清单中有声明，但引擎无法在当前类视图找到；失败记录保留。

引擎设置 `REA_JADX_HEAP_MIB=4096`、`REA_JADX_ACTIVE_PROCESSOR_COUNT=4`，不启动 Android App。

原始包及完整研究文件保存在当前工作区 `/workspace/research/android/`；公开源码仅附摘要和必要证据，未分发 APK、完整清单里的第三方配置或加载器源码。`android-summary.json` 明确标为派生研究摘要，不冒充未经修改的 REA Evidence。

## 加固造成的真实限制

- application 是 `com.stub.StubApp`；存在加载器类与本地加固库。
- 原始 DEX 头声明 4 个 class_defs；REA/JADX 的可见类清单为 6 项（包含辅助/资源表示）。它们主要为加载器和辅助类，不是完整业务类清单。
- 清单里有 HomeScanCodeAct、各类设备页与 BLE 相关声明，但其业务方法无法在当前静态类视图恢复。

这说明只靠对当前 APK 直接做静态反编译，尚不能拿到扫码、设备类型、蓝牙握手、订单等完整业务实现。可见类覆盖 complete 只表示该静态视图被穷尽，不表示加固载荷已经解开。不把加载器方法当作取水协议，也不虚构已经解密了所有业务。

后续已安装并校验官方 SDK/模拟器，尝试软件 ARM 运行方式；但尚未确认 Android 系统就绪。重启探测、就绪后安装 APK 的权限请求被取消，因此没有执行 APK 安装/启动或运行时解包。/dev/kvm 仍不存在。详见 [运行环境推进记录](ANDROID-RUNTIME.md)，不能把进程存在当作业务代码已恢复。

## 可确定的 Android 外部入口

| 清单声明 | 目标 | 能证明什么 |
|---|---|---|
| `qiekeji` Scheme | MainActivity | Android 注册了 App 启动入口；未知取水路由参数与 iOS 支持 |
| `qiekj` Scheme | OpenSuccessAct | Android 支付相关回调组件，不作为取水入口 |
| `afhbaedbic` Scheme | CmbPayResultActivity | 银行支付回调组件，不作为取水入口 |

这些声明没有被加入 iPhone 快捷入口；不能因为 Android 有某个 Scheme，就猜一个 iOS 深度链接。清单声明蓝牙权限也不能证明某个具体机型的蓝牙协议或是否必须蓝牙。

## 产品据此调整

继续复用有来源证据、已有用户验证的支付宝小程序通道；SN / NQT / IMEI 仍分开标注支持等级。当前不会声称兼容所有饮水机，也不直接实现未经核实的水阀控制。

v0.6 增加本机格式报告，帮助收集新类型的格式差异，而不是只保存两张照片。报告只保留 scheme、域名、路径类别、参数名称与支持状态，移除原文、设备标记值、查询值、路径内容和片段内容。没有自动上传；域名本身可能标识学校，分享前可先检查。报告不能证明设备授权或兼容性。

## 重现签名验证

本项目附 `scripts/VerifyApk.java`（我们编写的验证驱动），不包含第三方 JAR。合法取得同一 APK，按上述来源/校验值准备 Google apksig JAR 与 JDK 17+ 后：

```powershell
java -cp "工具目录\apksig-9.4.1.jar" scripts/VerifyApk.java "研究目录\QeUser.apk"
```

REA 操作需额外配置其锁定的 JADX JAR，示例：

```powershell
$env:REA_JADX_MCP_JAR = '工具目录\jadx-headless-mcp-0.7.1-all.jar'
$env:REA_JADX_HEAP_MIB = '4096'
npx rea-agents@6.8.0 inspect-android-package '研究目录\QeUser.apk' --format json
```

Windows 的 JADX 配置路径应改为完整绝对路径；Windows 实机命令尚未测试，实际运行记录来自当前 Linux 环境。
