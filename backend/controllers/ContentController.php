<?php
/**
 * 内容控制器
 */
class ContentController extends Controller
{
    /**
     * 获取分类列表
     */
    public function categories()
    {
        $categories = $this->db->fetchAll(
            'SELECT * FROM `categories` 
             WHERE `status` = 1 
             ORDER BY `sort` ASC'
        );
        
        Response::success($categories);
    }
    
    /**
     * 每日推荐
     */
    public function daily()
    {
        $today = date('Y-m-d');
        
        $daily = $this->db->fetch(
            'SELECT dr.*, c.*, cat.name as category_name 
             FROM `daily_recommendations` dr 
             LEFT JOIN `contents` c ON dr.content_id = c.id 
             LEFT JOIN `categories` cat ON c.category_id = cat.id 
             WHERE dr.date = :date 
             LIMIT 1',
            ['date' => $today]
        );
        
        if ($daily) {
            $this->db->update(
                'contents',
                ['view_count' => $daily['view_count'] + 1],
                '`id` = :id',
                ['id' => $daily['id']]
            );
            
            $isFavorite = false;
            $user = $this->getCurrentUser();
            if ($user) {
                $favorite = $this->db->fetch(
                    'SELECT * FROM `favorites` WHERE `user_id` = :user_id AND `content_id` = :content_id LIMIT 1',
                    ['user_id' => $user['id'], 'content_id' => $daily['id']]
                );
                $isFavorite = !!$favorite;
            }
            
            $daily['is_favorite'] = $isFavorite;
            
            Response::success($daily);
        }
        
        $content = $this->db->fetch(
            'SELECT c.*, cat.name as category_name 
             FROM `contents` c 
             LEFT JOIN `categories` cat ON c.category_id = cat.id 
             WHERE c.status = 1 
             ORDER BY RAND() 
             LIMIT 1'
        );
        
        if (!$content) {
            Response::success([], '暂无推荐内容');
        }
        
        $this->db->insert('daily_recommendations', [
            'date' => $today,
            'content_id' => $content['id']
        ]);
        
        $this->db->update(
            'contents',
            ['view_count' => $content['view_count'] + 1],
            '`id` = :id',
            ['id' => $content['id']]
        );
        
        $isFavorite = false;
        $user = $this->getCurrentUser();
        if ($user) {
            $favorite = $this->db->fetch(
                'SELECT * FROM `favorites` WHERE `user_id` = :user_id AND `content_id` = :content_id LIMIT 1',
                ['user_id' => $user['id'], 'content_id' => $content['id']]
            );
            $isFavorite = !!$favorite;
        }
        
        $content['is_favorite'] = $isFavorite;
        
        Response::success($content);
    }
    
    /**
     * 获取当前登录用户（不强制登录）
     */
    private function getCurrentUser()
    {
        $token = JWT::getTokenFromHeader();
        
        if (!$token) {
            return null;
        }
        
        $payload = JWT::decode($token);
        
        if (!$payload || !isset($payload['sub'])) {
            return null;
        }
        
        $userId = $payload['sub'];
        
        $user = $this->db->fetch(
            'SELECT * FROM `users` WHERE `id` = :id LIMIT 1',
            ['id' => $userId]
        );
        
        return $user;
    }
    
    /**
     * 内容列表
     */
    public function lists()
    {
        $categoryId = $this->getParam('category_id');
        $page = $this->getParam('page', 1);
        $pageSize = $this->getParam('page_size', 20);
        list($page, $pageSize, $offset) = $this->validatePageParams($page, $pageSize);
        
        $where = 'c.status = 1';
        $params = [];
        
        if ($categoryId) {
            $where .= ' AND c.category_id = :category_id';
            $params['category_id'] = $categoryId;
        }
        
        $total = $this->db->fetch(
            "SELECT COUNT(*) as count FROM `contents` c WHERE $where",
            $params
        );
        
        $contents = $this->db->fetchAll(
            "SELECT c.*, cat.name as category_name 
             FROM `contents` c 
             LEFT JOIN `categories` cat ON c.category_id = cat.id 
             WHERE $where 
             ORDER BY c.id DESC 
             LIMIT :offset, :limit",
            array_merge($params, [
                'offset' => $offset,
                'limit' => $pageSize
            ])
        );
        
        $user = $this->getCurrentUser();
        
        foreach ($contents as &$content) {
            $content['is_favorite'] = false;
            if ($user) {
                $favorite = $this->db->fetch(
                    'SELECT * FROM `favorites` WHERE `user_id` = :user_id AND `content_id` = :content_id LIMIT 1',
                    ['user_id' => $user['id'], 'content_id' => $content['id']]
                );
                $content['is_favorite'] = !!$favorite;
            }
        }
        
        Response::success([
            'total' => intval($total['count']),
            'page' => $page,
            'page_size' => $pageSize,
            'list' => $contents
        ]);
    }
    
