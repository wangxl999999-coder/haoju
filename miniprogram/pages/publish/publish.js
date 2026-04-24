const app = getApp()

Page({
  data: {
    categories: [],
    selectedCategory: null,
    title: '',
    content: '',
    author: '',
    contentLength: 0,
    loading: false
  },

  onLoad() {
    this.loadCategories()
  },

  onShow() {
    if (!app.globalData.isLoggedIn) {
      wx.switchTab({
        url: '/pages/index/index'
      })
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
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

  onCategoryChange(e) {
    const index = e.detail.value
    this.setData({
      selectedCategory: this.data.categories[index]
    })
  },

  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    })
  },

  onContentInput(e) {
    const content = e.detail.value
    this.setData({
      content: content,
      contentLength: content.length
    })
  },

  onAuthorInput(e) {
    this.setData({
      author: e.detail.value
    })
  },

  validate() {
    if (!this.data.selectedCategory) {
      app.showToast('请选择分类')
      return false
    }
    
    if (!this.data.content.trim()) {
      app.showToast('请输入内容')
      return false
    }
    
    if (this.data.content.trim().length < 10) {
      app.showToast('内容至少需要10个字符')
      return false
    }
    
    return true
  },

  async handlePublish() {
    if (!this.validate()) return
    
    this.setData({ loading: true })
    
    try {
      const res = await app.request({
        url: '/content/publish',
        method: 'POST',
        data: {
          category_id: this.data.selectedCategory.id,
          title: this.data.title,
          content: this.data.content,
          author: this.data.author
        }
      })
      
      app.showToast('发布成功，等待审核')
      
      setTimeout(() => {
        this.setData({
          selectedCategory: null,
          title: '',
          content: '',
          author: '',
          contentLength: 0,
          loading: false
        })
        
        wx.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)
      
    } catch (err) {
      this.setData({ loading: false })
      console.error('发布失败', err)
    }
  }
})
