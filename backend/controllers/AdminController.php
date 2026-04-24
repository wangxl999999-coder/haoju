<?php
/**
 * 后台管理控制器
 */
class AdminController extends Controller
{
    /**
     * 管理员登录
     */
    public function login()
    {
        $username = $this->getParam('username');
        $password = $this->getParam('password');
        
        if (!$username || !$password) {
            Response::error('请输入用户名和密码');
        }
        
        $admin = $this->db->fetch(
            'SELECT * FROM `admins` WHERE `username` = :username LIMIT 1',
            ['username' => $username]
        );
        
        if (!$admin) {
            Response::error('用户名或密码错误');
        }
        
        if (!$admin['status']) {
            Response::error('账号已被禁用');
        }
        
        if (!password_verify($password, $admin['password'])) {
            Response::error('用户名或密码错误');
        }
        
        $this->db->update(
            'admins',
            ['last_login_at' => date('Y-m-d H:i:s')],
            '`id` = :id',
            ['id' => $admin['id']]
        );
        
        $token = JWT::generateToken($admin['id'], 'admin');
        
        Response::success([
            'token' => $token,
            'admin' => [
                'id' => $admin['id'],
                'username' => $admin['username'],
                'nickname' => $admin['nickname']
            ]
        ], '登录成功');
    }
    
    /**
     * 管理员退出登录
     */
    public function logout()
    {
        $this->requireAdmin();
        Response::success([], '退出成功');
    }
    
    /**
     * 获取管理员信息
     */
    public function info()
    {
        $admin = $this->requireAdmin();
        
        Response::success([
            'id' => $admin['id'],
            'username' => $admin['username'],
            'nickname' => $admin['nickname'],
            'last_login_at' => $admin['last_login_at']
        ]);
    }
    
    /**
     * 获取统计数据
     */
    public function stats()
    {
        $this->requireAdmin();
        
        $totalUsers = $this->db->fetch(
            'SELECT COUNT(*) as count FROM `users`'
        );
        
        $totalContents = $this->db->fetch(
            'SELECT COUNT(*) as count FROM `contents`'
        );
        
        $pendingContents = $this->db->fetch(
            'SELECT COUNT(*) as count FROM `contents` WHERE `status` = 0'
        );
        
        $totalInvites = $this->db->fetch(
            'SELECT COUNT(*) as count FROM `invites`'
        );
        
        Response::success([
            'total_users' => intval($totalUsers['count']),
            'total_contents' => intval($totalContents['count']),
            'pending_contents' => intval($pendingContents['count']),
            'total_invites' => intval($totalInvites['count'])
        ]);
    }
    
    /**
     * 最近注册用户
     */
    public function recentUsers()
    {
        $this->requireAdmin();
        
        $limit = $this->getParam('limit', 10);
        
        $users = $this->db->fetchAll(
            'SELECT `id`, `phone`, `nickname`, `created_at` 
             FROM `users` 
             ORDER BY `id` DESC 
             LIMIT :limit',
            ['limit' => intval($limit)]
        );
        
        Response::success($users);
    }
    
    /**
     * 待审核内容
     */
    public function pendingContents()
    {
        $this->requireAdmin();
        
        $limit = $this->getParam('limit', 10);
        
        $contents = $this->db->fetchAll(
            'SELECT c.*, cat.name as category_name 
             FROM `contents` c 
             LEFT JOIN `categories` cat ON c.category_id = cat.id 
             WHERE c.`status` = 0 
             ORDER BY c.id ASC 
             LIMIT :limit',
            ['limit' => intval($limit)]
        );
        
        Response::success($contents);
    }
    
