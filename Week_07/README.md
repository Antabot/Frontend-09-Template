# 学习笔记

# 2 Realms

在被计算（evaluated）之前，所有 ECMAScript 代码必须被关联到一个 realm 中。概念上，一个 realm 包含一系列内置对象，一个 ES global 环境，所有 ES 代码会在全局环境作用域和其它相关的状态和资源中加载。



realm 在本规范中被表示为一个 Realm Record，并包含如下字段：



- [[Intrinsics]]，此 realm 相关代码使用的内置对象
- [[GlobalObject]]，此 realm 的全局对象
- [[GlobalEnv]]，此 realm 的全局环境
- [[TemplateMap]]，模板对象会根据每个 realm 的 Realm Reacords 的 [[TemplateMap]] 字段分别转换。
- [[HostDefined]]，为需要在 Realm Record 中关联附加信息的宿主环境提供的保留字段。



JS 引擎的实例中所有的内置对象会放进一个 Realm。

浏览器中一个 window 就是一个 realm。



所有对象都需要关联到 realm，因此一个 realm 中的对象就是指 window 中全部的对象。



执行上下文中包含当前 realm 的 Realm Record。

[[GlobalObject]] 是 realm 的一个私有属性。



