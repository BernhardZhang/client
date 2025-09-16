import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  Avatar,
  Typography,
  message,
  Tabs,
  Select,
  InputNumber,
  Progress,
  Statistic,
  Timeline,
  Badge,
  Tooltip,
  Divider,
  Layout,
  Menu,
  List,
  Empty
} from 'antd';
import {
  TrophyOutlined,
  GiftOutlined,
  HistoryOutlined,
  SwapOutlined,
  StarOutlined,
  CrownOutlined,
  FireOutlined,
  UserOutlined,
  CalendarOutlined,
  PlusOutlined,
  SendOutlined,
  HomeOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  MessageOutlined,
  FileTextOutlined,
  BarChartOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import usePointsStore from '../../stores/pointsStore';
import dayjs from 'dayjs';
import './Points.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { Sider, Content } = Layout;

const Points = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const {
    userPoints,
    pointsHistory,
    earnStats,
    evaluations,
    fetchPointsSummary,
    fetchPointsHistory,
    fetchEvaluations,
    isLoading
  } = usePointsStore();

  useEffect(() => {
    if (user) {
      fetchPointsSummary();
      fetchPointsHistory();
      fetchEvaluations();
    }
  }, [user, fetchPointsSummary, fetchPointsHistory, fetchEvaluations]);



  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getLevelColor = (level) => {
    const colors = {
      1: '#8c8c8c', // 新手 - 灰色
      2: '#cd7f32', // 青铜 - 青铜色
      3: '#c0c0c0', // 白银 - 银色
      4: '#ffd700', // 黄金 - 金色
      5: '#b9f2ff', // 钻石 - 钻石蓝
    };
    return colors[level] || '#8c8c8c';
  };

  const getLevelIcon = (level) => {
    const icons = {
      1: <UserOutlined />,
      2: <StarOutlined />,
      3: <TrophyOutlined />,
      4: <CrownOutlined />,
      5: <FireOutlined />,
    };
    return icons[level] || <UserOutlined />;
  };

  const getChangeTypeColor = (changeType) => {
    const colors = {
      'earn': 'success',
      'spend': 'error',
      'transfer': 'processing',
      'reward': 'warning',
      'penalty': 'error',
      'refund': 'default',
    };
    return colors[changeType] || 'default';
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

  // 积分统计
  const pointsStats = {
    total: userPoints?.total_points || 0,
    available: userPoints?.available_points || 0,
    used: userPoints?.used_points || 0,
    level: userPoints?.level || 1
  };

  // 最近积分变动
  const recentPointsHistory = pointsHistory?.slice(0, 5) || [];

  const historyColumns = [
    {
      title: '类型',
      dataIndex: 'change_type_display',
      key: 'change_type',
      render: (text, record) => (
        <Tag color={getChangeTypeColor(record.change_type)}>
          {text}
        </Tag>
      ),
    },
    {
      title: '积分变动',
      dataIndex: 'points',
      key: 'points',
      render: (points) => (
        <Text style={{ 
          color: points > 0 ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {points > 0 ? '+' : ''}{points}
        </Text>
      ),
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '相关项目',
      dataIndex: 'related_project_name',
      key: 'related_project_name',
      render: (name) => name ? <Tag color="blue">{name}</Tag> : '-',
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => (
        <Tooltip title={dayjs(time).format('YYYY-MM-DD HH:mm:ss')}>
          {dayjs(time).fromNow()}
        </Tooltip>
      ),
    },
    {
      title: '余额',
      dataIndex: 'balance_after',
      key: 'balance_after',
      render: (balance) => <Text strong>{balance}</Text>,
    },
  ];

  const evaluationColumns = [
    {
      title: '评分活动',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.project_name}
          </Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          'active': { color: 'processing', text: '进行中' },
          'completed': { color: 'success', text: '已完成' },
          'cancelled': { color: 'default', text: '已取消' },
        };
        const config = statusConfig[status] || { color: 'default', text: '未知' };
        return <Badge status={config.color} text={config.text} />;
      },
    },
    {
      title: '参与人数',
      dataIndex: 'participant_count',
      key: 'participant_count',
      render: (count) => `${count} 人`,
    },
    {
      title: '评分进度',
      dataIndex: 'evaluation_count',
      key: 'evaluation_count',
      render: (count, record) => {
        const total = record.participant_count * (record.participant_count - 1); // 每人评分其他所有人
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <Progress 
            percent={percent} 
            size="small" 
            format={() => `${count}/${total}`}
          />
        );
      },
    },
    {
      title: '时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time, record) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: 12 }}>
            开始: {dayjs(time).format('MM-DD HH:mm')}
          </Text>
          <Text style={{ fontSize: 12 }}>
            结束: {dayjs(record.end_time).format('MM-DD HH:mm')}
          </Text>
        </Space>
      ),
    },
  ];

  return (
    <Layout className="points-layout">
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
          {/* 顶部标题 */}
          <div style={{ marginBottom: '24px' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
              <Title level={2} style={{ margin: 0 }}>
                <TrophyOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                积分统计
              </Title>
            </Row>
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <Tabs.TabPane tab="项目积分概览" key="overview">
              {userPoints && (
                <>
                  {/* 快速统计 */}
                  <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={12} sm={6}>
                      <Card>
                        <Statistic
                          title="总积分"
                          value={userPoints.total_points}
                          prefix={<TrophyOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card>
                        <Statistic
                          title="可用积分"
                          value={userPoints.available_points}
                          prefix={<GiftOutlined />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card>
                        <Statistic
                          title="已使用积分"
                          value={userPoints.used_points}
                          prefix={<SwapOutlined />}
                          valueStyle={{ color: '#faad14' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card>
                        <Statistic
                          title="当前等级"
                          value={`Lv.${userPoints.level || 1}`}
                          prefix={<CrownOutlined />}
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  {/* 快捷操作 */}
                  <Card style={{ marginBottom: '24px' }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Button 
                          type="primary" 
                          block 
                          icon={<HistoryOutlined />}
                          onClick={() => setActiveTab('history')}
                        >
                          查看历史
                        </Button>
                      </Col>
                      <Col span={12}>
                        <Button 
                          block 
                          icon={<TrophyOutlined />}
                        >
                          等级详情
                        </Button>
                      </Col>
                    </Row>
                  </Card>



                  {/* 等级信息 */}
                  <Card style={{ marginBottom: '24px' }}>
                    <Row align="middle">
                      <Col span={4}>
                        <div style={{ textAlign: 'center' }}>
                          <Avatar 
                            size={80} 
                            style={{ 
                              backgroundColor: getLevelColor(userPoints.level),
                              fontSize: 32
                            }}
                            icon={getLevelIcon(userPoints.level)}
                          />
                        </div>
                      </Col>
                      <Col span={20}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div>
                            <Title level={3} style={{ margin: 0, display: 'inline-block' }}>
                              {userPoints.level_name} 等级
                            </Title>
                            <Tag 
                              color={getLevelColor(userPoints.level)}
                              style={{ marginLeft: 8 }}
                            >
                              Lv.{userPoints.level}
                            </Tag>
                          </div>
                          <div>
                            <Text type="secondary">
                              当前积分: {userPoints.total_points} 分
                            </Text>
                          </div>
                          {/* 升级进度条 */}
                          {userPoints.level < 5 && (
                            <div style={{ width: '60%' }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                距离下一等级还需积分: 
                              </Text>
                              <Progress 
                                percent={Math.min(100, (userPoints.total_points % 1000) / 10)}
                                size="small"
                                style={{ marginTop: 4 }}
                              />
                            </div>
                          )}
                        </Space>
                      </Col>
                    </Row>
                  </Card>

                  {/* 项目积分统计 */}
                  {earnStats && earnStats.length > 0 && (
                    <Card title="项目积分统计" style={{ marginBottom: '24px' }}>
                      <Row gutter={16}>
                        {earnStats.map((stat, index) => (
                          <Col span={8} key={index}>
                            <Card size="small">
                              <Statistic
                                title={stat.reason}
                                value={stat.total_points}
                                suffix={`(${stat.count}次)`}
                                valueStyle={{ fontSize: 16 }}
                              />
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  )}

                  {/* 最近项目积分变动 */}
                  <Card title="最近项目积分变动">
                    {pointsHistory && pointsHistory.length > 0 ? (
                      <Timeline>
                        {pointsHistory.slice(0, 8).map(record => (
                          <Timeline.Item
                            key={record.id}
                            color={record.points > 0 ? 'green' : 'red'}
                          >
                            <Space direction="vertical" size="small">
                              <Space>
                                <Tag color={getChangeTypeColor(record.change_type)}>
                                  {record.change_type_display}
                                </Tag>
                                <Text style={{ 
                                  color: record.points > 0 ? '#52c41a' : '#ff4d4f',
                                  fontWeight: 'bold'
                                }}>
                                  {record.points > 0 ? '+' : ''}{record.points}分
                                </Text>
                              </Space>
                              <Text>{record.reason}</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {dayjs(record.created_at).format('MM-DD HH:mm')}
                                {record.related_project_name && (
                                  <Tag color="blue" size="small" style={{ marginLeft: 8 }}>
                                    {record.related_project_name}
                                  </Tag>
                                )}
                              </Text>
                            </Space>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    ) : (
                      <Text type="secondary">暂无积分变动记录</Text>
                    )}
                  </Card>
                </>
              )}
            </Tabs.TabPane>

            <Tabs.TabPane tab="项目积分历史" key="history">
              <Card>
                <Table
                  columns={historyColumns}
                  dataSource={pointsHistory}
                  rowKey="id"
                  loading={isLoading}
                  pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条记录`,
                  }}
                />
              </Card>
            </Tabs.TabPane>

            <Tabs.TabPane tab="功分互评" key="evaluations">
              <Card>
                <Table
                  columns={evaluationColumns}
                  dataSource={evaluations}
                  rowKey="id"
                  loading={isLoading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 个评分活动`,
                  }}
                />
              </Card>
            </Tabs.TabPane>
          </Tabs>
        </Content>
      </Layout>


    </Layout>
  );
};

export default Points;