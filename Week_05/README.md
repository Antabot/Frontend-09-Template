# 学习笔记

本周的内容分为两个部分，一是 proxy 实现双向绑定，二是利用 range 实现精准拖拽。

# 1 Proxy 与双向绑定

## 1.1 Proxy

Proxy 对象用于创建一个对象的代理，从而实现基本操作的拦截和自定义（如属性查找、赋值、枚举、函数调用等）。

在使用时，一般对 Proxy 进行封装，如

```js
function reactive(object) {
	return new Proxy(object, handler)
}
```

handler 中可以使用的 trap 函数即其兼容性如下图：

![traps](https://img-blog.csdnimg.cn/20210328220535198.png#pic_center)

## 1.2 双向绑定

利用 Proxy 特性可以实现数据到 DOM 的绑定，利用 DOM 事件监听器可以实现 DOM 到数据的绑定。

模拟 Vue 3.0 reactivity 特性，实现数据到 DOM 绑定，主要思路与技巧如下：

- 使用 Proxy 创建对象代理，在修改属性时触发回调函数修改对应的 DOM 元素
- 记录回调函数调用时涉及的对象及其属性，以对象的属性为 key 保存回调函数，提高性能
- 因为 Proxy 是无状态的，因此可以利用缓存进一步提高性能

# 2 拖拽与 Range

## 2.1 拖拽动作

拖拽动作主要用 DOM 事件结合 transform 实现。

实现符合直觉的拖拽效果，需要注意元素 transform 的基准点（默认是中心点）与拖拽的起始位置两个参数。

同时，由于浏览器的特性，需要注意：

- drag/drop 事件是把元素抓起来放到某个位置，无法实现随鼠标移动，需要用 mousedown/mousemove/mouseup
- 在 mousedown 事件里监听 mousemove/mouseup 事件（也可设置 flag，但多了一个判断逻辑，影响性能）
- 在 document 上监听而不是在拖拽的元素上监听，以防止 “拖断” 的情况发生。（在现代浏览器中鼠标移出浏览器范围外也能监听到事件）

## 2.2 Range

Range 是一个 DOM API，表示文档中一个包含节点与部分文本节点的片段。

获取 Range 的方法：

- document.createRange()
- selection.getRangeAt()
- new Range()

利用 range，对 DOM 的操作可以精确到文本节点的某个字符，比如实现如图所示的效果：

![drag](https://img-blog.csdnimg.cn/20210328225410980.png#pic_center)