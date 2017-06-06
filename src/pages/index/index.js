var util = require('../../utils/util.js')
Page({
  data: {
    input: '',
    todos: [],
    leftCount: 0,
    targetIndex: 0,
    allCompleted: false,
    logs: [],
    onSetTimer: false,
    onFocus: false,
    moreStatus: 0,
    helpStatus: false,
    startTime: 0,
    endTime: 0
  },

  // 保存列表、日志数据至缓存
  save() {
    wx.setStorageSync('todo_list', this.data.todos)
    wx.setStorageSync('todo_logs', this.data.logs)
  },

  // 输入框聚焦时触发
  inputFocus(e) {
    if (e.target.id = 'input') {
      this.setData({ onFocus: true })
    }
  },

  // 输入框失去焦点时触发
  inputBlur(e) {
    if (e.target.id = 'input') {
      this.setData({ onFocus: false })
    }
  },

  // 判断如果本地缓存数据 isClear 存在，就清除初始数据里的 logs 以避免任何一个操作把未清除的 logs数据再次写入缓存，导致日志永远无法清除。然后把 isClear 存空
  clearLogData() {
    var isClear = wx.getStorageSync('isClear')
    if (isClear) {
      this.setData({
        logs: []
      })
      wx.setStorageSync('isClear', '')
      // console.log('reset isClear success')
    }
  },

  /* 生命周期函数--监听页面显示
   * 页面每次显示都调用clearLogData()方法，确保 logs 页面完成清除日志操作后，这里的 logs[] 也被清空
   */
  onShow() {
    this.clearLogData()
  },

  // 从本地缓存数据中提取备忘、日志数据，并写入页面的初始数据
  load() {
    var todos = wx.getStorageSync('todo_list')
    if (todos) {
      var leftCount = todos.filter(function (item) {
        return !item.completed
      }).length
      this.setData({
        todos: todos,
        leftCount: leftCount
      })
    }
    var logs = wx.getStorageSync('todo_logs')
    if (logs) {
      this.setData({
        logs: logs
      })
    }
  },

  // 生命周期函数--监听页面加载  调用 load 函数
  onLoad() {
    this.load()
  },

  /* 输入时同步写入 data
    inputChangeHandle(e) {
      this.setData({ input: e.detail.value })
    },
   */

  // input confirm触发。 保存输入文字到 data
  addTodoHandle(e) {
    this.data.input = e.detail.value
    console.log('data input before:', this.data.input)
    // if (!this.data.input || !this.data.input.trim()) return
    if (!e.detail.value || !e.detail.value.trim()) return
    var todos = this.data.todos
    // todos.unshift({ name: this.data.input, completed: false, timestamp: util.formatTime(new Date()) })
    todos.unshift({ name: e.detail.value, completed: false, timestamp: util.formatTime(new Date()) })

    var logs = this.data.logs
    logs.push({ timestamp: util.formatTime(new Date()), action: '新增', name: this.data.input })

    this.setData({
      input: '',
      todos: todos,
      leftCount: this.data.leftCount + 1,
      logs: logs
    })
    this.save()
    console.log('data input after:', this.data.input)
  },

  // 标记
  toggleTodoHandle(e) {
    var index = e.currentTarget.dataset.index
    var todos = this.data.todos
    todos[index].completed = !todos[index].completed
    var logs = this.data.logs
    logs.push({
      timestamp: util.formatTime(new Date()),
      action: todos[index].completed ? '标记完成' : '取消标记',
      name: todos[index].name
    })
    this.setData({
      todos: todos,
      leftCount: this.data.leftCount + (todos[index].completed ? -1 : 1),
      logs: logs
    })
    this.save()
    // console.log('toggle target', e.taeget.value)
  },

  // 移除
  removeTodoHandle(e) {
    var index = e.currentTarget.dataset.index
    var todos = this.data.todos
    var remove = todos.splice(index, 1)[0]
    var logs = this.data.logs
    logs.push({
      timestamp: util.formatTime(new Date()),
      action: '移除',
      name: remove.name
    })
    this.setData({
      todos: todos,
      leftCount: this.data.leftCount - (remove.completed ? 0 : 1),
      logs: logs
    })
    this.save()
  },

  // 标记所有
  toggleAllHandle(e) {
    this.data.allCompleted = !this.data.allCompleted
    var todos = this.data.todos
    for (var i = todos.length - 1; i >= 0; i--) {
      todos[i].completed = this.data.allCompleted
    }
    var logs = this.data.logs
    logs.push({
      timestamp: util.formatTime(new Date()),
      action: this.data.allCompleted ? '标记完成' : '取消标记',
      name: '全部任务'
    })
    this.setData({
      todos: todos,
      leftCount: this.data.allCompleted ? 0 : todos.length,
      logs: logs
    })
    this.save()
  },

  // 清空备忘录
  clear() {
    var todos = this.data.todos
    var remains = []
    for (var i = 0; i > todos.length; i++) {
      todos[i].completed || remains.push(todos[i])
    }
    var logs = this.data.logs
    logs.push({
      timestamp: util.formatTime(new Date()),
      action: '清空',
      name: '已完成任务'
    })
    this.setData({
      todos: remains,
      logs: logs,
      leftCount: 0
    })
    this.save()
  },

  // 提示是否清空，是=>调用 clear 函数
  clearCompletedHandle(e) {
    wx.showModal({
      title: '提示',
      content: '是否清空所有事件',
      success: (res) => {
        if (res.confirm) {
          this.clear()
        } else {
        }
      }
    })
  },

  setTimer() {
    this.setData({ onSetTimer: !this.data.onSetTimer })
  },

  // bindlongtap绑定事件：显示详情，把当前点击位置的下标 index 保存到 data.targetIndex
  showMore(e) {
    this.setData({
      moreStatus: 1,
      targetIndex: e.currentTarget.dataset.index
    })
    // console.log('targetIndex', this.data.targetIndex)
  },

  // 隐藏详情
  hideMore() {
    this.setData({
      moreStatus: false,
      helpStatus: false,
    })
  },

  // 开始按下
  bindTouchStart(e) {
    this.startTime = e.timeStamp
  },

  // 手指抬起
  bindTouchEnd(e) {
    this.endTime = e.timeStamp
  },

  // bindtap绑定事件：如果按下时间小于350ms，则调用标记事件
  myBindTap(e) {
    if (this.endTime - this.startTime < 350) {
      this.toggleTodoHandle(e)
    }
  },

  showHelp() {
    this.setData({ helpStatus: true })
  }
}) 

// git test ignore it