    /**
     * 内容详情
     */
    public function detail()
    {
        $id = $this->getParam('id');
        
        if (!$id) {
            Response::error('请传入内容ID');
        }
        
        $content = $this->db->fetch(
            'SELECT c.*, cat.name as category_name 
             FROM `contents` c 
             LEFT JOIN `categories` cat ON c.category_id = cat.id 
             WHERE c.id = :id AND c.status = 1 
             LIMIT 1',
            ['id' => $id]
        );
        
        if (!$content) {
            Response::notFound('内容不存在');
        }
        
        $this->db->update(
            'contents',
            ['view_count' => $content['view_count'] + 1],
            '`id` = :id',
            ['id' => $id]
        );
        
        $isFavorite = false;
        $user = $this->getCurrentUser();
        if ($user) {
            $favorite = $this->db->fetch(
                'SELECT * FROM `favorites` WHERE `user_id` = :user_id AND `content_id` = :content_id LIMIT 1',
                ['user_id' => $user['id'], 'content_id' => $content['id']]
            );
            $isFavorite = !!$favorite;
        }
        
        $content['is_favorite'] = $isFavorite;
        $content['view_count'] += 1;
        
        Response::success($content);
    }
    
    /**
     * 收藏/取消收藏
     */
    public function favorite()
    {
        $user = $this->requireLogin();
        
        $contentId = $this->getParam('content_id');
        
        if (!$contentId) {
            Response::error('请传入内容ID');
        }
        
        $content = $this->db->fetch(
            'SELECT * FROM `contents` WHERE `id` = :id AND `status` = 1 LIMIT 1',
            ['id' => $contentId]
        );
        
        if (!$content) {
            Response::notFound('内容不存在');
        }
        
        $favorite = $this->db->fetch(
            'SELECT * FROM `favorites` WHERE `user_id` = :user_id AND `content_id` = :content_id LIMIT 1',
            ['user_id' => $user['id'], 'content_id' => $contentId]
        );
        
        if ($favorite) {
            $this->db->delete(
                'favorites',
                '`id` = :id',
                ['id' => $favorite['id']]
            );
            
            $this->db->update(
                'contents',
                ['favorite_count' => max(0, $content['favorite_count'] - 1)],
                '`id` = :id',
                ['id' => $contentId]
            );
            
            Response::success(['is_favorite' => false], '已取消收藏');
        } else {
            $this->db->insert('favorites', [
                'user_id' => $user['id'],
                'content_id' => $contentId
            ]);
            
            $this->db->update(
                'contents',
                ['favorite_count' => $content['favorite_count'] + 1],
                '`id` = :id',
                ['id' => $contentId]
            );
            
            Response::success(['is_favorite' => true], '已收藏');
        }
    }
    
    /**
     * 我的收藏列表
     */
    public function myFavorites()
    {
        $user = $this->requireLogin();
        
        $page = $this->getParam('page', 1);
        $pageSize = $this->getParam('page_size', 20);
        list($page, $pageSize, $offset) = $this->validatePageParams($page, $pageSize);
        
        $total = $this->db->fetch(
            'SELECT COUNT(*) as count 
             FROM `favorites` f 
             LEFT JOIN `contents` c ON f.content_id = c.id 
             WHERE f.user_id = :user_id AND c.status = 1',
            ['user_id' => $user['id']]
        );
        
        $favorites = $this->db->fetchAll(
            'SELECT f.*, c.*, cat.name as category_name 
             FROM `favorites` f 
             LEFT JOIN `contents` c ON f.content_id = c.id 
             LEFT JOIN `categories` cat ON c.category_id = cat.id 
             WHERE f.user_id = :user_id AND c.status = 1 
             ORDER BY f.id DESC 
             LIMIT :offset, :limit',
            [
                'user_id' => $user['id'],
                'offset' => $offset,
                'limit' => $pageSize
            ]
        );
        
        foreach ($favorites as &$favorite) {
            $favorite['is_favorite'] = true;
        }
        
        Response::success([
            'total' => intval($total['count']),
            'page' => $page,
            'page_size' => $pageSize,
            'list' => $favorites
        ]);
    }
    
