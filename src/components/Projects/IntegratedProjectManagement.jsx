import React, { useState, useEffect } from 'react';
import {
  Card,
  Space,
  Typography,
  Button,
  Statistic,
  Row,
  Col,
  Empty,
  Badge,
  Avatar,
  Tag,
  Layout,
  Menu,
  Divider,
  Tabs,
  Select,
  Input,
  Tooltip,
  Dropdown,
  Modal,
  Form,
  message,
  Popconfirm,
  Progress,
  List,
  Timeline
} from 'antd';
import {
  ProjectOutlined,
  FileTextOutlined,
  TrophyOutlined,
  TeamOutlined,
  PlusOutlined,
  BarChartOutlined,
  CalendarOutlined,
  StarOutlined,
  HomeOutlined,
  DollarOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  MessageOutlined,
  UserOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  AppstoreOutlined,
  BarsOutlined,
  SearchOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Projects from './Projects';
import UserMeritSummary from '../Merit/UserMeritSummary';
import Merit from '../Merit/Merit';
import LoginPrompt from '../Auth/LoginPrompt';
import useAuthStore from '../../stores/authStore';
import useProjectStore from '../../stores/projectStore';
import LoginDialog from '../Auth/LoginDialog';
import RegisterDialog from '../Auth/RegisterDialog';
import './IntegratedProjectManagement.css';

const { Title, Text, Paragraph } = Typography;
const { Sider, Content } = Layout;
const { Search } = Input;
const { Option } = Select;

const IntegratedProjectManagement = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('create_time');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  
  useEffect(() => {
    // 无论是否登录都获取公开项目数据
    fetchProjects();
  }, []);

  const handleLoginRequired = () => {
    setShowLoginPrompt(true);
  };

  const handlePromptLogin = () => {
    setLoginModalVisible(true);
  };

  const handlePromptRegister = () => {
    setRegisterModalVisible(true);
  };

  const handleSwitchToRegister = () => {
    setLoginModalVisible(false);
    setRegisterModalVisible(true);
  };

  const handleSwitchToLogin = () => {
    setRegisterModalVisible(false);
    setLoginModalVisible(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // 获取项目数据（包括公开项目）
  const allProjects = projects || [];
  const userProjects = isAuthenticated() ? allProjects.filter(project => 
    project.owner === user?.id || 
    project.members_detail?.some(member => member.user === user?.id)
  ) : [];

  const publicProjects = allProjects.filter(project => project.is_public);

  // 显示的项目列表
  const displayProjects = isAuthenticated() ? userProjects : publicProjects;

  // 计算统计数据
  const statsProjects = isAuthenticated() ? userProjects : publicProjects;

  // 从项目数据中计算任务统计
  const projectTasks = statsProjects.reduce((acc, project) => {
    const taskCount = project.task_count || 0;
    const completedTaskCount = project.completed_tasks || 0;
    return {
      total: acc.total + taskCount,
      completed: acc.completed + completedTaskCount,
      pending: acc.pending + (taskCount - completedTaskCount)
    };
  }, { total: 0, completed: 0, pending: 0 });

  // 计算总功分（从项目成员数据中获取）
  const totalFunctionScore = isAuthenticated() ? userProjects.reduce((total, project) => {
    const myMembership = project.members_detail?.find(m => m.user === user?.id);
    return total + (Number(myMembership?.contribution_score) || 0);
  }, 0) : 0;

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
    total: displayProjects.length,
    active: displayProjects.filter(p => p.status === 'active').length,
    completed: displayProjects.filter(p => p.status === 'completed').length,
    pending: displayProjects.filter(p => p.status === 'pending').length,
    totalValuation: displayProjects.reduce((sum, p) => sum + (Number(p.valuation) || 0), 0),
    fundingRounds: displayProjects.reduce((sum, p) => sum + (p.funding_rounds || 0), 0)
  };

  // 最近项目
  const recentProjects = displayProjects
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <Layout className="project-layout">
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
                <ProjectOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                项目管理
              </Title>
            </Row>

            {/* 搜索栏 */}
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Search
                  placeholder="搜索项目名称或描述"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onSearch={(value) => setSearchText(value)}
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
                  title={isAuthenticated() ? "我的项目" : "公开项目"}
                  value={displayProjects.length}
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
                  title="已完成项目"
                  value={projectStats.completed}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="总估值"
                  value={projectStats.totalValuation}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 任务统计 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="待办任务"
                  value={projectTasks.pending}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="已完成"
                  value={projectTasks.completed}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="总任务"
                  value={projectTasks.total}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title={isAuthenticated() ? "总功分" : "项目数"}
                  value={isAuthenticated() ? totalFunctionScore.toFixed(1) : displayProjects.length}
                  prefix={<StarOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>



          {/* 项目列表 */}
          <Card>
            <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
              <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <Tabs.TabPane tab="全部项目" key="all" />
                <Tabs.TabPane tab="我创建的" key="created" />
                <Tabs.TabPane tab="我参与的" key="joined" />
              </Tabs>
              <Space>
                <Select
                  value={`${sortBy}_${sortOrder}`}
                  onChange={(value) => {
                    const [field, order] = value.split('_');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  style={{ width: 150 }}
                >
                  <Option value="create_time_desc">最新创建</Option>
                  <Option value="create_time_asc">最早创建</Option>
                  <Option value="name_asc">名称A-Z</Option>
                  <Option value="name_desc">名称Z-A</Option>
                  <Option value="progress_desc">进度高-低</Option>
                  <Option value="progress_asc">进度低-高</Option>
                </Select>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                >
                  创建项目
                </Button>
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
                      icon={<BarsOutlined />}
                      onClick={() => setViewMode('table')}
                    />
                  </Tooltip>
                  <Tooltip title="筛选项目">
                    <Button 
                      icon={<FilterOutlined />}
                    />
                  </Tooltip>
                </Button.Group>
              </Space>
            </Row>

            <Projects 
              onProjectSelect={setSelectedProject} 
              projects={displayProjects}
              isAuthenticated={isAuthenticated()}
              onLoginRequired={handleLoginRequired}
              viewMode={viewMode}
              searchText={searchText}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          </Card>
        </Content>
      </Layout>
      
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="请登录后使用完整的项目管理功能"
        onLogin={handlePromptLogin}
        onRegister={handlePromptRegister}
      />

      {/* 登录和注册对话框 */}
      <LoginDialog
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />

      <RegisterDialog
        visible={registerModalVisible}
        onClose={() => setRegisterModalVisible(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </Layout>
  );
};

export default IntegratedProjectManagement;