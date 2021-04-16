# 学习笔记

本周开始学习浏览器工作原理。

## 1 浏览器总论

### 1.1 浏览器渲染流程

![渲染流程](https://img-blog.csdnimg.cn/20210414193221829.png#pic_center)

## 2 有限状态机

### 2.1 什么是有限状态机？

- 每一个状态都是一个机器（每个机器是相互解耦的，因此可忽略其它状态机的逻辑）
  - 在每一个机器里，可以做计算、存储、输出...
  - 所有机器接受的输入是一致的
  - 状态机的每一个机器本身没有状态，如果用函数表示，应该是纯函数（无副作用）
- 每一个机器知道下一个状态
  - 每个机器都有确定的下一个状态（Moore 状态机）
  - 每个机器根据输入决定下一个状态（Mealy 状态机，用途较广）

### 2.2 JS 中如何实现有限状态机（Mealy）？

```js
// 每个函数是一个状态
function state(input) // 函数参数就是输入
{
    // 逻辑代码
    return next; // 返回值作为下一个状态
}

// 调用方式
while(input) {
    // 获取输入
    state = state(input); // 把状态机的返回值作为下一个状态
}

```

### 2.3 有限状态机的优势如何体现？

**Example 1:** 在一个字符串中找到字符 'a'。

常规思路：

```js
function match(string) {
    for(let c of string) {
        if(c === 'a') return true;
    }
    return false;
}

match("I am a groot")
```

**Example 2:** 在一个字符串中找到字符 'ab'（不能使用正则表达式）

```js
function match(string) {
    let foundA = false;
    for(let c of string) {
        if(c === 'a')
            foundA = true;
        else if(foundA && c === 'b')
            return true;
        else
            foundA = false;
    }
    return false;
}

console.log(match("I acbm groot"));
```

**Example 3:** 在一个字符串中找到字符 'abcdef'（不能使用正则表达式）

```js
function match(string) {
    let foundA = false;
    let foundB = false;
    let foundC = false;
    let foundD = false;
    let foundE = false;
    for(let c of string) {
        if(c === 'a') 
            foundA = true;
        else if(foundA && c === 'b') {
            if(!foundB) foundB = true;
            else {
                foundA = false;
                foundB = false;
            }
        }
        else if(foundB && c === 'c') {
            if(!foundC) foundC = true;
            else {
                foundA = false;
                foundB = false;
                foundC = false;
            }
        }
        else if(foundC && c === 'd') {
            if(!foundD) foundD = true;
            else {
                foundA = false;
                foundB = false;
                foundC = false;
                foundD = false;
            }
        }
        else if(foundD && c === 'e') {
            if(!foundE) foundE = true;
            else {
                foundA = false;
                foundB = false;
                foundC = false;
                foundD = false;
                foundE = false;
            }
        }
        else if(foundE && c === 'f')
            return true;
        else {
            foundA = false;
            foundB = false;
            foundC = false;
            foundD = false;
            foundE = false;
        }
    }
  return false;
}

console.log('abbcdef');
```

可以看到，用常规解法到这里代码已经不太容易阅读。

如何使用状态机解 Example 3？其实每找到一个字符，就可以认为状态发生了一次改变，下次处理的逻辑是独立的。可以将代码修改为如下形式：

```js
function match(string) {
    let state = start;
    for(let c of string) {
        state = state(c);
    }
    return state === end;
}

function start(c) {
    if(c === 'a')
        return foundA;
    else
        return start;
}

// trap
function end(c) {
    return end;
}

function foundA(c) {
    if(c === 'b')
        return foundB;
    else
        // reconsume，重新从此位开始判断
        return start(c);
}

function foundB(c) {
    if(c === 'c')
        return foundC;
    else
        return start(c);
}

function foundC(c) {
    if(c === 'd')
        return foundD;
    else
        return start(c);
}

function foundD(c) {
    if(c === 'e')
        return foundE;
    else
        return start(c);
}

function foundE(c) {
    if(c === 'f')
        return end;
    else
        return start(c);
}

console.log(match('aabcdef'));
```

**Example 4：**在一个字符串中找到字符 'abcabx'

```js
function match(string) {
    let state = start;
    for(let c of string) {
        state = state(c);
    }
    return state === end;
}

function start(c) {
    if(c === 'a')
        return foundA;
    else
        return start;
}

// trap
function end(c) {
    return end;
}

function foundA(c) {
    if(c === 'b')
        return foundB;
    else
        return start(c);
}

function foundB(c) {
    if(c === 'c')
        return foundC;
    else
        return start(c);
}

function foundC(c) {
    if(c === 'a')
        return foundABCA;
    else
        return start(c);
}

function foundA2(c) {
    if(c === 'b') 
        return foundABCAB;
    else
        return start(c);
}

function foundB2(c) {
    if(c === 'x') 
        return end;
    else
        return foundB(c); // reconsume
}


console.log(match('abcabcabx'));
```

## 3 HTTP 请求

### 3.1 HTTP 协议解析

#### 3.1.1 网络分层模型

![网络模型](https://img-blog.csdnimg.cn/20210415205039640.png#pic_center)

#### 3.1.2 TCP 与 IP

- 流（无明显分割单位，只考虑前后顺序）
- 端口（应用对应端口）
- require('net')
- 包（可大可小）
- IP 地址
- libnet/libpcap，node 调用的两个底层库（c++），libnet 负责构造 IP 包并发送，labpcap 负责从网卡抓所有的 IP 包

#### 3.1.3 HTTP Request

HTTP 是文本型协议（与二进制协议相对），所有内容都是字符，比如 1，会被用 Unicode 编码值传递。也就是传输 HTTP 时 TCP 里的内容都是字符。

一个 HTTP 请求包括如下内容：

- request line
- headers
- body，由 content-type 决定格式，不同 content-type 使用不同的分割字符，为避免冲突，换行一般用 \r\n

#### 3.1.4 HTTP Response

- status line，如 `HTTP/1.1 200 OK`
- headers，同 request
- body，格式由 Content-Type 决定。node 默认为 trunked body。如

```html
26 // 16 进制字符，每一行前都有，表示 trunk 长度，用于切分 body 内容
<html><body>Hello World<body></html>
0 // 16 进制 0，表示结束
```

### 3.2 HTTP 实现

#### 3.2.1 Request

- 设计一个 HTTP 请求的类，通过构造器收集必要信息
- Content-Type 是必要字段，要有默认值
- body 是 k-v 格式
- 不同 content-type 影响 body 的格式
- 需要正确的 Content-Length

#### 3.2.2 send()

- 设计 send 函数，把请求真实发送到服务器
- send 函数是异步的，因此返回一个 Promise
- 设计支持已有的 connection 或者自己新建 connection
- 收到数据传给 parser
- 根据 parser 状态 resolve 

#### 3.2.3 ResponseParser

- Response 必须分段构造，因此需要用 ResponseParser “装配”
- ResponseParser 分段处理 ResponseText，可以用状态机分析文本结构

#### 3.2.4 BodyParser

- Response 的 body 可能根据 Content-Type 有不同的结构，因此我们会采用子 Parser 的结构专门处理 body
- 以 TrunkedBodyParser 为例，用状态机处理 body 格式（除了 trunked body 还有很多其它类型）

