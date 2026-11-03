# 工程进度追踪工作台（ge-workbench-engineering-progress）

把已上线的金鹰工程进度系统（http://jyplan.zcx-baixiaobai.cn/）整页嵌入为一个工作台：

- 同文档顶部一条极简工具栏：数据状态 + 重载 + 新窗口打开（视图导航沿用原系统自带的左侧导航，不重复造）
- 下方整块 iframe 承载原系统，保留其全部交互与样式
- 加载中显示骨架、超时或不可达显示原因与重试，并给出外链兜底

## 接口

- `GET /api/engineering-progress/status` 上游 `/api/status` 的代理（8s 超时、60s 缓存）

> 本机接口注册时必须带 `requestBody: 'buffered'`。缺省时宿主按流式处理请求体，
> 对 GET 构造带 body 的 Request 会被 Node 拒绝，客户端看到的是 400。0.1.1 已修。

## 配置

默认上游 `http://jyplan.zcx-baixiaobai.cn`；如需换地址，在 profile 的 `cordis.patch.yml` 中覆盖：

```yaml
- id: ge-workbench-engineering-progress
  config:
    baseUrl: 'http://other-host:port'
```

## 说明

嵌入模式下，工作台不修改原系统的界面；深链通过 `#dash / #list / #gantt / #daily` 生效。
后续若需要项目级深链或原生看板，可基于 `/api/snapshot` 逐步补齐。
