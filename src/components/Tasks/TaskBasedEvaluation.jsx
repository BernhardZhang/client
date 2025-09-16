import { useEffect, useState } from 'react';
import {
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
  Select,
  Rate,
  Row,
  Col,
  Divider,
  Checkbox,
  InputNumber,
  DatePicker,
  List,
  Badge,
  Tabs,
  Progress,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  StarOutlined,
  TrophyOutlined,
  TeamOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore.js';
import useTaskStore from '../../stores/taskStore.js';
import useVotingStore from '../../stores/votingStore.js';
import { tasksAPI } from '../../services/api.js';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TaskBasedEvaluation = ({ projectId, project, isProjectOwner }) => {
  const [form] = Form.useForm();
  const [evaluationForm] = Form.useForm();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEvaluationModalVisible, setIsEvaluationModalVisible] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [evaluationData, setEvaluationData] = useState([]);
  const [activeTab, setActiveTab] = useState('list');

  const { user } = useAuthStore();
  const {
    evaluationSessions,
    fetchEvaluationSessions,
    createEvaluationSession,
    submitBatchEvaluation,
    completeEvaluationSession,
    isLoading
  } = useTaskStore();
  const {
    myVotes,
    fetchMyVotes,
    votingRounds,
    fetchVotingRounds,
    activeRound
  } = useVotingStore();

  useEffect(() => {
    if (projectId) {
      loadEvaluations();
      fetchCompletedTasks();
      fetchAllTasks();
      fetchProjectMembers();
      // Also load voting data
      fetchMyVotes();
      fetchVotingRounds();
    }
  }, [projectId]);

  const loadEvaluations = async () => {
    try {
      await fetchEvaluationSessions({ project: projectId });
    } catch (error) {
      console.error('获取评分活动失败:', error);
    }
  };

  const fetchCompletedTasks = async () => {
    try {
      const response = await tasksAPI.getTasks({ project: projectId, status: 'completed' });
      setCompletedTasks(response.data.results || response.data);
    } catch (error) {
      console.error('获取已完成任务失败:', error);
    }
  };

  const fetchAllTasks = async () => {
    try {
      const response = await tasksAPI.getTasks({ project: projectId });
      setAllTasks(response.data.results || response.data);
    } catch (error) {
      console.error('获取所有任务失败:', error);
    }
  };

  const fetchProjectMembers = () => {
    if (project && project.members_detail) {
      setProjectMembers(project.members_detail);
    }
  };

  const handleCreateEvaluation = async () => {
    try {
      const values = await form.validateFields();
      
      const sessionData = {
        name: values.name,
        description: values.description,
        project: projectId,
        selected_tasks: values.selected_tasks,
        participants: values.selected_members,
      };

      const result = await createEvaluationSession(sessionData);

      if (result.success) {
        message.success('任务评估评分会话创建成功！');
        setIsCreateModalVisible(false);
        form.resetFields();
        loadEvaluations();
        fetchAllTasks();
      } else {
        message.error(result.error || '创建失败');
      }
    } catch (error) {
      console.error('创建评估会话失败:', error);
      message.error('创建失败');
    }
  };

  const handleParticipateEvaluation = (evaluation) => {
    setCurrentEvaluation(evaluation);
    
    // 获取评估会话的任务信息
    const taskInfo = evaluation.selected_tasks_detail || [];
    const selectedMembers = evaluation.participants_detail || [];
    
    // 初始化评估数据
    const initialData = [];
    taskInfo.forEach(task => {
      // 只评估有负责人的任务
      if (task.assignee && task.assignee !== user.id) {
        const assigneeName = selectedMembers.find(m => m.id === task.assignee)?.username || task.assignee_name;
        initialData.push({
          task_id: task.id,
          task_title: task.title,
          evaluated_user: task.assignee,
          evaluated_user_name: assigneeName,
          score: 80, // 默认分数
          comment: '',
          criteria_scores: {
            '任务质量': 80,
            '完成效率': 80,
            '团队协作': 80,
            '创新程度': 80,
          }
        });
      }
    });
    
    setEvaluationData(initialData);
    setIsEvaluationModalVisible(true);
  };

  const handleSubmitEvaluation = async () => {
    try {
      const result = await submitBatchEvaluation(currentEvaluation.id, evaluationData);

      if (result.success) {
        message.success('评分提交成功！');
        setIsEvaluationModalVisible(false);
        setCurrentEvaluation(null);
        setEvaluationData([]);
        loadEvaluations();
        fetchAllTasks();
        fetchCompletedTasks();
      } else {
        message.error(result.error || '提交失败');
      }
    } catch (error) {
      console.error('提交评分失败:', error);
      message.error('提交失败');
    }
  };

  const updateEvaluationScore = (index, field, value) => {
    const newData = [...evaluationData];
    if (field === 'criteria_scores') {
      newData[index].criteria_scores = { ...newData[index].criteria_scores, ...value };
      // 计算平均分作为总分
      const criteriaValues = Object.values(newData[index].criteria_scores);
      const avgScore = criteriaValues.reduce((sum, score) => sum + score, 0) / criteriaValues.length;
      newData[index].score = Math.round(avgScore);
    } else {
      newData[index][field] = value;
    }
    setEvaluationData(newData);
  };

  const getEvaluationStatusTag = (status) => {
    const config = {
      active: { color: 'processing', text: '进行中' },
      completed: { color: 'success', text: '已完成' },
      cancelled: { color: 'error', text: '已取消' },
    };
    const statusConfig = config[status] || { color: 'default', text: '未知' };
    return <Tag color={statusConfig.color}>{statusConfig.text}</Tag>;
  };

  const columns = [
    {
      title: '评分名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          {record.description && (
            <Text type="secondary" ellipsis>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getEvaluationStatusTag(status),
    },
    {
      title: '参与人数',
      key: 'participant_count',
      render: (_, record) => (
        <Space>
          <TeamOutlined />
          <Text>{record.participants?.length || 0} 人</Text>
        </Space>
      ),
    },
    {
      title: '任务数量',
      key: 'task_count',
      render: (_, record) => (
        <Space>
          <FileTextOutlined />
          <Text>{record.selected_tasks_detail?.length || 0} 个</Text>
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => {
        const isCreator = record.created_by === user.id;
        const isParticipant = record.participants_detail?.some(p => p.id === user.id);
        const hasParticipated = record.evaluation_records?.some(r => r.evaluator === user.username);
        const canParticipate = isParticipant && !hasParticipated && record.status === 'active';

        return (
          <Space>
            {canParticipate && (
              <Button
                type="primary"
                size="small"
                icon={<StarOutlined />}
                onClick={() => handleParticipateEvaluation(record)}
              >
                参与评分
              </Button>
            )}
            {isCreator && record.status === 'active' && (
              <Button
                size="small"
                onClick={async () => {
                  try {
                    const result = await completeEvaluationSession(record.id);
                    if (result.success) {
                      message.success('评估会话完成成功！');
                      loadEvaluations();
                      fetchAllTasks();
                      fetchCompletedTasks();
                    } else {
                      message.error(result.error || '完成评估会话失败');
                    }
                  } catch (error) {
                    message.error('完成评估会话失败');
                  }
                }}
              >
                完成评分
              </Button>
            )}
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => message.info('查看详情功能待实现')}
            >
              查看
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Space>
          <Text strong>项目任务总览: {allTasks.length} 个任务，其中 {completedTasks.length} 个已完成</Text>
        </Space>
        {(isProjectOwner || project?.members_detail?.some(m => m.user === user.id && m.role === 'admin')) && (
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalVisible(true)}
          >
            创建评分
          </Button>
        )}
      </Row>

      {/* 任务评分统计 */}
      <Row gutter={8} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
            <Statistic
              title="总任务数"
              value={allTasks.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ fontSize: '16px', color: '#1890ff' }}
              titleStyle={{ fontSize: '12px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
            <Statistic
              title="已完成任务"
              value={completedTasks.length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ fontSize: '16px', color: '#52c41a' }}
              titleStyle={{ fontSize: '12px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
            <Statistic
              title="平均系统分"
              value={completedTasks.length > 0 ? (completedTasks.reduce((sum, task) => sum + (task.system_score || 0), 0) / completedTasks.length).toFixed(1) : 0}
              prefix={<BarChartOutlined />}
              valueStyle={{ fontSize: '16px', color: '#1890ff' }}
              titleStyle={{ fontSize: '12px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
            <Statistic
              title="平均功分"
              value={completedTasks.length > 0 ? (completedTasks.reduce((sum, task) => sum + (task.function_score || 0), 0) / completedTasks.length).toFixed(1) : 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ fontSize: '16px', color: '#52c41a' }}
              titleStyle={{ fontSize: '12px' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="评分列表" key="list">
          <Table
            columns={columns}
            dataSource={evaluationSessions}
            rowKey="id"
            loading={isLoading}
            size="small"
            pagination={{
              pageSize: 5,
              size: 'small',
              showSizeChanger: false,
              showQuickJumper: false,
              showTotal: (total) => `共 ${total} 个评分活动`,
            }}
            scroll={{ y: 250 }}
          />
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="任务分数" key="task-scores">
          <Table
            columns={[
              {
                title: '任务名称',
                dataIndex: 'title',
                key: 'title',
                render: (text, record) => (
                  <Space direction="vertical" size="small">
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      负责人: {record.assignee_name || '未分配'}
                    </Text>
                  </Space>
                ),
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: (status) => (
                  <Tag color={status === 'completed' ? 'green' : status === 'in_progress' ? 'blue' : 'orange'}>
                    {status === 'completed' ? '已完成' : status === 'in_progress' ? '进行中' : '待处理'}
                  </Tag>
                ),
              },
              {
                title: '系统分',
                dataIndex: 'system_score',
                key: 'system_score',
                render: (score) => (
                  <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>
                    {Number(score || 0).toFixed(1)}
                  </Text>
                ),
              },
              {
                title: '功分',
                dataIndex: 'function_score',
                key: 'function_score',
                render: (score) => (
                  <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    {Number(score || 0).toFixed(1)}
                  </Text>
                ),
              },
              {
                title: '总分',
                key: 'total_score',
                render: (_, record) => (
                  <Text style={{ color: '#722ed1', fontWeight: 'bold' }}>
                    {(Number(record.system_score || 0) + Number(record.function_score || 0)).toFixed(1)}
                  </Text>
                ),
              },
            ]}
            dataSource={allTasks}
            rowKey="id"
            size="small"
            pagination={{
              pageSize: 5,
              size: 'small',
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 个任务`,
            }}
            scroll={{ y: 250 }}
          />
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="评分统计" key="stats">
          <Card>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="总评分活动"
                  value={evaluationSessions.length}
                  prefix={<TrophyOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="进行中"
                  value={evaluationSessions.filter(e => e.status === 'active').length}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<CalendarOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="已完成"
                  value={evaluationSessions.filter(e => e.status === 'completed').length}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane tab="投票评分" key="voting">
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
                  <Statistic
                    title="我的投票次数"
                    value={myVotes.length}
                    prefix={<StarOutlined />}
                    valueStyle={{ fontSize: '16px', color: '#722ed1' }}
                    titleStyle={{ fontSize: '12px' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
                  <Statistic
                    title="投票轮次"
                    value={votingRounds.length}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ fontSize: '16px', color: '#1890ff' }}
                    titleStyle={{ fontSize: '12px' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
                  <Statistic
                    title="当前轮次"
                    value={activeRound ? activeRound.name : '无'}
                    prefix={<TrophyOutlined />}
                    valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                    titleStyle={{ fontSize: '12px' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="我的投票记录">
              {myVotes && myVotes.length > 0 ? (
                <Table
                  dataSource={myVotes}
                  rowKey="id"
                  size="small"
                  pagination={{
                    pageSize: 5,
                    size: 'small',
                    showTotal: (total) => `共 ${total} 条投票记录`,
                  }}
                  columns={[
                    {
                      title: '投票对象',
                      dataIndex: 'target_name',
                      key: 'target_name',
                      render: (text, record) => (
                        <Space>
                          <Avatar size="small" icon={<UserOutlined />} />
                          <Text>{text || record.voted_user_name || '未知'}</Text>
                        </Space>
                      ),
                    },
                    {
                      title: '投票分数',
                      dataIndex: 'score',
                      key: 'score',
                      render: (score) => (
                        <Text strong style={{ color: '#1890ff' }}>
                          {score || 0} 分
                        </Text>
                      ),
                    },
                    {
                      title: '投票轮次',
                      dataIndex: 'voting_round_name',
                      key: 'voting_round_name',
                      render: (text) => (
                        <Tag color="blue">{text || '未知轮次'}</Tag>
                      ),
                    },
                    {
                      title: '投票时间',
                      dataIndex: 'created_at',
                      key: 'created_at',
                      render: (date) => (
                        <Text type="secondary">
                          {date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'}
                        </Text>
                      ),
                    },
                    {
                      title: '评论',
                      dataIndex: 'comment',
                      key: 'comment',
                      render: (comment) => (
                        <Text type="secondary" ellipsis={{ tooltip: comment }}>
                          {comment || '无评论'}
                        </Text>
                      ),
                    },
                  ]}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  <StarOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <div>暂无投票记录</div>
                  <Text type="secondary">当有投票活动时，您的投票记录会在这里显示</Text>
                </div>
              )}
            </Card>
          </div>
        </Tabs.TabPane>
      </Tabs>

      {/* 创建评分会话Modal */}
      <Modal
        title="创建任务评估评分"
        open={isCreateModalVisible}
        onOk={handleCreateEvaluation}
        onCancel={() => {
          setIsCreateModalVisible(false);
          form.resetFields();
        }}
        width={800}
        okText="创建"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="评分名称"
            rules={[{ required: true, message: '请输入评分名称' }]}
          >
            <Input placeholder="请输入评分名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="评分说明"
          >
            <TextArea
              rows={3}
              placeholder="请输入评分说明，包括评分标准、注意事项等"
            />
          </Form.Item>

          <Form.Item
            name="selected_tasks"
            label="选择要评估的已完成任务"
            rules={[{ required: true, message: '请至少选择一个任务' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择要评估的已完成任务"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {completedTasks.map(task => (
                <Option key={task.id} value={task.id}>
                  {task.title} - {task.assignee_name || '未分配'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="selected_members"
            label="选择参与评分的成员"
            rules={[{ required: true, message: '请至少选择一个成员' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择参与评分的项目成员"
            >
              {projectMembers.map(member => (
                <Option key={member.user} value={member.user}>
                  {member.user_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 参与评分Modal */}
      <Modal
        title={`参与评分: ${currentEvaluation?.name}`}
        open={isEvaluationModalVisible}
        onOk={handleSubmitEvaluation}
        onCancel={() => {
          setIsEvaluationModalVisible(false);
          setCurrentEvaluation(null);
          setEvaluationData([]);
        }}
        width={1000}
        okText="提交评分"
        cancelText="取消"
      >
        <div style={{ maxHeight: 600, overflowY: 'auto' }}>
          <Paragraph type="secondary">
            请对以下任务-成员组合进行评分。评分将影响成员的功分计算。
          </Paragraph>
          
          {evaluationData.map((item, index) => (
            <Card key={`${item.task_id}-${item.evaluated_user}`} size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical">
                    <Text strong>任务: {item.task_title}</Text>
                    <Text>评估对象: {item.evaluated_user_name}</Text>
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>综合评分</Text>
                    <Rate
                      allowHalf
                      count={10}
                      value={item.score / 10}
                      onChange={(value) => updateEvaluationScore(index, 'score', value * 10)}
                    />
                    <InputNumber
                      min={0}
                      max={100}
                      value={item.score}
                      onChange={(value) => updateEvaluationScore(index, 'score', value)}
                      formatter={value => `${value}分`}
                      parser={value => value.replace('分', '')}
                    />
                  </Space>
                </Col>
              </Row>
              
              <Divider />
              
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>分项评分</Text>
                  {Object.entries(item.criteria_scores).map(([criterion, score]) => (
                    <Row key={criterion} align="middle" style={{ marginTop: 8 }}>
                      <Col span={8}><Text>{criterion}:</Text></Col>
                      <Col span={16}>
                        <Slider
                          min={0}
                          max={100}
                          value={score}
                          onChange={(value) => updateEvaluationScore(index, 'criteria_scores', { [criterion]: value })}
                          marks={{ 0: '0', 50: '50', 100: '100' }}
                        />
                      </Col>
                    </Row>
                  ))}
                </Col>
                <Col span={12}>
                  <Text strong>评分意见</Text>
                  <TextArea
                    rows={4}
                    placeholder="请输入评分理由和建议..."
                    value={item.comment}
                    onChange={(e) => updateEvaluationScore(index, 'comment', e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                </Col>
              </Row>
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default TaskBasedEvaluation;