const app = getApp()

Page({
  data: {
    userInfo: null,
    logList: [],
    page: 1,
    pageSize: 20,
    loading: false,
    noMore: false,
    earnedPoints: 0,
    usedPoints: 0
  },

  onLoad() {
    this.loadUserInfo()
    this.loadLogs(true)
  },

  onShow() {
    this.loadUserInfo()
  },

  onPullDownRefresh() {
    this.loadUserInfo()
    this.loadLogs(true)
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadLogs(false)
    }
  },

  async loadUserInfo() {
    try {
      const res = await app.request({
        url: '/user/info',
        method: 'GET'
      })
      
      this.setData({
        userInfo: res.data
      })
    } catch (err) {
      console.error('加载用户信息失败', err)
    }
  },

  async loadLogs(refresh = false) {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    const page = refresh ? 1 : this.data.page
    
    try {
      const res = await app.request({
        url: '/user/pointsLog',
        method: 'GET',
        data: {
          page: page,
          page_size: this.data.pageSize
        }
      })
      
      const newList = res.data.list || []
      const noMore = newList.length < this.data.pageSize
      
      let earnedPoints = this.data.earnedPoints
      let usedPoints = this.data.usedPoints
      
      if (refresh) {
        newList.forEach(item => {
          if (item.points > 0) {
            earnedPoints += item.points
          } else {
            usedPoints += Math.abs(item.points)
          }
        })
      }
      
      this.setData({
        logList: refresh ? newList : [...this.data.logList, ...newList],
        page: page + 1,
        noMore: noMore,
        loading: false,
        earnedPoints: earnedPoints,
        usedPoints: usedPoints
      })
    } catch (err) {
      this.setData({ loading: false })
      console.error('加载积分记录失败', err)
    }
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr.replace(/-/g, '/'))
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  },

  loadMore() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadLogs(false)
    }
  }
})
