---
title: 部署一个Django的项目
date: 2020-01-21 23:30:00
categories: 
  - 技术
tags:
  - Python
keywords: 
  - 宝塔
  - 运维
  - Python
  - Djang
---

## 准备

首先准备好最新版本的Python

```shell
rm -rf /usr/local/python3
./configure --prefix=/usr/local/python3/
make && make install
rm -rf /usr/local/bin/python3
ln -s /usr/local/python3/bin/python3 /usr/local/bin/python3
rm -rf /usr/local/bin/pip3
ln -s /usr/local/python3/bin/pip3 /usr/local/bin/pip3
```

因为我用的是宝塔环境，宝塔自带了Nginx和Supervisor，所以不用单独安装了

然后把代码上传到opt目录，我的上传到了`YojigenAPI`目录下

这里我是使用了PyCharm的自带`Deployment`功能进行代码上传

首先打开PyCharm的菜单栏的Tools --> Deployment --> Configure

![](1.jpg)

在里面添加一个新的服务器，我添加的服务器命名为`AliyunHK`，输入好服务器的登陆信息

![](2.jpg)

然后到Mappings页面，添加一下文件夹对应的路径配置，我这里是将代码放到了服务器的`/opt/YojigenAPI`目录下

![](3.jpg)

最后到Excluded Paths页面，添加一个Local Path，忽略掉本地的venv虚拟环境文件夹

![](4.jpg)

最后点击PyCharm的菜单栏的Tools --> Deployment --> Upload to AliyunHK，就可以将代码推送到服务器上了

![](5.jpg)

## 环境配置

ssh登陆到服务器，来到项目目录下，先创建一个虚拟环境

```shell
virtualenv -p /usr/local/bin/python3 --no-site-packages venv
```

然后进入到虚拟环境里

```shell
source venv/bin/activate
```

之后恢复pip的包

```shell
pip install -r requirements.txt
```

注意这里安装了`gunicorn`，默认的Django项目是不会安装的

包都装完了，就可以退出虚拟环境了

```shell
deactivate
```

## 服务配置

先测试一下服务启动命令，10000是监听端口

```shell
venv/bin/gunicorn YojigenAPI.wsgi -b 0.0.0.0:10000
```

结果发现报错了，`The SECRET_KEY setting must not be empty.`，这个错误是项目配置文件找不到了，实际上是因为需要设置一下配置文件的环境变量才行，所以只要运行

```shell
venv/bin/gunicorn YojigenAPI.wsgi -b 0.0.0.0:10000 -e DJANGO_SETTINGS_MODULE="YojigenAPI.settings.prod"
```

之后再启动，如果没错那就没问题了

然而我又报错了，`SQLite 3.8.3 or later is required (found 3.7.17).`，这个问题是因为我用的是CentOS，系统自带的sqlite3版本太老，升级一下就可以了

```shell
./configure --prefix=/usr/local
make & make install
```

编译好了之后，执行一下这个，把/usr/local/lib添加到系统的链接库中

```shell
echo "/usr/local/lib" >> /etc/ld.so.conf
/sbin/ldconfig
```

之后再运行应该就可以正常启动了，然后配置更新一下数据库，以及转存一下静态文件

```shell
venv/bin/python manage.py migrate --settings=YojigenAPI.settings.prod
venv/bin/python manage.py createsuperuser --settings=YojigenAPI.settings.prod
venv/bin/python manage.py collectstatic --settings=YojigenAPI.settings.prod
```

接下来就是配置Supervisor守护进程了，因为我用了宝塔，宝塔里面有现成的Supervisor管理器，这里就直接使用宝塔的管理器了

填写进去启动信息，保存即可

![](6.jpg)

最后就是大家都熟悉的Nginx配置反向代理了，反向代理到对应的域名上就可以了，不过这里有个坑，是关于静态文件的，宝塔默认的配置里包含了css和js的相关配置，要去给他删了才行

```nginx
location /
{
	proxy_pass http://127.0.0.1:10000;
	proxy_set_header Host api.yojigen.tech;
	proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_set_header REMOTE-HOST $remote_addr;
	add_header X-Cache $upstream_cache_status;
}

location /static/ 
{
	alias /opt/YojigenAPI/static/;
}
```

到此配置全部完成，代码成功上线啦。