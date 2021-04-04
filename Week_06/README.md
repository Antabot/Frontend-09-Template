# 学习笔记

本周进入重学 JavaScript 模块，从语言学、语法、语义、运行时等角度理解 JavaScript 作为一门编程语言的特点与本质。

## 1 JS 语言通识

### 1.1 泛用语言分类

按语法分类：

- 非形式语言，如各类自然语言
- 形式语言，如各类编程语言

形式语言按文法表达能力分类 —— 乔姆斯基谱系：

- 0 型文法（无限制文法或短语结构文法）包括所有的文法。
- 1 型文法（上下文相关文法）生成上下文相关语言。
- 2 型文法（上下文无关文法）生成上下文无关语言。
- 3 型文法（正规文法）生成正则语言。


### 1.2 产生式

产生式，即源程序经过词法分析和语法分析后得到的一系列符合文法规则的语句。

巴科斯-诺尔范式（Backus-Naur Form, BNF）是一种用于描述上下文无关文法的表现方式。

BNF 语法：

- 尖括号中的内容表示语法结构名
- 语法结构分成基础结构（Terminal Symbol，终结符）和需要用其它语法结构定义的复合结构（Nonterminal Symbol，非终结符）
- 引号和中间的字符表示终结符
- 可以有括号
- `*` 表示重复多此
- `|` 表示或
- `+` 表示至少一次

例：带括号的四则运算 BNF 产生式：

```html
<Expression>::=<AdditiveExpression><EOF>
<AdditiveExpression>::=<MultiplicativeExpression>|
	<AdditiveExpression>"+"<MultiplicativeExpression>|
	<AdditiveExpression>"-"<MultiplicativeExpression>
<MultiplicativeExpression>::=<PrimaryExpression>|
	<MultiplicativeExpression>"*"<PrimaryExpression>|
	<MultiplicativeExpression>"/"<PrimaryExpression>
<PrimaryExpression>::=<Number>|
	"("<AdditiveExpression>")"
```

JS 的产生式写法与 BNF 类似。

### 1.3 编程语言分类

按用途分：
- 数据描述语言：JSON HTML XAML SQL CSS
- 编程语言：C C++ C# Java Python Ruby Perl Lisp T-SQL Clojure Haskell JavaScript Go Scala

按表达方式分：
- 声明式语言：JSON HTML XAML SQL CSS Lisp Clojure Haskell
- 命令型语言：C C++ Java C# Python Ruby Perl JavaScript Go Scala

按类型转换规则分：
- 强类型语言：C C++ C# Java Python
- 弱类型语言：JavaScript VBScript PHP Perl Ruby

按类型确定时机分：
- 静态语言（编译时确定）：C C++ C# Java
- 动态语言（运行时确定）：Python JavaScript VBScript Ruby PHP Perl

### 1.4 编程语言的性质

**图灵完备性：**

如果一系列操作数据的规则（如指令集、编程语言、细胞自动机）可以用来模拟单带图灵机，那么它是图灵完全的。或者说，如果能够描述所有可计算的问题，就是图灵完备的。

实现图灵完备性有两种思路：

- 命令式——图灵机（goto/if while） 
- 声明式——lambda（递归）

**动态与静态：**

动态对应运行时（用户设备或服务器上），静态对应编译时（开发者设备上）。

**类型系统：**

动态类型系统与静态类型系统：

- 动态类型系统，在运行时存在的类型
- 静态类型系统，只在编写代码时能够保存的类型系统（编译成机器码后类型信息丢失）

强类型与弱类型

- 强类型，类型转换必须是显式的
- 弱类型，类型转换可以是隐式的


### 1.4 命令式编程语言的设计方式

- Atom: Identifier Literal
- Expression: Atom Operator Punctuator
- Statement: Expression keyword Punctuator
- Structure: Function Class Process Namespace
- Program: Module Package Library

## 2 JS 类型

### 2.1 Number

依据： IEEE 754-2008 规定的双浮点数规则，有效整数范围是 -0x1fffffffffffff 至 0x1fffffffffffff-

格式： Sign(1) + Exponent(11) + Fraction(52)

特例：
- NaN，占用 9007199254740990
- Infinity，无穷大
- -Infinity，负无穷大

非整数 Number 类型无法用 ==/=== 比较，而需要用差值与 Number.EPSILON 比较。

### 2.2 String

JavaScript 字符串把每个 UTF16 单元当作一个字符来处理。`charAt、charCodeAt、length` 等方法均是针对 UTF16 编码。

### 2.3 其它类型

Boolean: 

true、false，均为关键字

null & undefined：

Undefined 不是关键字，一般用 void 0 表示 undefined

Symbol:

用作 Object 属性的关键字。

Symbol 在内存中创建后，只能通过变量名引用，两个 Symbol 即使名字一样，也是不相等的。

### 2.4 对象

**对象的特征：**

唯一标识性（identifier）、具有状态（state）、具有行为（behavior）

**描述对象的方式：**

- 类，归类，如 C++，支持多继承。分类，如 Java，C#，只能单继承
- 原型，对象仅需要描述与原型的区别，原型本身也是对象

设计对象的状态和行为时，我们应该遵循 **行为改变状态** 原则。（例：不是“狗咬人”，而是 “人受到伤害”）

**JavaScript 对象：**

运行时：

![object](https://img-blog.csdnimg.cn/20210404223659181.png)

原型链： 

对象中找不到的属性，会根据 [[prototype]] 属性从原型中寻找，直到 Null。

对象属性分类：

![属性](https://img-blog.csdnimg.cn/20210404224002228.png)

JS 中描述对象的四种方式：

- {} / . / [] / Obejct.defineProperty，不依赖类或原型创建对象、访问属性、定义新属性的基础方法
- Obejct.create / Object.setPrototypeOf / Object.getPrototypeOf，基于原型的描述方法
- new / class / extends，模拟类的方式
- new / function /prototype，原始的模拟类的方式，ES 3 版本之后不推荐使用

JS 中的特殊对象，指无法仅用属性+原型描述的对象，主要是各种原生对象：

![特殊对象](https://img-blog.csdnimg.cn/20210404224431809.png)