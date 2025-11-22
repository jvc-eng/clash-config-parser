# Clash 配置解析器

一个在 Cloudflare Pages 上运行的 Clash 配置文件解析器，支持上传多个 OpenClash/Clash/Mihomo 的 YAML 配置文件，提取节点并生成订阅链接。

## 功能特点

- 🖼️ 现代化拖放上传界面
- 📁 支持多文件同时上传
- 🔍 自动提取节点信息
- 📊 实时统计显示
- 🔗 一键生成订阅链接
- 📱 响应式设计

## 部署到 Cloudflare Pages

### 方法一：通过 GitHub 连接部署（推荐）

1. Fork 或克隆此仓库
2. 在 [Cloudflare Pages](https://dash.cloudflare.com/) 中创建新项目
3. 连接您的 GitHub 账户
4. 选择此仓库
5. 配置构建设置：
   - 构建命令：`npm run build`
   - 构建输出目录：`dist`
6. 点击"部署"

### 方法二：手动上传

1. 在本地构建项目：
   ```bash
   npm install
   npm run build
