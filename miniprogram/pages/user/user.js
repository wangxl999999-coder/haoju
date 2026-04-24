const app = getApp()

Page({
  data: {
    userInfo: null,
    showEditModal: false,
    editNickname: ''
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  async loadUserInfo() {
    if (!app.globalData.isLoggedIn) {
      this.setData({ userInfo: null })
      return
    }

    try {
      const res = await app.request({
        url: '/user/info',
        method: 'GET'
      })
      
      this.setData({
        userInfo: res.data
      })
      
      app.globalData.userInfo = res.data
      wx.setStorageSync('userInfo', res.data)
      
    } catch (err) {
      console.error('加载用户信息失败', err)
    }
  },

  goLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  goMyPublish() {
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/my-publish/my-publish'
    })
  },

  goFavorites() {
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/favorites/favorites'
    })
  },

  goInvite() {
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/invite/invite'
    })
  },

  goPointsLog() {
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/points-log/points-log'
    })
  },

  editProfile() {
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    
    this.setData({
      showEditModal: true,
      editNickname: this.data.userInfo.nickname || ''
    })
  },

  hideEditModal() {
    this.setData({ showEditModal: false })
  },

  onEditNickname(e) {
    this.setData({ editNickname: e.detail.value })
  },

  async saveProfile() {
    const nickname = this.data.editNickname.trim()
    
    if (!nickname) {
      app.showToast('请输入昵称')
      return
    }
    
    if (nickname.length > 20) {
      app.showToast('昵称不能超过20个字符')
      return
    }
    
    try {
      await app.request({
        url: '/user/update',
        method: 'POST',
        data: { nickname }
      })
      
      app.showToast('保存成功')
      this.hideEditModal()
      this.loadUserInfo()
      
    } catch (err) {
      console.error('保存失败', err)
    }
  },

  viewAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '欢迎使用好句好段小程序！请仔细阅读以下用户协议。\n\n1. 用户注册后可发布内容，内容需符合法律法规。\n2. 严禁发布违法、违规、低俗内容。\n3. 平台有权审核和删除违规内容。\n4. 用户发布内容原创，抄袭后果自负。\n5. 解释权归本平台所有。',
      showCancel: false
    })
  },

  viewPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私保护。\n\n1. 我们仅收集必要的信息用于提供服务。\n2. 您的手机号仅用于登录验证，不会公开。\n3. 我们不会将您的个人信息出售给第三方。\n4. 您可以随时删除自己的账户和相关数据。\n5. 如有疑问，请联系我们。',
      showCancel: false
    })
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          this.setData({ userInfo: null })
          app.showToast('已退出登录')
        }
      }
    })
  },

  preventMove() {
    return false
  }
})
