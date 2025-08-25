import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Typography,
  Space,
  Tag,
  Table,
  Select,
  DatePicker,
  Button,
  Avatar,
  List,
  Empty,
  Tooltip,
  Divider,
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  UserOutlined,
  ProjectOutlined,
  CalendarOutlined,
  TrophyOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import useProjectStore from '../../stores/projectStore';
import useTaskStore from '../../stores/taskStore';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ProjectAnalytics = ({ projectId, project, isProjectOwner }) => {
  const [timeRange, setTimeRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState({});
  
  const { user } = useAuthStore();
  const { projects } = useProjectStore();
  const { tasks } = useTaskStore();

  useEffect(() => {
    generateAnalyticsData();
  }, [projectId, timeRange, project, tasks]);

  // 生成项目分析数据
  const generateAnalyticsData = () => {
    if (!project) return;

    const projectTasks = tasks?.filter(task => task.project === projectId) || [];
    const projectMembers = project.members_detail || [];

    // 任务统计
    const taskStats = {
      total: projectTasks.length,
      completed: projectTasks.filter(t => t.status === 'completed').length,
      inProgress: projectTasks.filter(t => t.status === 'in_progress').length,
      pending: projectTasks.filter(t => t.status === 'pending').length,
    };

    // 成员贡献分析
    const memberContributions = projectMembers.map(member => ({
      name: member.user_name,
      tasks: projectTasks.filter(t => t.assignee === member.user).length,
      completedTasks: projectTasks.filter(t => t.assignee === member.user && t.status === 'completed').length,
      contribution: member.contribution_percentage || 0,
      equity: member.equity_percentage || 0,
    }));

    // 项目进度趋势数据（模拟）
    const progressTrendData = [
      { date: '2024-01', progress: 10 },
      { date: '2024-02', progress: 25 },
      { date: '2024-03', progress: 40 },
      { date: '2024-04', progress: 60 },
      { date: '2024-05', progress: 75 },
      { date: '2024-06', progress: project.progress || 80 },
    ];

    // 任务分布数据
    const taskDistributionData = [
      { type: '已完成', value: taskStats.completed },
      { type: '进行中', value: taskStats.inProgress },
      { type: '待开始', value: taskStats.pending },
    ];

    // 成员任务分布
    const memberTaskData = memberContributions.map(member => ({
      member: member.name,
      completed: member.completedTasks,
      total: member.tasks,
    }));

    setAnalyticsData({
      taskStats,
      memberContributions,
      progressTrendData,
      taskDistributionData,
      memberTaskData,
    });
  };

  const {
    taskStats = {},
    memberContributions = [],
    progressTrendData = [],
    taskDistributionData = [],
    memberTaskData = [],
  } = analyticsData;

    // 进度趋势图配置 - 移除，改用简化展示
    // 任务分布饼图配置 - 移除，改用进度条展示  
    // 成员任务柱状图配置 - 移除，改用表格展示

  return (
    <div style={{ padding: '16px' }}>
      {/* 项目概览统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="项目进度"
              value={project.progress || 0}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={taskStats.total || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成任务"
              value={taskStats.completed || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="团队成员"
              value={project.member_count || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表分析 - 使用简化的展示方式 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="项目进度趋势" extra={
            <Select value={timeRange} onChange={setTimeRange} style={{ width: 100 }}>
              <Option value="week">本周</Option>
              <Option value="month">本月</Option>
              <Option value="quarter">本季度</Option>
            </Select>
          }>
            <div style={{ height: 300, padding: '20px', textAlign: 'center' }}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Title level={2} style={{ color: '#1890ff', margin: 0 }}>
                    {project.progress || 0}%
                  </Title>
                  <Text type="secondary">当前进度</Text>
                </div>
                <Divider />
                <Space size="large">
                  <div style={{ textAlign: 'center' }}>
                    <RiseOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    <div><Text strong style={{ color: '#52c41a' }}>+15%</Text></div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>本月增长</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <LineChartOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <div><Text strong>稳定</Text></div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>增长趋势</Text>
                  </div>
                </Space>
              </Space>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="任务状态分布">
            <div style={{ height: 300, padding: '20px' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>已完成</span>
                  <Progress 
                    percent={taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}
                    strokeColor="#52c41a"
                    style={{ width: '60%' }}
                  />
                  <Text strong>{taskStats.completed || 0}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>进行中</span>
                  <Progress 
                    percent={taskStats.total > 0 ? Math.round((taskStats.inProgress / taskStats.total) * 100) : 0}
                    strokeColor="#1890ff"
                    style={{ width: '60%' }}
                  />
                  <Text strong>{taskStats.inProgress || 0}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>待开始</span>
                  <Progress 
                    percent={taskStats.total > 0 ? Math.round((taskStats.pending / taskStats.total) * 100) : 0}
                    strokeColor="#faad14"
                    style={{ width: '60%' }}
                  />
                  <Text strong>{taskStats.pending || 0}</Text>
                </div>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="成员任务完成情况">
            <div style={{ height: 300, overflow: 'auto' }}>
              <Table
                dataSource={memberTaskData}
                pagination={false}
                columns={[
                  {
                    title: '成员',
                    dataIndex: 'member',
                    key: 'member',
                    render: (name) => (
                      <Space>
                        <Avatar size="small" icon={<UserOutlined />} />
                        {name}
                      </Space>
                    ),
                  },
                  {
                    title: '完成任务',
                    dataIndex: 'completed',
                    key: 'completed',
                    render: (completed, record) => (
                      <Space>
                        <Progress
                          percent={record.total > 0 ? Math.round((completed / record.total) * 100) : 0}
                          size="small"
                          style={{ width: 100 }}
                        />
                        <Text>{completed}/{record.total}</Text>
                      </Space>
                    ),
                  },
                  {
                    title: '完成率',
                    key: 'rate',
                    render: (_, record) => {
                      const rate = record.total > 0 ? Math.round((record.completed / record.total) * 100) : 0;
                      return (
                        <Tag color={rate >= 80 ? 'success' : rate >= 60 ? 'processing' : 'warning'}>
                          {rate}%
                        </Tag>
                      );
                    },
                  },
                ]}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 成员贡献分析 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="成员贡献分析">
            <List
              dataSource={memberContributions}
              renderItem={(member) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={member.name}
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text>任务完成:</Text>
                          <Text strong>{member.completedTasks}/{member.tasks}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text>贡献比例:</Text>
                          <Progress
                            percent={member.contribution}
                            size="small"
                            style={{ width: 100 }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text>股份占比:</Text>
                          <Text strong style={{ color: '#52c41a' }}>
                            {member.equity.toFixed(2)}%
                          </Text>
                        </div>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="项目关键指标">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>项目估值:</Text>
                <br />
                <Text style={{ fontSize: 24, color: '#722ed1' }}>
                  ¥{Number(project.valuation || 0).toFixed(2)}
                </Text>
              </div>
              
              <div>
                <Text strong>完成率:</Text>
                <br />
                <Progress 
                  percent={taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}
                  status="active"
                  strokeColor={{
                    from: '#108ee9',
                    to: '#87d068',
                  }}
                />
              </div>

              <div>
                <Text strong>项目状态:</Text>
                <br />
                <Tag 
                  color={
                    project.status === 'active' ? 'success' : 
                    project.status === 'completed' ? 'default' : 'warning'
                  }
                  style={{ fontSize: 14, padding: '4px 12px' }}
                >
                  {project.status === 'active' ? '进行中' : 
                   project.status === 'completed' ? '已完成' : '待审核'}
                </Tag>
              </div>

              <div>
                <Text strong>创建时间:</Text>
                <br />
                <Text type="secondary">
                  {new Date(project.created_at).toLocaleDateString()}
                </Text>
              </div>

              {project.funding_rounds && (
                <div>
                  <Text strong>融资轮次:</Text>
                  <br />
                  <Tag color="purple" style={{ fontSize: 14, padding: '4px 12px' }}>
                    第{project.funding_rounds}轮
                  </Tag>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectAnalytics;