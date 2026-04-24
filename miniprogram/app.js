App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'http://localhost/api',
    isLoggedIn: false
  },

  onLaunch() {
    this.checkLogin()
    this.checkInviteCode()
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.isLoggedIn = true
    }
  },

  checkInviteCode() {
    const launchOptions = wx.getLaunchOptionsSync()
    if (launchOptions.query && launchOptions.query.invite_code) {
      wx.setStorageSync('invite_code', launchOptions.query.invite_code)
    }
  },

  setLoginInfo(token, userInfo) {
    this.globalData.token = token
    this.globalData.userInfo = userInfo
    this.globalData.isLoggedIn = true
    
    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo)
  },

  logout() {
    this.globalData.token = null
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
    
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
  },

  request(options) {
    const { url, method = 'GET', data = {} } = options
    const header = {
      'Content-Type': 'application/json'
    }
    
    if (this.globalData.token) {
      header['Authorization'] = `Bearer ${this.globalData.token}`
    }
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.globalData.baseUrl + url,
        method: method,
        data: data,
        header: header,
        success: (res) => {
          if (res.statusCode === 401) {
            this.logout()
            wx.showToast({
              title: '登录已过期',
              icon: 'none'
            })
            setTimeout(() => {
              wx.redirectTo({
                url: '/pages/login/login'
              })
            }, 1500)
            reject(res)
          } else if (res.data.code === 200) {
            resolve(res.data)
          } else {
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            })
            reject(res)
          }
        },
        fail: (err) => {
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          })
          reject(err)
        }
      })
    })
  },

  showLoading(title = '加载中...') {
    wx.showLoading({
      title: title,
      mask: true
    })
  },

  hideLoading() {
    wx.hideLoading()
  },

  showToast(title, icon = 'none', duration = 2000) {
    wx.showToast({
      title: title,
      icon: icon,
      duration: duration
    })
  }
})
