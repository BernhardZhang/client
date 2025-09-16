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
  Progress,
  InputNumber,
  Slider,
  Checkbox
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
  const [detailLoading, setDetailLoading] = useState(false);
  const [projectDetail, setProjectDetail] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  const [isInvestModalVisible, setIsInvestModalVisible] = useState(false);
  const [investProject, setInvestProject] = useState(null);
  const [investAmount, setInvestAmount] = useState(0);
  const [agreeRisk, setAgreeRisk] = useState(false);
  const [investSubmitting, setInvestSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, updateProfile } = useAuthStore();
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
    } else if (key === 'notifications') {
      navigate('/notifications');
    } else if (key === 'settings') {
      navigate('/settings');
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

  const fetchProjectDetail = async (projectId) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/`);
      setProjectDetail(res.data || null);
    } catch (e) {
      console.error('获取项目详情失败:', e);
      setProjectDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewProject = (project) => {
    setViewingProject(project);
    setIsDetailModalVisible(true);
    fetchProjectDetail(project.id);
  };

  const handleOpenInvest = async (project) => {
    if (!isAuthenticated()) {
      handleLoginRequired();
      return;
    }
    try {
      await updateProfile?.();
    } catch (e) {
      console.warn('刷新用户资料失败，继续打开投资弹窗');
    }
    setInvestProject(project);
    setInvestAmount(0);
    setAgreeRisk(false);
    setIsInvestModalVisible(true);
  };

  const handleSubmitInvest = async () => {
    if (!investProject) return;
    if (investAmount <= 0 || investAmount > 1) {
      message.warning('请输入0-1元之间的投资金额');
      return;
    }
    if (typeof user?.balance === 'number' && investAmount > user.balance) {
      message.error('可用额度不足');
      return;
    }
    if (!agreeRisk) {
      message.warning('请勾选风险提示与协议');
      return;
    }
    try {
      setInvestSubmitting(true);
      await api.post(`/projects/${investProject.id}/invest/`, { amount: Number(investAmount.toFixed(2)) });
      message.success('投资成功');
      setIsInvestModalVisible(false);
      setInvestProject(null);
    } catch (error) {
      console.error('投资失败:', error);
      message.error('投资失败，请稍后重试');
    } finally {
      setInvestSubmitting(false);
    }
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
            投资人: {record.investor_count || record.investors_count || 0}
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
            onClick={() => handleOpenInvest(record)}
          >
            投资项目
          </Button>
        </Space>
      ),
    },
  ];

  const renderProjectCard = (project) => (
    <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
      <Card
        hoverable
        style={{
          borderRadius: 12,
          border: '1px solid #f0f0f0',
          boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
          transition: 'all 0.25s ease',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)'
        }}
        bodyStyle={{ padding: 16, minHeight: 220 }}
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
            onClick={() => handleOpenInvest(project)}
          >
            投资项目
          </Button>
        ]}
      >
        {/* 顶部标头 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #e6f4ff 0%, #f0f5ff 100%)',
            border: '1px solid #e6f4ff',
            marginRight: 10
          }}>
            <ProjectOutlined style={{ color: '#1677ff', fontSize: 20 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: 600 }} ellipsis>{project.name}</Text>
              <Tag color={getStatusColor(project.status)}>{getStatusText(project.status)}</Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
              {project.description || '暂无描述'}
            </Text>
          </div>
        </div>

        {/* 进度条 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>项目进度</Text>
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#1677ff' }}>{project.progress || 0}%</Text>
          </div>
          <Progress 
            percent={project.progress || 0} 
            size="small" 
            status={project.status === 'completed' ? 'success' : 'active'}
          />
        </div>

        {/* 指标区域：2x2 等宽网格对齐 */}
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: '#f6ffed', color: '#389e0d', border: '1px solid #b7eb8f',
              padding: '8px 10px', borderRadius: 10, fontSize: 12, width: '100%'
            }}>
              <TeamOutlined />{project.members_count || 0} 成员
            </div>
          </Col>
          <Col span={12}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: '#fff7e6', color: '#d46b08', border: '1px solid #ffd591',
              padding: '8px 10px', borderRadius: 10, fontSize: 12, width: '100%'
            }}>
              <TrophyOutlined />{project.task_count || 0} 任务
            </div>
          </Col>
          <Col span={12}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: '#f9f0ff', color: '#722ed1', border: '1px solid #d3adf7',
              padding: '8px 10px', borderRadius: 10, fontSize: 12, width: '100%'
            }}>
              💼 {project.investor_count || project.investors_count || 0} 投资人
            </div>
          </Col>
          <Col span={12}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: '#fff1f0', color: '#cf1322', border: '1px solid #ffa39e',
              padding: '8px 10px', borderRadius: 10, fontSize: 12, width: '100%'
            }}>
              <FireOutlined />{project.view_count || Math.floor(Math.random() * 1000) + 100} 浏览
            </div>
          </Col>
        </Row>
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
        message="请登录后投资项目"
        onLogin={handlePromptLogin}
        onRegister={handlePromptRegister}
      />

      {/* 项目详情模态框 */
      }
      <Modal
        title="项目详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="invest" 
            type="primary"
            onClick={() => {
              setIsDetailModalVisible(false);
              handleOpenInvest(viewingProject);
            }}
          >
            投资项目
          </Button>
        ]}
        width={800}
      >
        {viewingProject && (
          <>
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
                {projectDetail?.members_count ?? viewingProject.members_count ?? 0} 人
              </Descriptions.Item>
              <Descriptions.Item label="任务数量">
                {projectDetail?.task_count ?? viewingProject.task_count ?? 0} 个
              </Descriptions.Item>
              <Descriptions.Item label="项目进度" span={2}>
                <Progress 
                  percent={projectDetail?.progress ?? viewingProject.progress ?? 0} 
                  status={(projectDetail?.status ?? viewingProject.status) === 'completed' ? 'success' : 'active'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(viewingProject.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs((projectDetail?.updated_at ?? viewingProject.updated_at)).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Row gutter={16}>
                {/* 任务概览 */}
                <Col span={12}>
                  <Card size="small" title="任务概览" loading={detailLoading}>
                    {projectDetail?.tasks?.length ? (
                      <List
                        size="small"
                        dataSource={projectDetail.tasks.slice(0, 5)}
                        renderItem={(t) => (
                          <List.Item>
                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                              <span style={{ maxWidth: 200 }} title={t.title}>{t.title}</span>
                              <Space>
                                <Tag color={t.status === 'completed' ? 'green' : 'blue'}>
                                  {t.status === 'completed' ? '已完成' : '进行中'}
                                </Tag>
                                {typeof t.task_percentage === 'number' && (
                                  <Tag color="geekblue">{t.task_percentage}%</Tag>
                                )}
                              </Space>
                            </Space>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无任务数据" />
                    )}
                  </Card>
                </Col>

                {/* 项目分析内容 */}
                <Col span={12}>
                  <Card size="small" title="项目分析" loading={detailLoading}>
                    <Typography.Paragraph style={{ marginBottom: 8 }}>
                      {projectDetail?.analysis_content || projectDetail?.analysis_summary || '暂无项目分析内容'}
                    </Typography.Paragraph>
                    {projectDetail?.analytics?.metrics && (
                      <Row gutter={8}>
                        {projectDetail.analytics.metrics.slice(0, 3).map((m) => (
                          <Col span={8} key={m.name}>
                            <Statistic title={m.name} value={m.value} />
                          </Col>
                        ))}
                      </Row>
                    )}
                  </Card>
                </Col>
              </Row>

              <Row gutter={16} style={{ marginTop: 16 }}>
                {/* 团队合作情况 */}
                <Col span={12}>
                  <Card size="small" title="团队合作情况" loading={detailLoading}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <TeamOutlined />
                        <Text>成员：{projectDetail?.members_count ?? viewingProject.members_count ?? 0} 人</Text>
                      </Space>
                      {projectDetail?.members_detail?.length ? (
                        <Space wrap>
                          {projectDetail.members_detail.slice(0, 6).map((m) => (
                            <Tag key={m.user} color={m.role === 'owner' ? 'blue' : m.role === 'admin' ? 'green' : 'default'}>
                              {m.user_name || m.username}
                            </Tag>
                          ))}
                          {projectDetail.members_detail.length > 6 && (
                            <Tag>+{projectDetail.members_detail.length - 6}</Tag>
                          )}
                        </Space>
                      ) : (
                        <Text type="secondary">暂无详细成员数据</Text>
                      )}
                    </Space>
                  </Card>
                </Col>

                {/* 核心功能及特点 */}
                <Col span={12}>
                  <Card size="small" title="核心功能与特点" loading={detailLoading}>
                    {Array.isArray(projectDetail?.features) && projectDetail.features.length > 0 ? (
                      <Space wrap>
                        {projectDetail.features.map((f, idx) => (
                          <Tag key={idx} color="processing">{f}</Tag>
                        ))}
                      </Space>
                    ) : Array.isArray(projectDetail?.tags) && projectDetail.tags.length > 0 ? (
                      <Space wrap>
                        {projectDetail.tags.slice(0, 8).map((t, idx) => (
                          <Tag key={idx}>{t}</Tag>
                        ))}
                      </Space>
                    ) : (
                      <Text type="secondary">暂无功能标签</Text>
                    )}
                  </Card>
                </Col>
              </Row>
            </div>
          </>
        )}
      </Modal>

      {/* 投资项目弹窗 */}
      <Modal
        title="投资项目"
        open={isInvestModalVisible}
        onCancel={() => setIsInvestModalVisible(false)}
        onOk={handleSubmitInvest}
        confirmLoading={investSubmitting}
        okText="确认投资"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>项目：</Text>
          <Text>{investProject?.name}</Text>
        </div>
        <div style={{
          background: '#f6ffed',
          border: '1px solid #b7eb8f',
          padding: 12,
          borderRadius: 6,
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text type="success">账户可用额度</Text>
          <Space>
            <Text strong style={{ color: '#52c41a' }}>{typeof user?.balance === 'number' ? user.balance.toFixed(2) : '0.00'}</Text>
            <Text type="secondary">元</Text>
          </Space>
        </div>
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>选择投资金额（0-1元）</Text>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={investAmount}
            onChange={setInvestAmount}
            marks={{ 0: '0', 1: '1.00' }}
            tooltip={{ formatter: (v) => `${(v || 0).toFixed(2)} 元` }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <InputNumber
              min={0}
              max={1}
              step={0.01}
              precision={2}
              value={investAmount}
              onChange={(v) => setInvestAmount(Number(v || 0))}
            />
            <Text type="secondary">元</Text>
          </div>
        </div>
        <div style={{
          background: '#fffbe6',
          border: '1px solid #ffe58f',
          padding: 12,
          borderRadius: 6,
          marginBottom: 12
        }}>
          <Text type="secondary">
            此为体验性投资功能，金额范围为0-1元，请理性参与。投资成功后，您将成为该项目股东，按持有比例享有项目分红权。
          </Text>
        </div>
        <Checkbox checked={agreeRisk} onChange={(e) => setAgreeRisk(e.target.checked)}>
          我已知晓风险并同意相关协议
        </Checkbox>
      </Modal>
    </Layout>
  );
};

export default ProjectHall;
