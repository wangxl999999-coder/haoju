const app = getApp()

Page({
  data: {
    categories: [],
    currentCategory: null,
    contentList: [],
    page: 1,
    pageSize: 10,
    loading: false,
    noMore: false
  },

  onLoad(options) {
    if (options.category_id) {
      this.setData({
        currentCategory: parseInt(options.category_id)
      })
    }
    this.loadCategories()
  },

  onShow() {
    this.loadContentList(true)
  },

  onPullDownRefresh() {
    this.loadContentList(true)
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadContentList(false)
    }
  },

  async loadCategories() {
    try {
      const res = await app.request({
        url: '/content/categories',
        method: 'GET'
      })
      this.setData({
        categories: res.data || []
      })
    } catch (err) {
      console.error('加载分类失败', err)
    }
  },

  selectCategory(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      currentCategory: id
    })
    this.loadContentList(true)
  },

  async loadContentList(refresh = false) {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    const page = refresh ? 1 : this.data.page
    
    try {
      const params = {
        page: page,
        page_size: this.data.pageSize
      }
      
      if (this.data.currentCategory !== null) {
        params.category_id = this.data.currentCategory
      }
      
      const res = await app.request({
        url: '/content/lists',
        method: 'GET',
        data: params
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
      console.error('加载内容列表失败', err)
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  async toggleFavorite(e) {
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index
    
    try {
      const res = await app.request({
        url: '/content/favorite',
        method: 'POST',
        data: { content_id: id }
      })
      
      const key = `contentList[${index}].is_favorite`
      const favoriteCountKey = `contentList[${index}].favorite_count`
      const currentCount = this.data.contentList[index].favorite_count
      
      this.setData({
        [key]: res.data.is_favorite,
        [favoriteCountKey]: res.data.is_favorite ? currentCount + 1 : currentCount - 1
      })
      
      app.showToast(res.message)
    } catch (err) {
      console.error('收藏操作失败', err)
    }
  },

  loadMore() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadContentList(false)
    }
  }
})