    /**
     * 用户列表
     */
    public function users()
    {
        $this->requireAdmin();
        
        $page = $this->getParam('page', 1);
        $pageSize = $this->getParam('page_size', 20);
        $keyword = $this->getParam('keyword');
        list($page, $pageSize, $offset) = $this->validatePageParams($page, $pageSize);
        
        $where = '1=1';
        $params = [];
        
        if ($keyword) {
            $where .= ' AND (phone LIKE :keyword OR nickname LIKE :keyword)';
            $params['keyword'] = "%$keyword%";
        }
        
        $total = $this->db->fetch(
            "SELECT COUNT(*) as count FROM `users` WHERE $where",
            $params
        );
        
        $users = $this->db->fetchAll(
            "SELECT u.*, 
             (SELECT COUNT(*) FROM `favorites` WHERE user_id = u.id) as favorite_count,
             (SELECT COUNT(*) FROM `contents` WHERE user_id = u.id) as publish_count,
             (SELECT COUNT(*) FROM `invites` WHERE inviter_id = u.id) as invite_count,
             inviter.nickname as inviter_nickname,
             inviter.phone as inviter_phone
             FROM `users` u 
             LEFT JOIN `users` inviter ON u.inviter_id = inviter.id
             WHERE $where 
             ORDER BY u.id DESC 
             LIMIT :offset, :limit",
            array_merge($params, [
                'offset' => $offset,
                'limit' => $pageSize
            ])
        );
        
        Response::success([
            'list' => $users,
            'total' => intval($total['count']),
            'page' => $page,
            'page_size' => $pageSize,
            'total_pages' => ceil(intval($total['count']) / $pageSize)
        ]);
    }
    
    /**
     * 用户详情
     */
    public function user()
    {
        $this->requireAdmin();
        
        $id = $this->getParam('id');
        
        if (!$id) {
            Response::error('请传入用户ID');
        }
        
        $user = $this->db->fetch(
            'SELECT u.*, 
             (SELECT COUNT(*) FROM `favorites` WHERE user_id = u.id) as favorite_count,
             (SELECT COUNT(*) FROM `contents` WHERE user_id = u.id) as publish_count,
             (SELECT COUNT(*) FROM `invites` WHERE inviter_id = u.id) as invite_count,
             inviter.nickname as inviter_nickname,
             inviter.phone as inviter_phone
             FROM `users` u 
             LEFT JOIN `users` inviter ON u.inviter_id = inviter.id
             WHERE u.id = :id 
             LIMIT 1',
            ['id' => $id]
        );
        
        if (!$user) {
            Response::notFound('用户不存在');
        }
        
        Response::success($user);
    }
    
    /**
     * 内容列表
     */
    public function contents()
    {
        $this->requireAdmin();
        
        $page = $this->getParam('page', 1);
        $pageSize = $this->getParam('page_size', 20);
        $categoryId = $this->getParam('category_id');
        $status = $this->getParam('status');
        $keyword = $this->getParam('keyword');
        list($page, $pageSize, $offset) = $this->validatePageParams($page, $pageSize);
        
        $where = '1=1';
        $params = [];
        
        if ($categoryId) {
            $where .= ' AND c.category_id = :category_id';
            $params['category_id'] = $categoryId;
        }
        
        if ($status !== null && $status !== '') {
            $where .= ' AND c.status = :status';
            $params['status'] = $status;
        }
        
        if ($keyword) {
            $where .= ' AND (c.title LIKE :keyword OR c.content LIKE :keyword OR c.author LIKE :keyword)';
            $params['keyword'] = "%$keyword%";
        }
        
        $total = $this->db->fetch(
            "SELECT COUNT(*) as count FROM `contents` c WHERE $where",
            $params
        );
        
        $contents = $this->db->fetchAll(
            "SELECT c.*, cat.name as category_name, u.nickname as user_nickname, u.phone as user_phone
             FROM `contents` c 
             LEFT JOIN `categories` cat ON c.category_id = cat.id 
             LEFT JOIN `users` u ON c.user_id = u.id 
             WHERE $where 
             ORDER BY c.id DESC 
             LIMIT :offset, :limit",
            array_merge($params, [
                'offset' => $offset,
                'limit' => $pageSize
            ])
        );
        
        Response::success([
            'list' => $contents,
            'total' => intval($total['count']),
            'page' => $page,
            'page_size' => $pageSize,
            'total_pages' => ceil(intval($total['count']) / $pageSize)
        ]);
    }
    
    /**
     * 内容详情
     */
    public function content()
    {
        $this->requireAdmin();
        
        $id = $this->getParam('id');
        
        if (!$id) {
            Response::error('请传入内容ID');
        }
        
        $content = $this->db->fetch(
            'SELECT c.*, cat.name as category_name, u.nickname as user_nickname, u.phone as user_phone
             FROM `contents` c 
             LEFT JOIN `categories` cat ON c.category_id = cat.id 
             LEFT JOIN `users` u ON c.user_id = u.id 
             WHERE c.id = :id 
             LIMIT 1',
            ['id' => $id]
        );
        
        if (!$content) {
            Response::notFound('内容不存在');
        }
        
        Response::success($content);
    }
    
