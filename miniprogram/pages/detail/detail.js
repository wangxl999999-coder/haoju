const app = getApp()

Page({
  data: {
    content: {},
    contentId: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ contentId: options.id })
      this.loadContent(options.id)
    }
  },

  onShow() {
    if (this.data.contentId) {
      this.loadContent(this.data.contentId)
    }
  },

  async loadContent(id) {
    if (!id) return
    
    try {
      const res = await app.request({
        url: '/content/detail',
        method: 'GET',
        data: { id }
      })
      
      this.setData({
        content: res.data || {}
      })
    } catch (err) {
      console.error('加载内容详情失败', err)
    }
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr.replace(/-/g, '/'))
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  },

  async toggleFavorite() {
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    
    if (!this.data.content.id) return
    
    try {
      const res = await app.request({
        url: '/content/favorite',
        method: 'POST',
        data: { content_id: this.data.content.id }
      })
      
      const isFavorite = res.data.is_favorite
      const currentCount = this.data.content.favorite_count
      
      this.setData({
        'content.is_favorite': isFavorite,
        'content.favorite_count': isFavorite ? currentCount + 1 : currentCount - 1
      })
      
      app.showToast(isFavorite ? '已收藏' : '已取消收藏')
      
    } catch (err) {
      console.error('收藏操作失败', err)
    }
  },

  shareContent() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  onShareAppMessage() {
    const content = this.data.content
    const userInfo = app.globalData.userInfo
    
    let path = `/pages/detail/detail?id=${content.id}`
    if (userInfo && userInfo.id) {
      path = `/pages/index/index?invite_code=${userInfo.id}`
    }
    
    return {
      title: content.content ? content.content.substring(0, 30) + '...' : '好句好段',
      path: path,
      imageUrl: ''
    }
  },

  onShareTimeline() {
    const content = this.data.content
    return {
      title: content.content ? content.content.substring(0, 30) + '...' : '好句好段',
      imageUrl: ''
    }
  }
})
