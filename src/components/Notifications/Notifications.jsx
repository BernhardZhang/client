import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Avatar,
  Typography,
  Tag,
  Button,
  Space,
  Empty,
  Badge,
  Divider,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
  Timeline,
  Progress,
  Layout,
  Menu
} from 'antd';
import {
  BellOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  UserOutlined,
  ProjectOutlined,
  DollarOutlined,
  TeamOutlined,
  TrophyOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  SearchOutlined,
  ReloadOutlined,
  SettingOutlined,
  StarOutlined,
  FireOutlined,
  ClockCircleOutlined,
  MailOutlined,
  NotificationOutlined,
  HomeOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  LoginOutlined,
  LogoutOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import './Notifications.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Sider, Content } = Layout;

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: ''
  });
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // 主导航菜单项
  const mainNavItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: '/project-hall',
      icon: <AppstoreOutlined />,
      label: '项目大厅',
    },
    {
      key: '/points',
      icon: <StarOutlined />,
      label: '积分统计',
    },
    {
      key: '/finance',
      icon: <DollarOutlined />,
      label: '财务管理',
    },
    {
      key: '/evaluation',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
  ];

  // 功能菜单项
  const functionItems = [
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: '消息通知',
    },
    {
      key: 'messages',
      icon: <MessageOutlined />,
      label: '私信',
    },
    {
      key: 'documents',
      icon: <FileTextOutlined />,
      label: '文档中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'notifications') {
      navigate('/notifications');
    } else if (key === 'settings') {
      navigate('/settings');
    } else if (key.startsWith('/')) {
      navigate(key);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // 模拟通知数据
  const mockNotifications = [
    {
      id: 1,
      type: 'project',
      title: '项目邀请通知',
      content: '您被邀请加入项目"智能数据分析平台"，请及时查看项目详情。',
      sender: '张三',
      sender_avatar: null,
      project_name: '智能数据分析平台',
      project_id: 1,
      status: 'unread',
      priority: 'high',
      created_at: '2024-01-15T10:30:00Z',
      read_at: null,
      action_url: '/projects/1',
      action_text: '查看项目'
    },
    {
      id: 2,
      type: 'investment',
      title: '投资成功通知',
      content: '您对项目"区块链应用开发"的投资已成功，投资金额：0.5元，您已成为该项目股东。',
      sender: '系统',
      sender_avatar: null,
      project_name: '区块链应用开发',
      project_id: 2,
      status: 'read',
      priority: 'medium',
      created_at: '2024-01-15T09:15:00Z',
      read_at: '2024-01-15T09:20:00Z',
      action_url: '/projects/2',
      action_text: '查看投资详情'
    },
    {
      id: 3,
      type: 'task',
      title: '任务分配通知',
      content: '您被分配了新任务"用户界面设计"，截止时间：2024-01-20，请及时处理。',
      sender: '李四',
      sender_avatar: null,
      project_name: '移动应用开发',
      project_id: 3,
      status: 'unread',
      priority: 'high',
      created_at: '2024-01-15T08:45:00Z',
      read_at: null,
      action_url: '/projects/3/tasks',
      action_text: '查看任务'
    },
    {
      id: 4,
      type: 'system',
      title: '系统维护通知',
      content: '系统将于2024-01-16 02:00-04:00进行维护升级，期间可能影响正常使用，请提前做好准备。',
      sender: '系统管理员',
      sender_avatar: null,
      project_name: null,
      project_id: null,
      status: 'read',
      priority: 'low',
      created_at: '2024-01-14T16:00:00Z',
      read_at: '2024-01-14T16:05:00Z',
      action_url: null,
      action_text: null
    },
    {
      id: 5,
      type: 'voting',
      title: '投票邀请通知',
      content: '项目"AI算法优化"发起成员评价投票，请参与投票以完成团队评价。',
      sender: '王五',
      sender_avatar: null,
      project_name: 'AI算法优化',
      project_id: 4,
      status: 'unread',
      priority: 'medium',
      created_at: '2024-01-14T14:30:00Z',
      read_at: null,
      action_url: '/projects/4/voting',
      action_text: '参与投票'
    },
    {
      id: 6,
      type: 'finance',
      title: '分红到账通知',
      content: '您参与的项目"电商平台开发"本月分红已到账，金额：2.5元，请查收。',
      sender: '财务系统',
      sender_avatar: null,
      project_name: '电商平台开发',
      project_id: 5,
      status: 'read',
      priority: 'medium',
      created_at: '2024-01-14T10:00:00Z',
      read_at: '2024-01-14T10:05:00Z',
      action_url: '/finance',
      action_text: '查看财务'
    }
  ];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('获取通知失败:', error);
      message.error('获取通知失败');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      project: <ProjectOutlined style={{ color: '#1890ff' }} />,
      investment: <DollarOutlined style={{ color: '#52c41a' }} />,
      task: <TrophyOutlined style={{ color: '#fa8c16' }} />,
      system: <SettingOutlined style={{ color: '#722ed1' }} />,
      voting: <StarOutlined style={{ color: '#eb2f96' }} />,
      finance: <DollarOutlined style={{ color: '#13c2c2' }} />
    };
    return iconMap[type] || <BellOutlined />;
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      high: 'red',
      medium: 'orange',
      low: 'blue'
    };
    return colorMap[priority] || 'default';
  };

  const getPriorityText = (priority) => {
    const textMap = {
      high: '高',
      medium: '中',
      low: '低'
    };
    return textMap[priority] || '普通';
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      // 模拟API调用
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'read', read_at: new Date().toISOString() }
            : notif
        )
      );
      message.success('已标记为已读');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev => 
        prev.map(notif => 
          notif.status === 'unread' 
            ? { ...notif, status: 'read', read_at: new Date().toISOString() }
            : notif
        )
      );
      message.success('已全部标记为已读');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      message.success('通知已删除');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleDeleteSelected = async () => {
    try {
      setNotifications(prev => prev.filter(notif => !selectedNotifications.includes(notif.id)));
      setSelectedNotifications([]);
      message.success('已删除选中的通知');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesType = filters.type === 'all' || notif.type === filters.type;
    const matchesStatus = filters.status === 'all' || notif.status === filters.status;
    const matchesSearch = !filters.search || 
      notif.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      notif.content.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  const unreadCount = notifications.filter(notif => notif.status === 'unread').length;
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    today: notifications.filter(notif => 
      dayjs(notif.created_at).isSame(dayjs(), 'day')
    ).length
  };

  return (
    <Layout className="notifications-layout">
      {/* 左侧总导航栏 */}
      <Sider 
        width={200} 
        collapsible 
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="left-sider"
      >
        <div style={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #303030'
        }}>
          <Text strong style={{ 
            fontSize: collapsed ? '16px' : '18px', 
            color: '#fff',
            whiteSpace: 'nowrap'
          }}>
            {collapsed ? '功分' : '功分易'}
          </Text>
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={mainNavItems}
          onClick={handleMenuClick}
          className="nav-menu"
        />
        
        <Divider style={{ margin: '16px 0', borderColor: '#303030' }} />
        
        <Menu
          theme="dark"
          mode="inline"
          items={functionItems}
          onClick={handleMenuClick}
          className="nav-menu"
        />
        
        {/* 用户信息区域 */}
        <div className="user-info-area">
          {isAuthenticated() ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar size="small" src={user?.avatar} icon={<UserOutlined />} />
              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: '#fff', fontSize: '12px' }} ellipsis>
                    {user?.username}
                  </Text>
                  <div>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<LogoutOutlined />}
                      onClick={handleLogout}
                      style={{ color: '#fff', padding: 0, height: 'auto' }}
                    >
                      {!collapsed && '退出'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              {!collapsed && (
                <div>
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<LoginOutlined />}
                    onClick={() => navigate('/')}
                    style={{ color: '#fff', padding: 0, height: 'auto' }}
                  >
                    登录
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Sider>

      {/* 右侧内容区域 */}
      <Layout>
        <Content className="right-content" style={{ 
          padding: '24px', 
          overflow: 'auto',
          background: '#f5f5f5', 
          minHeight: '100vh'
        }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
            }}>
              <BellOutlined style={{ color: 'white', fontSize: 24 }} />
            </div>
            <div>
              <Title level={2} style={{ margin: 0, color: '#262626' }}>
                消息通知
                {unreadCount > 0 && (
                  <Badge count={unreadCount} style={{ marginLeft: 12 }} />
                )}
              </Title>
              <Text type="secondary">管理系统推送的消息通知</Text>
            </div>
          </div>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchNotifications}
              loading={loading}
            >
              刷新
            </Button>
            {unreadCount > 0 && (
              <Button 
                type="primary" 
                onClick={handleMarkAllAsRead}
              >
                全部已读
              </Button>
            )}
          </Space>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="总通知数"
                value={stats.total}
                prefix={<NotificationOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="未读通知"
                value={stats.unread}
                prefix={<BellOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="今日通知"
                value={stats.today}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 筛选和搜索 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Search
              placeholder="搜索通知内容"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onSearch={(value) => setFilters(prev => ({ ...prev, search: value }))}
              enterButton
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="通知类型"
              value={filters.type}
              onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              style={{ width: '100%' }}
            >
              <Option value="all">全部类型</Option>
              <Option value="project">项目相关</Option>
              <Option value="investment">投资相关</Option>
              <Option value="task">任务相关</Option>
              <Option value="voting">投票相关</Option>
              <Option value="finance">财务相关</Option>
              <Option value="system">系统通知</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="读取状态"
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              style={{ width: '100%' }}
            >
              <Option value="all">全部状态</Option>
              <Option value="unread">未读</Option>
              <Option value="read">已读</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button 
              type="primary" 
              icon={<FilterOutlined />}
              onClick={() => setFilters({ type: 'all', status: 'all', search: '' })}
            >
              重置筛选
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 通知列表 */}
      <Card>
        {selectedNotifications.length > 0 && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', borderRadius: 6 }}>
            <Space>
              <Text>已选择 {selectedNotifications.length} 条通知</Text>
              <Popconfirm
                title="确定要删除选中的通知吗？"
                onConfirm={handleDeleteSelected}
                okText="确定"
                cancelText="取消"
              >
                <Button danger size="small" icon={<DeleteOutlined />}>
                  删除选中
                </Button>
              </Popconfirm>
            </Space>
          </div>
        )}

        <List
          loading={loading}
          dataSource={filteredNotifications}
          locale={{ emptyText: <Empty description="暂无通知" /> }}
          renderItem={(notification) => (
            <List.Item
              style={{
                background: notification.status === 'unread' ? '#f6ffed' : 'white',
                border: notification.status === 'unread' ? '1px solid #b7eb8f' : '1px solid #f0f0f0',
                borderRadius: 8,
                marginBottom: 8,
                padding: 16,
                transition: 'all 0.3s ease'
              }}
              actions={[
                <Space key="actions">
                  {notification.status === 'unread' && (
                    <Tooltip title="标记为已读">
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleMarkAsRead(notification.id)}
                      />
                    </Tooltip>
                  )}
                  {notification.action_url && (
                    <Tooltip title={notification.action_text}>
                      <Button 
                        type="link" 
                        size="small" 
                        icon={<EyeOutlined />}
                        href={notification.action_url}
                      >
                        {notification.action_text}
                      </Button>
                    </Tooltip>
                  )}
                  <Popconfirm
                    title="确定要删除这条通知吗？"
                    onConfirm={() => handleDeleteNotification(notification.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Tooltip title="删除">
                      <Button 
                        type="text" 
                        size="small" 
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ position: 'relative' }}>
                    <Avatar 
                      size={48} 
                      icon={getNotificationIcon(notification.type)}
                      style={{ 
                        background: notification.status === 'unread' ? '#1890ff' : '#d9d9d9',
                        border: '2px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    {notification.status === 'unread' && (
                      <div style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#ff4d4f',
                        border: '2px solid white'
                      }} />
                    )}
                  </div>
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 16 }}>{notification.title}</Text>
                    <Tag color={getPriorityColor(notification.priority)} size="small">
                      {getPriorityText(notification.priority)}
                    </Tag>
                    {notification.project_name && (
                      <Tag color="blue" size="small">
                        {notification.project_name}
                      </Tag>
                    )}
                  </div>
                }
                description={
                  <div>
                    <Paragraph 
                      style={{ 
                        marginBottom: 8, 
                        color: notification.status === 'unread' ? '#262626' : '#8c8c8c',
                        fontSize: 14
                      }}
                      ellipsis={{ rows: 2 }}
                    >
                      {notification.content}
                    </Paragraph>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#8c8c8c' }}>
                      <Space>
                        <UserOutlined />
                        <Text>{notification.sender}</Text>
                      </Space>
                      <Space>
                        <ClockCircleOutlined />
                        <Text>{dayjs(notification.created_at).format('YYYY-MM-DD HH:mm')}</Text>
                      </Space>
                      {notification.read_at && (
                        <Space>
                          <CheckCircleOutlined />
                          <Text>已读于 {dayjs(notification.read_at).format('MM-DD HH:mm')}</Text>
                        </Space>
                      )}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Notifications;
