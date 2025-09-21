import React, { useState, useEffect, useMemo } from 'react';
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
import usePointsStore from '../../stores/pointsStore';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ProjectAnalytics = ({ projectId, project, isProjectOwner }) => {
  const [timeRange, setTimeRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState({});
  const [projectPoints, setProjectPoints] = useState(null);
  
  const { user } = useAuthStore();
  const { projects } = useProjectStore();
  const { tasks } = useTaskStore();
  const { fetchProjectPoints } = usePointsStore();

  useEffect(() => {
    generateAnalyticsData();
  }, [projectId, timeRange, project, tasks]);

  useEffect(() => {
    const loadProjectPoints = async () => {
      if (!projectId) return;
      try {
        const data = await fetchProjectPoints(projectId);
        setProjectPoints(data || null);
      } catch (e) {
        setProjectPoints(null);
      }
    };
    loadProjectPoints();
  }, [projectId, fetchProjectPoints]);

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
      projectTasks,
      projectMembers,
    });
  };

  const {
    taskStats = {},
    progressTrendData = [],
    taskDistributionData = [],
    memberTaskData = [],
    projectTasks = [],
    projectMembers = [],
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

      {/* 任务拆分与权重分配分析 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="任务拆分与权重分配分析" extra={<Text type="secondary">总价值100分制</Text>}>
            <div style={{ marginBottom: 16 }}>
              <Text>每个项目总价值为100分，根据任务占比分配；角色权重用于体现成员在任务中的重要性。</Text>
            </div>
            <Table
              dataSource={(projectTasks || []).map((t, idx) => {
                // 任务占比：优先使用预估工时占比，否则均分
                const validHours = (projectTasks || []).map(x => Number(x.estimated_hours || 0)).reduce((a,b)=>a+b,0);
                const taskShare = validHours > 0 ? Number(t.estimated_hours || 0) / validHours : (projectTasks.length > 0 ? 1 / projectTasks.length : 0);
                const roleWeight = Number(t.weight_coefficient || 1.0);
                return {
                  key: t.id || idx,
                  title: t.title,
                  share: (taskShare * 100).toFixed(2) + '%',
                  roleWeight: roleWeight.toFixed(2),
                };
              })}
              pagination={false}
              columns={[
                { title: '任务', dataIndex: 'title', key: 'title' },
                { title: '任务占比', dataIndex: 'share', key: 'share' },
                { title: '角色权重', dataIndex: 'roleWeight', key: 'roleWeight' },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* 时效奖惩机制分析 */}
      <TimelinessPanel tasks={projectTasks} />

      {/* 系统分计算 */}
      <SystemScorePanel tasks={projectTasks} members={projectMembers} />

      {/* 功分评分 */}
      <MeritScorePanel projectPoints={projectPoints} members={projectMembers} />

      {/* 综合评分 */}
      <CombinedScorePanel tasks={projectTasks} members={projectMembers} projectPoints={projectPoints} />
    </div>
  );
};

export default ProjectAnalytics;

// ========== 子组件与工具函数 ==========

const computePlannedDays = (task) => {
  const start = task.start_date ? new Date(task.start_date) : null;
  const due = task.due_date ? new Date(task.due_date) : null;
  if (!due || !start) return null;
  const ms = due.getTime() - start.getTime();
  return ms > 0 ? Math.ceil(ms / (24 * 3600 * 1000)) : null;
};

