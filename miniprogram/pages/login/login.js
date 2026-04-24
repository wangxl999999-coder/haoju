const app = getApp()

Page({
  data: {
    phone: '',
    code: '',
    countdown: 0,
    agreed: true,
    loading: false,
    inviteCode: ''
  },

  onLoad(options) {
    const inviteCode = wx.getStorageSync('invite_code') || options.invite_code || ''
    this.setData({ inviteCode })
  },

  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    })
  },

  onCodeInput(e) {
    this.setData({
      code: e.detail.value
    })
  },

  toggleAgreement() {
    this.setData({
      agreed: !this.data.agreed
    })
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

  validatePhone() {
    const phone = this.data.phone
    if (!phone) {
      app.showToast('请输入手机号')
      return false
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      app.showToast('手机号格式不正确')
      return false
    }
    return true
  },

  async sendCode() {
    if (this.data.countdown > 0) return
    
    if (!this.validatePhone()) return

    try {
      const res = await app.request({
        url: '/user/sendCode',
        method: 'POST',
        data: {
          phone: this.data.phone
        }
      })
      
      app.showToast('验证码已发送')
      
      if (res.data && res.data.debug_code) {
        this.setData({
          code: res.data.debug_code
        })
      }
      
      this.startCountdown()
    } catch (err) {
      console.error('发送验证码失败', err)
    }
  },

  startCountdown() {
    let countdown = 60
    this.setData({ countdown })
    
    const timer = setInterval(() => {
      countdown--
      this.setData({ countdown })
      
      if (countdown <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  },

  async handleLogin() {
    if (!this.data.agreed) {
      app.showToast('请先同意用户协议和隐私政策')
      return
    }
    
    if (!this.validatePhone()) return
    
    if (!this.data.code) {
      app.showToast('请输入验证码')
      return
    }
    
    this.setData({ loading: true })
    
    try {
      const data = {
        phone: this.data.phone,
        code: this.data.code
      }
      
      if (this.data.inviteCode) {
        data.invite_code = this.data.inviteCode
      }
      
      const res = await app.request({
        url: '/user/login',
        method: 'POST',
        data: data
      })
      
      app.setLoginInfo(res.data.token, res.data.user)
      
      wx.removeStorageSync('invite_code')
      
      if (res.data.is_new_user) {
        app.showToast('注册成功，获得邀请奖励！')
      } else {
        app.showToast('登录成功')
      }
      
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)
      
    } catch (err) {
      this.setData({ loading: false })
      console.error('登录失败', err)
    }
  }
})
