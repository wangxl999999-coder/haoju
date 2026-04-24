const app = getApp()

Page({
  data: {
    inviteCode: '',
    inviteCount: 0,
    earnedPoints: 0,
    inviteList: [],
    page: 1,
    pageSize: 20,
    loading: false,
    noMore: false
  },

  onLoad() {
    this.setData({
      inviteCode: app.globalData.userInfo ? app.globalData.userInfo.id : ''
    })
    this.loadInvites(true)
  },

  onShow() {
    this.loadInvites(true)
  },

  onPullDownRefresh() {
    this.loadInvites(true)
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadInvites(false)
    }
  },

  async loadInvites(refresh = false) {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    const page = refresh ? 1 : this.data.page
    
    try {
      const res = await app.request({
        url: '/user/invites',
        method: 'GET',
        data: {
          page: page,
          page_size: this.data.pageSize
        }
      })
      
      const newList = res.data.list || []
      const noMore = newList.length < this.data.pageSize
      
      let inviteCount = refresh ? 0 : this.data.inviteCount
      let earnedPoints = refresh ? 0 : this.data.earnedPoints
      
      if (refresh) {
        newList.forEach(item => {
          inviteCount++
          if (item.reward_given) {
            earnedPoints += 1
          }
        })
      }
      
      this.setData({
        inviteList: refresh ? newList : [...this.data.inviteList, ...newList],
        page: page + 1,
        noMore: noMore,
        loading: false,
        inviteCount: inviteCount,
        earnedPoints: earnedPoints
      })
    } catch (err) {
      this.setData({ loading: false })
      console.error('加载邀请列表失败', err)
    }
  },

  onShareAppMessage() {
    const userInfo = app.globalData.userInfo
    let path = '/pages/index/index'
    
    if (userInfo && userInfo.id) {
      path = `/pages/index/index?invite_code=${userInfo.id}`
    }
    
    return {
      title: '发现一个超棒的好句好段小程序，快来一起用吧！',
      path: path,
      imageUrl: ''
    }
  },

  copyInviteCode() {
    const userInfo = app.globalData.userInfo
    if (!userInfo || !userInfo.id) {
      app.showToast('请先登录')
      return
    }
    
    const inviteCode = userInfo.id.toString()
    
    wx.setClipboardData({
      data: inviteCode,
      success: () => {
        app.showToast('邀请码已复制')
      }
    })
  },

  loadMore() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadInvites(false)
    }
  }
})
