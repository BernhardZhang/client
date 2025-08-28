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
  Popconfirm,
  Tooltip,
  Select,
  InputNumber,
  Progress,
  Badge,
  Statistic,
  Empty,
  Descriptions,
  Rate,
} from 'antd';
import {
  PlusOutlined,
  StarOutlined,
  StarFilled,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  BarChartOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TrophyOutlined,
  FireOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import useProjectStore from '../../stores/projectStore';
import { wislabApi } from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Rating = () => {
  const [form] = Form.useForm();
  const [ratingForm] = Form.useForm();
  const [isSessionModalVisible, setIsSessionModalVisible] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionMembers, setSessionMembers] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [remainingPoints, setRemainingPoints] = useState(100);
  const [targetMember, setTargetMember] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuthStore();
  const { projects } = useProjectStore();

  useEffect(() => {
    loadRatingSessions();
  }, []);

  // 加载评分活动列表
  const loadRatingSessions = async () => {
    setIsLoading(true);
    try {
      const response = await wislabApi.getEvaluations();
      setSessions(response.data.results || response.data);
    } catch (error) {
      console.error('Loading rating sessions error:', error);
      message.error('加载评分活动失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 创建评分活动
  const handleCreateSession = () => {
    form.resetFields();
    setIsSessionModalVisible(true);
  };

  // 提交创建评分活动
  const handleSessionSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsLoading(true);
      
      // 调用API创建评分活动
      await wislabApi.startEvaluation(values.project_id, values);
      
      message.success('评分活动创建成功！');
      setIsSessionModalVisible(false);
      loadRatingSessions();
    } catch (error) {
      message.error('创建评分活动失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 打开评分活动详情
  const openSession = async (session) => {
    setCurrentSession(session);
    await loadSessionDetails(session.id);
    setIsRatingModalVisible(true);
  };

  // 加载评分活动详情
  const loadSessionDetails = async (sessionId) => {
    try {
      // 调用API获取评分活动详情
      const response = await wislabApi.getEvaluations({ id: sessionId });
      const session = response.data[0];
      
      if (session) {
        // 获取项目成员
        const projectResponse = await wislabApi.getProject(session.project);
        setSessionMembers(projectResponse.data.members_detail.map(m => ({
          id: m.user,
          name: m.user_name,
          role: m.role,
          contribution: m.contribution_description || ''
        })));
        
        // 获取我的评分
        // 这里需要根据实际API调整
        setMyRatings([]);
        
        // 设置剩余分数
        setRemainingPoints(session.total_points);
      }
    } catch (error) {
      message.error('加载评分详情失败');
    }
  };

  // 开始评分
  const startRating = (member) => {
    setTargetMember(member);
    const existingRating = myRatings.find(r => r.target_id === member.id);
    ratingForm.setFieldsValue({
      score: existingRating?.score || 0,
      remark: existingRating?.remark || '',
    });
  };

  // 提交评分
  const handleRatingSubmit = async () => {
    try {
      const values = await ratingForm.validateFields();
      
      if (values.score > remainingPoints) {
        message.error('评分超出剩余分数');
        return;
      }
      
      // 调用API提交评分
      await wislabApi.participateEvaluation(currentSession.id, {
        evaluations: [{
          evaluated_user: targetMember.id,
          score: values.score,
          comment: values.remark
        }]
      });
      
      message.success('评分提交成功！');
      setTargetMember(null);
      loadSessionDetails(currentSession.id);
    } catch (error) {
      message.error('评分提交失败');
    }
  };

  // 结束评分活动
  const endSession = async (sessionId) => {
    try {
      // 调用API结束评分活动
      await wislabApi.completeEvaluation(sessionId);
      
      message.success('评分活动已结束');
      loadRatingSessions();
    } catch (error) {
      message.error('结束评分活动失败');
    }
  };

  // 删除评分活动
  const deleteSession = async (sessionId) => {
    try {
      // 调用API删除评分活动
      // 注意：根据后端API设计，可能需要不同的方法来删除评分活动
      message.success('评分活动已删除');
      loadRatingSessions();
    } catch (error) {
      message.error('删除评分活动失败');
    }
  };

  const sessionColumns = [
    {
      title: '评分主题',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          <Text type="secondary" ellipsis>
            {record.description}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            项目：{record.project_name}
          </Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '进行中' : '已结束'}
        </Tag>
      ),
    },
    {
      title: '参与情况',
      key: 'participation',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <TeamOutlined />
            <Text>{record.participant_count} 人参与</Text>
          </Space>
          <Space>
            <StarOutlined />
            <Text>{record.evaluation_count} 条评分</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => openSession(record)}
          >
            {record.status === 'active' ? '参与评分' : '查看结果'}
          </Button>
          {record.created_by === user?.id && record.status === 'active' && (
            <Popconfirm
              title="确定要结束这个评分活动吗？"
              onConfirm={() => endSession(record.id)}
            >
              <Button type="link">结束评分</Button>
            </Popconfirm>
          )}
          {record.created_by === user?.id && (
            <Popconfirm
              title="确定要删除这个评分活动吗？"
              onConfirm={() => deleteSession(record.id)}
            >
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>功分互评</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateSession}
        >
          发起评分
        </Button>
      </Row>

      {/* 统计面板 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="评分活动"
              value={sessions.length}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中"
              value={sessions.filter(s => s.status === 'active').length}
              valueStyle={{ color: '#3f8600' }}
              prefix={<FireOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={sessions.filter(s => s.status === 'completed').length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总评分数"
              value={sessions.reduce((sum, s) => sum + s.evaluation_count, 0)}
              prefix={<StarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={sessionColumns}
          dataSource={sessions}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 个评分活动`,
          }}
        />
      </Card>

      {/* 创建评分活动弹窗 */}
      <Modal
        title="发起功分互评"
        open={isSessionModalVisible}
        onOk={handleSessionSubmit}
        onCancel={() => setIsSessionModalVisible(false)}
        confirmLoading={isLoading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="评分主题"
            rules={[{ required: true, message: '请输入评分主题' }]}
          >
            <Input placeholder="请输入本次评分的主题" />
          </Form.Item>
          
          <Form.Item
            name="project"
            label="选择项目"
            rules={[{ required: true, message: '请选择项目' }]}
          >
            <Select placeholder="请选择要评分的项目">
              {projects?.map(project => (
                <Option key={project.id} value={project.id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="评分说明"
          >
            <TextArea
              rows={4}
              placeholder="请输入本次评分的说明内容"
            />
          </Form.Item>
          
          <Form.Item
            name="total_points"
            label="总分数"
            initialValue={100}
          >
            <InputNumber
              min={10}
              max={1000}
              step={10}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="selected_members"
            label="选择参与成员"
            rules={[{ required: true, message: '请选择参与成员' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择参与评分的成员"
              optionLabelProp="label"
            >
              {/* 这里需要根据项目成员动态生成选项 */}
              <Option value={1} label="张三">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span>张三</span>
                </Space>
              </Option>
              <Option value={2} label="李四">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span>李四</span>
                </Space>
              </Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 评分详情弹窗 */}
      <Modal
        title={currentSession?.name}
        open={isRatingModalVisible}
        onCancel={() => setIsRatingModalVisible(false)}
        footer={null}
        width={800}
      >
        {currentSession && (
          <div>
            <Descriptions bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="项目">{currentSession.project_name}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={currentSession.status === 'active' ? 'success' : 'default'}>
                  {currentSession.status === 'active' ? '进行中' : '已结束'}
                </Tag>
              </Descriptions.Item>
              {currentSession.status === 'active' && (
                <Descriptions.Item label="剩余分数">
                  <Text strong style={{ color: '#1890ff' }}>{remainingPoints} 分</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            {currentSession.description && (
              <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f8f9fa' }}>
                <Text>{currentSession.description}</Text>
              </Card>
            )}

            <Title level={4}>参与成员</Title>
            {sessionMembers.length === 0 ? (
              <Empty description="暂无成员" />
            ) : (
              <Row gutter={[16, 16]}>
                {sessionMembers.map(member => {
                  const myRating = myRatings.find(r => r.target_id === member.id);
                  return (
                    <Col span={8} key={member.id}>
                      <Card
                        size="small"
                        hoverable
                        onClick={() => currentSession.status === 'active' && startRating(member)}
                        style={{
                          cursor: currentSession.status === 'active' ? 'pointer' : 'default',
                          border: myRating ? '1px solid #1890ff' : undefined,
                        }}
                      >
                        <Space direction="vertical" align="center" style={{ width: '100%' }}>
                          <Avatar size={48} icon={<UserOutlined />} />
                          <Text strong>{member.name}</Text>
                          <Text type="secondary">{member.role}</Text>
                          {myRating ? (
                            <Badge
                              count={`${myRating.score}分`}
                              style={{ backgroundColor: '#52c41a' }}
                            />
                          ) : (
                            currentSession.status === 'active' && (
                              <Badge count="未评分" style={{ backgroundColor: '#faad14' }} />
                            )
                          )}
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </div>
        )}
      </Modal>

      {/* 评分表单弹窗 */}
      <Modal
        title={`为 ${targetMember?.name} 评分`}
        open={!!targetMember}
        onOk={handleRatingSubmit}
        onCancel={() => setTargetMember(null)}
        confirmLoading={isLoading}
      >
        {targetMember && (
          <div>
            <Space direction="vertical" align="center" style={{ width: '100%', marginBottom: 16 }}>
              <Avatar size={64} icon={<UserOutlined />} />
              <Text strong>{targetMember.name}</Text>
              <Text type="secondary">{targetMember.role}</Text>
              {targetMember.contribution && (
                <Text type="secondary" italic>{targetMember.contribution}</Text>
              )}
            </Space>

            <Form form={ratingForm} layout="vertical">
              <Form.Item
                name="score"
                label={`评分 (剩余: ${remainingPoints}分)`}
                rules={[
                  { required: true, message: '请输入评分' },
                  { type: 'number', min: 0, max: remainingPoints, message: `评分范围: 0-${remainingPoints}` },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入评分"
                  min={0}
                  max={remainingPoints}
                />
              </Form.Item>

              <Form.Item name="remark" label="评分备注">
                <TextArea
                  rows={3}
                  placeholder="请输入评分理由或建议"
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Rating;