    /**
     * 审核通过
     */
    public function approve()
    {
        $this->requireAdmin();
        
        $id = $this->getParam('id');
        
        if (!$id) {
            Response::error('请传入内容ID');
        }
        
        $content = $this->db->fetch(
            'SELECT * FROM `contents` WHERE `id` = :id LIMIT 1',
            ['id' => $id]
        );
        
        if (!$content) {
            Response::notFound('内容不存在');
        }
        
        if ($content['status'] != 0) {
            Response::error('该内容已审核过');
        }
        
        $this->db->update(
            'contents',
            ['status' => 1],
            '`id` = :id',
            ['id' => $id]
        );
        
        if ($content['user_id']) {
            $pointsController = new PointsController();
            $pointsController->rewardPublish($id);
        }
        
        Response::success([], '审核通过');
    }
    
    /**
     * 审核拒绝
     */
    public function reject()
    {
        $this->requireAdmin();
        
        $id = $this->getParam('id');
        
        if (!$id) {
            Response::error('请传入内容ID');
        }
        
        $content = $this->db->fetch(
            'SELECT * FROM `contents` WHERE `id` = :id LIMIT 1',
            ['id' => $id]
        );
        
        if (!$content) {
            Response::notFound('内容不存在');
        }
        
        if ($content['status'] != 0) {
            Response::error('该内容已审核过');
        }
        
        $this->db->update(
            'contents',
            ['status' => 2],
            '`id` = :id',
            ['id' => $id]
        );
        
        Response::success([], '审核拒绝');
    }
    
    /**
     * 添加内容
     */
    public function create()
    {
        $this->requireAdmin();
        
        $categoryId = $this->getParam('category_id');
        $title = $this->getParam('title');
        $content = $this->getParam('content');
        $author = $this->getParam('author');
        $status = $this->getParam('status', 1);
        
        if (!$categoryId) {
            Response::error('请选择分类');
        }
        
        $category = $this->db->fetch(
            'SELECT * FROM `categories` WHERE `id` = :id AND `status` = 1 LIMIT 1',
            ['id' => $categoryId]
        );
        
        if (!$category) {
            Response::error('分类不存在');
        }
        
        if (!$content) {
            Response::error('请输入内容');
        }
        
        $contentId = $this->db->insert('contents', [
            'category_id' => $categoryId,
            'title' => $title ?: '',
            'content' => $content,
            'author' => $author ?: '',
            'user_id' => null,
            'status' => $status,
            'view_count' => 0,
            'favorite_count' => 0
        ]);
        
        Response::success(['id' => $contentId], '添加成功');
    }
    
    /**
     * 编辑内容
     */
    public function update()
    {
        $this->requireAdmin();
        
        $id = $this->getParam('id');
        $categoryId = $this->getParam('category_id');
        $title = $this->getParam('title');
        $content = $this->getParam('content');
        $author = $this->getParam('author');
        $status = $this->getParam('status');
        
        if (!$id) {
            Response::error('请传入内容ID');
        }
        
        $existingContent = $this->db->fetch(
            'SELECT * FROM `contents` WHERE `id` = :id LIMIT 1',
            ['id' => $id]
        );
        
        if (!$existingContent) {
            Response::notFound('内容不存在');
        }
        
        $updateData = [];
        
        if ($categoryId) {
            $category = $this->db->fetch(
                'SELECT * FROM `categories` WHERE `id` = :id AND `status` = 1 LIMIT 1',
                ['id' => $categoryId]
            );
            if (!$category) {
                Response::error('分类不存在');
            }
            $updateData['category_id'] = $categoryId;
        }
        
        if ($title !== null) {
            $updateData['title'] = $title;
        }
        
        if ($content) {
            $updateData['content'] = $content;
        }
        
        if ($author !== null) {
            $updateData['author'] = $author;
        }
        
        if ($status !== null) {
            $updateData['status'] = $status;
        }
        
        if (empty($updateData)) {
            Response::error('没有需要更新的内容');
        }
        
        $this->db->update(
            'contents',
            $updateData,
            '`id` = :id',
            ['id' => $id]
        );
        
        Response::success([], '更新成功');
    }
    
