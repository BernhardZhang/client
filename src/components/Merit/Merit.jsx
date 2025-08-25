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
  InputNumber,
  Select,
  Space,
  Tag,
  Avatar,
  Typography,
  message,
  List,
  Progress,
  Statistic,
  Rate,
  Tabs,
} from 'antd';
import {
  UserOutlined,
  ProjectOutlined,
  StarOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import useProjectStore from '../../stores/projectStore';
import useVotingStore from '../../stores/votingStore';
import { authAPI } from '../../services/api';
import UserMeritSummary from './UserMeritSummary';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const Merit = ({ projectId = null }) => {
  const [form] = Form.useForm();
  const [isEvalModalVisible, setIsEvalModalVisible] = useState(false);
  const [allUsers, setAllUsers] = useState({});
  
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const {
    activeRound,
    evaluations,
    fetchActiveRound,
    fetchEvaluations,
    createEvaluation,
    isLoading
  } = useVotingStore();

  useEffect(() => {
    fetchProjects();
    fetchActiveRound();
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeRound) {
      fetchEvaluations(activeRound.id);
    }
  }, [activeRound]);

  const loadUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      setAllUsers(response.data || []);
    } catch (error) {
      message.error('加载用户列表失败，请刷新页面重试');
    }
  };

  const handleCreateEvaluation = async () => {
    try {
      const values = await form.validateFields();
      const result = await createEvaluation({
        ...values,
        voting_round: activeRound.id,
      });
      
      if (result.success) {
        message.success('贡献评价提交成功！');
        setIsEvalModalVisible(false);
        form.resetFields();
        fetchEvaluations(activeRound.id);
      } else {
        message.error(result.error);
      }
    } catch (error) {
      console.error('提交评价失败:', error);
    }
  };

  const myProjects = Array.isArray(projects) ? projects.filter(p => 
    p.members_detail?.some(m => m.user === user?.id)
  ) : [];

  const otherUsers = Array.isArray(allUsers) ? allUsers.filter(u => u.id !== user?.id) : [];

  // 我创建的评价
  const myEvaluations = Array.isArray(evaluations) ? evaluations.filter(e => e.evaluator === user?.id) : [];
  
  // 我收到的评价
  const receivedEvaluations = Array.isArray(evaluations) ? evaluations.filter(e => e.evaluated_user === user?.id) : [];

  // 统计数据
  const avgScore = receivedEvaluations.length > 0 
    ? receivedEvaluations.reduce((sum, e) => sum + e.contribution_score, 0) / receivedEvaluations.length 
    : 0;

  const evaluationColumns = [
    {
      title: '评价者',
      dataIndex: 'evaluator_name',
      key: 'evaluator_name',
      render: (name) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {name}
        </Space>
      ),
    },
    {
      title: '被评价者',
      dataIndex: 'evaluated_user_name',
      key: 'evaluated_user_name',
      render: (name) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {name}
        </Space>
      ),
    },
    {
      title: '项目',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (name) => (
        <Tag color="blue" icon={<ProjectOutlined />}>
          {name}
        </Tag>
      ),
    },
    {
      title: '贡献度评分',
      dataIndex: 'contribution_score',
      key: 'contribution_score',
      render: (score) => (
        <Space>
          <Progress 
            percent={score} 
            size="small" 
            status={score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception'}
            style={{ width: 100 }}
          />
          <Text strong>{score}分</Text>
        </Space>
      ),
    },
    {
      title: '评价时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>功分系统</Title>
      </Row>

      <Tabs defaultActiveKey="evaluation" type="card">
        <TabPane
          tab={
            <Space>
              <StarOutlined />
              同行互评
            </Space>
          }
          key="evaluation"
        >
          <div style={{ marginBottom: 16 }}>
            {activeRound && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setIsEvalModalVisible(true);
                  // 确保在打开Modal时用户数据已加载
                  if (allUsers.length === 0) {
                    loadUsers();
                  }
                }}
              >
                创建评价
              </Button>
            )}
          </div>

          {!activeRound ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircleOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
                <Title level={4} type="secondary">暂无活跃的评价轮次</Title>
                <Text type="secondary">请等待管理员开启新的评价轮次</Text>
              </div>
            </Card>
          ) : (
            <>
              {/* 统计卡片 */}
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="当前轮次"
                      value={activeRound.name + " (互评)"}
                      prefix={<StarOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="我的平均得分"
                      value={avgScore.toFixed(1)}
                      suffix="分"
                      valueStyle={{ color: avgScore >= 80 ? '#3f8600' : avgScore >= 60 ? '#1890ff' : '#cf1322' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="创建的评价"
                      value={myEvaluations.length}
                      suffix="条"
                      prefix={<UserOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="收到的评价"
                      value={receivedEvaluations.length}
                      suffix="条"
                      prefix={<CheckCircleOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              {/* 评价列表 */}
              <Row gutter={16}>
                <Col span={12}>
                  <Card title="我创建的评价" style={{ height: 500, overflow: 'auto' }}>
                    <List
                      dataSource={myEvaluations}
                      renderItem={(evaluation) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Avatar icon={<StarOutlined />} />}
                            title={`评价 ${evaluation.evaluated_user_name}`}
                            description={
                              <Space direction="vertical" size="small">
                                <Text>项目: {evaluation.project_name}</Text>
                                <Progress
                                  percent={evaluation.contribution_score}
                                  size="small"
                                  status={evaluation.contribution_score >= 80 ? 'success' : 'normal'}
                                />
                                {evaluation.comment && (
                                  <Text type="secondary" style={{ fontStyle: 'italic' }}>
                                    "{evaluation.comment}"
                                  </Text>
                                )}
                              </Space>
                            }
                          />
                          <div>
                            <Text type="secondary">
                              {new Date(evaluation.created_at).toLocaleDateString()}
                            </Text>
                          </div>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
                
                <Col span={12}>
                  <Card title="我收到的评价" style={{ height: 500, overflow: 'auto' }}>
                    <List
                      dataSource={receivedEvaluations}
                      renderItem={(evaluation) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Avatar icon={<UserOutlined />} />}
                            title={`${evaluation.evaluator_name} 的评价`}
                            description={
                              <Space direction="vertical" size="small">
                                <Text>项目: {evaluation.project_name}</Text>
                                <Progress
                                  percent={evaluation.contribution_score}
                                  size="small"
                                  status={evaluation.contribution_score >= 80 ? 'success' : 'normal'}
                                />
                                {evaluation.comment && (
                                  <Text type="secondary" style={{ fontStyle: 'italic' }}>
                                    "{evaluation.comment}"
                                  </Text>
                                )}
                              </Space>
                            }
                          />
                          <div>
                            <Text type="secondary">
                              {new Date(evaluation.created_at).toLocaleDateString()}
                            </Text>
                          </div>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>

              {/* 详细评价表格 */}
              <Card title="所有评价记录" style={{ marginTop: 16 }}>
                <Table
                  columns={evaluationColumns}
                  dataSource={Array.isArray(evaluations) ? evaluations : []}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  loading={isLoading}
                />
              </Card>
            </>
          )}
        </TabPane>

        <TabPane
          tab={
            <Space>
              <TrophyOutlined />
              功分汇总
            </Space>
          }
          key="merit"
        >
          <UserMeritSummary />
        </TabPane>
      </Tabs>

      {/* 创建评价Modal */}
      <Modal
        title="创建贡献评价"
        open={isEvalModalVisible}
        onOk={handleCreateEvaluation}
        onCancel={() => {
          setIsEvalModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={isLoading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="project"
            label="选择项目"
            rules={[{ required: true, message: '请选择项目！' }]}
          >
            <Select placeholder="选择要评价的项目">
              {myProjects.map(project => (
                <Option key={project.id} value={project.id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="evaluated_user"
            label="被评价者"
            rules={[{ required: true, message: '请选择被评价者！' }]}
          >
            <Select placeholder投票给用户="选择被评价的用户">
              {allUsers.results && allUsers.results.length > 0 ? (
                allUsers.results.filter(u => !user || u.id !== user.id).map(u => (
                  <Option key={u.id} value={u.id}>
                    {u.username}
                  </Option>
                ))
              ) : (
                <Option disabled value="">
                  暂无可选用户
                </Option>
              )}
            </Select>
          </Form.Item>

          <Form.Item
            name="contribution_score"
            label="贡献度评分"
            rules={[
              { required: true, message: '请给出贡献度评分！' },
              { type: 'number', min: 0, max: 100, message: '评分范围为0-100分！' }
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: '100%' }}
              placeholder="请输入0-100的评分"
              addonAfter="分"
            />
          </Form.Item>

          <Form.Item
            name="comment"
            label="评价说明"
          >
            <TextArea
              rows={4}
              placeholder="请详细说明您的评价理由..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Merit;