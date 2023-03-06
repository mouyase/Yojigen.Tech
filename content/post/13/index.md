---
title: 「技术」打造一个漂亮的Android标题栏
date: 2020-02-15 13:30:00
categories: 
  - 技术
tags:
  - Android
keywords: 
  - Android
  - CoordinatorLayout
  - AppBarLayout
  - TabLayout
---

![](1.jpg)

Cover: [仮想都歌姫 - BEEK@Pixiv](https://www.pixiv.net/artworks/58328867)

## 前言

最近因为正在做新坑Pixiu，本身的计划是照着Pivision做一个UI几乎没区别的复刻版，但是苦于已经好久没有正经开发过安卓App了，很多UI自己根本不会做，一个滑动的题图卡了我一天的时间，不过最后总算是连抄带蒙的做出来了，而且实际上也很简单，所以就写一个日志来记录一下。

## 效果演示

![](2.gif)

## 开发过程
整个效果实现需要三部分的工作，分别解决三个问题
 - StatusBar透明化
 - 带图片可滑动的ToolBar
 - 图片延伸到StatusBar

### StatusBar透明化

首先需要在style.xml里添加如下的style，名字随便起。

```xml
<style name="AppTheme.NoActionBar.TranslucentStatusBar" parent="AppTheme.NoActionBar">
	<item name="android:windowTranslucentStatus" tools:targetApi="KITKAT">true</item>
	<item name="android:statusBarColor" tools:targetApi="lollipop">
		@android:color/transparent
	</item>
</style>
```

首先需要先继承`NoActionBar`，否则会带上默认的ActionBar，就没办法实现效果。

其次中间有一个`tools:targetApi="KITKAT"`，这个`android:windowTranslucentStatus`就是设置是否开启透明StatusBar的参数，这个是从Android4.4，也就是Kitkat开始加入的参数，如果不这么写，在`value-19`里的`style.xml`写也是可以，不过我比较偷懒，这么写就不用做很多的`value`文件夹了。

而另一个参数则是Android5.0后加入的，设置StatusBar颜色的参数，这个把他设置成透明的就可以了。

最后则是把目标的Activity设置上这个新的主题。

```xml
<activity
	android:name=".view.MainActivity"
	android:theme="@style/AppTheme.NoActionBar.TranslucentStatusBar" />
```

这样咱们就获得了一个没有标题栏，而且也是透明的，还可以在里面放控件的Activity了。

### 带图片可滑动的ToolBar

这一步我玩了一上午，但是只是实现一个这样的简单效果并没有多难，只是我坑踩太多。

打开咱们Activity的布局文件，例如这里是`activity_main.xml`，把根布局换成`CoordinatorLayout`,然后在里面塞一个`AppBarLayout`，AppBarLayout里再塞一个`CollapsingToolbarLayout`，最后在CollapsingToolbarLayout里再分别塞一个`ImageView`，和一个`ToolBar`。最后把咱们的主要的布局放在CoordinatorLayout下面，这里放了个`LinearLayout`。

```xml
<androidx.coordinatorlayout.widget.CoordinatorLayout
	android:layout_width="match_parent"
	android:layout_height="match_parent">

	<com.google.android.material.appbar.AppBarLayout
		android:layout_width="match_parent"
		android:layout_height="wrap_content">

		<com.google.android.material.appbar.CollapsingToolbarLayout
			android:layout_width="match_parent"
			android:layout_height="wrap_content"
			app:layout_scrollFlags="scroll|exitUntilCollapsed|snap"
			app:titleEnabled="false">

			<ImageView
				android:id="@+id/iv_title/cover"
				android:layout_width="match_parent"
				android:layout_height="wrap_content"
				android:scaleType="centerCrop"
				app:layout_collapseMode="pin"/>

			<androidx.appcompat.widget.Toolbar
				android:id="@+id/tb_main"
				android:layout_width="match_parent"
				android:layout_height="wrap_content"
				app:layout_collapseMode="pin"
				app:title="@string/app_name" />

		</com.google.android.material.appbar.CollapsingToolbarLayout>

	</com.google.android.material.appbar.AppBarLayout>

	<LinearLayout
		android:layout_width="match_parent"
		android:layout_height="match_parent"
		android:orientation="vertical"
		app:layout_behavior="@string/appbar_scrolling_view_behavior">

	</LinearLayout>

</androidx.coordinatorlayout.widget.CoordinatorLayout>
```

这里解释一下各个细节，首先是这种滑动变化的布局，必须在`CoordinatorLayout`里进行，所以说根布局要换成这个，不过如果这个只是页面UI一部分的话，外面也是可以再套其他布局的。

因为要做有多种元素还能滚动的复杂TitleBar，所以要用`AppBarLayout`包裹`ToolBar`，这样才能配合CoordinatorLayout实现滚动。

`CollapsingToolbarLayout`则是相当于一个高级的`ToolBar`，需要包裹`ToolBar`才能实现效果。参数中的`app:layout_scrollFlags`代表了这个控件的可滑动状态。这个参数一共有五种，可以共存，分别是。

| 参数                 | 功能                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| scroll               | 代表这个控件可以被滚动                                                                              |
| enterAlways          | 代表这个控件会被优先滚动，需要和scroll共用                                                          |
| enterAlwaysCollapsed | 代表这个控件会被分段滚动，首先先滚动会显示最小高度，到达滚动边界后再完全显示，需要和enterAlways共用 |
| exitUntilCollapsed   | 代表这个控件会被保留最小高度，不会完全滚动出窗口，需要和scroll共用                                  |
| snap                 | 代表这个控件滚动时会有边缘吸附效果，需要和scroll共用                                                |

因为咱们的控件属于**保留最小高度，同时有吸附效果**，所以最后需要的是`scroll|exitUntilCollapsed|snap`。

至于`app:titleEnabled`则是代表是否使用系统自带的标题，这里因为要用ToolBar，所以关了就好。

接下来是ToolBar中的，`app:layout_collapseMode`，这个参数是开启了滚动后才会生效的效果，这个有三种参数。

| 参数     | 功能                         |
| -------- | ---------------------------- |
| none     | 代表这个控件会被滚出屏幕     |
| pin      | 代表这个控件不会被滚出屏幕   |
| parallax | 代表这个控件滚动时会有滚动差 |

最后是LinearLayout中的`app:layout_behavior`，behavior就是在CoordinatorLayout中负责处理各种效果的工具，这里使用了一个系统默认的参数`@string/appbar_scrolling_view_behavior`，效果为跟随appbar滚动，所以这个控件就相当于咱们整个窗口中的`根布局`了，其他控件放这里就好。

这样咱们就有了一个具有带图片可滑动的ToolBar，而且StatusBar也是透明的Activity了。

### 图片延伸到StatusBar

这一步卡的时间最久，因为我改了好多布局的方案，最后图片总是不能好好地显示到StatusBar上，要么是不显示，要么是UI错位，最后发现最简单的办法就是给ToolBar设置一个顶部padding，大小为StatusBar的高度，就可以完美实现了。

```java
ToolBar tb_main = findViewById(R.id.tb_main);
ViewGroup.LayoutParams toolbarParams = tb_main.getLayoutParams();
ViewGroup.MarginLayoutParams toolbarMarginParams;
if (toolbarParams instanceof ViewGroup.MarginLayoutParams) {
	toolbarMarginParams = (ViewGroup.MarginLayoutParams) toolbarParams;
} else {
	toolbarMarginParams = new ViewGroup.MarginLayoutParams(toolbarParams);
}
toolbarMarginParams.setMargins(0, ViewSize.getStatusBarHeight(this), 0, 0);
tb_main.setLayoutParams(toolbarMarginParams);
```

里面的`ViewSize.getStatusBarHeight(Activity activity)`如下。

```java
public static int getStatusBarHeight(Activity activity) {
	int statusBarHeight = 0;
	int resourceId_status = activity.getResources().getIdentifier("status_bar_height", "dimen", "android");
	if (resourceId_status > 0) {
		statusBarHeight = activity.getResources().getDimensionPixelSize(resourceId_status);
	}
	return statusBarHeight;
}
```

这样就可以给ToolBar设置上padding了，我们的布局也终于正常了。

## 结语

于是我终于可以开发其他模块了233。