import { useEffect, useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  List,
  Avatar,
  Button,
  Space,
  Tag,
  Progress,
  Alert,
  Badge,
  Tooltip
} from 'antd';
import {
  DollarOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  StarOutlined,
  RocketOutlined,
  UserOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import useAuthStore from '../../stores/authStore';
import useProjectStore from '../../stores/projectStore';
import useVotingStore from '../../stores/votingStore';
import { financeAPI, wislabApi } from '../../services/api';

const { Title, Text } = Typography;

const Dashboard = () => {
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const { activeRound, fetchActiveRound, myVotes, fetchMyVotes } = useVotingStore();
  const [portfolio, setPortfolio] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
    fetchActiveRound();
    loadPortfolio();
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeRound) {
      fetchMyVotes(activeRound.id);
    }
  }, [activeRound]);

  const loadPortfolio = async () => {
    try {
      const response = await financeAPI.getPortfolio();
      setPortfolio(response.data);
    } catch (error) {
      console.error('加载投资组合失败:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await wislabApi.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

// 会员状态相关函数
  const getMembershipStatusColor = (membership) => {
    if (!membership?.is_membership_valid_status) return 'red';
    if (membership.membership_type === 'vip') return 'gold';
    if (membership.membership_type === 'premium') return 'purple';
    return 'blue';
  };

  const getMembershipStatusText = (membership) => {
    if (!membership?.is_membership_valid_status) return '已过期';
    return membership.membership_type_display;
  };

  // 系统分vs功分饼图数据
  const pieData = dashboardData ? [
    {
      name: '系统分',
      value: parseFloat(dashboardData.task_stats?.total_system_score || 0),
      color: '#3f8600'
    },
    {
      name: '功分',
      value: parseFloat(dashboardData.task_stats?.total_function_score || 0),
      color: '#cf1322'
    }
  ] : [];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>仪表板</Title>
        <Text type="secondary">欢迎回来，{user?.username}！</Text>
      </Row>

      {/* 会员状态卡片 */}
      {dashboardData?.membership && (
        <Card 
          title="会员状态" 
          style={{ marginBottom: 24 }}
          extra={
            <Badge 
              status={getMembershipStatusColor(dashboardData.membership)} 
              text={getMembershipStatusText(dashboardData.membership)}
            />
          }
        >
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="会员类型"
                value={dashboardData.membership.membership_type_display}
                prefix={<StarOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="项目限制"
                value={dashboardData.membership.project_limit === 999 ? '无限制' : dashboardData.membership.project_limit}
                prefix={<ProjectOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="当前项目数"
                value={dashboardData.membership.current_project_count}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总积分"
                value={dashboardData.membership.total_points}
                prefix={<TrophyOutlined />}
              />
            </Col>
          </Row>
          
          {dashboardData.membership.membership_type === 'normal' && (
            <div style={{ marginTop: 16 }}>
              <Progress
                percent={(dashboardData.membership.current_project_count / dashboardData.membership.project_limit) * 100}
                status={dashboardData.membership.can_join_project_status ? 'active' : 'exception'}
                showInfo={false}
              />
              <Text type="secondary">
                项目使用率: {dashboardData.membership.current_project_count}/{dashboardData.membership.project_limit}
              </Text>
              {!dashboardData.membership.can_join_project_status && (
                <Alert
                  message="项目数量已达上限"
                  description="升级为高级会员可解除项目数量限制"
                  type="warning"
                  style={{ marginTop: 8 }}
                  action={
                    <Button type="primary" size="small">
                      升级会员
                    </Button>
                  }
                />
              )}
            </div>
          )}
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="账户余额"
              value={user?.balance || 0}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="参与项目"
              value={dashboardData?.project_stats?.total || 
                (Array.isArray(projects) ? 
                  projects.filter(p => 
                    p.owner === user?.id || p.members_detail?.some(m => m.user === user?.id)
                  ).length : 0)}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ProjectOutlined />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="功分互评"
              value={dashboardData?.evaluation_stats?.participated || myVotes.length}
              valueStyle={{ color: '#722ed1' }}
              prefix={<CheckCircleOutlined />}
              suffix="次"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总投资"
              value={portfolio?.total_investment || 0}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix={<TrophyOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      {/* 分数统计 */}
      {dashboardData?.task_stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="我的总分统计">
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="系统分"
                    value={dashboardData.task_stats.total_system_score}
                    precision={2}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<RocketOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="功分"
                    value={dashboardData.task_stats.total_function_score}
                    precision={2}
                    valueStyle={{ color: '#cf1322' }}
                    prefix={<StarOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="总分"
                    value={dashboardData.task_stats.total_score}
                    precision={2}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<TrophyOutlined />}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="分数构成">
              {pieData.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(1)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  暂无评分数据
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="我创建的项目" style={{ height: 400, overflow: 'auto' }}>
            <List
              dataSource={Array.isArray(projects) ? projects.filter(p => p.owner === user?.id) : []}
              renderItem={(project) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#faad14' }} />}
                    title={project.name}
                    description={
                      <Space direction="vertical" size="small">
                        <Text type="secondary">{project.description}</Text>
                        <Space>
                          <Tag color="gold">负责人</Tag>
                          <Text type="secondary">
                            {project.member_count} 人参与
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="我加入的项目" style={{ height: 400, overflow: 'auto' }}>
            <List
              dataSource={Array.isArray(projects) ? projects.filter(p => 
                p.owner !== user?.id && p.members_detail?.some(m => m.user === user?.id)
              ) : []}
              renderItem={(project) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<ProjectOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                    title={project.name}
                    description={
                      <Space direction="vertical" size="small">
                        <Text type="secondary">{project.description}</Text>
                        <Space>
                          <Tag color="blue">成员</Tag>
                          <Text type="secondary">
                            {project.member_count} 人参与
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;