const computeTimeCoefficientClient = (task) => {
  const due = task.due_date ? new Date(task.due_date) : null;
  const completed = task.completed_at ? new Date(task.completed_at) : (task.completion_date ? new Date(task.completion_date) : null);
  if (!due || !completed) return 1.0;

  const daysDiff = Math.floor((completed.getTime() - due.getTime()) / (24 * 3600 * 1000));
  // 提前完成：负数
  if (daysDiff < 0) {
    const earlyDays = Math.abs(daysDiff);
    if (earlyDays >= 4 && earlyDays <= 7) return 1.3;
    if (earlyDays >= 1 && earlyDays <= 3) return 1.2;
    if (earlyDays > 7) return 1.3; // 上限按1.3
    return 1.0;
  }

  if (daysDiff === 0) return 1.0; // 按时

  // 超时：按比例
  const plannedDays = computePlannedDays(task);
  if (plannedDays && plannedDays > 0) {
    const overRate = daysDiff / plannedDays; // 超时百分比
    if (overRate <= 0.1) return 0.9;
    if (overRate <= 0.3) return 0.7;
    return 0.5;
  }

  // 无计划时长，退化到天数分档
  if (daysDiff <= 1) return 0.9;
  if (daysDiff <= 3) return 0.7;
  return 0.5;
};

const computeTaskShare = (task, allTasks) => {
  const hours = allTasks.map(t => Number(t.estimated_hours || 0));
  const sum = hours.reduce((a,b)=>a+b,0);
  if (sum > 0) return Number(task.estimated_hours || 0) / sum;
  return allTasks.length > 0 ? 1 / allTasks.length : 0;
};

const computeSystemScore = (task, allTasks) => {
  const taskShare = computeTaskShare(task, allTasks); // 0-1
  const roleWeight = Number(task.weight_coefficient || 1.0); // 0.1-1.0
  const timeCoef = computeTimeCoefficientClient(task); // 0.5-1.3
  // 系统分=任务占比×角色权重×时效系数×100
  return taskShare * roleWeight * timeCoef * 100;
};

