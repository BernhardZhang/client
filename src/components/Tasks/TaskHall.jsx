import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Avatar,
  Typography,
  message,
  Empty,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Tooltip,
  Badge,
  Modal,
  Descriptions,
  Pagination,
  Layout,
  Menu,
  Divider,
  List,
  Timeline
} from 'antd';
import {
  ShopOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  ProjectOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  HomeOutlined,
  DollarOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  MessageOutlined,
  FileTextOutlined,
  StarOutlined,
  BarChartOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import LoginPrompt from '../Auth/LoginPrompt';
import useAuthStore from '../../stores/authStore';
import { tasksAPI } from '../../services/api';
import './TaskHall.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Sider, Content } = Layout;

const TaskHall = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    priority: 'all',
    project: 'all'
  });
  const [viewingTask, setViewingTask] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [claimingTaskId, setClaimingTaskId] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();

  // 获取项目大厅数据
  const fetchTaskHall = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        search: filters.search || undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined
      };

      const response = await tasksAPI.getTaskHall(params);
      
      if (response.data) {
        setTasks(response.data.tasks || []);
        setPagination({
          current: response.data.page || 1,
          pageSize: response.data.page_size || 20,
          total: response.data.total || 0
        });
      }
    } catch (error) {
      console.error('获取项目大厅数据失败:', error);
      message.error('获取项目大厅数据失败');
      
      // 使用模拟数据作为备用
      const mockTasks = [
        {
          id: 1,
          title: '移动端UI设计优化',
          description: '需要对现有移动端界面进行用户体验优化，包括布局调整、颜色搭配、交互改进等',
          project: { id: 1, name: '智能实验室管理系统' },
          creator: { username: '张三' },
          priority: 'high',
          estimated_hours: 16,
          created_at: '2024-01-20T09:00:00Z',
          tags: ['UI设计', '移动端', '用户体验']
        },
        {
          id: 2,
          title: '数据分析报告生成',
          description: '开发自动化的数据分析报告生成功能，支持多种图表类型和数据源',
          project: { id: 2, name: '学生成绩分析平台' },
          creator: { username: '李四' },
          priority: 'medium',
          estimated_hours: 24,
          created_at: '2024-01-19T14:30:00Z',
          tags: ['数据分析', 'Python', '自动化']
        }
      ];
      
      setTasks(mockTasks);
      setPagination({
        current: 1,
        pageSize: 20,
        total: mockTasks.length
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskHall(pagination.current, pagination.pageSize);
  }, [filters]);

  // 领取任务
  const handleClaimTask = async (taskId) => {
    if (!isAuthenticated()) {
      setShowLoginPrompt(true);
      return;
    }

    setClaimingTaskId(taskId);
    try {
      const response = await tasksAPI.claimTask(taskId);
      message.success('任务领取成功！');
      
      // 刷新任务列表
      fetchTaskHall(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('领取任务失败:', error);
      const errorMessage = error.response?.data?.error || '领取任务失败';
      message.error(errorMessage);
    } finally {
      setClaimingTaskId(null);
    }
  };

  const handleLoginRequired = () => {
    setShowLoginPrompt(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // 查看任务详情
  const handleViewTask = (task) => {
    setViewingTask(task);
    setIsDetailModalVisible(true);
  };

  // 搜索处理
  const handleSearch = (value) => {
    setFilters({ ...filters, search: value });
  };

  // 过滤器处理
  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  // 分页处理
  const handlePageChange = (page, pageSize) => {
    setPagination({ ...pagination, current: page, pageSize });
    fetchTaskHall(page, pageSize);
  };

  // 获取优先级标签
  const getPriorityTag = (priority) => {
    const priorityConfig = {
      low: { color: 'green', text: '低' },
      medium: { color: 'orange', text: '中' },
      high: { color: 'red', text: '高' },
      urgent: { color: 'purple', text: '紧急' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.medium;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

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
      key: '/task-hall',
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
    } else if (key.startsWith('/')) {
      navigate(key);
    }
  };

  // 任务统计
  const taskStats = {
    available: tasks.length,
    highPriority: tasks.filter(task => task.priority === 'high' || task.priority === 'urgent').length,
    totalPages: Math.ceil(pagination.total / pagination.pageSize),
    total: pagination.total
  };

  // 最近任务
  const recentTasks = tasks
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // 表格列定义
  const columns = [
    {
      title: '任务信息',
      key: 'task_info',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Text strong style={{ fontSize: '16px', marginRight: '8px' }}>
              {record.title}
            </Text>
            {getPriorityTag(record.priority)}
          </div>
          <Paragraph 
            ellipsis={{ rows: 2, expandable: true, symbol: '更多' }}
            style={{ marginBottom: '8px', color: '#666' }}
          >
            {record.description}
          </Paragraph>
          <Space wrap>
            <Text type="secondary">
              <ProjectOutlined /> {record.project?.name}
            </Text>
            <Text type="secondary">
              <UserOutlined /> {record.creator?.username}
            </Text>
            <Text type="secondary">
              <ClockCircleOutlined /> 预计 {record.estimated_hours || 0} 小时
            </Text>
          </Space>
        </div>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags) => (
        <Space wrap>
          {(tags || []).map((tag, index) => (
            <Tag key={index} color="blue">{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => (
        <Text type="secondary">
          {dayjs(date).format('MM-DD HH:mm')}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              onClick={() => handleViewTask(record)}
            />
          </Tooltip>
          <Button
            type="primary"
            size="small"
            loading={claimingTaskId === record.id}
            onClick={() => handleClaimTask(record.id)}
            disabled={record.creator?.username === user?.username}
          >
            {record.creator?.username === user?.username ? '自己发布' : '领取任务'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout className="project-hall-layout">
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



      {/* 右侧内容栏 */}
      <Layout>
        <Content className="right-content" style={{ 
          padding: '24px', 
          overflow: 'auto'
        }}>
          {/* 顶部标题和搜索 */}
          <div style={{ marginBottom: '24px' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
              <Title level={2} style={{ margin: 0 }}>
                <AppstoreOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                项目大厅
              </Title>
              <Space>
                <Select
                  value={filters.priority}
                  onChange={(value) => handleFilterChange('priority', value)}
                  style={{ width: 120 }}
                >
                  <Option value="all">全部优先级</Option>
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                  <Option value="urgent">紧急</Option>
                </Select>
                <Button.Group>
                  <Tooltip title="卡片视图">
                    <Button 
                      type={viewMode === 'card' ? 'primary' : 'default'} 
                      icon={<AppstoreOutlined />}
                      onClick={() => setViewMode('card')}
                    />
                  </Tooltip>
                  <Tooltip title="列表视图">
                    <Button 
                      type={viewMode === 'table' ? 'primary' : 'default'} 
                      icon={<BarChartOutlined />}
                      onClick={() => setViewMode('table')}
                    />
                  </Tooltip>
                </Button.Group>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={() => fetchTaskHall(pagination.current, pagination.pageSize)}
                >
                  刷新
                </Button>
              </Space>
            </Row>

            {/* 搜索栏 */}
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Search
                  placeholder="搜索任务标题或描述..."
                  allowClear
                  onSearch={handleSearch}
                  prefix={<SearchOutlined />}
                />
          </Col>
        </Row>
          </div>

          {/* 统计数据 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="可领取任务"
                  value={taskStats.available}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="高优先级任务"
                  value={taskStats.highPriority}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="总页数"
                  value={taskStats.totalPages}
                  prefix={<FlagOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="总任务数"
                  value={taskStats.total}
                  prefix={<ProjectOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
      </Card>
            </Col>
          </Row>

      {/* 任务列表 */}
      <Card>
        {tasks.length === 0 && !loading ? (
          <Empty
            description="暂无可领取的任务"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            {viewMode === 'card' ? (
              <Row gutter={[16, 16]}>
                {tasks.map((task) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={task.id}>
                    <Card
                      hoverable
                      actions={[
                        <Button 
                          type="link" 
                          size="small" 
                          icon={<EyeOutlined />}
                          onClick={() => handleViewTask(task)}
                        >
                          查看详情
                        </Button>,
                        <Button 
                          type="primary" 
                          size="small"
                          onClick={() => handleClaimTask(task.id)}
                          loading={claimingTaskId === task.id}
                        >
                          领取任务
                        </Button>
                      ]}
                    >
                      <Card.Meta
                        avatar={<Avatar icon={<ProjectOutlined />} />}
                        title={
                          <Space>
                            <Text strong>{task.title}</Text>
                            {getPriorityTag(task.priority)}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {task.description?.substring(0, 80)}...
                            </Text>
                            <Space>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                <ProjectOutlined /> {task.project?.name}
                              </Text>
                            </Space>
                            <Space>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                <UserOutlined /> {task.creator?.username}
                              </Text>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                <ClockCircleOutlined /> {task.estimated_hours || 0}h
                              </Text>
                            </Space>
                            {task.tags && task.tags.length > 0 && (
                              <div>
                                {task.tags.slice(0, 3).map((tag, index) => (
                                  <Tag key={index} size="small" color="blue">{tag}</Tag>
                                ))}
                                {task.tags.length > 3 && (
                                  <Tag size="small">+{task.tags.length - 3}</Tag>
                                )}
                              </div>
                            )}
                          </Space>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Table
                columns={columns}
                dataSource={tasks}
                loading={loading}
                pagination={false}
                rowKey="id"
                size="middle"
              />
            )}
            
            {/* 分页 */}
            {pagination.total > 0 && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) => 
                    `第 ${range[0]}-${range[1]} 条，共 ${total} 条任务`
                  }
                />
              </div>
            )}
          </>
        )}
      </Card>
        </Content>
      </Layout>

      {/* 任务详情Modal */}
      <Modal
        title="任务详情"
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setViewingTask(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsDetailModalVisible(false)}>
            关闭
          </Button>,
          viewingTask && viewingTask.creator?.username !== user?.username && (
            <Button
              key="claim"
              type="primary"
              loading={claimingTaskId === viewingTask?.id}
              onClick={() => {
                handleClaimTask(viewingTask.id);
                setIsDetailModalVisible(false);
              }}
            >
              领取任务
            </Button>
          )
        ]}
        width={700}
      >
        {viewingTask && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="任务标题" span={2}>
                <Text strong>{viewingTask.title}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="所属项目" span={2}>
                <Text>{viewingTask.project?.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="发布者">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {viewingTask.creator?.username}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                {getPriorityTag(viewingTask.priority)}
              </Descriptions.Item>
              <Descriptions.Item label="预计工时">
                {viewingTask.estimated_hours || 0} 小时
              </Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {dayjs(viewingTask.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="任务描述" span={2}>
                <Paragraph>{viewingTask.description}</Paragraph>
              </Descriptions.Item>
              {viewingTask.tags && viewingTask.tags.length > 0 && (
                <Descriptions.Item label="相关标签" span={2}>
                  <Space wrap>
                    {viewingTask.tags.map((tag, index) => (
                      <Tag key={index} color="blue">{tag}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* 登录提示 */}
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="请登录后领取任务"
      />
    </Layout>
  );
};

export default TaskHall;