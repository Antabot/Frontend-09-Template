# 学习笔记

本周的主要内容是用 JS 实现构建抽象语法树（AST）的算法。

## 1.什么是 AST？

AST 是一个非常基础而重要的知识点。在 JS 中 AST 的应用场景主要在于批量构建代码，我们常用的 webpack、babel、vue-cli 等的实现均离不开 AST。

一个标准的 AST 结构可以理解为一个 JSON 对象，如 

```js
const team = 'front-end'
```

转换为 AST 结构即：

```js
	{
	  "type": "Program",
	  "start": 0,
	  "end": 18,
	  "body": [
	    {
	      "type": "VariableDeclaration",
	      "start": 0,
	      "end": 18,
	      "declarations": [
	        {
	          "type": "VariableDeclarator",
	          "start": 6,
	          "end": 18,
	          "id": {
	            "type": "Identifier",
	            "start": 6,
	            "end": 8,
	            "name": "team"
	          },
	          "init": {
	            "type": "Literal",
	            "start": 11,
	            "end": 18,
	            "value": "front-end",
	            "raw": "'front-end'"
	          }
	        }
	      ],
	      "kind": "const"
	    }
	  ],
	  "sourceType": "module"
	}
```

AST 的生成与应用流程如下：

![AST流程](https://img-blog.csdnimg.cn/20210314203539613.png)

## 2.如何生成 AST？

构建 AST 的过程又被称为语法分析。语法分析算法的核心思想主要有两种：

- LL 算法（Left Left），从左到右扫描，从左到右归约
- LR 算法，从左到右扫描，从右到左归约

### 2.1 四则运算词法分析

TokenNumber、Operator、Whitespace(<SP>)、LineTerminator(<LF><CR>)

### 2.2 四则运算语法分析

按照 LL 进行语法分析时，各类表达式可以拆解为如下形式：

```html
<!-- 表达式相当于一个加法表达式和一个结束符 -->
<Expression> ::=
	<AdditiveExpression><EOF>

<!-- 加法表达式相当于一个乘法表达式或两个加法表达式相加或两个加法表达式相减 -->
<AdditiveExpression> ::=
	<MultiplicativeExpression>
	|<AdditiveExpression><+><AdditiveExpression>
	|<AdditiveExpression><-><AdditiveExpression>

<!-- 乘（除）法表达式相当于一个数字或一个乘（除）法表达式乘以数字或一个乘（除）法表达式除以数字 -->
<MultiplicativeExpression> ::=
	<Number>
	|<MultiplicativeExpression><*><Number>
	|<MultiplicativeExpression></><Number>
```

执行顺序遵循四则运算规则，先乘除后加减。

这样数字和相乘的项都会先被作为乘法表达式，再经过加法表达式处理，作为一个整体的加法表达式，最后添加 EOF 形成最终的表达式。