const TimelinessPanel = ({ tasks }) => {
  const stats = useMemo(() => {
    const res = { early13: 0, early12: 0, ontime: 0, over10: 0, over30: 0, overGt30: 0 };
    (tasks || []).forEach(t => {
      if (!t.due_date || !(t.completed_at || t.completion_date)) return;
      const due = new Date(t.due_date);
      const completed = new Date(t.completed_at || t.completion_date);
      const days = Math.floor((completed.getTime() - due.getTime()) / (24*3600*1000));
      if (days < 0) {
        const early = Math.abs(days);
        if (early >= 4) res.early13 += 1; else if (early >= 1) res.early12 += 1;
      } else if (days === 0) {
        res.ontime += 1;
      } else {
        const planned = computePlannedDays(t);
        if (planned && planned > 0) {
          const rate = days / planned;
          if (rate <= 0.1) res.over10 += 1; else if (rate <= 0.3) res.over30 += 1; else res.overGt30 += 1;
        } else {
          if (days <= 1) res.over10 += 1; else if (days <= 3) res.over30 += 1; else res.overGt30 += 1;
        }
      }
    });
    return res;
  }, [tasks]);

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card title="时效奖惩机制" extra={<Text type="secondary">基于任务完成时间的奖惩系数</Text>}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><Text strong>提前完成奖励</Text> <Text type="secondary">提前1-3天: 系数1.2｜提前4-7天: 系数1.3</Text></div>
                <div style={{ display:'flex', gap:16 }}>
                  <Tag color="success">提前1-3天: {stats.early12}</Tag>
                  <Tag color="processing">提前4-7天: {stats.early13}</Tag>
                </div>
              </Space>
            </Card>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><Text strong>按时完成</Text> <Text type="secondary">系数 1.0</Text></div>
                <Tag color="blue">按时完成 {stats.ontime}</Tag>
              </Space>
            </Card>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><Text strong>超时惩罚</Text> <Text type="secondary">≤10%:0.9｜10-30%:0.7｜&gt;30%:0.5</Text></div>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                  <Tag color="orange">超时≤10%: {stats.over10}</Tag>
                  <Tag color="warning">10-30%: {stats.over30}</Tag>
                  <Tag color="red">&gt;30%: {stats.overGt30}</Tag>
                </div>
              </Space>
            </Card>
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

const SystemScorePanel = ({ tasks, members }) => {
  const data = useMemo(() => {
    const rows = (members || []).map(m => ({ key: m.user, name: m.user_name, system: 0 }));
    const byId = new Map(rows.map(r => [r.key, r]));
    (tasks || []).forEach(t => {
      if (!t.assignee) return;
      const score = computeSystemScore(t, tasks || []);
      const row = byId.get(t.assignee);
      if (row) row.system += score;
    });
    rows.forEach(r => { r.system = Number(r.system || 0); });
    return rows;
  }, [tasks, members]);

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card title="系统分计算" extra={<Text type="secondary">系统分 = 任务占比 × 角色权重 × 时效系数</Text>}>
          <Table
            dataSource={data}
            pagination={false}
            columns={[
              { title: '成员', dataIndex: 'name', key: 'name' },
              { title: '系统分', dataIndex: 'system', key: 'system', render: v => <Text strong>{v.toFixed(2)}</Text> },
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
};

const MeritScorePanel = ({ projectPoints, members }) => {
  const rows = useMemo(() => {
    const pointsMap = new Map();
    if (projectPoints && Array.isArray(projectPoints.distribution)) {
      projectPoints.distribution.forEach(item => {
        pointsMap.set(item.user, Number(item.points || 0));
      });
    }
    const total = Array.from(pointsMap.values()).reduce((a,b)=>a+b,0);
    return (members || []).map(m => {
      const p = pointsMap.get(m.user) || 0;
      const merit = total > 0 ? (p / total) * 30 : 0; // 30分制
      return { key: m.user, name: m.user_name, points: p, merit: merit };
    });
  }, [projectPoints, members]);

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card title="功分评分" extra={<Text type="secondary">功分 = 个人积分 ÷ 全队总积分 × 30分</Text>}>
          <Table
            dataSource={rows}
            pagination={false}
            columns={[
              { title: '成员', dataIndex: 'name', key: 'name' },
              { title: '个人积分', dataIndex: 'points', key: 'points' },
              { title: '功分得分', dataIndex: 'merit', key: 'merit', render: v => <Tag color="purple">{Number(v).toFixed(2)}</Tag> },
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
};

const CombinedScorePanel = ({ tasks, members, projectPoints }) => {
  const combined = useMemo(() => {
    // 系统分
    const sysMap = new Map();
    (tasks || []).forEach(t => {
      if (!t.assignee) return;
      const s = computeSystemScore(t, tasks || []);
      sysMap.set(t.assignee, Number(sysMap.get(t.assignee) || 0) + s);
    });
    // 功分
    const pointsMap = new Map();
    if (projectPoints && Array.isArray(projectPoints.distribution)) {
      projectPoints.distribution.forEach(item => {
        pointsMap.set(item.user, Number(item.points || 0));
      });
    }
    const totalPoints = Array.from(pointsMap.values()).reduce((a,b)=>a+b,0);

    return (members || []).map(m => {
      const sys = Number(sysMap.get(m.user) || 0);
      const p = Number(pointsMap.get(m.user) || 0);
      const merit = totalPoints > 0 ? (p / totalPoints) * 30 : 0;
      const total = sys + merit;
      return { key: m.user, name: m.user_name, system: sys, merit, total };
    }).sort((a,b)=> b.total - a.total);
  }, [tasks, members, projectPoints]);

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={24}>
        <Card title="综合评分" extra={<Text type="secondary">系统分 + 功分 = 总分</Text>}>
          <Table
            dataSource={combined}
            pagination={false}
            columns={[
              { title: '成员', dataIndex: 'name', key: 'name' },
              { title: '系统分', dataIndex: 'system', key: 'system', render: v => v.toFixed(2) },
              { title: '功分', dataIndex: 'merit', key: 'merit', render: v => v.toFixed(2) },
              { title: '总分', dataIndex: 'total', key: 'total', render: v => <Text strong>{v.toFixed(2)}</Text> },
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
};