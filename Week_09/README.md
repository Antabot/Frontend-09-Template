# 学习笔记

本周学习浏览器工作原理的第二部分，包括 HTML 解析、CSS 计算的原理及实现。

## 1 HTML 解析

### 1.1 文件拆分和接口设计

- 为方便文件管理，把 parser 单独拆到文件中
- parser 接受 HTML 文本作为参数，返回一棵 DOM 树

```js
module.exports.parseHTML = function parseHTML(html) {
	// 根据 html 生成 DOM 树（使用 stack 存储）
}
```



### 1.2 使用 FSM 实现 HTML 的分析

- HTML 标准规定了 HTML 的状态，挑选一部分状态完成精简版本。状态机执行代码如下：

```js
module.exports.parseHTML = function parseHTML(html) {
    // 初始状态：data
    let state = data;
    for(let c of html) {
        state = state(c);
    }
    // 结束状态可以使用 Symbol 避免冲突
    state = state(EOF);
}
```



### 1.3 解析标签

- HTML 标签：开始标签、结束标签、自封闭标签
- 暂时忽略属性

```js
function data(c) {
    if(c === '<') {
        return tagOpen;
    } else if(c === EOF) {
        emit({
            type: "EOF"
        });
        return ;
    } else {
        return data;
    }
}

function tagOpen(c) {
    if(c === "/") {
        return endTagOpen;
    } else if(c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: "startTag",
            tagName: ""
        }
        return tagName(c);
    } else {
        return ;
    }
}

function endTagOpen(c) {
    if(c.match(/^[a-zA-Z]$/)) {
        return tagName(c);
    } else if(c === ">") {

    } else if(c === EOF) {

    } else {

    }
}

function tagName(c) {
    // 遇到空格，说明后面要跟属性
    if(c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if(c === "/") {
        return selfClosingStartTag;
    } else if(c.match(/^[a-zA-Z]$/)) {
        currentToken.tagName += c;
        return tagName;
    } else if(c === ">") {
        return data;
    } else {
        return tagName;
    }
}

function selfClosingStartTag(c) {
    // 已有一个 "/" 时只有 ">" 有效，其余都是报错的逻辑
    if(c === ">") {
        currentToken.isSelfClosing = true;
        return data;
    } else if(c === "EOF") {

    } else {

    }
}

// 暂不处理属性
function beforeAttributeName(c) {
    if(c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if(c === ">") {
        return data; // 终止
    } else if(c === "=") {
        return beforeAttributeName;
    } else {
        return beforeAttributeName;
    }
}
```



### 1.4 创建元素

- 在状态机中，除了状态迁移，还需要加入业务逻辑（创建 token，并把字符加到 token 上）
- 标签结束状态提交标签 token

使用全局变量 `currentToken` 存储 token -> 当标签结束时将其提交（`emit`）

```js
function emit(token) {
    // 处理 token
}
```



### 1.5 处理属性

- 属性分为单引号、双引号、无引号三种写法，因此需要较多状态处理
- 处理属性的方式与标签类似
- 属性结束时，我们把属性加到标签  token 上

状态：`beforeAttributeName`、`attributeName`、`beforeAttributeValue`、`doubleQuotedAttributeValue`、`singleQuotedAttributeValue`、`afterQuotedAttributeValue`、`UnquotedAttributeValue`

```js
function beforeAttributeName(c) {
    if(c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if(c === "/" || c === ">" || c === EOF) {
        return afterAttributeName(c);
    } else if(c === "=") {

    } else {
        currentAttribute = {
            name: "",
            value: ""
        }
        return attributeName(c);
    }
}

function attributeName(c) {
    if(c.match(/^[\t\n\f ]$/) || c === "/" || c === ">" || c === EOF) {
        return afterAttributeName(c);
    } else if(c === "=") {
        return beforeAttributeValue;
    } else if(c === "\u0000") {

    } else if(c === "\"" || c === "\'" || c === "<") {

    } else {
        currentAttribute.name += c;
        return attributeName;
    }
}

function beforeAttributeValue(c) {
    if(c.match(/^[\t\n\f ]$/) || c === "/" || c === ">" || c === EOF) {
        return beforeAttributeValue;
    } else if(c === "\"") {
        return doubleQuotedAttributeValue;
    } else if(c === "\'") {
        return singleQuotedAttributeValue;
    } else if(c === ">") {

    } else {
        return UnquotedAttributeValue(c);
    }
}

function doubleQuotedAttributeValue(c) {
    if(c === "\"") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if(c === "\u0000") {

    } else if(c === EOF) {

    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function singleQuotedAttributeValue(c) {
    if(c === "\'") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if(c === "\u0000") {

    } else if(c === EOF) {

    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function afterQuotedAttributeValue(c) {
    if(c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if(c === "/") {
        return selfClosingStartTag;
    } else if(c === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if(c === EOF) {

    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function UnquotedAttributeValue(c) {
    if(c.match(/^[\t\n\f ]/)) {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName;
    } else if(c === "/") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag;
    } else if(c === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if(c === "\u0000") {

    } else if(c === "\'" || c === "'" || c === "<" || c === "=" || c === "`") {

    } else if(c === EOF) {

    } else {
        currentAttribute.value += c;
        return UnquotedAttributeValue;
    }
}
```



### 1.6 用 token 构建 DOM 树

- 从标签构建 DOM 树的基本技巧是使用栈
- 遇到开始标签时创建元素并入栈，遇到结束时出栈
- 自封闭节点可视为入栈后立刻出栈

```js
// 初始化一个 document，以便最后获取 DOM（良好配对的标签会全部弹出栈）
let stack = [{type: "document", children: []}];

