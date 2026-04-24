const CONFIG = {
    baseUrl: 'http://localhost/api',
    
    getToken() {
        return localStorage.getItem('admin_token') || null;
    },
    
    setToken(token) {
        localStorage.setItem('admin_token', token);
    },
    
    removeToken() {
        localStorage.removeItem('admin_token');
    },
    
    getAdminInfo() {
        const info = localStorage.getItem('admin_info');
        return info ? JSON.parse(info) : null;
    },
    
    setAdminInfo(info) {
        localStorage.setItem('admin_info', JSON.stringify(info));
    },
    
    removeAdminInfo() {
        localStorage.removeItem('admin_info');
    }
};
