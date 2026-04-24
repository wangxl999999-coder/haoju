document.addEventListener('DOMContentLoaded', () => {
    const token = CONFIG.getToken();
    if (token) {
        window.location.href = 'main.html';
        return;
    }
    
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username) {
            Utils.showToast('请输入用户名', 'error');
            return;
        }
        
        if (!password) {
            Utils.showToast('请输入密码', 'error');
            return;
        }
        
        loginBtn.disabled = true;
        loginBtn.textContent = '登录中...';
        Utils.showLoading();
        
        try {
            const result = await Http.post('/admin/login', {
                username: username,
                password: password
            });
            
            Utils.hideLoading();
            
            if (result.code === 200) {
                CONFIG.setToken(result.data.token);
                CONFIG.setAdminInfo(result.data.admin);
                
                Utils.showToast('登录成功', 'success');
                
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 1000);
            } else {
                Utils.showToast(result.message || '登录失败', 'error');
                loginBtn.disabled = false;
                loginBtn.textContent = '登 录';
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('登录失败，请检查网络', 'error');
            loginBtn.disabled = false;
            loginBtn.textContent = '登 录';
        }
    });
});
