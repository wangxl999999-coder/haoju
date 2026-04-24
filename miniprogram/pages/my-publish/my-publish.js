const app = getApp()

Page({
  data: {
    contentList: [],
    page: 1,
    pageSize: 10,
    loading: false,
    noMore: false
  },

  onLoad() {
    this.loadMyPublish(true)
  },

  onShow() {
    this.loadMyPublish(true)
  },

  onPullDownRefresh() {
    this.loadMyPublish(true)
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadMyPublish(false)
    }
  },

  async loadMyPublish(refresh = false) {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    const page = refresh ? 1 : this.data.page
    
    try {
      const res = await app.request({
        url: '/content/myPublish',
        method: 'GET',
        data: {
          page: page,
          page_size: this.data.pageSize
        }
      })
      
      const newList = res.data.list || []
      const noMore = newList.length < this.data.pageSize
      
      this.setData({
        contentList: refresh ? newList : [...this.data.contentList, ...newList],
        page: page + 1,
        noMore: noMore,
        loading: false
      })
    } catch (err) {
      this.setData({ loading: false })
      console.error('加载我的发布失败', err)
    }
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr.replace(/-/g, '/'))
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  goPublish() {
    wx.switchTab({
      url: '/pages/publish/publish'
    })
  },

  loadMore() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadMyPublish(false)
    }
  }
})
