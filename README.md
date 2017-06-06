# Notes
## About Notes
 一个微信小程序，简单的备忘录项目，同时也是第一个使用 GitHub 的项目，通过不断的功能完善增加以学习小程序开发    
 一些功能的设计或设想（如闹铃提醒）不考虑项目的实用性
> **感谢大神[汪磊][1]，本项目在他的 TODOS 项目基础上进行修改**
## New
- 样式美化
- 长按显示 notes 详情
- 清空日志
- **日志的上拉加载**
## Todos
- [ ] 数据服务器同步
- [ ] 闹铃提醒
- [ ] ......
## Details
### 样式美化
- input 高亮效果  
	+ 坑：反复快速使 `input` 聚焦失焦，会使 `placeholder` 消失，并且该 `input` 组件完全失效——**小程序bug，无解**
- 列表隔行背景色区分
	+   提升视觉效果
	+ 通过判断 `view` 绑定数组的下标奇偶，渲染不同的样式来实现
### 长按显示 notes 详情
- 坑：当一个组件上同时绑定 bindtap 和 bindlongtap 事件时，长按触发 bindlongtap 之后始终会触发 bindtap
	>   测试发现，小程序中事件执行顺序为：  
	> 点击：touchstart → touchend → tap  
	> 长按：touchstart → longtap → touchend → tap  
	> 所以，最后无论如何，都会执行 tap 事件  
  
所以不能简单的绑定 bindtap 和 bindlongtap 事件，需要通过 bindTouchStart 和 bindTouchEnd 来计算出时间差判断按下时间（一般大于350ms 视为长按）来调用长按或者点击事件：
```js
// js
bindTouchStart(e) {
    this.startTime = e.timeStamp;
}
bindTouchEnd(e) {
    this.endTime = e.timeStamp;
}
bindTap(e) {
    if(this.endTime  - this.startTime < 350) {
        console.log("点击")
    } else {
        console.log("长按")
    }
}
```
看上去很美好，但是又掉进另一个坑里，研究代码可以发现，使用 `if else` 来控制点击和长按，会有一个黑洞，那就是只要手指不抬起来，endTime 永远得不到，永远无法判断应该点击还是长按。  
所以还是必须保留 bindlongtap 的绑定，只是用时间差大于350来锁定 bindtap 事件的发生：  
```xml
<!--wxml-->
<view bindtouchstart="bindTouchStart" bindtouchend="bindTouchEnd" bindtap="bindTap" bindlongtap="bindLongTap">点击？长按？</view>
```
```js
// js
bindTouchStart(e) {
    this.startTime = e.timeStamp;
}
bindTouchEndn(e) {
    this.endTime = e.timeStamp;
}
bindTap(e) {
    if(this.endTime  - this.startTime < 350) {
        console.log("点击")
    }
}
bingLongTap(e) {
    console.log("长按");
}
```
这样基本上可以完美解决了，但是还是觉得比较智障，这种小问题小程序团队搞不定？可以说是非常爆笑了:relieved:   


- 关于长按显示的实现  
	在 data 里设置一个布尔类型的 isMoreStatus 默认0，触发长按 showMore ，设为1，在 wxml 中条件渲染 `wx:if` 来控制弹出 view。  
显示内容方面，由于事件传值和详情 view 不是同一个，渲染详情 view 时无法直接使用点击时传过来的 `e.currentTarget.dataset.index` ，所以 data 里还必须有一个 targetIndex 来保存传过来的下标在详情 view 中使用，确保显示的是我们点击条目的详情内容。  

### 清空日志
日志数据是保存在本地缓存中的，第一次尝试在“清除所有日志”绑定事件中简单的做 `wx.clearStorageSync()` 同时把 data 里的数据设为空，发现确实可以删除，但是一旦在首页中有任何操作，再回到日志界面，会发现之前清空的所有数据又回来了。调试发现，在 index 页面的每一个操作都会触发 save() 方法，并且把日志数据写入 data。save()方法是把数据保存到本地缓存，而数据的来源就是 index 的 data。  
所以，只要在 logs 页面清除数据的同时，使 index 中的 logs[] 数据也清空。笨方法，`wx.setStorageSync('isClear', '1')` 设置一个本地缓存，保存任意数据，在 index `clearLogData()` 中判断本地缓存 isClear 是否存在，存在即清空 data 中的 logs[] 数据，然后清空 isClear，并且在 `onShow()` 中调用 `clearLogData()` 方法，确保 logs 页面完成清除日志操作后，这里的 logs[] 也被清空。

### 日志的上拉加载
> 实际上在这个项目中，使用  `reverse()` 方法颠倒数组的显示，更加合适，添加上拉加载更多功能纯粹是为了学习。

实现上拉加载的思路：  
查阅了很多资料，觉得那些处理都太麻烦了，还要限制 view 的高度，用 scrollview 算拉到什么位置，头都大了。后来发现我的方法更爆炸。  
简单来说就是，定义一个全局变量 n 用作限定 logs[]的范围，使页面只显示 logs[0]-logs[n]条数据，然后在 `onReachBottom()` 方法中让 n 自加3（数字随意，每次上拉多加载的条数），并调用 `loadData()` 方法向 data 中的 logs[] 写入 logs[0]-logs[n+3]，再上拉一次写入 logs[0]-logs[n+6]...在 `onShow()` 中设置 n 初值为9，这个数字不可以太小，太小会导致一个页面只显示几条数据就没了，无法触发 `onReachBottom()` 方法，太大的话会导致这个页面一显示出来顶部不是第一条数据，影响美观。基本就是这样，具体看代码吧。

[1]:	http://github.com/zce