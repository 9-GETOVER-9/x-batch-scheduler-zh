<div align="center">

# X 批量排期 · 中文版

**把待发布内容整理成计划，在浏览器中管理发帖排期。**

`Chrome 扩展` · `CSV 导入` · `手动编辑` · `中文界面`

[![GitHub Stars](https://img.shields.io/github/stars/9-GETOVER-9/x-batch-scheduler-zh?style=for-the-badge&color=839778)](https://github.com/9-GETOVER-9/x-batch-scheduler-zh/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-7A9270?style=for-the-badge)](LICENSE)

[安装](#section-1)

</div>

---

Chrome 扩展，用表格、手动输入或随机组合模式批量安排 X 帖子。中文界面直接打开排期页，无需注册扩展账号。

<a id="section-1"></a>

## 安装

1. 打开 `chrome://extensions/`，开启开发者模式。
2. 选择“加载已解压的扩展程序”，选中本仓库目录。
3. 在同一浏览器里登录 X，点击扩展图标打开排期界面。

CSV 支持 `caption,image_filename`，也支持第三列 `datetime` 指定每条排期时间。不填写时间时，使用页面中的起始时间和间隔设置。开始处理前请核对预览。

扩展会读取 X 登录 Cookie 并调用 X 的排期接口；X 页面或接口变化后，功能可能需要适配。反馈表单仍连接到源码原有的外部服务。请先用少量测试内容验证排期结果。

<a id="section-2"></a>

## 检查

仓库中的 JavaScript 可用 `node --check` 进行语法检查。实际排期仍需在登录后的 X 页面验证。

<a id="section-3"></a>

## 许可证

[MIT](LICENSE)。本项目与 X 无官方关联。
