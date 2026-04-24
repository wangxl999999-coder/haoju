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
    this.loadFavorites(true)
  },

  onShow() {
    this.loadFavorites(true)
  },

  onPullDownRefresh() {
    this.loadFavorites(true)
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadFavorites(false)
    }
  },

  async loadFavorites(refresh = false) {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    const page = refresh ? 1 : this.data.page
    
    try {
      const res = await app.request({
        url: '/content/myFavorites',
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
      console.error('加载收藏列表失败', err)
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  goExplore() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  async toggleFavorite(e) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index
    
    try {
      const res = await app.request({
        url: '/content/favorite',
        method: 'POST',
        data: { content_id: id }
      })
      
      if (!res.data.is_favorite) {
        const newList = this.data.contentList.filter((item, i) => i !== index)
        this.setData({
          contentList: newList
        })
        app.showToast('已取消收藏')
      }
      
    } catch (err) {
      console.error('取消收藏失败', err)
    }
  },

  loadMore() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadFavorites(false)
    }
  }
})
