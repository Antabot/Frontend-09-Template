# week01-学习笔记

### 学习方法与构建知识体系

三种能力：业务能力、技术能力、**工程能力**

进阶资深工程师：组件化、工具链、持续集成、发布系统等方向任选其一

学习方法：建立知识架构、追溯法

### Tic-Tac-Toe 实现

技巧：二维数组展平、高效克隆

算法：递归 AI、胜负剪枝

### 异步编程

三种方案：
- callback，JS 初期唯一异步方案，代码复杂，效率低
- Promise，then 中返回 Promise 实现链式表达
- async/await，早年用 generator + yeild 模拟

async + generator 可实现异步迭代器，对应 `for await of` 语法