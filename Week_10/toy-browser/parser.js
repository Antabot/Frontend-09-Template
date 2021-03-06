const css = require('css');
const EOF = Symbol("EOF");
const layout = require("./layout.js");

let currentToken = null;
let currentAttribute = null;

let stack = [{type: "document", children: []}];
let currentTextNode = null;

let rules = [];
function addCSSRules(text) {
    let ast = css.parse(text);
    rules.push(...ast.stylesheet.rules);
}

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
            if(!attr) return false;
            // 处理带空格的 class
            let classes = attr.value.split(" ");
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

function compare(sp1, sp2) {
    if(sp1[0] - sp2[0])
        return sp1[0] - sp2[0];
    if(sp1[1] - sp2[1])
        return sp1[1] - sp2[1];
    if(sp1[2] - sp2[2])
        return sp1[2] - sp2[2];

    return sp1[3] - sp2[3];
}

function computeCSS(element) {
    // 获取父元素序列，slice 不改变原数组，相当于复制了一遍
    // 元素匹配 CSS 时是从当前元素向父元素逐级寻找（考虑 div div #myid），因此需要 reverse 
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
    }
}

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

        computeCSS(element);

        top.children.push(element);
        // element.parent = top; 不记录 parent，避免循环引用

        if(!token.isSelfClosing)
            stack.push(element);

        currentTextNode = null;
    } else if(token.type === "endTag") {
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
    } else if(token.type === "text") {
        if(currentTextNode === null) {
            currentTextNode = {
                type: "text",
                content: ""
            }
            top.children.push(currentTextNode);
        }
        currentTextNode.content += token.content;
    }
}

function data(c) {
    if(c === '<') {
        return tagOpen;
    } else if(c === EOF) {
        emit({
            type: "EOF"
        });
        return ;
    } else {
        emit({
            type: "text",
            content: c
        });
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
        emit(currentToken);
        return data;
    } else {
        return tagName;
    }
}

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


function selfClosingStartTag(c) {
    // 已有一个 "/" 时只有 ">" 有效，其余都是报错的逻辑
    if(c === ">") {
        currentToken.isSelfClosing = true;
        emit(currentToken);
        return data;
    } else if(c === "EOF") {

    } else {

    }
}

function endTagOpen(c) {
    if(c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: "endTag",
            tagName: ""
        }
        return tagName(c);
    } else if(c === ">") {

    } else if(c === EOF) {

    } else {

    }
}

function afterAttributeName(c) {
    if(c.match(/^[\t\n\f ]$/)) {
        return afterAttributeName;
    } else if(c === "/") {
        return selfClosingStartTag;
    } else if(c === "=") {
        return beforeAttributeValue;
    } else if(c === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if(c === EOF) {

    } else {
        currentToken[currentAttribute.name] = currentAttribute.value;
        currentAttribute = {
            name: "",
            value: ""
        };
        return attributeName(c);
    }
}

module.exports.parseHTML = function parseHTML(html) {
    let state = data;
    for(let c of html) {
        state = state(c);
    }
    state = state(EOF);
    return stack[0];
}