    /**
     * 邀请关系列表
     */
    public function invites()
    {
        $this->requireAdmin();
        
        $page = $this->getParam('page', 1);
        $pageSize = $this->getParam('page_size', 20);
        $keyword = $this->getParam('keyword');
        list($page, $pageSize, $offset) = $this->validatePageParams($page, $pageSize);
        
        $where = '1=1';
        $params = [];
        
        if ($keyword) {
            $where .= ' AND (inviter.nickname LIKE :keyword OR inviter.phone LIKE :keyword OR invitee.nickname LIKE :keyword OR invitee.phone LIKE :keyword)';
            $params['keyword'] = "%$keyword%";
        }
        
        $total = $this->db->fetch(
            "SELECT COUNT(*) as count 
             FROM `invites` i 
             LEFT JOIN `users` inviter ON i.inviter_id = inviter.id 
             LEFT JOIN `users` invitee ON i.invitee_id = invitee.id 
             WHERE $where",
            $params
        );
        
        $invites = $this->db->fetchAll(
            "SELECT i.*, 
             inviter.nickname as inviter_nickname, 
             inviter.phone as inviter_phone,
             invitee.nickname as invitee_nickname, 
             invitee.phone as invitee_phone,
             invitee.created_at as invitee_created_at
             FROM `invites` i 
             LEFT JOIN `users` inviter ON i.inviter_id = inviter.id 
             LEFT JOIN `users` invitee ON i.invitee_id = invitee.id 
             WHERE $where 
             ORDER BY i.id DESC 
             LIMIT :offset, :limit",
            array_merge($params, [
                'offset' => $offset,
                'limit' => $pageSize
            ])
        );
        
        Response::success([
            'list' => $invites,
            'total' => intval($total['count']),
            'page' => $page,
            'page_size' => $pageSize,
            'total_pages' => ceil(intval($total['count']) / $pageSize)
        ]);
    }
    
    /**
     * 分类列表
     */
    public function categories()
    {
        $this->requireAdmin();
        
        $categories = $this->db->fetchAll(
            'SELECT * FROM `categories` ORDER BY `sort` ASC'
        );
        
        Response::success($categories);
    }
    
    /**
     * 添加分类
     */
    public function categoryCreate()
    {
        $this->requireAdmin();
        
        $name = $this->getParam('name');
        $icon = $this->getParam('icon');
        $sort = $this->getParam('sort', 0);
        $status = $this->getParam('status', 1);
        
        if (!$name) {
            Response::error('请输入分类名称');
        }
        
        $categoryId = $this->db->insert('categories', [
            'name' => $name,
            'icon' => $icon ?: '',
            'sort' => $sort,
            'status' => $status
        ]);
        
        Response::success(['id' => $categoryId], '添加成功');
    }
    
    /**
     * 编辑分类
     */
    public function categoryUpdate()
    {
        $this->requireAdmin();
        
        $id = $this->getParam('id');
        $name = $this->getParam('name');
        $icon = $this->getParam('icon');
        $sort = $this->getParam('sort');
        $status = $this->getParam('status');
        
        if (!$id) {
            Response::error('请传入分类ID');
        }
        
        $category = $this->db->fetch(
            'SELECT * FROM `categories` WHERE `id` = :id LIMIT 1',
            ['id' => $id]
        );
        
        if (!$category) {
            Response::notFound('分类不存在');
        }
        
        $updateData = [];
        
        if ($name !== null) {
            $updateData['name'] = $name;
        }
        
        if ($icon !== null) {
            $updateData['icon'] = $icon;
        }
        
        if ($sort !== null) {
            $updateData['sort'] = $sort;
        }
        
        if ($status !== null) {
            $updateData['status'] = $status;
        }
        
        if (empty($updateData)) {
            Response::error('没有需要更新的内容');
        }
        
        $this->db->update(
            'categories',
            $updateData,
            '`id` = :id',
            ['id' => $id]
        );
        
        Response::success([], '更新成功');
    }
}
