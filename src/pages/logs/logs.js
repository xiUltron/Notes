var n
Page({
  data: {
    logs: [],
    count: 0,
    allLogs: [],
    isDone: false
  },


  onShow() {
    n = 9
    this.setData({
      isDone: false
    })
    this.loadData()
  },

  loadData() {
    console.log('n=', n)
    var logs = wx.getStorageSync('todo_logs')
    var newLogs = logs.slice(0, n)
    if (newLogs) {
      this.setData({
        // 添加了上拉加载更多，所以可以不用倒序加载数组，只是为了实践上拉加载功能，实际在这个 APP 中，倒序更实用。关键是倒序我不知道怎么实现。
        // logs: newLogs.reverse(),
        logs: newLogs,
        count: logs.length,
        // allLogs: logs.reverse()
        allLogs: logs,
      })
    }
  },

  clearStorage() {
    wx.showModal({
      title: '提示',
      content: '是否清空所有' + this.data.count + '条日志',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          this.setData({ logs: [], isDone: false })
          wx.setStorageSync('isClear', '1')
        }
      }
    })
  },

  onReachBottom() {

    n += 3

    if (n > this.data.allLogs.length + 3) {
      this.setData({ isDone: true })
      console.log('加载失败')
      n -= 3
    } else {
      this.loadData()
      console.log('加载成功')
    }
    console.log('loadMore now, n=', n, 'log条数为：', this.data.allLogs.length)
  }
})