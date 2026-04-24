const Utils = {
    formatDate(dateStr, format = 'YYYY-MM-DD') {
        if (!dateStr) return '';
        const date = new Date(dateStr.replace(/-/g, '/'));
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const second = date.getSeconds();
        
        return format
            .replace('YYYY', year)
            .replace('MM', month.toString().padStart(2, '0'))
            .replace('DD', day.toString().padStart(2, '0'))
            .replace('HH', hour.toString().padStart(2, '0'))
            .replace('mm', minute.toString().padStart(2, '0'))
            .replace('ss', second.toString().padStart(2, '0'));
    },
    
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span class="icon icon-${type === 'success' ? 'check-circle' : 'close-circle'}"></span><span>${message}</span>`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    },
    
    showLoading() {
        const loading = document.createElement('div');
        loading.className = 'loading-mask';
        loading.id = 'loadingMask';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>加载中...</p>
            </div>
        `;
        document.body.appendChild(loading);
    },
    
    hideLoading() {
        const loading = document.getElementById('loadingMask');
        if (loading) {
            document.body.removeChild(loading);
        }
    },
    
    showConfirm(title, message) {
        return new Promise((resolve, reject) => {
            const modal = document.createElement('div');
            modal.className = 'confirm-modal';
            modal.innerHTML = `
                <div class="confirm-mask"></div>
                <div class="confirm-content">
                    <div class="confirm-header">
                        <h3>${title}</h3>
                    </div>
                    <div class="confirm-body">
                        <p>${message}</p>
                    </div>
                    <div class="confirm-footer">
                        <button class="btn btn-default" id="confirmCancel">取消</button>
                        <button class="btn btn-primary" id="confirmOk">确定</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            document.getElementById('confirmCancel').onclick = () => {
                document.body.removeChild(modal);
                resolve(false);
            };
            
            document.getElementById('confirmOk').onclick = () => {
                document.body.removeChild(modal);
                resolve(true);
            };
        });
    },
    
    pagination(containerId, currentPage, totalPages, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = '<div class="pagination">';
        
        html += `<button class="page-btn ${currentPage <= 1 ? 'disabled' : ''}" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>上一页</button>`;
        
        const showPages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
        let endPage = Math.min(totalPages, startPage + showPages - 1);
        
        if (endPage - startPage < showPages - 1) {
            startPage = Math.max(1, endPage - showPages + 1);
        }
        
        if (startPage > 1) {
            html += `<button class="page-num" data-page="1">1</button>`;
            if (startPage > 2) {
                html += '<span class="page-ellipsis">...</span>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-num ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += '<span class="page-ellipsis">...</span>';
            }
            html += `<button class="page-num" data-page="${totalPages}">${totalPages}</button>`;
        }
        
        html += `<button class="page-btn ${currentPage >= totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>下一页</button>`;
        
        html += '</div>';
        container.innerHTML = html;
        
        const buttons = container.querySelectorAll('button[data-page]');
        buttons.forEach(btn => {
            btn.onclick = () => {
                const page = parseInt(btn.dataset.page);
                if (page >= 1 && page <= totalPages && page !== currentPage) {
                    onPageChange(page);
                }
            };
        });
    }
};

const Http = {
    async request(url, options = {}) {
        const { method = 'GET', data = {} } = options;
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        const token = CONFIG.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        let fetchUrl = CONFIG.baseUrl + url;
        let fetchOptions = {
            method: method,
            headers: headers
        };
        
        if (method === 'GET') {
            const params = new URLSearchParams();
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
                    params.append(key, data[key]);
                }
            });
            const queryString = params.toString();
            if (queryString) {
                fetchUrl += '?' + queryString;
            }
        } else {
            fetchOptions.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(fetchUrl, fetchOptions);
            const result = await response.json();
            
            if (response.status === 401) {
                CONFIG.removeToken();
                CONFIG.removeAdminInfo();
                window.location.href = 'index.html';
                throw new Error('登录已过期');
            }
            
            return result;
        } catch (error) {
            console.error('请求失败:', error);
            throw error;
        }
    },
    
    get(url, data) {
        return this.request(url, { method: 'GET', data });
    },
    
    post(url, data) {
        return this.request(url, { method: 'POST', data });
    },
    
    put(url, data) {
        return this.request(url, { method: 'PUT', data });
    },
    
    delete(url, data) {
        return this.request(url, { method: 'DELETE', data });
    }
};