    /**
     * 发布内容
     */
    public function publish()
    {
        $user = $this->requireLogin();
        
        $categoryId = $this->getParam('category_id');
        $title = $this->getParam('title');
        $content = $this->getParam('content');
        $author = $this->getParam('author');
        
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
        
        if (mb_strlen($content) < 10) {
            Response::error('内容至少需要10个字符');
        }
        
        if (mb_strlen($content) > 5000) {
            Response::error('内容不能超过5000个字符');
        }
        
        $contentId = $this->db->insert('contents', [
            'category_id' => $categoryId,
            'title' => $title ?: '',
            'content' => $content,
            'author' => $author ?: '',
            'user_id' => $user['id'],
            'status' => 0,
            'view_count' => 0,
            'favorite_count' => 0
        ]);
        
        Response::success([
            'id' => $contentId,
            'status' => 0
        ], '发布成功，等待审核');
    }
    
    /**
     * 我的发布列表
     */
    public function myPublish()
    {
        $user = $this->requireLogin();
        
        $page = $this->getParam('page', 1);
        $pageSize = $this->getParam('page_size', 20);
        list($page, $pageSize, $offset) = $this->validatePageParams($page, $pageSize);
        
        $total = $this->db->fetch(
            'SELECT COUNT(*) as count FROM `contents` WHERE `user_id` = :user_id',
            ['user_id' => $user['id']]
        );
        
        $contents = $this->db->fetchAll(
            'SELECT c.*, cat.name as category_name 
             FROM `contents` c 
             LEFT JOIN `categories` cat ON c.category_id = cat.id 
             WHERE c.user_id = :user_id 
             ORDER BY c.id DESC 
             LIMIT :offset, :limit',
            [
                'user_id' => $user['id'],
                'offset' => $offset,
                'limit' => $pageSize
            ]
        );
        
        $statusNames = [
            0 => '待审核',
            1 => '已通过',
            2 => '已拒绝'
        ];
        
        foreach ($contents as &$content) {
            $content['status_name'] = isset($statusNames[$content['status']]) ? $statusNames[$content['status']] : '未知';
            $content['is_favorite'] = false;
            $favorite = $this->db->fetch(
                'SELECT * FROM `favorites` WHERE `user_id` = :user_id AND `content_id` = :content_id LIMIT 1',
                ['user_id' => $user['id'], 'content_id' => $content['id']]
            );
            $content['is_favorite'] = !!$favorite;
        }
        
        Response::success([
            'total' => intval($total['count']),
            'page' => $page,
            'page_size' => $pageSize,
            'list' => $contents
        ]);
    }
    
    /**
     * 搜索内容
     */
    public function search()
    {
        $keyword = $this->getParam('keyword');
        $page = $this->getParam('page', 1);
        $pageSize = $this->getParam('page_size', 20);
        list($page, $pageSize, $offset) = $this->validatePageParams($page, $pageSize);
        
        if (!$keyword) {
            Response::error('请输入搜索关键词');
        }
        
        $searchKeyword = "%$keyword%";
        
        $total = $this->db->fetch(
            'SELECT COUNT(*) as count 
             FROM `contents` 
             WHERE `status` = 1 
             AND (`title` LIKE :keyword OR `content` LIKE :keyword OR `author` LIKE :keyword)',
            ['keyword' => $searchKeyword]
        );
        
        $contents = $this->db->fetchAll(
            'SELECT c.*, cat.name as category_name 
             FROM `contents` c 
             LEFT JOIN `categories` cat ON c.category_id = cat.id 
             WHERE c.status = 1 
             AND (c.title LIKE :keyword OR c.content LIKE :keyword OR c.author LIKE :keyword) 
             ORDER BY c.id DESC 
             LIMIT :offset, :limit',
            [
                'keyword' => $searchKeyword,
                'offset' => $offset,
                'limit' => $pageSize
            ]
        );
        
        $user = $this->getCurrentUser();
        
        foreach ($contents as &$content) {
            $content['is_favorite'] = false;
            if ($user) {
                $favorite = $this->db->fetch(
                    'SELECT * FROM `favorites` WHERE `user_id` = :user_id AND `content_id` = :content_id LIMIT 1',
                    ['user_id' => $user['id'], 'content_id' => $content['id']]
                );
                $content['is_favorite'] = !!$favorite;
            }
        }
        
        Response::success([
            'total' => intval($total['count']),
            'page' => $page,
            'page_size' => $pageSize,
            'list' => $contents
        ]);
    }
}
