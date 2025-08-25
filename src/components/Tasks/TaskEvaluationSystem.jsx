import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Tag,
  Space,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Rate,
  Alert,
  Divider,
  Tabs,
  DatePicker
} from 'antd';
import {
  BarChartOutlined,
  TrophyOutlined,
  StarOutlined,
  EyeOutlined,
  CalculatorOutlined,
  LineChartOutlined,
  TeamOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TaskEvaluationSystem = ({ taskId, projectId, isProjectOwner }) => {
  const [taskData, setTaskData] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [taskAssignments, setTaskAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evaluationModalVisible, setEvaluationModalVisible] = useState(false);
  const [scoreDetailsVisible, setScoreDetailsVisible] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (taskId) {
      fetchTaskData();
      fetchTaskAssignments();
      fetchEvaluations();
    }
  }, [taskId]);

  const fetchTaskData = async () => {
    try {
      const response = await api.get(`/projects/tasks/${taskId}/`);
      setTaskData(response.data);
    } catch (error) {
      console.error('Error fetching task data:', error);
    }
  };

  const fetchTaskAssignments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects/task-assignments/', {
        params: { task: taskId }
      });
      setTaskAssignments(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching task assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const response = await api.get('/projects/evaluations/', {
        params: { project: projectId }
      });
      setEvaluations(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    }
  };

  const calculateTaskScores = () => {
    if (!taskData || taskData.status !== 'completed') {
      return null;
    }

    const scores = taskAssignments.map(assignment => {
      // 系统分计算：基础分 × 角色权重 × 时效系数
      const systemScore = 100 * (assignment.role_weight || 1.0) * (taskData.time_coefficient || 1.0);
      
      // 功分从评估记录中获取或使用默认值
      const functionScore = assignment.function_score || 0;
      
      // 总分
      const totalScore = systemScore + functionScore;

      return {
        ...assignment,
        calculated_system_score: systemScore,
        calculated_total_score: totalScore
      };
    });

    return scores;
  };

  const getScoreColor = (score) => {
    if (score >= 150) return '#52c41a'; // 绿色 - 优秀
    if (score >= 120) return '#1890ff'; // 蓝色 - 良好
    if (score >= 100) return '#faad14'; // 黄色 - 一般
    return '#ff4d4f'; // 红色 - 需改进
  };

  const getPerformanceLevel = (score) => {
    if (score >= 150) return { text: '优秀', color: 'success' };
    if (score >= 120) return { text: '良好', color: 'processing' };
    if (score >= 100) return { text: '一般', color: 'warning' };
    return { text: '需改进', color: 'error' };
  };

  const assignmentColumns = [
    {
      title: '成员',
      dataIndex: 'user_name',
      key: 'user',
      render: (name) => (
        <Space>
          <TeamOutlined />
          <Text strong>{name}</Text>
        </Space>
      )
    },
    {
      title: '角色权重',
      dataIndex: 'role_weight',
      key: 'role_weight',
      render: (weight) => (
        <div>
          <Progress 
            percent={weight * 100} 
            size="small" 
            showInfo={false}
            strokeColor="#1890ff"
          />
          <Text style={{ fontSize: 12 }}>{weight}</Text>
        </div>
      )
    },
    {
      title: '系统分',
      key: 'system_score',
      render: (_, record) => {
        const calculatedScores = calculateTaskScores();
        const userScore = calculatedScores?.find(s => s.user === record.user);
        const systemScore = userScore?.calculated_system_score || record.system_score;
        
        return (
          <div>
            <Text strong style={{ color: getScoreColor(systemScore) }}>
              {systemScore.toFixed(1)}
            </Text>
            <div style={{ fontSize: 11, color: '#666' }}>
              基础分 × 权重 × 时效
            </div>
          </div>
        );
      }
    },
    {
      title: '功分',
      dataIndex: 'function_score',
      key: 'function_score',
      render: (score) => (
        <div>
          <Text strong style={{ color: '#722ed1' }}>{score}</Text>
          <div style={{ fontSize: 11, color: '#666' }}>
            同行评估分
          </div>
        </div>
      )
    },
    {
      title: '总分',
      key: 'total_score',
      render: (_, record) => {
        const calculatedScores = calculateTaskScores();
        const userScore = calculatedScores?.find(s => s.user === record.user);
        const totalScore = userScore?.calculated_total_score || record.total_score;
        const level = getPerformanceLevel(totalScore);
        
        return (
          <Space direction="vertical" size="small">
            <Text strong style={{ color: getScoreColor(totalScore), fontSize: 16 }}>
              {totalScore.toFixed(1)}
            </Text>
            <Tag color={level.color}>{level.text}</Tag>
          </Space>
        );
      }
    },
    {
      title: '分配时间',
      dataIndex: 'assigned_at',
      key: 'assigned_at',
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    }
  ];

  const ScoreBreakdown = () => {
    if (!taskData || taskData.status !== 'completed') {
      return (
        <Alert
          message="任务尚未完成"
          description="任务完成后才能查看详细的评分计算"
          type="info"
          showIcon
        />
      );
    }

    const calculatedScores = calculateTaskScores();
    if (!calculatedScores || calculatedScores.length === 0) {
      return (
        <Alert
          message="无评分数据"
          description="此任务没有分配给任何成员"
          type="warning"
          showIcon
        />
      );
    }

    return (
      <div>
        <Title level={4}>评分计算说明</Title>
        <Paragraph>
          <Text strong>系统分计算公式：</Text> 基础分(100) × 角色权重 × 时效系数<br />
          <Text strong>功分：</Text> 由项目成员互评获得<br />
          <Text strong>总分：</Text> 系统分 + 功分
        </Paragraph>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="任务时效系数"
                value={taskData.time_coefficient || 1.0}
                precision={2}
                prefix={<CalculatorOutlined />}
                valueStyle={{ 
                  color: taskData.time_coefficient >= 1.2 ? '#52c41a' : 
                         taskData.time_coefficient >= 1.0 ? '#1890ff' : '#ff4d4f'
                }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                {taskData.time_coefficient >= 1.2 ? '提前完成，获得奖励' :
                 taskData.time_coefficient >= 1.0 ? '按时完成' : '延期完成，有扣分'}
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="平均系统分"
                value={calculatedScores.reduce((sum, s) => sum + s.calculated_system_score, 0) / calculatedScores.length}
                precision={1}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="最高总分"
                value={Math.max(...calculatedScores.map(s => s.calculated_total_score))}
                precision={1}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={assignmentColumns}
          dataSource={taskAssignments}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </div>
    );
  };

  const TaskOverview = () => (
    <div>
      {taskData && (
        <Card>
          <Row gutter={16}>
            <Col span={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><Text strong>任务标题：</Text>{taskData.title}</div>
                <div><Text strong>任务状态：</Text>
                  <Tag color={
                    taskData.status === 'completed' ? 'success' : 
                    taskData.status === 'in_progress' ? 'processing' : 'warning'
                  }>
                    {taskData.status === 'completed' ? '已完成' : 
                     taskData.status === 'in_progress' ? '进行中' : '待处理'}
                  </Tag>
                </div>
                <div><Text strong>任务进度：</Text>
                  <Progress percent={taskData.progress || 0} size="small" style={{ width: 200 }} />
                </div>
                <div><Text strong>负责人：</Text>{taskData.assignee_name || '未分配'}</div>
                <div><Text strong>创建者：</Text>{taskData.creator_name}</div>
              </Space>
            </Col>
            <Col span={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><Text strong>预估工时：</Text>{taskData.estimated_hours || 'N/A'} 小时</div>
                <div><Text strong>实际工时：</Text>{taskData.actual_hours || 'N/A'} 小时</div>
                <div><Text strong>截止日期：</Text>
                  {taskData.due_date ? dayjs(taskData.due_date).format('YYYY-MM-DD') : '无限制'}
                </div>
                <div><Text strong>完成时间：</Text>
                  {taskData.completed_at ? dayjs(taskData.completed_at).format('YYYY-MM-DD HH:mm') : 'N/A'}
                </div>
                <div><Text strong>创建时间：</Text>
                  {dayjs(taskData.created_at).format('YYYY-MM-DD HH:mm')}
                </div>
              </Space>
            </Col>
          </Row>
          
          {taskData.description && (
            <>
              <Divider />
              <div>
                <Text strong>任务描述：</Text>
                <Paragraph style={{ marginTop: 8 }}>{taskData.description}</Paragraph>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );

  return (
    <div>
      <Card
        title={
          <Space>
            <BarChartOutlined />
            <span>任务评估与评分</span>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="任务概览" key="overview">
            <TaskOverview />
          </Tabs.TabPane>
          
          <Tabs.TabPane tab="评分详情" key="scoring">
            <ScoreBreakdown />
          </Tabs.TabPane>
          
          <Tabs.TabPane tab={`成员分配 (${taskAssignments.length})`} key="assignments">
            <Table
              columns={assignmentColumns}
              dataSource={taskAssignments}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 个分配`
              }}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default TaskEvaluationSystem;