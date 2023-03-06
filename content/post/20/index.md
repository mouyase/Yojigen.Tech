---
title: Web前端开发面试题整理
date: 2021-03-30 15:39:00
categories: 
  - 分享
  - 开发
tags:
  - 前端
  - JavaScript
keywords: 
  - 面试题
  - 前端
  - ES6
  - JavaScript
---

## 导语
研究面试题是一件很有意义的事情，面试题里很多的知识点或许并不完全在工作中会用到，但是经常会涉及到一些底层知识，这些知识如果可以理解领悟的话，对程序设计还是会有不少的帮助的，这里就把之前见到的一些面试问题整理一下放在这里，然后我也可以一边分享一边学习。
**如果有小伙伴发现有哪些问题我的答案有误，欢迎指正**。



## ES6 相关
### ES6 的新特性有哪些

#### const 和 let 变量声明

在 ES6 之前，变量声明都是采用的`var`，而`var`有一个特型叫做**作用域提升**，就是你无论在哪里声明这个变量，在运行时都会把这个声明提升到代码最前面执行，然后这样就会导致逻辑的混乱，而`let`和`const`解决了这个问题，同时这两者都是**块级作用域**，只会在一个花括号`{}`内生效，可以很好的避免作用域混乱产生逻辑错误。
一般情况下，使用`let`表示变量，用`const`表示常量。

```javascript
var a = 1;
b = 2;
console.log(b); // 输出 2
function test(){
	let c = 3;
	const d = 4;
	console.log(a); // 输出 1
	console.log(b); // 输出 0，这里因为是在下面的 var b = 0 后面执行，所以 b 被赋值 0
	console.log(c); // 输出 3
	console.log(d); // 输出 4
}
var b = 0;
// 这里看做 var b 和 b = 0，var b 被提升到作用域顶部
// 所以 b 会被先赋值 2 ，在这里再被赋值 0
test()
console.log(a); // 输出 1
console.log(b); // 输出 0
console.log(c); // 报错 c 未定义
console.log(d); // 报错 d 未定义
```

#### 模板字符串
在 ES6 之前，我们往往这么处理模板字符串:

```javascript
$("body").html("This demonstrates the output of HTML \
content to the page, including student's\
" + name + ", " + seatNumber + ", " + sex + " and so on.");
```

里面充满了`+`，`"`，`\\`，可读性和可维护性就不是很好。
但是在 ES6 之后，我们可以这样来处理模板字符串:

```javascript
$("body").html(`This demonstrates the output of HTML content to the page, 
including student's ${name}, ${seatNumber}, ${sex} and so on.`);
```

<p>用<code>``</code>来包裹模板字符串。用<code>${}</code>来包裹变量。可以简单清晰的处理模板字符串。</p>

#### 箭头函数
这个本质就是语法糖了，不用写`function`，如果是直接返回一个值或者表达式的场合，还可以省略掉`return`和`{}`，而且可以继承当前上下文的`this`对象，用起来会比较方便。

```javascript
// ES6 之前
var add = function (a, b) {
    return a + b;
};
// ES6 之后使用箭头函数
var add = (a, b) => a + b;

// ES6 之前
[1,2,3].map((function(x){
    return x + 1;
}).bind(this));
// ES6 之后使用箭头函数
[1,2,3].map(x => x + 1);
```

#### 函数参数的默认值

在 ES6 之前，函数的参数是不能直接设置默认值的，我们只能通过判断参数是否存在，再对其进行赋值，而 ES6 简化了这一点，可以直接赋初始值了。

```javascript
// ES6 之前
function who(name) {
    if (!name) {
        name = '张三'
    }
    console.log(name);
}

// ES6 之后
function who(name = '张三') {
    console.log(name);
}

who('李四'); // 输出 李四
who(); // 输出 张三
```

## Vue相关
### 谈一谈Vue.nextTick()函数
Vue中是异步更新DOM的，Vue.nextTick()是Vue框架提供给我们的DOM更新后的回调函数，当数据变化，DOM更新后，就会执行该函数，常见于需要处理DOM场合，例如。
```javascript
// 改变数据
vm.message = 'changed'

// 想要立即使用更新后的DOM。这样不行，因为设置message后DOM还没有更新
console.log(vm.$el.textContent) // 并不会得到'changed'

// 这样可以，nextTick里面的代码会在DOM更新后执行
Vue.nextTick(function(){
    console.log(vm.$el.textContent) // 可以得到'changed'
})
```