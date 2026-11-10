# 办公套件

金鹰 Agent 的人机协同办公套件：框选任意区域，让 AI 开始工作。用本机 ONLYOFFICE Document Server 完整编辑
Word、Excel、PPT；在文档里选中一段内容后，把选区和一句指令交给 Agent，修改会
自动写回同一个文件，并保留 Agent 修改前的版本。

![办公套件：本地文件夹、最近打开的文件与 OnlyOffice 连接状态](docs/screenshots/overview.png)

- 业务整页，默认不显示聊天；点“让 Agent 修改”时才创建/恢复工作台会话并显示原生对话。
- Excel 直接编辑单元格、公式和格式，保存时由 OnlyOffice 重算。
- Word/PPT 直接编辑段落、表格、文本框和形状。
- 文档不上传云端；OnlyOffice 与文件都在本机。
- 白底、金色点缀、简洁风格，中文界面。

## 运行条件

1. 支持工作台的金鹰 Agent Desktop。
2. 本机 Docker（或能访问本机 Docker 的等价环境）。
3. ONLYOFFICE Document Server，默认监听 `127.0.0.1:18080`。

首次启动 Document Server：

```bash
docker run -d --name office-co-creation-ds \
  --platform linux/arm64 \
  -p 127.0.0.1:18080:80 \
  -e JWT_ENABLED=false \
  -e ALLOW_PRIVATE_IP_ADDRESS=true \
  onlyoffice/documentserver:latest
```

- Intel Mac：`--platform` 改为 `linux/amd64`。
- Linux：把 `--platform` 一行换成 `--add-host host.docker.internal:host-gateway`。
- 只绑定 `127.0.0.1`，不要暴露到局域网。
- 启动后约 30 秒，工作台点“检测 OnlyOffice”即可。

> 本机自用场景下关闭了 OnlyOffice JWT；工作台用每个文件独立的随机令牌保护
> 文件读取、保存回调、选区上报和补丁通道，Document Server 只监听环回地址。
> 如果这台机器还有其他人使用，请为 OnlyOffice 开启 JWT，并只在可信网络中运行。

## 安装

在本目录执行：

```bash
pnpm pack
```

得到 `office-co-creation-0.1.0.tgz`，然后使用当前 Desktop 支持的本地插件安装入口：

```bash
dsh plugin add ./office-co-creation-0.1.0.tgz
```

安装后完整退出并重新打开金鹰 Agent。左侧栏顶部的工作台切换器里会出现
“办公套件”；也可以到工作台市场的“已安装”里检查条目。

## 使用

1. 点“打开文件”直接选择一个 `.xlsx` / `.docx` / `.pptx`；也可以点“打开文件夹”，再从左侧文件列表选择。
2. 从左侧文件列表选择 `.xlsx` / `.docx` / `.pptx`，OnlyOffice 直接打开。
3. 像平时一样编辑；Excel 公式照常输入、计算和保存。
4. 选中一个单元格/区域、一段文字或一个文本框，底部出现选区指令条。
5. 输入“把这段写得更简洁”“把 D3 改成 B3*C3*2”之类的指令，点“让 Agent 修改”。
6. Agent 只收到当前选区和指令，通过 `office_apply_patch` 工具提交替换内容；
   工作台把修改写回编辑器并强制保存。
7. 需要撤销时点“撤销 Agent 修改”，恢复到最近一次 Agent 修改前的已保存版本。

## 数据与安全

- 业务数据目录：`dshHomePath('office-co-creation')`，包含 `recent.json` 和
  `backups/<fileId>/`。卸载工作台不会删除该目录。
- 文件访问只允许用户在工作台里明确选择过的文件夹；使用 `realpath` 校验，
  拒绝符号链接、目录穿越和非 Office 扩展名。
- 文件读取、保存回调、选区上报、补丁通道都要求每文件随机令牌。
- 保存回调只接受本机/本机 Docker 主机地址，并且只处理状态 2/6。
- 保存前重新计算源文件 SHA-256；外部已修改时拒绝覆盖。
- 写入使用同目录临时文件 + 原子替换，权限收紧到 0600。
- 不把密钥写入源码、示例或测试；OnlyOffice 的 JWT 配置留给部署环境。

## 已知限制

- Word/PPT 的选区替换依赖编辑器当前仍保留选区；如果点开指令条后选区丢失，
  插件会拒绝修改并提示重新选择。Excel 使用地址重新选中，不依赖焦点。
- “撤销 Agent 修改”恢复的是最近一次 Agent 修改前的**已保存**版本；编辑器里
  尚未保存的手动修改不会进入该备份。
- 备份记录在本次运行的内存中；重启后磁盘上的备份仍在，但“撤销”入口只列本次
  运行产生的记录。
- OnlyOffice Document Server 需要单独启动；工作台只做健康检测和提示。
- 不做在线文档、多人协作、市场投稿或公开发布。

## 包结构

```text
package.json
cordis.patch.yml
dsh/index.js                      服务端：路由、工具、保存回调、版本
lib/client.js                     客户端：工作台面板、OnlyOffice 容器、会话
lib/host/file-store.js            文件扫描、路径校验、原子写回、备份
lib/host/document-server.js       健康检测、强制保存、回调主机校验
lib/host/patches.js               Agent 补丁队列与 office_apply_patch 工具
lib/onlyoffice-plugin/plugin.js   选区读取、补丁应用（PasteText）
lib/onlyoffice-plugin/config.json 插件配置参考
lib/onlyoffice-plugin/index.html  插件页面参考模板
```

## 自测

```bash
npm run check
npm test
pnpm pack
tar -tzf office-co-creation-0.1.0.tgz
```

第 8 节工作台自测清单中的安装、重启后加载、已安装列表、切换入口和真实业务
界面，需要在目标 Desktop 中人工完成；没有实测的项目不会写成已通过。