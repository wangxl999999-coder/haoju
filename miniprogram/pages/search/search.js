const app = getApp()

Page({
  data: {
    keyword: '',
    hotKeywords: ['名人名言', '励志句子', '经典语录', '美文摘抄', '古诗名句'],
    searchHistory: [],
    contentList: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    noMore: false,
    hasSearched: false
  },

  onLoad() {
    this.loadHistory()
  },

  loadHistory() {
    const history = wx.getStorageSync('searchHistory') || []
    this.setData({
      searchHistory: history
    })
  },

  saveHistory(keyword) {
    let history = wx.getStorageSync('searchHistory') || []
    history = history.filter(item => item !== keyword)
    history.unshift(keyword)
    if (history.length > 10) {
      history = history.slice(0, 10)
    }
    wx.setStorageSync('searchHistory', history)
    this.setData({
      searchHistory: history
    })
  },

  onKeywordInput(e) {
    this.setData({
      keyword: e.detail.value
    })
  },

  clearKeyword() {
    this.setData({
      keyword: '',
      hasSearched: false,
      contentList: []
    })
  },

  searchKeyword(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({
      keyword: keyword
    })
    this.handleSearch()
  },

  async handleSearch() {
    const keyword = this.data.keyword.trim()
    
    if (!keyword) {
      app.showToast('请输入搜索关键词')
      return
    }
    
    this.saveHistory(keyword)
    this.setData({ hasSearched: true })
    this.loadSearchResults(true)
  },

  async loadSearchResults(refresh = false) {
    if (this.data.loading) return
    
    const keyword = this.data.keyword.trim()
    if (!keyword) return
    
    this.setData({ loading: true })
    
    const page = refresh ? 1 : this.data.page
    
    try {
      const res = await app.request({
        url: '/content/search',
        method: 'GET',
        data: {
          keyword: keyword,
          page: page,
          page_size: this.data.pageSize
        }
      })
      
      const newList = res.data.list || []
      const noMore = newList.length < this.data.pageSize
      
      this.setData({
        contentList: refresh ? newList : [...this.data.contentList, ...newList],
        total: res.data.total || 0,
        page: page + 1,
        noMore: noMore,
        loading: false
      })
    } catch (err) {
      this.setData({ loading: false })
      console.error('搜索失败', err)
    }
  },

  clearHistory() {
    wx.showModal({
      title: '提示',
      content: '确定要清空搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('searchHistory')
          this.setData({
            searchHistory: []
          })
        }
      }
    })
  },

  goBack() {
    wx.navigateBack()
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  loadMore() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadSearchResults(false)
    }
  }
})
