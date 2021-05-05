# 学习笔记

本周完成浏览器工作原理的学习，主要包括页面的排版和渲染两个部分。

## 1 排版

CSS 常见的布局（排版）模式包括：

- 正常流
- flex，接近设计软件的思维模式
- grid，功能更强大
- Houdini

这里我们采用 flex 布局，因为相对容易实现，且能力还可以。（CSS 规范中有对实现方式的描述）



![flex](https://img-blog.csdnimg.cn/20210426180014797.png)



通过 flex 容器的属性，可以控制容器内部的整体布局表现：

- `flex-direction`，设置主轴（main-axis）方向
- `flex-wrap` ，设置换行行为，相当于设置了交叉轴（cross-axis）方向，交叉轴与主轴垂直，主轴是上下方向交叉轴就是左右方向
- `flex-flow`，同时设置主轴和交叉轴方向
- `justify-content`，项在主轴的对齐方式，还是要看主轴方向，水平时就对应左右对齐居中对齐两端对齐等
- `align-items`，项在交叉轴上的对齐方式，主轴水平时就对应上下对齐垂直居中垂直两端等，这两项结合 word 的排版布局就很容易理解
- `align-content`，设置多行时的对齐方式

而 flex 项的属性则主要用于控制单个项的行为：

 - `order`，设置排列顺序，数值越小越靠前，默认为 0，数值相同时则比较在文档中的顺序
 - `flex-grow` ，控制项的伸展行为，这是一个相对数值，比如在有额外空间时，值为 2 的项就会拉伸为值为 1 的项的两倍
 - `flex-shrink`，控制项的收缩行为，同为相对数值，默认为 1，表示自动收缩，0 表示不收缩。值为 2 的项收缩后仍是值为 1 的项的两倍大，而不是变得更小
 - `flex-basis`，项的基础大小，浏览器会根据这个大小判断是否需要伸缩
 - `flex`，综合前面三种，取值类似 `1 1 auto` 或 `0 0 auto`，`1 1 auto` 可以简写为 `auto`，`0 0 auto` 可以简写为 none
 - `align-self` 可以为项设置单独的对齐方式，覆盖容器的 `align-items` 属性

### 1.1 根据浏览器属性进行排版

flex 需要知道子元素，因此应在结束标签之前调用 layout。

```js
...
if(token.type === "endTag") {
    if(top.tagName !== token.tagName) {
        throw new Error("Tag start end doesn't match!");
    } else {
        // 遇到 style 标签时执行添加 CSS 规则的操作
        if(top.tagName === "style") {
            addCSSRules(top.children[0].content);
        }
        layout(top);
        stack.pop();
    }
    currentTextNode = null;
}
```

在 `layout.js` 中，首先预处理属性值

```js
function getStyle(element) {
    if(!element.style)
        element.style = {};

    for(let prop in element.computedStyle) {
        // var p = element.computedStyle.value;
        element.style[prop] = element.computedStyle[prop].value;

        if(element.style[prop].toString().match(/px$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }
        if(element.style[prop].toString().match(/^[0-9\.]+$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }
    }
    return element.style;
}
```

取出 flex 元素，设置默认属性，并把 left、right、top、bottom 等属性抽象成 main 和 cross 的相关属性，以方便后续的处理。

```js
function layout(element) {
    if(!element.computedStyle)
        return ;

    let elementStyle = getStyle(element);

    // 只处理 flex
    if(elementStyle.display !== "flex")
        return
        
    // 过滤非 element 节点（文本节点）
    let items = element.children.filter(e => e.type === "element");

    // 支持 order 属性
    items.sort(function(a, b) {
        return (a.order || 0) - (b.order || 0);
    });

    let style = elementStyle;

    ["width", "height"].forEach(size => {
        if(style[size] === "auto" || style[size] === "") {
            style[size] = null; // 设置为 null 方便判断
        }
    })

    // 设置默认值
    if(!style.flexDirection || style.flexDirection === "auto")
        style.flexDirection = 'row';
    if(!style.alignItems || style.alignItems === "auto")
        style.alignItems = "stretch";
    if(!style.justifyContent || style.justifyContent === "auto")
        style.justifyContent = "flex-start"
    if(!style.flexWrap || style.flexWrap === "auto")
        style.flexWrap = "nowrap";
    if(!style.alignContent || style.alignContent === "auto")
        style.alignContent = "stretch";

    let mainSize, mainStart, mainEnd, mainSign, mainBase, crossSize,
        crossStart, crossEnd, crossSign, crossBase;
    if(style.flexDirection === "row") {
        mainSize = "width";
        mainStart = "left";
        mainEnd = "right";
        mainSign = +1; // 代表符号正负，加 + 号特别强调是正 1
        mainBase = 0; // 初始值，和 mainSign 是一对

        crossSize = "height";
        crossStart = "top";
        crossEnd = "bottom";
    }

    if(style.flexDirection === "row-reverse") {
        mainSize = "width";
        mainStart = "right";
        mainEnd = "left";
        mainSign = -1;
        mainBase = style.width; // 从最右侧起算

        crossSize = "height";
        crossStart = "top";
        crossEnd = "bottom";
    }

    if(style.flexDirection === "column") {
		...
    }

    if(style.flexDirection === "column-reverse") {
		...
    }

    if(style.flexWrap === "wrap-reverse") {
        ...
    } else {
        crossBase = 0;
        crossSign = 1;
    }
}
```

### 1.2 收集元素进行

分行：

- 根据主轴尺寸，把元素分进行
- 若设置了 no-wrap，则强行分配进第一行
- 若父元素没有尺寸，则由子元素将父元素撑开，isAutoMainSize 设为 true

![flex 分行](https://img-blog.csdnimg.cn/20210426211253694.png)



```js
let isAutoMainSize = false;
// 若父元素没有尺寸，则由子元素将父元素撑开，子元素不会超出父元素，isAutoMainSize 设为 true
if(!style[mainSize]) {
    elementStyle[mainSize] = 0;
    for(let i = 0; i < items.length; i++) {
        let item = items[i];
        let itemStyle = getStyle(item);
        if(itemStyle[mainSize] !== null || itemStyle[mainSize] !== void 0)
            elementStyle[mainSize] = elementStyle[mainSize] + itemStyle[mainSize];
    }
    isAutoMainSize = true;
}

let flexLine = [];
let flexLines = [flexLine];

let mainSpace = elementStyle[mainSize];
let crossSpace = 0;

for(let i = 0; i < items.length; i++) {
    let item = items[i];
    let itemStyle = getStyle(item);

    if(itemStyle[mainSize] === null) {
        itemStyle[mainSize] = 0;
    }

    if(itemStyle.flex) {
        flexLine.push(item);
    } else if(style.flexWrap === "nowrap" && isAutoMainSize) {
        mainSpace -= itemStyle[mainSize];
        if(itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0))
            crossSpace = Math.max(crossSpace, itemStyle[crossSize]); // 一行有多高取决于最高的元素有多高
        flexLine.push(item);
    } else {
        if(itemStyle[mainSize] > style[mainSize]) {
            itemStyle[mainSize] = style[mainSize]; // 元素比父元素大，则压缩
        }
        if(mainSpace < itemStyle[mainSize]) { // 主轴空间不足，换行
            flexLine.mainSpace = mainSpace; // 存储主轴剩余空间，可能用于排版
            flexLine.crossSpace = crossSpace; 
            flexLine = [item];
            flexLines.push(flexLine);
            mainSpace = style[mainSize];
            crossSpace = 0;
        } else {
            flexLine.push(item);
        }
        if(itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0))
            crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
        mainSpace -= itemStyle[mainSize];
    }
}
```



### 1.3 计算主轴

- 找出所有 flex 元素
- 把主轴方向的剩余尺寸按比例分配给这些元素
- 若剩余空间为负数，所有 flex 元素为 0，等比压缩剩余函数

```js
flexLine.mainSpace = mainSpace; 

if(style.flexWrap === "nowrap" || isAutoMainSize) {
    flexLine.crossSpace = (style[crossSize] !== undefined) ? style[crossSize] : crossSpace;
} else {
    flexLine.crossSpace = crossSpace;
}

// 如果 mainSpace < 0，对元素进行等比压缩（只会出现在单行）
if(mainSpace < 0) {
    let scale = style[mainSize] / (style[mainSize] - mainSpace);
    let currentMain = mainBase;
    for(let i = 0; i < items.length; i++) {
        let item = items[i];
        let itemStyle = getStyle(item);

        if(itemStyle.flex) {
            itemStyle[mainSize] = 0;
        }

        itemStyle[mainSize] = itemStyle[mainSize] * scale;

        // 计算元素的起止位置
        itemStyle[mainStart] = currentMain;
        itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
        currentMain = itemStyle[mainEnd];
    }
} else {
    flexLines.forEach(function(items) {
        let mainSpace = items.mainSpace;
        let flexTotal = 0;
        for(let i = 0; i < items.length; i++) {
            let item = items[i];
            let itemStyle = getStyle(item);

            if((itemStyle.flex !== null) && (itemStyle.flex) !== (void 0)) {
                flexTotal += itemStyle.flex;
                continue;
            }
        }

        // 如果有 flex 元素，则永远会占满一行
        if(flexTotal > 0) {
            let currentMain = mainBase;
            for(let i = 0; i < items.length; i++) {
                let item = items[i];
                let itemStyle = getStyle(item);

                if(itemStyle.flex) {
                    itemStyle[mainSize] = (mainSpace / flexTotal) * itemStyle.flex; // 按比例划分占有空间
                }
                itemStyle[mainStart] = currentMain;
                itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                currentMain = itemStyle[mainEnd];
            }
        } else { // 没有 flex 元素，根据 justifyContent 计算
            if(style.justifyContent === "flex-start") {
                let currentMain = mainBase;
                let step = 0; // step 代表间隙
            }
            if(style.justifyContent === "flex-end") {
                let currentMain = mainSpace * mainSign + mainBase;
                let step = 0;
            }
            if(style.justifyContent === "space-between") {
                let step = mainSpace / (items.length - 1) * mainSign;
                let currentMain = mainBase;
            }
            if(style.justifyContent === "space-around") {
                let step = mainSpace / items.length * mainSign;
                let currentMain = step / 2 + mainBase;
            }
            for(let i = 0; i < items.length; i++) {
                let item = items[i];
                itemStyle[mainStart, currentMain];
                itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                currentMain = itemStyle[mainEnd] + step;
            }
        }
    })
}
```

### 1.4 计算交叉轴

- 根据每一行中最大元素尺寸计算行高
- 根据行高 flex-align 和 item-align，确定元素具体位置

过程与主轴类似。

## 2 渲染

### 2.1 绘制单个元素

- 绘制依赖图形环境，选用 npm 包 images 简单实现，复杂的绘制可以使用 WebGL 等库
- 绘制在 viewport 进行
- 与绘制相关的属性： background-color、border、background-image 等

```js
function render(viewport, element) {
    if(element.style) {
        let img = images(element.style.width, element.style.height);

        if(element.style["background-color"]) {
            let color = element.style["background-color"] || "rgb(0, 0, 0)";
            color.match(/rgb\((\d+), ?(\d+), ?(\d+)\)/);
            img.fill(Number(RegExp.$1), Number(RegExp.$2), Number(RegExp.$3));
            viewport.draw(img, element.style.left || 0, element.style.top || 0);
        }
    }
}
```



```js
let viewport = images(800, 600); // 通过 viewport 绘制，提高性能
render(viewport, dom.children[0].children[3].children[1].children[3]); // 调用 render 绘制单个元素
viewport.save("./viewport.jpg"); // 将 viewport 保存为图片
```

### 2.2 绘制 DOM 树

- 递归调用子元素的绘制方法完成 DOM 树绘制
- 忽略一些不需要绘制的节点
- 实际浏览器中，文字绘制是难点，需要依赖字体库
- 实际浏览器中，还会对一些图层做 compositing，这里暂时忽略

```js
if(element.children) {
    for(let child of element.children) {
        render(viewport, child);
    }
}
```