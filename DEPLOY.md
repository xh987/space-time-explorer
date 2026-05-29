# 时空探险家 - 部署与分享指南

## 方案一：免费静态托管（推荐）

### 1. Vercel 部署（最简单）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 在项目目录执行
vercel

# 按提示操作，完成后会获得 https://your-app.vercel.app 链接
```

**特点**：
- 自动 HTTPS
- 全球 CDN 加速
- 绑定自定义域名
- 每次 git push 自动部署

### 2. Netlify 部署

1. 访问 https://app.netlify.com/drop
2. 将 `dist` 文件夹拖拽上传
3. 获得链接如 `https://xxx.netlify.app`

### 3. 腾讯云开发 / 阿里云 OSS

- 国内访问速度快
- 需要实名认证
- 支持自定义域名

---

## 方案二：PWA 添加到主屏幕

部署后，用户可以将应用添加到手机桌面：

### iOS Safari
1. 打开网页
2. 点击底部分享按钮 ⬆️
3. 选择「添加到主屏幕」
4. 点击「添加」

### Android Chrome
1. 打开网页
2. 点击菜单（⋮）
3. 选择「添加到主屏幕」或「安装应用」
4. 点击「安装」

### 效果
- 像原生 App 一样全屏运行
- 有独立图标和启动画面
- 支持离线使用

---

## 方案三：分享到微信/QQ

部署后获得链接，可以：

1. **生成二维码**
   - 访问 https://cli.im/ 或 https://qr-code-generator.com/
   - 输入你的网址生成二维码
   - 保存图片分享

2. **直接分享链接**
   - 微信：发送链接给好友或朋友圈
   - QQ：发送给好友或群

---

## 方案四：局域网内分享（测试用）

```bash
# 在同一 WiFi 下，其他设备访问你的电脑 IP

# 1. 先构建
npm run build

# 2. 启动预览（带 host 暴露到局域网）
npx vite preview --host

# 3. 查看本机 IP
# Windows: ipconfig
# Mac/Linux: ifconfig

# 4. 手机浏览器访问
# http://192.168.x.x:4173
```

---

## 图标生成

PWA 需要多种尺寸的图标。可以使用在线工具：

1. 访问 https://favicon.io/favicon-converter/
2. 上传 `public/favicon.svg`
3. 下载生成的图标包
4. 解压到 `public/icons/` 目录

或使用命令行：
```bash
# 安装 ImageMagick 后
magick public/favicon.svg -resize 192x192 public/icons/icon-192x192.png
magick public/favicon.svg -resize 512x512 public/icons/icon-512x512.png
# ... 其他尺寸
```

---

## 域名绑定（可选）

### 自定义域名
1. 购买域名（阿里云/腾讯云/GoDaddy）
2. 在 Vercel/Netlify 设置中添加域名
3. 按提示配置 DNS 解析

### 免费二级域名
- Vercel: `xxx.vercel.app`
- Netlify: `xxx.netlify.app`
- Surge: `xxx.surge.sh`

---

## 快速开始

最简单的分享方式：

```bash
# 1. 构建项目
npm run build

# 2. 部署到 Vercel
npx vercel --prod

# 3. 获得链接后，生成二维码分享
```

部署完成后，任何人扫码即可在手机上使用！
