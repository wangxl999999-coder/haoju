const App = {
    currentPage: 'dashboard',
    userParams: {
        page: 1,
        pageSize: 15,
        keyword: ''
    },
    contentParams: {
        page: 1,
        pageSize: 15,
        keyword: '',
        categoryId: '',
        status: ''
    },
    inviteParams: {
        page: 1,
        pageSize: 15,
        keyword: ''
    },
    categories: [],
    
    async init() {
        const token = CONFIG.getToken();
        if (!token) {
            window.location.href = 'index.html';
            return;
        }
        
        const adminInfo = CONFIG.getAdminInfo();
        if (adminInfo) {
            document.getElementById('adminName').textContent = adminInfo.username || '管理员';
        }
        
        await this.loadCategories();
        this.bindEvents();
        this.loadDashboard();
    },
    
    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.switchPage(page);
            });
        });
        
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
        
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });
        
        document.getElementById('userSearchBtn').addEventListener('click', () => {
            this.userParams.keyword = document.getElementById('userSearchInput').value.trim();
            this.userParams.page = 1;
            this.loadUsers();
        });
        
        document.getElementById('contentSearchBtn').addEventListener('click', () => {
            this.contentParams.keyword = document.getElementById('contentSearchInput').value.trim();
            this.contentParams.categoryId = document.getElementById('contentCategoryFilter').value;
            this.contentParams.status = document.getElementById('contentStatusFilter').value;
            this.contentParams.page = 1;
            this.loadContents();
        });
        
        document.getElementById('addContentBtn').addEventListener('click', () => {
            this.openContentModal();
        });
        
        document.getElementById('contentModalClose').addEventListener('click', () => {
            this.closeContentModal();
        });
        
        document.getElementById('contentModalCancel').addEventListener('click', () => {
            this.closeContentModal();
        });
        
        document.getElementById('contentModalSave').addEventListener('click', () => {
            this.saveContent();
        });
        
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.openCategoryModal();
        });
        
        document.getElementById('categoryModalClose').addEventListener('click', () => {
            this.closeCategoryModal();
        });
        
        document.getElementById('categoryModalCancel').addEventListener('click', () => {
            this.closeCategoryModal();
        });
        
        document.getElementById('categoryModalSave').addEventListener('click', () => {
            this.saveCategory();
        });
        
        document.getElementById('detailModalClose').addEventListener('click', () => {
            this.closeDetailModal();
        });
        
        document.getElementById('userSearchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('userSearchBtn').click();
            }
        });
        
        document.getElementById('contentSearchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('contentSearchBtn').click();
            }
        });
        
        document.getElementById('inviteSearchBtn').addEventListener('click', () => {
            this.inviteParams.keyword = document.getElementById('inviteSearchInput').value.trim();
            this.inviteParams.page = 1;
            this.loadInvites();
        });
        
        document.getElementById('inviteSearchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('inviteSearchBtn').click();
            }
        });
    },
    
    switchPage(page) {
        this.currentPage = page;
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
        
        document.querySelectorAll('.page-content').forEach(content => {
            content.classList.toggle('active', content.id === page + 'Page');
        });
        
        const titles = {
            dashboard: '首页',
            users: '用户管理',
            contents: '内容管理',
            categories: '分类管理',
            invites: '邀请关系'
        };
        document.getElementById('pageTitle').textContent = titles[page] || '首页';
        
        switch (page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'contents':
                this.loadContents();
                break;
            case 'categories':
                this.loadCategories(true);
                break;
            case 'invites':
                this.loadInvites();
                break;
        }
    },
    
    async loadDashboard() {
        try {
            const statsResult = await Http.get('/admin/stats');
            if (statsResult.code === 200) {
                const stats = statsResult.data;
                document.getElementById('totalUsers').textContent = stats.total_users || 0;
                document.getElementById('totalContents').textContent = stats.total_contents || 0;
                document.getElementById('pendingContents').textContent = stats.pending_contents || 0;
                document.getElementById('totalInvites').textContent = stats.total_invites || 0;
            }
            
            const recentResult = await Http.get('/admin/recent-users');
            if (recentResult.code === 200) {
                this.renderRecentUsers(recentResult.data || []);
            }
            
            const pendingResult = await Http.get('/admin/pending-contents', { limit: 5 });
            if (pendingResult.code === 200) {
                this.renderPendingContents(pendingResult.data || []);
            }
        } catch (error) {
            console.error('加载首页数据失败', error);
        }
    },
    
    renderRecentUsers(users) {
        const container = document.getElementById('recentUsers');
        if (!users || users.length === 0) {
            container.innerHTML = '<p class="empty-text">暂无数据</p>';
            return;
        }
        
        let html = '';
        users.forEach(user => {
            html += `
                <div class="recent-item">
                    <div class="recent-info">
                        <p class="name">${user.nickname || user.phone}</p>
                        <p class="meta">${user.phone} · ${Utils.formatDate(user.created_at, 'YYYY-MM-DD HH:mm')}</p>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },
    
    renderPendingContents(contents) {
        const container = document.getElementById('pendingList');
        if (!contents || contents.length === 0) {
            container.innerHTML = '<p class="empty-text">暂无数据</p>';
            return;
        }
        
        let html = '';
        contents.forEach(content => {
            const preview = content.content.length > 50 ? content.content.substring(0, 50) + '...' : content.content;
            html += `
                <div class="recent-item">
                    <div class="recent-info">
                        <p class="name">${preview}</p>
                        <p class="meta">${content.category_name} · ${Utils.formatDate(content.created_at, 'YYYY-MM-DD HH:mm')}</p>
                    </div>
                    <span class="recent-status status-pending">待审核</span>
                </div>
            `;
        });
        container.innerHTML = html;
    },
    
    async loadUsers() {
        Utils.showLoading();
        try {
            const result = await Http.get('/admin/users', {
                page: this.userParams.page,
                page_size: this.userParams.pageSize,
                keyword: this.userParams.keyword
            });
            
            Utils.hideLoading();
            
            if (result.code === 200) {
                this.renderUsersTable(result.data.list || []);
                Utils.pagination('usersPagination', this.userParams.page, result.data.total_pages || 1, (page) => {
                    this.userParams.page = page;
                    this.loadUsers();
                });
            } else {
                Utils.showToast(result.message || '加载失败', 'error');
            }
        } catch (error) {
            Utils.hideLoading();
            console.error('加载用户列表失败', error);
            Utils.showToast('加载失败', 'error');
        }
    },
    
    renderUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">暂无数据</td></tr>';
            return;
        }
        
        let html = '';
        users.forEach(user => {
            html += `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.phone}</td>
                    <td>${user.nickname || '-'}</td>
                    <td><span style="color: #ff6b6b; font-weight: 600;">${user.points || 0}</span></td>
                    <td>${user.inviter_nickname || user.inviter_phone || '-'}</td>
                    <td>${user.favorite_count || 0}</td>
                    <td>${user.publish_count || 0}</td>
                    <td>${Utils.formatDate(user.created_at, 'YYYY-MM-DD')}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn btn-default btn-small" onclick="App.viewUser(${user.id})">查看</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    },
    
    async viewUser(userId) {
        try {
            const result = await Http.get('/admin/user', { id: userId });
            if (result.code === 200) {
                const user = result.data;
                const html = `
                    <div class="detail-content">
                        <div class="detail-row">
                            <span class="detail-label">ID：</span>
                            <span class="detail-value">${user.id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">手机号：</span>
                            <span class="detail-value">${user.phone}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">昵称：</span>
                            <span class="detail-value">${user.nickname || '-'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">积分：</span>
                            <span class="detail-value" style="color: #ff6b6b; font-weight: 600;">${user.points || 0}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">邀请人：</span>
                            <span class="detail-value">${user.inviter_nickname || user.inviter_phone || '无'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">收藏数：</span>
                            <span class="detail-value">${user.favorite_count || 0}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">发布数：</span>
                            <span class="detail-value">${user.publish_count || 0}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">注册时间：</span>
                            <span class="detail-value">${Utils.formatDate(user.created_at, 'YYYY-MM-DD HH:mm')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">最后登录：</span>
                            <span class="detail-value">${user.last_login_at ? Utils.formatDate(user.last_login_at, 'YYYY-MM-DD HH:mm') : '-'}</span>
                        </div>
                    </div>
                `;
                document.getElementById('detailModalBody').innerHTML = html;
                document.getElementById('detailModalFooter').innerHTML = '';
                document.getElementById('detailModal').classList.add('active');
            }
        } catch (error) {
            console.error('获取用户详情失败', error);
            Utils.showToast('获取详情失败', 'error');
        }
    },
    
    async loadContents() {
        Utils.showLoading();
        try {
            const result = await Http.get('/admin/contents', {
                page: this.contentParams.page,
                page_size: this.contentParams.pageSize,
                keyword: this.contentParams.keyword,
                category_id: this.contentParams.categoryId,
                status: this.contentParams.status
            });
            
            Utils.hideLoading();
            
            if (result.code === 200) {
                this.renderContentsTable(result.data.list || []);
                Utils.pagination('contentsPagination', this.contentParams.page, result.data.total_pages || 1, (page) => {
                    this.contentParams.page = page;
                    this.loadContents();
                });
            } else {
                Utils.showToast(result.message || '加载失败', 'error');
            }
        } catch (error) {
            Utils.hideLoading();
            console.error('加载内容列表失败', error);
            Utils.showToast('加载失败', 'error');
        }
    },
    
    renderContentsTable(contents) {
        const tbody = document.getElementById('contentsTableBody');
        if (!contents || contents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center">暂无数据</td></tr>';
            return;
        }
        
        const statusMap = {
            0: { text: '待审核', class: 'status-pending' },
            1: { text: '已通过', class: 'status-approved' },
            2: { text: '已拒绝', class: 'status-rejected' }
        };
        
        let html = '';
        contents.forEach(content => {
            const status = statusMap[content.status] || statusMap[0];
            const preview = content.content.length > 40 ? content.content.substring(0, 40) + '...' : content.content;
            
            let actionButtons = `
                <button class="btn btn-default btn-small" onclick="App.viewContent(${content.id})">详情</button>
                <button class="btn btn-primary btn-small" onclick="App.editContent(${content.id})">编辑</button>
            `;
            
            if (content.status === 0) {
                actionButtons += `
                    <button class="btn btn-success btn-small" onclick="App.approveContent(${content.id})">通过</button>
                    <button class="btn btn-danger btn-small" onclick="App.rejectContent(${content.id})">拒绝</button>
                `;
            }
            
            html += `
                <tr>
                    <td>${content.id}</td>
                    <td>${content.category_name || '-'}</td>
                    <td>
                        <span class="content-preview" title="${content.content}">${preview}</span>
                    </td>
                    <td>${content.author || '-'}</td>
                    <td>${content.user_nickname || content.user_phone || '-'}</td>
                    <td><span class="status-badge ${status.class}">${status.text}</span></td>
                    <td>${content.view_count || 0}</td>
                    <td>${content.favorite_count || 0}</td>
                    <td>${Utils.formatDate(content.created_at, 'YYYY-MM-DD')}</td>
                    <td>
                        <div class="action-btns">
                            ${actionButtons}
                        </div>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    },
    
    async viewContent(contentId) {
        try {
            const result = await Http.get('/admin/content', { id: contentId });
            if (result.code === 200) {
                const content = result.data;
                const statusMap = {
                    0: '待审核',
                    1: '已通过',
                    2: '已拒绝'
                };
                
                const html = `
                    <div class="detail-content">
                        <div class="detail-row">
                            <span class="detail-label">ID：</span>
                            <span class="detail-value">${content.id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">分类：</span>
                            <span class="detail-value">${content.category_name || '-'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">标题：</span>
                            <span class="detail-value">${content.title || '-'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">作者：</span>
                            <span class="detail-value">${content.author || '-'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">发布用户：</span>
                            <span class="detail-value">${content.user_nickname || content.user_phone || '官方内容'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">状态：</span>
                            <span class="detail-value">${statusMap[content.status] || '未知'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">浏览量：</span>
                            <span class="detail-value">${content.view_count || 0}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">收藏数：</span>
                            <span class="detail-value">${content.favorite_count || 0}</span>
                        </div>
                    </div>
                    <div class="detail-full">
                        <span class="detail-label">内容：</span>
                        <div class="detail-value">${content.content}</div>
                    </div>
                `;
                document.getElementById('detailModalBody').innerHTML = html;
                document.getElementById('detailModalFooter').innerHTML = '';
                document.getElementById('detailModal').classList.add('active');
            }
        } catch (error) {
            console.error('获取内容详情失败', error);
            Utils.showToast('获取详情失败', 'error');
        }
    },
    
    async approveContent(contentId) {
        const confirmed = await Utils.showConfirm('确认审核', '确定要通过该内容审核吗？');
        if (!confirmed) return;
        
        try {
            const result = await Http.post('/admin/content/approve', { id: contentId });
            if (result.code === 200) {
                Utils.showToast('审核通过', 'success');
                this.loadContents();
                this.loadDashboard();
            } else {
                Utils.showToast(result.message || '操作失败', 'error');
            }
        } catch (error) {
            console.error('审核通过失败', error);
            Utils.showToast('操作失败', 'error');
        }
    },
    
    async rejectContent(contentId) {
        const confirmed = await Utils.showConfirm('确认审核', '确定要拒绝该内容吗？');
        if (!confirmed) return;
        
        try {
            const result = await Http.post('/admin/content/reject', { id: contentId });
            if (result.code === 200) {
                Utils.showToast('已拒绝', 'success');
                this.loadContents();
                this.loadDashboard();
            } else {
                Utils.showToast(result.message || '操作失败', 'error');
            }
        } catch (error) {
            console.error('拒绝内容失败', error);
            Utils.showToast('操作失败', 'error');
        }
    },
    
    openContentModal(content = null) {
        const title = content ? '编辑内容' : '添加内容';
        document.getElementById('contentModalTitle').textContent = title;
        document.getElementById('contentFormId').value = content ? content.id : '';
        document.getElementById('contentFormCategory').value = content ? content.category_id : '';
        document.getElementById('contentFormTitle').value = content ? (content.title || '') : '';
        document.getElementById('contentFormContent').value = content ? content.content : '';
        document.getElementById('contentFormAuthor').value = content ? (content.author || '') : '';
        
        document.getElementById('contentModal').classList.add('active');
    },
    
    closeContentModal() {
        document.getElementById('contentModal').classList.remove('active');
    },
    
    async editContent(contentId) {
        try {
            const result = await Http.get('/admin/content', { id: contentId });
            if (result.code === 200) {
                this.openContentModal(result.data);
            }
        } catch (error) {
            console.error('获取内容失败', error);
            Utils.showToast('获取内容失败', 'error');
        }
    },
    
    async saveContent() {
        const id = document.getElementById('contentFormId').value;
        const categoryId = document.getElementById('contentFormCategory').value;
        const title = document.getElementById('contentFormTitle').value.trim();
        const content = document.getElementById('contentFormContent').value.trim();
        const author = document.getElementById('contentFormAuthor').value.trim();
        
        if (!categoryId) {
            Utils.showToast('请选择分类', 'error');
            return;
        }
        
        if (!content) {
            Utils.showToast('请输入内容', 'error');
            return;
        }
        
        const data = {
            category_id: parseInt(categoryId),
            title: title,
            content: content,
            author: author,
            status: 1
        };
        
        if (id) {
            data.id = parseInt(id);
        }
        
        try {
            const url = id ? '/admin/content/update' : '/admin/content/create';
            const result = await Http.post(url, data);
            
            if (result.code === 200) {
                Utils.showToast(id ? '编辑成功' : '添加成功', 'success');
                this.closeContentModal();
                this.loadContents();
                this.loadDashboard();
            } else {
                Utils.showToast(result.message || '保存失败', 'error');
            }
        } catch (error) {
            console.error('保存内容失败', error);
            Utils.showToast('保存失败', 'error');
        }
    },
    
    async loadCategories(refresh = false) {
        if (this.categories.length > 0 && !refresh) {
            this.renderCategorySelects();
            return;
        }
        
        try {
            const result = await Http.get('/admin/categories');
            if (result.code === 200) {
                this.categories = result.data || [];
                this.renderCategorySelects();
                this.renderCategoriesTable();
            }
        } catch (error) {
            console.error('加载分类失败', error);
        }
    },
    
    renderCategorySelects() {
        const selects = [
            document.getElementById('contentCategoryFilter'),
            document.getElementById('contentFormCategory')
        ];
        
        selects.forEach(select => {
            if (!select) return;
            const currentValue = select.value;
            let options = '<option value="">请选择分类</option>';
            this.categories.forEach(cat => {
                options += `<option value="${cat.id}">${cat.name}</option>`;
            });
            select.innerHTML = options;
            select.value = currentValue;
        });
    },
    
    renderCategoriesTable() {
        const tbody = document.getElementById('categoriesTableBody');
        if (!this.categories || this.categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">暂无数据</td></tr>';
            return;
        }
        
        let html = '';
        this.categories.forEach(category => {
            const statusText = category.status === 1 ? '启用' : '禁用';
            const statusClass = category.status === 1 ? 'status-approved' : 'status-rejected';
            
            html += `
                <tr>
                    <td>${category.id}</td>
                    <td>${category.name}</td>
                    <td>${category.sort || 0}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${Utils.formatDate(category.created_at, 'YYYY-MM-DD')}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn btn-primary btn-small" onclick="App.editCategory(${category.id})">编辑</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    },
    
    openCategoryModal(category = null) {
        const title = category ? '编辑分类' : '添加分类';
        document.getElementById('categoryModalTitle').textContent = title;
        document.getElementById('categoryFormId').value = category ? category.id : '';
        document.getElementById('categoryFormName').value = category ? category.name : '';
        document.getElementById('categoryFormSort').value = category ? (category.sort || 0) : 0;
        document.getElementById('categoryFormStatus').value = category ? (category.status || 1) : 1;
        
        document.getElementById('categoryModal').classList.add('active');
    },
    
    closeCategoryModal() {
        document.getElementById('categoryModal').classList.remove('active');
    },
    
    editCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
            this.openCategoryModal(category);
        }
    },
    
    async saveCategory() {
        const id = document.getElementById('categoryFormId').value;
        const name = document.getElementById('categoryFormName').value.trim();
        const sort = document.getElementById('categoryFormSort').value;
        const status = document.getElementById('categoryFormStatus').value;
        
        if (!name) {
            Utils.showToast('请输入分类名称', 'error');
            return;
        }
        
        const data = {
            name: name,
            sort: parseInt(sort) || 0,
            status: parseInt(status)
        };
        
        if (id) {
            data.id = parseInt(id);
        }
        
        try {
            const url = id ? '/admin/category/update' : '/admin/category/create';
            const result = await Http.post(url, data);
            
            if (result.code === 200) {
                Utils.showToast(id ? '编辑成功' : '添加成功', 'success');
                this.closeCategoryModal();
                await this.loadCategories(true);
            } else {
                Utils.showToast(result.message || '保存失败', 'error');
            }
        } catch (error) {
            console.error('保存分类失败', error);
            Utils.showToast('保存失败', 'error');
        }
    },
    
    async loadInvites() {
        Utils.showLoading();
        try {
            const result = await Http.get('/admin/invites', {
                page: this.inviteParams.page,
                page_size: this.inviteParams.pageSize,
                keyword: this.inviteParams.keyword
            });
            
            Utils.hideLoading();
            
            if (result.code === 200) {
                this.renderInvitesTable(result.data.list || []);
                Utils.pagination('invitesPagination', this.inviteParams.page, result.data.total_pages || 1, (page) => {
                    this.inviteParams.page = page;
                    this.loadInvites();
                });
            } else {
                Utils.showToast(result.message || '加载失败', 'error');
            }
        } catch (error) {
            Utils.hideLoading();
            console.error('加载邀请关系失败', error);
            Utils.showToast('加载失败', 'error');
        }
    },
    
    renderInvitesTable(invites) {
        const tbody = document.getElementById('invitesTableBody');
        if (!invites || invites.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">暂无数据</td></tr>';
            return;
        }
        
        let html = '';
        invites.forEach(invite => {
            const rewardText = invite.reward_issued ? '已发放' : '未发放';
            const rewardClass = invite.reward_issued ? 'status-approved' : 'status-pending';
            
            html += `
                <tr>
                    <td>${invite.id}</td>
                    <td>${invite.inviter_nickname || '-'}</td>
                    <td>${invite.inviter_phone || '-'}</td>
                    <td>${invite.invitee_nickname || '-'}</td>
                    <td>${invite.invitee_phone || '-'}</td>
                    <td><span class="status-badge ${rewardClass}">${rewardText}</span></td>
                    <td>${Utils.formatDate(invite.created_at, 'YYYY-MM-DD HH:mm')}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    },
    
    closeDetailModal() {
        document.getElementById('detailModal').classList.remove('active');
    },
    
    async logout() {
        const confirmed = await Utils.showConfirm('退出登录', '确定要退出登录吗？');
        if (!confirmed) return;
        
        try {
            await Http.post('/admin/logout');
        } catch (error) {
            console.error('退出登录请求失败', error);
        }
        
        CONFIG.removeToken();
        CONFIG.removeAdminInfo();
        window.location.href = 'index.html';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
