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
import api from "../../services/api.js";

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
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [joinForm] = Form.useForm();
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { projects, fetchProjects, createProject, isLoading } = useProjectStore();
  
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

  const handleCreateProject = () => {
    if (!isAuthenticated()) {
      handleLoginRequired();
      return;
    }
    setIsCreateModalVisible(true);
    createForm.resetFields();
  };

  const handleCreateModalOk = async () => {
    try {
      const values = await createForm.validateFields();
      const result = await createProject(values);
      if (result.success) {
        message.success('项目创建成功！');
        setIsCreateModalVisible(false);
        createForm.resetFields();
      } else {
        if (typeof result.error === 'object') {
          Object.values(result.error).flat().forEach(error => {
            message.error(error);
          });
        } else {
          message.error(result.error);
        }
      }
    } catch (error) {
      console.error('Create project error:', error);
      message.error('创建项目失败');
    }
  };

  const handleCreateModalCancel = () => {
    setIsCreateModalVisible(false);
    createForm.resetFields();
  };

  const handleJoinProject = () => {
    if (!isAuthenticated()) {
      handleLoginRequired();
      return;
    }
    setIsJoinModalVisible(true);
    joinForm.resetFields();
  };

  const handleJoinModalOk = async () => {
    try {
      const values = await joinForm.validateFields();
      // 这里调用参与项目的API
      const result = await joinProjectByCode(values.joinCode);
      if (result.success) {
        message.success('成功参与项目！');
        setIsJoinModalVisible(false);
        joinForm.resetFields();
        fetchProjects(); // 刷新项目列表
      } else {
        message.error(result.error || '参与项目失败');
      }
    } catch (error) {
      console.error('Join project error:', error);
      message.error('参与项目失败');
    }
  };

  const handleJoinModalCancel = () => {
    setIsJoinModalVisible(false);
    joinForm.resetFields();
  };

  // 参与项目的API调用函数
  const joinProjectByCode = async (joinCode) => {
    try {
      const response = await api.post('/projects/join-by-code/', {
          join_code: joinCode
      });
      
      const data = await response.data;
      
      if (response.status == 200) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error || '参与项目失败' };
      }
    } catch (error) {
      console.error('Join project API error:', error);
      return { success: false, error: '网络错误，请稍后重试' };
    }
  };

  // 获取项目数据（只显示用户相关项目）
  const allProjects = projects || [];
  
  // 只显示用户自己创建的项目和被邀请参与的项目
  const userProjects = isAuthenticated() ? allProjects.filter(project => 
    project.owner === user?.id || 
    project.members_detail?.some(member => member.user === user?.id)
  ) : [];

  // 未登录用户不显示任何项目
  const displayProjects = isAuthenticated() ? userProjects : [];

  // 计算统计数据（只基于用户相关项目）
  const statsProjects = isAuthenticated() ? userProjects : [];

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
                  onClick={handleCreateProject}
                >
                  创建项目
                </Button>
                <Button
                  type="primary"
                  icon={<TeamOutlined />}
                  onClick={handleJoinProject}
                  style={{ 
                    marginLeft: 8,
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a'
                  }}
                >
                  参与项目
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
              activeTab={activeTab}
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

      {/* 创建项目Modal */}
      <Modal
        title="创建项目"
        open={isCreateModalVisible}
        onOk={handleCreateModalOk}
        onCancel={handleCreateModalCancel}
        confirmLoading={isLoading}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="项目名称"
            rules={[
              { required: true, message: '请输入项目名称！' },
              { max: 200, message: '项目名称不能超过200个字符！' },
            ]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="项目描述"
            rules={[
              { max: 1000, message: '项目描述不能超过1000个字符！' },
            ]}
          >
            <Input.TextArea rows={4} placeholder="请输入项目描述" />
          </Form.Item>
          
          <Form.Item
            name="project_type"
            label="项目类型"
            rules={[{ required: true, message: '请选择项目类型！' }]}
          >
            <Select placeholder="选择项目类型">
              <Select.Option value="research">研发项目</Select.Option>
              <Select.Option value="academic">学术项目</Select.Option>
              <Select.Option value="design">设计项目</Select.Option>
              <Select.Option value="innovation">创新实验</Select.Option>
              <Select.Option value="development">开发项目</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

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

      {/* 参与项目Modal */}
      <Modal
        title="参与项目"
        open={isJoinModalVisible}
        onOk={handleJoinModalOk}
        onCancel={handleJoinModalCancel}
        confirmLoading={isLoading}
        width={500}
      >
        <Form
          form={joinForm}
          layout="vertical"
        >
          <Form.Item
            name="joinCode"
            label="参与验证码"
            rules={[
              { required: true, message: '请输入参与验证码！' },
              { min: 6, message: '验证码至少6位！' },
              { max: 20, message: '验证码不能超过20位！' },
            ]}
          >
            <Input 
              placeholder="请输入项目参与验证码" 
              style={{ fontSize: 16, letterSpacing: 2 }}
            />
          </Form.Item>
          
          <div style={{ 
            background: '#f6f8fa', 
            padding: 12, 
            borderRadius: 6, 
            marginTop: 16,
            fontSize: 13,
            color: '#586069'
          }}>
            <Text type="secondary">
              💡 提示：参与验证码由项目创建者提供，输入正确的验证码即可参与项目。
            </Text>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
};

export default IntegratedProjectManagement;