# 广告行为核对

来源为 2026-10-26 读取的官方 `pages_skip.a9039bcd.js`，SHA-256 与完整资源链接见 RESEARCH.md。用户两张 iPhone 截图中，冷/热水设备页均展示商品流。

为避免依赖名字猜功能，在不运行完整网页、不登录、不发出网络请求的条件下，抽取原脚本的 `appendAlipayMiniCoverAdParam`、`getAlipayMiniCoverAdStatus`、`getAlipayMiniJumpUrl` 方法，在 Node VM 中给 `$get` 注入合成返回值。使用虚构设备 ID 和商家 ID，结果如下：

| 合成返回 | 官方代码的输出 |
|---|---|
| slot/get 返回非空 images | 不自动添加 isShowAd=false |
| slot/get 返回空 images | query、page 与外层启动链接加入 isShowAd=false |
| 查询抛出异常 | 代码同样生成 isShowAd=false |

查询的 slotKey 为 `h5_ad_alipay_mini_cover_control`。这确认参数与该网页的封面广告控制分支相关，但不能证明小程序如何执行它，也不能证明它控制设备页下方的商品推广。

实验数据不是你学校的服务端返回；没有调用 slot/get 或读取你账号/商家的配置。没有模拟服务端错误访问真实设备，没有把这些候选参数加入已验证的日常入口。也没有测试另一个灰度小程序是否适合本校。

当前可靠结论：官方直达入口已在两台设备到达相应设备页，减少了进入胖乖生活 App 首页的操作；商品广告仍存在。没有经过验证的去除该商品流方案。网页 PWA 无法访问支付宝小程序 DOM，不能用网页 CSS 隐藏其中内容。若后续取得其他官方支持入口的实机证据，再考虑替换；现阶段保持已验证的路由。
