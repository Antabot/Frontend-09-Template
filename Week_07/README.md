# 学习笔记

本周继续重学 JavaScript 模块，根据前面的划分，进行表达式、语句、结构层面的深入探讨。

## 1 JS 表达式

### 1.1 运算符

#### 1.1.1 Member

优先级最高，形式包括：

- a.b
- a[b]
- foo`string`（不属于 Member，但同优先级）
- super.b
- super['b']
- new.target

#### 1.1.2 New

new foo 优先级比 new foo() 低，new a()() 是 a 和第一个 () 结合，new new a() 是 a() 与第二个 new 结合。

#### 1.1.3 Reference

存在于运行时中的规范类型（ECMAScript specification type），一般形式是 Object-Key，此外 delete、 assign（赋值） 等运算也会产生引用类型。

#### 1.1.4 Call

- foo()
- super()
- foo()['b']，此种写法使表达式降级为 call 运算，优先级低于 Member
- foo().b，降级
- foo()`abc`，降级

Example: `new a()['b']` 中 new a() 先执行。

> 由此可以看出，各运算符的优先级并不固定，而是要视使用的具体位置决定，应该用产生式表达更为严谨的优先级。


以上均为 Left Handside Expression，顾名思义就是可以放在等号左边的表达式，而 Left Handside Expression 几乎一定同时是 Right Handside Expression。

#### 1.1.5 Update

Update 为 Right Handside Expression

- a++
- ++a
- a--
- --a

Example: ++a++ 会优先和后面的 ++ 结合（这种语法是不合法的）

#### 1.1.6 Unary（单目运算符）

- delete a.b
- void foo()
- typeof a
- +a
- -a
- ~a
- !a
- await a

#### 1.1.7 Exponental

** 运算符是 JS 中唯一一个右结合的运算符，3**2**3 先算 2 的 3 次方再算 3 的 8 次方。

#### 1.1.8 其它运算

- Multiplicative `* / %`
- Additive `+ -`
- Shift `<< >> >>>`
- Relationship `< > <= >= instanceof in`

- Equality `== != === !==`，双等运算的类型转换比较反直觉，不建议使用
- Bitwise `& ^ |`
- Logical `&& ||`，遵循短路原则，前面已经确定结果则后面不再运算
- Conditional `?:`

### 1.2 类型转换

可能发生类型转换的场景：

- a + b
- "false" == false
- a[o] = 1

转换规则：

![类型转换](https://img-blog.csdnimg.cn/20210412212533923.png#pic_center)

#### 1.2.1 拆箱转换

拆箱转换主要是调用 `ToPremitive` 方法，有三个方法会影响该过程：

- toString，作为属性名时优先调用 toString
- valueOf，加法运算会优先调用 valueOf
- Symbol.toPrimitive

#### 1.2.2 装箱转换

Number String Boolean Symbol`new Object(Symbol('a'))`。

由于装箱转换的存在，我们为对象类型添加的属性可以方便地被对应的其它类型访问。

#### 1.2.3 typeof

|Type|	Result|
|--|--|
|Undefined|	"undefined"|
|Null|"object" |
|Boolean|	"boolean"|
|Number|	"number"|
|BigInt|	"bigint"|
|String|	"string"|
|Symbol | "symbol"|
|Function object (implements [[Call]] in ECMA-262 terms)	|"function"|
|Any other object|"object

## 2 JS 语句

- 简单语句
- 组合语句
- 声明

### 2.1 Completion Record

描述语句执行的状态的数据结构，属于规范类型。

- [[type]]: normal, break, continue, return, throw
- [[value]]: 语言类型的值
- [[target]]: label （break continue 可以和 label 配合）

### 2.2 简单语句

- ExpressionStatement
- EmptyStatement
- DebuggerStatement (使用 debugger 关键字的语句)
- ThrowStatement
- ContinueStatement
- BreakStatement
- ReturnStatement

### 2.3 复合语句

- BlockStatement
- IfStatement
- SwitchStatement 不建议在 JS 使用（并不提升性能且易出错）
- IterationStatement
- WithStatement 不确定性比较高，不建议使用
- LabelledStatement
- TryStatement

## 3 JS 结构化

### 3.1 JS 执行粒度

- 宏任务，传给 JS 引擎的任务
- 微任务（Promise）
- 语句/声明
- 表达式
- 直接量/变量/this

宏任务与微任务：

![宏任务与微任务](https://img-blog.csdnimg.cn/20210412214300614.png#pic_center)

### 3.2 事件循环

wait->getcode->execute->wait

### 3.2 JS 函数调用

#### 3.2.1 Execution Context

执行一个语句的时候需要的所有信息会保存在执行上下文中，执行上下文保存在执行上下文栈中，栈顶即当前执行上下文。

执行上下文组成：

![执行上下文](https://img-blog.csdnimg.cn/20210412215042972.png#pic_center)

一个执行上下文不一定有以上全部的内容。

#### 3.2.2 Lexical Environment

- this
- new.target
- super
- 变量

#### 3.2.3 VariableEnvironment

历史包袱，仅处理 var 声明。但无法处理 eval 里的 var，因此仍需借助 lexical Environment。

#### 3.2.4 Environment Record

![Environment Record](https://img-blog.csdnimg.cn/20210412215421741.png#pic_center)

#### 3.2.5 Closure

根据 ES 定义，闭包即为函数。

但在某些场景下，闭包指有以下特征的函数：

- 即使创建它的上下文已经销毁，它仍然存在（比如，内部函数从父函数中返回）
- 在代码中引用了自由变量

> “作用域链” 这个说法在 ES 2018 后已经不再提及。

#### 3.2.2 Realm

在被执行（evaluated）之前，所有 ECMAScript 代码必须被关联到一个 realm 中。概念上，一个 realm 包含一系列内置对象，一个 ES global 环境，所有 ES 代码会在全局环境作用域和其它相关的状态和资源中加载。

realm 在规范中被表示为一个 Realm Record，并包含如下字段：

- [[Intrinsics]]，此 realm 相关代码使用的内置对象
- [[GlobalObject]]，此 realm 的全局对象
- [[GlobalEnv]]，此 realm 的全局环境
- [[TemplateMap]]，模板对象会根据每个 realm 的 Realm Reacords 的 [[TemplateMap]] 字段分别转换。
- [[HostDefined]]，为需要在 Realm Record 中关联附加信息的宿主环境提供的保留字段。

JS 引擎的实例中所有的内置对象会放进一个 Realm。浏览器中一个 window 就是一个 realm，所有对象都需要关联到 realm，因此一个 realm 中的对象就是指 window 中全部的对象。




