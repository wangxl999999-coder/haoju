const app = getApp()

Page({
  data: {
    today: '',
    dailyContent: {},
    categories: [],
    selectedCategory: null,
    currentCategoryName: '',
    contentList: [],
    page: 1,
    pageSize: 10,
    loading: false,
    noMore: false
  },

  onLoad() {
    this.setToday()
    this.loadCategories()
  },

  onShow() {
    this.loadDaily()
    this.loadContentList(true)
  },

  onPullDownRefresh() {
    this.loadDaily()
    this.loadContentList(true)
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadContentList(false)
    }
  },

  setToday() {
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const weekDay = weekDays[now.getDay()]
    this.setData({
      today: `${month}月${day}日 周${weekDay}`
    })
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

  async loadDaily() {
    try {
      const res = await app.request({
        url: '/content/daily',
        method: 'GET'
      })
      this.setData({
        dailyContent: res.data || {}
      })
    } catch (err) {
      console.error('加载每日推荐失败', err)
    }
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
      
      if (this.data.selectedCategory) {
        params.category_id = this.data.selectedCategory
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

  selectCategory(e) {
    const id = e.currentTarget.dataset.id
    const category = this.data.categories.find(c => c.id === id)
    
    if (this.data.selectedCategory === id) {
      this.setData({
        selectedCategory: null,
        currentCategoryName: ''
      })
    } else {
      this.setData({
        selectedCategory: id,
        currentCategoryName: category ? category.name : ''
      })
    }
    
    this.loadContentList(true)
  },

  goSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
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
  },

  getCategoryIcon(id) {
    const icons = {
      1: 'icon-star',
      2: 'icon-paragraph',
      3: 'icon-quote',
      4: 'icon-chat',
      5: 'icon-pen'
    }
    return icons[id] || 'icon-star'
  }
})
