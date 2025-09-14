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
  Timeline,
  Progress
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
  TeamOutlined,
  TrophyOutlined,
  AppstoreOutlined,
  FireOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import LoginPrompt from '../Auth/LoginPrompt';
import useAuthStore from '../../stores/authStore';
import useProjectStore from '../../stores/projectStore';
import api from '../../services/api';
import './ProjectHall.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Sider, Content } = Layout;

const ProjectHall = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all'
  });
  const [viewingProject, setViewingProject] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { fetchProjects } = useProjectStore();

  // 获取公开项目数据
  const fetchPublicProjects = async (page = 1, pageSize = 12) => {
    setLoading(true);
    try {
      // 直接调用后端的公开项目API
      console.log('Fetching public projects from API...');
      const response = await api.get('/projects/public/');
      console.log('Public projects response:', response.data);
      const publicProjects = response.data.results || response.data || [];
      
      console.log('Found public projects:', publicProjects.length);
      setProjects(publicProjects);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: publicProjects.length
      }));
    } catch (error) {
      console.error('Error fetching public projects:', error);
      message.error('获取公开项目数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicProjects();
  }, []);

  // 添加一个刷新公开项目的处理函数
  const handleRefreshProjects = () => {
    fetchPublicProjects();
  };

  const handleLoginRequired = () => {
    setShowLoginPrompt(true);
  };

  const handlePromptLogin = () => {
    setShowLoginPrompt(false);
    // 这里可以触发登录流程
  };

  const handlePromptRegister = () => {
    setShowLoginPrompt(false);
    // 这里可以触发注册流程
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
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
    } else if (key.startsWith('/')) {
      navigate(key);
    }
  };

  // 项目统计
  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    recruiting: projects.filter(p => p.status === 'recruiting').length,
    totalMembers: projects.reduce((sum, p) => sum + (p.members_count || 0), 0),
    totalTasks: projects.reduce((sum, p) => sum + (p.task_count || 0), 0)
  };

  // 最近项目
  const recentProjects = projects
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // 热门项目
  const popularProjects = projects
    .sort((a, b) => (b.members_count || 0) - (a.members_count || 0))
    .slice(0, 5);

  const handleViewProject = (project) => {
    setViewingProject(project);
    setIsDetailModalVisible(true);
  };

  const handleJoinProject = (project) => {
    if (!isAuthenticated()) {
      handleLoginRequired();
      return;
    }
    message.success(`已申请加入项目：${project.name}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'completed': return 'blue';
      case 'recruiting': return 'orange';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return '进行中';
      case 'completed': return '已完成';
      case 'recruiting': return '招募中';
      case 'pending': return '待启动';
      default: return '未知';
    }
  };

  const columns = [
    {
      title: '项目信息',
      key: 'info',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <Avatar size="small" icon={<ProjectOutlined />} />
            <Text strong>{record.name}</Text>
            <Tag color={getStatusColor(record.status)}>
              {getStatusText(record.status)}
            </Tag>
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description?.substring(0, 100)}...
          </Text>
        </Space>
      ),
    },
    {
      title: '进度',
      key: 'progress',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Progress 
            percent={record.progress || 0} 
            size="small" 
            status={record.status === 'completed' ? 'success' : 'active'}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.completed_tasks || 0}/{record.task_count || 0} 任务
          </Text>
        </Space>
      ),
    },
    {
      title: '团队',
      key: 'team',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <TeamOutlined />
            <Text>{record.members_count || 0} 成员</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            估值: ¥{record.valuation || 0}
          </Text>
        </Space>
      ),
    },
    {
      title: '热度',
      key: 'heat',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <FireOutlined style={{ color: '#ff4d4f' }} />
            <Text>{record.view_count || Math.floor(Math.random() * 1000) + 100}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            浏览热度
          </Text>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewProject(record)}
          >
            查看
          </Button>
          <Button 
            type="primary" 
            size="small"
            onClick={() => handleJoinProject(record)}
          >
            加入
          </Button>
        </Space>
      ),
    },
  ];

  const renderProjectCard = (project) => (
    <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
      <Card
        hoverable
        actions={[
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewProject(project)}
          >
            查看详情
          </Button>,
          <Button 
            type="primary" 
            size="small"
            onClick={() => handleJoinProject(project)}
          >
            加入项目
          </Button>
        ]}
      >
        <Card.Meta
          avatar={<Avatar size="large" icon={<ProjectOutlined />} />}
          title={
            <Space>
              <Text strong>{project.name}</Text>
              <Tag color={getStatusColor(project.status)}>
                {getStatusText(project.status)}
              </Tag>
            </Space>
          }
          description={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {project.description?.substring(0, 80)}...
              </Text>
              <Progress 
                percent={project.progress || 0} 
                size="small" 
                status={project.status === 'completed' ? 'success' : 'active'}
              />
              <Row gutter={8}>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <TeamOutlined /> {project.members_count || 0} 成员
                  </Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <TrophyOutlined /> {project.task_count || 0} 任务
                  </Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <FireOutlined /> {project.view_count || Math.floor(Math.random() * 1000) + 100} 热度
                  </Text>
                </Col>
              </Row>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                估值: ¥{project.valuation || 0}
              </Text>
            </Space>
          }
        />
      </Card>
    </Col>
  );

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
                    onClick={handleLoginRequired}
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
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                style={{ width: 120 }}
              >
                <Option value="all">全部状态</Option>
                <Option value="active">进行中</Option>
                <Option value="recruiting">招募中</Option>
                <Option value="completed">已完成</Option>
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
            </Space>
          </Row>

          {/* 搜索栏 */}
          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col span={12}>
              <Search
                placeholder="搜索项目名称或描述"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onSearch={(value) => setFilters(prev => ({ ...prev, search: value }))}
                enterButton
              />
            </Col>
          </Row>
        </div>

        {/* 统计数据 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="公开项目"
                value={projectStats.total}
                prefix={<ProjectOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="进行中项目"
                value={projectStats.active}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="招募中项目"
                value={projectStats.recruiting}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总成员数"
                value={projectStats.totalMembers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 项目列表 */}
        <Card>
          {viewMode === 'card' ? (
            <Row gutter={[16, 16]}>
              {projects.length > 0 ? (
                projects.map(renderProjectCard)
              ) : (
                <Col span={24}>
                  <Empty description="暂无公开项目" />
                </Col>
              )}
            </Row>
          ) : (
            <Table
              columns={columns}
              dataSource={projects}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
            />
          )}
        </Card>
        </Content>
      </Layout>
      
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="请登录后加入项目"
        onLogin={handlePromptLogin}
        onRegister={handlePromptRegister}
      />

      {/* 项目详情模态框 */}
      <Modal
        title="项目详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="join" 
            type="primary"
            onClick={() => {
              handleJoinProject(viewingProject);
              setIsDetailModalVisible(false);
            }}
          >
            加入项目
          </Button>
        ]}
        width={800}
      >
        {viewingProject && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="项目名称" span={2}>
              {viewingProject.name}
            </Descriptions.Item>
            <Descriptions.Item label="项目状态">
              <Tag color={getStatusColor(viewingProject.status)}>
                {getStatusText(viewingProject.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="项目估值">
              ¥{viewingProject.valuation || 0}
            </Descriptions.Item>
            <Descriptions.Item label="项目描述" span={2}>
              {viewingProject.description}
            </Descriptions.Item>
            <Descriptions.Item label="团队成员">
              {viewingProject.members_count || 0} 人
            </Descriptions.Item>
            <Descriptions.Item label="任务数量">
              {viewingProject.task_count || 0} 个
            </Descriptions.Item>
            <Descriptions.Item label="项目进度" span={2}>
              <Progress 
                percent={viewingProject.progress || 0} 
                status={viewingProject.status === 'completed' ? 'success' : 'active'}
              />
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(viewingProject.created_at).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dayjs(viewingProject.updated_at).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Layout>
  );
};

export default ProjectHall;