function emit(token) {
    let top = stack[stack.length - 1];

    if(token.type === "startTag") {
        let element = {
            type: "element",
            children: [],
            attributes: []
        };

        element.tagName = token.tagName;

        for(let p in token) {
            if(p !== "type" && p !== "tagName")
                element.attributes.push({
                    name: p,
                    value: token[p]
                });
        }

        top.children.push(element);
        element.parent = top;

        if(!token.isSelfClosing)
            stack.push(element);
    } else if(token.type === "endTag") {
        if(top.tagName !== token.tagName) {
            throw new Error("Tag start end doesn't match!");
        } else {
            stack.pop();
        }
        currentTextNode = null;
    }
}
```



### 1.7 将文本节点添加到 DOM 树

- 文本节点与自封闭标签处理类似
- 多个文本节点需要合并

```js
// emit 中的逻辑
// endTag 时清空文本节点
currentTextNode = null;
if(token.type === "text") {
    if(currentTextNode === null) {
        currentTextNode = {
            type: "text",
            content: ""
        }
        top.children.push(currentTextNode);
    }
    currentTextNode.content += token.content;
}
```



## 2 CSS 计算

### 2.1 收集 CSS 规则

- 遇到 style 标签时，把 CSS 规则保存起来
- 调用 CSS Parser（`npm install css`） 分析 CSS 规则
- 需要仔细研究此库，分析 CSS 规则的格式

```js
if(token.type === "endTag") {
    if(top.tagName !== token.tagName) {
        throw new Error("Tag start end doesn't match!");
    } else {
        // 遇到 style 标签时执行添加 CSS 规则的操作
        if(top.tagName === "style") {
            addCSSRules(top.children[0].content);
        }
        stack.pop();
    }
    currentTextNode = null;
}
```



```js
let rules = [];
function addCSSRules(text) {
    // 注意 ast 的结构
    let ast = css.parse(text);
    rules.push(...ast.stylesheet.rules);
}
```



### 2.2 添加调用

- 创建元素后，立即计算 CSS
- 理论上，当我们分析一个元素时，所有 CSS 规则已经收集完毕
- 在真实浏览器中，可能遇到写在 body 的style 标签，需要重新 CSS 计算的情况，这里我们忽略

```js
function computeCSS(element) {
    // 计算元素对应的 CSS
}
```

调用 computeCSS 的时机是 `startTag` 入栈时（元素获取了所有属性后）。

### 2.3 获取父元素序列

- 在 computeCSS 函数中，我们必须知道元素的所有父元素才能判断元素与规则是否匹配
- 从上一步骤的 stack 可以获取本元素所有的父元素
- 因为我们首先获取的是“当前元素”（`div div #myid`，从 #myid 向上匹配才是高效的），所以我们获得和计算父元素匹配的顺序是从内向外

```js
function computeCSS(element) {
    // 获取父元素序列，slice 不改变原数组，相当于复制了一遍
    // stack 是父在前子在后，reverse 后父在后子在前，遍历时就能逐级向外
    let elements = stack.slice().reverse();
}
```



### 2.4 选择器与元素的匹配

- 选择器也要从当前元素向外排列
- 复杂选择器拆成复合选择器，用循环匹配父元素队列

