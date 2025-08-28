import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Button, 
  Space,
  List,
  Tag,
  Avatar,
  Timeline,
  Empty,
  Layout,
  Menu,
  Divider,
  Badge
} from 'antd';
import {
  UserOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  TeamOutlined,
  TrophyOutlined,
  HomeOutlined,
  DollarOutlined,
  BarChartOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  MessageOutlined,
  FileTextOutlined,
  StarOutlined,
  FireOutlined,
  WalletOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';
import LoginDialog from '../Auth/LoginDialog';
import RegisterDialog from '../Auth/RegisterDialog';
import './PublicHome.css';

const { Header, Sider, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const PublicHome = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0,
    totalTasks: 0,
    totalPoints: 0,
    availableFunds: 0,
    frozenFunds: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);
  const [registerVisible, setRegisterVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();

  // 获取公开统计数据
  const fetchPublicStats = async () => {
    setLoading(true);
    try {
      // 获取公开的统计信息
      const [projectsRes] = await Promise.allSettled([
        api.get('/projects/public-stats/'),
      ]);

      if (projectsRes.status === 'fulfilled') {
        setStats(projectsRes.value.data);
      }

      // 获取公开项目列表（前5个）
      const publicProjectsRes = await api.get('/projects/public/', { params: { limit: 5 } });
      if (publicProjectsRes.data) {
        setRecentProjects(publicProjectsRes.data.results || publicProjectsRes.data);
      }
    } catch (error) {
      console.error('获取公开数据失败:', error);
      // 使用模拟数据
      setStats({
        totalUsers: 25,
        totalProjects: 8,
        activeProjects: 6,
        completedTasks: 156,
        totalTasks: 203,
        totalPoints: 12580,
        availableFunds: 45600,
        frozenFunds: 12300
      });
      setRecentProjects([
        {
          id: 1,
          name: '智能实验室管理系统',
          description: '基于物联网的实验室设备管理和预约系统',
          status: 'active',
          members_count: 6,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 2,
          name: '学生成绩分析平台',
          description: '数据驱动的学生学习效果分析和预警系统',
          status: 'active',
          members_count: 4,
          created_at: '2024-01-10T15:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicStats();
  }, []);

  const handleViewProject = (projectId) => {
    navigate(`/public/projects/${projectId}`);
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
      key: '/task-hall',
      icon: <AppstoreOutlined />,
      label: '任务大厅',
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

  return (
    <>
    <Layout className="home-layout">
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
                    onClick={() => setLoginVisible(true)}
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
      {/* 欢迎区域 */}
      <Card style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Title level={2}>欢迎来到功分易</Title>
        <Paragraph style={{ fontSize: '16px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
          功分易是一个现代化的项目管理和团队协作平台，支持任务管理、功劳评估、财务管理等功能。
          我们致力于提高团队协作效率，让每个项目都能高效推进，公平分配功劳。
        </Paragraph>
      </Card>

      {/* 统计数据 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Statistic
              title="项目统计"
              value={`${stats.totalProjects || 0} / ${stats.activeProjects || 0}`}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#3f8600', fontSize: '24px' }}
              suffix={
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  <div>总项目数 / 活跃项目数</div>
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Statistic
              title="任务统计"
              value={`${stats.completedTasks || 0} / ${stats.totalTasks || 0}`}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
              suffix={
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  <div>已完成 / 总任务数</div>
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Statistic
              title="积分统计"
              value={stats.totalPoints || 0}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#722ed1', fontSize: '24px' }}
              suffix={
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  <div>总积分数量</div>
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Statistic
              title="资金统计"
              value={`${stats.availableFunds || 0} / ${stats.frozenFunds || 0}`}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#fa8c16', fontSize: '24px' }}
              suffix={
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  <div>可用资金 / 冻结资金</div>
                </div>
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 最近项目 */}
        <Col xs={24} xl={12}>
          <Card title="最近项目" extra={<ProjectOutlined />} style={{ height: '400px' }}>
            {recentProjects.length > 0 ? (
              <List
                dataSource={recentProjects}
                renderItem={(project) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        onClick={() => handleViewProject(project.id)}
                      >
                        查看详情
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<ProjectOutlined />} />}
                      title={project.name}
                      description={
                        <div>
                          <Paragraph ellipsis={{ rows: 2 }}>
                            {project.description}
                          </Paragraph>
                          <Space>
                            <Tag color="blue">
                              <TeamOutlined /> {project.members_count || 0} 成员
                            </Tag>
                            <Tag color={project.status === 'active' ? 'green' : 'orange'}>
                              {project.status === 'active' ? '进行中' : '已完成'}
                            </Tag>
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无公开项目" />
            )}
          </Card>
        </Col>

        {/* 平台特色 */}
        <Col xs={24} xl={12}>
          <Card title="平台特色" extra={<TrophyOutlined />} style={{ height: '400px' }}>
            <Timeline>
              <Timeline.Item color="blue">
                <Text strong>项目管理</Text>
                <br />
                <Text type="secondary">完整的项目生命周期管理，支持任务分配、进度跟踪</Text>
              </Timeline.Item>
              <Timeline.Item color="green">
                <Text strong>团队协作</Text>
                <br />
                <Text type="secondary">实时协作功能，支持评论、文件共享、日志记录</Text>
              </Timeline.Item>
              <Timeline.Item color="red">
                <Text strong>投票评估</Text>
                <br />
                <Text type="secondary">公平的投票评估机制，支持多维度评分</Text>
              </Timeline.Item>
              <Timeline.Item color="orange">
                <Text strong>数据分析</Text>
                <br />
                <Text type="secondary">智能数据分析，提供深入的项目和团队洞察</Text>
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>
      </Row>
        </Content>
      </Layout>
    </Layout>

    {/* 登录对话框 */}
    <LoginDialog
      visible={loginVisible}
      onClose={() => setLoginVisible(false)}
      onSwitchToRegister={() => {
        setLoginVisible(false);
        setRegisterVisible(true);
      }}
    />

    {/* 注册对话框 */}
    <RegisterDialog
      visible={registerVisible}
      onClose={() => setRegisterVisible(false)}
      onSwitchToLogin={() => {
        setRegisterVisible(false);
        setLoginVisible(true);
      }}
    />
  </>
  );
};

export default PublicHome;