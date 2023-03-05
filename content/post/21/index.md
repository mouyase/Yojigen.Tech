---
title: 关于Nginx的一些骚操作
date: 2021-07-12 10:32:00
categories: 
  - 技术
tags:
  - Nginx
keywords: 
  - Nginx
  - 反向代理
  - 前端跨域
---
前几天给服务器重装了个系统，用来反向代理一些接口，结果学会了几个骚操作，分享给大家。

## 反向代理使用了多个证书的网站
一上来属于是一个坑，我们都知道同一个IP可以被很多个域名指向，通过不同的域名来访问同一个IP的服务器，则是通过`header`里的`host`来判断是访问到哪个站点。但是这里面会有一种情况，就是这个站点是具有tls加密也就是https加密，同时这个站点配置了多个证书，这时候如果你直接代理的话，则会报证书错误，必须在`location`里添加`proxy_ssl_server_name on`，例如下面这样。
```nginx
proxy_set_header Host "www.example.com";
proxy_ssl_server_name on;
```
这样源站的服务器才能知道你是为了哪一个域名和证书而来，才回给你发放对应的证书。
注：其实这个就是SNI功能，某些网站的访问就是在这一部被屏蔽掉的。

## 前端跨域时的处理
前端跨域限制是浏览器的一种安全措施，叫做同源策略（Sameoriginpolicy），属于是浏览器的一种很基础的安全策略。在同源策略限制下，网页的JS会不允许访问协议、域名或者端口不同的内容和资源。但是有时候我们前端的代码可能会需要访问不同域名或者端口的接口，所以我们会使用Nginx来处理跨域问题。
一般情况下，我们在网站配置的`location`下面，增加下面两条，就可以允许服务器被跨域访问了。
```nginx
add_header Access-Control-Allow-Origin * always;
add_header Access-Control-Allow-Headers * always;
```
但是在做反向代理的时候，如果源站配置过同源限制，则需要再加上下面这两条。
```nginx
proxy_hide_header Access-Control-Allow-Origin;
proxy_hide_header Access-Control-Allow-Headers;
```
这两条的意思是丢弃掉源站的同源配置，同时你增加了新的配置，这样才能正确配置。
但是其实还有一个问题，就是浏览器会发送`method`为`options`的请求，用来判断是否可以接收跨域请求。
那既然我们已经允许了全部的跨域请求，我们就可以给`options`请求直接返回一个200告诉他可以。
```nginx
if ($request_method = "OPTIONS") {
	return 200;
}
```
由此一来我们就可以随便调用这个反向代理的接口了。

## 反向代理Url使用变量
反向代理时，有可能源网址并不是固定的，而是随着某些nginx的变量改变的，这种时候，就要在`proxy_pass`中拼接一个变量，像下面这样。
```nginx
set $name 'tom';
proxy_pass https://www.example.com/$name;
```
但是如果直接这样使用可能会报错，需要在`server`字段下，添加dns配置，如下。
```nginx
resolver 8.8.8.8;
```
这样才能在`proxy_pass`中拼接变量。

## 使用lua获取post请求的body
这是这次学到的最骚的一个操作，一般来说nginx是不能直接获取到`post`请求中的内容的，但是大家都知道lua是一种非常容易嵌入各种各样环境的语言，nginx中也是有嵌入lua可以使用的，所以我们可以通过lua来获取`post`和`body`。

首先如果想获取`body`的话，需要先在`server`字段中，添加如下配置。
```nginx
lua_need_request_body on;
```
这条配置代表了声明lua需要读取`request`和`body`。

之后我们在`location`下，添加如下配置。
```nginx
set $name '';
rewrite_by_lua_block {
	local post = ngx.req.get_post_args()
	ngx.var.name = post.name
}
proxy_pass https://www.example.com/$name;
```
首先先使用原生nginx语句，定义一个变量`name`，之后添加`rewrite_by_lua_block`代码段，这里因为我是需要在`proxy_pass`之前处理数据，所以使用了`rewrite_by_lua_block`，还有其他的节点可以使用，下面再说。
然后内部就是lua语句了，定义一个`post`变量，赋值为`ngx.req.get_post_args()`的返回值，这里就获取到了`body`的数据了，之后`ngx.var.name`这个变量就等于是之前我们使用`set`定义的变量`name`，所以这里就是给变量`name`赋值`post.name`，也就是我们请求上送过来的`body`中的`name`字段。
最后再把`name`变量拼接到`proxy_pass`后面。
于是就实现了，可以通过post请求中的`name`字段，来修改反向代理的地址了。

### 扩展内容——关于在nginx中使用lua
nginx提供了几个lua代码的处理阶段，具体如下表。

|处理阶段|可用范围|
|:-|:-|
|init_by_lua|http|
|set_by_lua|server, server if, location, location if|
|rewrite_by_lua|http, server, location, location if|
|access_by_lua|http, server, location, location if|
|content_by_lua|location, location if|
|header_filter_by_lua|http, server, location, location if|
|body_filter_by_lua|http, server, location, location if|
|log_by_lua|http, server, location, location if|
|timer|\*|

#### init_by_lua
在nginx重新加载配置文件时，运行里面lua脚本，常用于全局变量的申请。
例如lua_shared_dict共享内存的申请，只有当nginx重起后，共享内存数据才清空，这常用于统计。

#### set_by_lua
设置一个变量，常用与计算一个逻辑，然后返回结果
该阶段不能运行Output API、Control API、Subrequest API、Cosocket API

#### rewrite_by_lua
在access阶段前运行，主要用于rewrite

#### access_by_lua
主要用于访问控制，能收集到大部分变量，类似status需要在log阶段才有。
这条指令运行于nginx access阶段的末尾，因此总是在 allow 和 deny 这样的指令之后运行，虽然它们同属 access 阶段。

#### content_by_lua
阶段是所有请求处理阶段中最为重要的一个，运行在这个阶段的配置指令一般都肩负着生成内容（content）并输出HTTP响应。

#### header_filter_by_lua
一般只用于设置Cookie和Headers等
该阶段不能运行Output API、Control API、Subrequest API、Cosocket API

#### body_filter_by_lua
一般会在一次请求中被调用多次, 因为这是实现基于 HTTP 1.1 chunked 编码的所谓“流式输出”的。
该阶段不能运行Output API、Control API、Subrequest API、Cosocket API

#### log_by_lua
该阶段总是运行在请求结束的时候，用于请求的后续操作，如在共享内存中进行统计数据,如果要高精确的数据统计，应该使用body_filter_by_lua。
该阶段不能运行Output API、Control API、Subrequest API、Cosocket API

#### timer
可参考官方文档：[http://wiki.nginx.org/HttpLuaModule](http://wiki.nginx.org/HttpLuaModule "http://wiki.nginx.org/HttpLuaModule")

在lua代码中，可以使用`ngx.var.变量名`获取ngxin的原生变量，例如`ngx.var.name`等价于nginx中的`$name`，但是注意的一点是，这个变量必须预先在nginx中声明。

可以在不同的请求阶段后面增加`_block`，则可以使用代码块形式嵌入lua脚本，如下。

```nginx
set $name '';
rewrite_by_lua "
	ngx.var.name = 'tom'
"
rewrite_by_lua_block {
	ngx.var.name = "tom"
}
```