```js
function computeCSS(element) {
    let elements = stack.slice().reverse();
    if(!element.computedStyle)
        element.computedStyle = {};

    for(let rule of rules) {
        let selectorParts = rule.selectors[0].split(" ").reverse();

        if(!match(element, selectorParts[0]))
            continue;

        let matched = false;
        let j = 1;
        for(let i = 0; i < elements.length; i++){
            if(match(elements[i], selectorParts[j])) {
                j++;
            }
        }
        if(j >= selectorParts.length)
            matched = true;

        if(matched) {
            // 生成 computed 属性
        }
    }
}
```



### 2.5 计算选择器与元素匹配

- 根据选择器的类型和元素属性，计算是否与当前元素匹配
- 此处只处理了三种简单选择器
- 附加题：实现复合选择器和支持空格的 Class 选择器

```js
function match(element, selector) {
    if(!selector || !element.attributes)
        return false;

    // 处理复合选择器
    let simpleSelectors = selector.split(/(?=[#.])/);
    for(let simpleSelector of simpleSelectors) {
        if(simpleSelector.charAt(0) === "#") {
            let attr = element.attributes.filter(attr => attr.name === "id")[0];
            if(!attr || attr.value !== simpleSelector.replace("#", ''))
                return false;
        } else if(simpleSelector.charAt(0) === ".") {
            let attr = element.attributes.filter(attr => attr.name === "class")[0];
            // 处理带空格的 class
            let classes = attr.value.split(" ");
            if(!attr) return false;
            let hasClass = false;
            let target = simpleSelector.replace(".", "");
            for(let cls of classes) {
                if(cls === target) hasClass = true;
            }
            if(!hasClass) return false;
        } else {
            if(element.tagName !== simpleSelector)
                return false;
        }
    }
    return true;
}
```



关于 split 分割的用法：

- "1、2、3".split("、") == ["1", "2", "3"]

- "1、2、3".split(/(、)/g) == ["1", "、", "2", "、", "3"]

- "1、2、3".split(/(?=、)/g) == ["1", "、2", "、3"]

- "1、2、3".split(/(?!、)/g) == ["1、", "2、", "3"]   // 只适用于分割单个字符

- "1、2、3".split(/(.*?、)/g) == ["", "1、", "", "2、", "3"]



### 2.6 生成 computed 属性

- 一旦选择匹配，就应用声明到元素上，形成 computedStyle

```js
if(matched) {
    let computedStyle = element.computedStyle;
    for(let declaration of rule.declarations) {
        if(!computedStyle[declaration.property])
            computedStyle[declaration.property] = {}
        computedStyle[declaration.property].value = declaration.value;
    }
    console.log(element.computedStyle);
}
```



### 2.7 specificity 的计算逻辑

specificity 一般翻译为优先级，但其实优先级是 priority，specificity 的原意是 “特征、专一性”，也就是 **“专指的程度”**。

- CSS 规则根据 specificity 和后来优先规则覆盖
- specificity 是个四元组，越左边权重越高（最新的 CSS Selector 规范实际上是三元组，内联被独立了出去）
- 一个 CSS 规则的 specificity 根据包含的简单选择器相加而成



优先级四元组计算：

```js
function specificity(selector) {
    let p = [0, 0, 0, 0];
    let selectorParts = selector.split(" ");
    for(let compoundPart of selectorParts) {
        // 解析复合选择器
        let simpleParts = compoundPart.split(/(?=[#.])/);
        for(let simplePart of simpleParts) {
            if(simplePart.charAt(0) === "#") {
                p[1]++;
            } else if(simplePart.charAt(0) === ".") {
                p[2]++;
            } else {
                p[3]++;
            }
        }
    }
    return p;
}
```

比较函数，从前到后比较各个位：

```js
function compare(sp1, sp2) {
    if(sp1[0] - sp2[0])
        return sp1[0] - sp2[0];
    if(sp1[1] - sp2[1])
        return sp1[1] - sp2[1];
    if(sp1[2] - sp2[2])
        return sp1[2] - sp2[2];

    return sp1[3] - sp2[3];
}
```

加上优先级比较，确定 computed style：

```js
if(matched) {
    let sp = specificity(rule.selectors[0]);
    let computedStyle = element.computedStyle;
    for(let declaration of rule.declarations) {
        if(!computedStyle[declaration.property])
            computedStyle[declaration.property] = {}

        if(!computedStyle[declaration.property].specificity) {
            computedStyle[declaration.property].value = declaration.value;
            computedStyle[declaration.property].specificity = sp;
        } else if(compare(computedStyle[declaration.property].specificity, sp) < 0) {
            computedStyle[declaration.property].value = declaration.value;
            computedStyle[declaration.property].specificity = sp;
        }
    }
    console.log(element.computedStyle);
}
```

