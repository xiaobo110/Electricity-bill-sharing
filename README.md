# 🏠 房租电费分摊计算器

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)  
[![Version](https://img.shields.io/badge/version-1.0.0-brightgreen)](https://github.com/xiaobo110/Electricity-bill-sharing/releases)

> 💡 **让合租更公平、更简单** —— 一款专为合租人群打造的智能费用分摊工具。

---

## 📌 项目简介

在合租生活中，房租与电费如何公平分摊常常引发矛盾。  
**房租电费分摊计算器** 通过灵活的算法模型，帮助用户一键生成清晰、公正的分摊方案，支持多种复杂场景（如短租、电器差异、面积不均等），彻底告别“口头算不清”的烦恼。

无论你是学生、上班族还是房东，只需几分钟，即可完成一次透明、可追溯的费用结算。

---

## ✨ 核心功能

✅ **多维分摊策略**  

- 按房间面积  
- 按人头均摊  
- 按实际居住天数  
- 按电器使用情况（空调、冰箱等）  
- 自定义比例分配（支持任意权重）

✅ **直观可视化结果**  

- 使用 **Chart.js** 动态生成柱状图，清晰展示每位租户的分摊金额与占比  
- 支持结果导出或截图分享

✅ **极致用户体验**  

- 响应式设计：完美适配手机、平板、桌面端  
- 深色/浅色主题自动切换，夜间使用更舒适  
- 玀代化 UI：渐变色彩 + 流畅交互动效，操作愉悦

---

## 🚀 快速开始

### 🔧 前置要求

- Node.js ≥ v16
- npm 或 yarn

### ▶️ 本地运行

```bash
# 1. 克隆仓库
git clone https://github.com/xiaobo110/Electricity-bill-sharing.git

# 2. 进入项目目录
cd rent-electricity-calculator

# 3. 安装依赖
npm install
# 或
yarn install

# 4. 启动开发服务器
npm run dev
# 或
yarn dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可使用！

### 📦 构建生产版本

```bash
npm run build
# 或
yarn build
```

构建产物位于 `dist/` 目录，可直接部署至任何静态托管服务（如 Vercel、Netlify、GitHub Pages、阿里云 OSS 等）。

---

## 🛠 技术栈

| 类别       | 技术选型                   |
| ---------- | -------------------------- |
| 前端框架   | Vue 3 + `<script setup>`   |
| 状态管理   | Pinia                      |
| UI 组件库  | Bootstrap 5                |
| 样式预处理 | Sass                       |
| 图表可视化 | Chart.js + vue-chartjs     |
| 构建工具   | Vite                       |
| 部署加速   | 阿里云 ESA（边缘安全加速） |

---

## ⚠️ 免责声明

本工具提供的计算结果**仅供参考**，不构成法律或财务建议。  
实际费用分摊请以租赁合同、电力公司账单及当地政策为准。  
开发者不对因使用本工具产生的任何争议或损失承担责任。

---

<div align="center">
  <hr width="80%">
  <p><strong>✨ 本项目由阿里云 ESA 提供全球加速、安全防护与高性能计算支持</strong></p>
  <hr width="80%">
  <img src="https://img.alicdn.com/imgextra/i3/O1CN01H1UU3i1Cti9lYtFrs_!!6000000000139-2-tps-7534-844.png" alt="阿里云ESA" width="800" />
</div>


---

## 🙏 致谢

感谢每一位使用者的反馈与信任！  
特别致谢开源社区、Vue 生态及所有依赖库的维护者。

---

> 📬 **有任何问题或建议？**  
> 欢迎通过 [Issues](https://github.com/xiaobo110/Electricity-bill-sharing/issues) 提交反馈，我们会认真阅读每一条留言！

---

### 🌟 如果你觉得这个项目有帮助，欢迎：

- ⭐ Star 本仓库  
- 🐦 分享给需要的朋友  
- 💬 提出改进建议  

**让合租，从此不再“算不清”！**

---

> ✅ **MIT License** · © 2025 xiaobo110
