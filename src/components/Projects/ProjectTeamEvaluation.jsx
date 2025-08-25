import React, { useState, useEffect } from 'react';
import {
  Card,
  Space,
  Typography,
  Button,
  Table,
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  message,
  Row,
  Col,
  Statistic,
  Avatar,
  Tag,
  Progress,
  Rate,
  List,
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  UserOutlined,
  StarOutlined,
  TrophyOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import useVotingStore from '../../stores/votingStore';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ProjectTeamEvaluation = ({ projectId, project, isProjectOwner }) => {
  const [form] = Form.useForm();
  const [isEvalModalVisible, setIsEvalModalVisible] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  
  const { user } = useAuthStore();
  const { 
    activeRound,
    fetchActiveRound,
    createEvaluation,
    isLoading 
  } = useVotingStore();

  useEffect(() => {
    fetchActiveRound();
    loadProjectEvaluations();
  }, [projectId]);

  const loadProjectEvaluations = async () => {
    // 这里应该加载项目特定的评估数据
    // 暂时使用模拟数据
    setEvaluations([]);
  };

  const handleCreateEvaluation = async () => {
    try {
      const values = await form.validateFields();
      const result = await createEvaluation({
        ...values,
        project: projectId,
        voting_round: activeRound.id,
      });
      
      if (result.success) {
        message.success('团队评估提交成功！');
        setIsEvalModalVisible(false);
        form.resetFields();
        loadProjectEvaluations();
      } else {
        message.error(result.error);
      }
    } catch (error) {
      console.error('提交评估失败:', error);
    }
  };

  const projectMembers = project?.members_detail || [];
  const otherMembers = projectMembers.filter(m => m.user !== user?.id);

  // 计算团队评估统计
  const teamStats = {
    totalMembers: projectMembers.length,
    evaluationsCount: evaluations.length,
    avgTeamwork: evaluations.length > 0 
      ? evaluations.reduce((sum, e) => sum + (e.teamwork_score || 0), 0) / evaluations.length 
      : 0,
    avgCommunication: evaluations.length > 0 
      ? evaluations.reduce((sum, e) => sum + (e.communication_score || 0), 0) / evaluations.length 
      : 0,
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* 团队评估概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="团队成员"
              value={teamStats.totalMembers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="评估总数"
              value={teamStats.evaluationsCount}
              prefix={<StarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="团队协作"
              value={teamStats.avgTeamwork.toFixed(1)}
              suffix="分"
              valueStyle={{ color: teamStats.avgTeamwork >= 80 ? '#3f8600' : '#1890ff' }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="沟通能力"
              value={teamStats.avgCommunication.toFixed(1)}
              suffix="分"
              valueStyle={{ color: teamStats.avgCommunication >= 80 ? '#3f8600' : '#1890ff' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 团队成员列表 */}
      <Card title="团队成员表现" style={{ marginBottom: 16 }}>
        <List
          dataSource={projectMembers}
          renderItem={(member) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={member.user_name}
                description={
                  <Space direction="vertical" size="small">
                    <div>
                      <Text>股份占比: </Text>
                      <Text strong style={{ color: '#52c41a' }}>
                        {Number(member.equity_percentage || 0).toFixed(2)}%
                      </Text>
                    </div>
                    <div>
                      <Text>贡献比例: </Text>
                      <Progress
                        percent={member.contribution_percentage || 0}
                        size="small"
                        style={{ width: 150 }}
                      />
                    </div>
                  </Space>
                }
              />
              <div>
                {member.user === user?.id && (
                  <Tag color="blue">我</Tag>
                )}
                {project?.owner === member.user && (
                  <Tag color="gold">项目负责人</Tag>
                )}
              </div>
            </List.Item>
          )}
        />
      </Card>

      {/* 评估操作 */}
      <Card title="团队评估管理">
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsEvalModalVisible(true)}
            disabled={!activeRound || otherMembers.length === 0}
          >
            创建团队评估
          </Button>
          {!activeRound && (
            <Text type="secondary">暂无活跃的评估轮次</Text>
          )}
          {otherMembers.length === 0 && (
            <Text type="secondary">项目暂无其他成员可评估</Text>
          )}
        </Space>

        {evaluations.length > 0 ? (
          <Table
            dataSource={evaluations}
            columns={[
              {
                title: '评估者',
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
                title: '被评估者',
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
                title: '团队协作',
                dataIndex: 'teamwork_score',
                key: 'teamwork_score',
                render: (score) => (
                  <Space>
                    <Rate disabled value={score / 20} />
                    <Text>{score}分</Text>
                  </Space>
                ),
              },
              {
                title: '沟通能力',
                dataIndex: 'communication_score',
                key: 'communication_score',
                render: (score) => (
                  <Space>
                    <Rate disabled value={score / 20} />
                    <Text>{score}分</Text>
                  </Space>
                ),
              },
              {
                title: '评估时间',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (time) => new Date(time).toLocaleDateString(),
              },
            ]}
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <TeamOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={4} type="secondary">暂无团队评估记录</Title>
            <Text type="secondary">
              {project?.name} 项目还没有团队评估记录，开始第一个评估吧！
            </Text>
          </div>
        )}
      </Card>

      {/* 创建评估Modal */}
      <Modal
        title={`团队评估 - ${project?.name}`}
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
            name="evaluated_user"
            label="评估团队成员"
            rules={[{ required: true, message: '请选择要评估的团队成员！' }]}
          >
            <Select placeholder="选择团队成员">
              {otherMembers.map(member => (
                <Option key={member.user} value={member.user}>
                  {member.user_name}
                  {project?.owner === member.user && ' (项目负责人)'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="teamwork_score"
            label="团队协作能力"
            rules={[
              { required: true, message: '请评价团队协作能力！' },
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
            name="communication_score"
            label="沟通交流能力"
            rules={[
              { required: true, message: '请评价沟通交流能力！' },
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
            name="leadership_score"
            label="领导力"
            rules={[
              { type: 'number', min: 0, max: 100, message: '评分范围为0-100分！' }
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: '100%' }}
              placeholder="请输入0-100的评分（可选）"
              addonAfter="分"
            />
          </Form.Item>

          <Form.Item
            name="comment"
            label="评估说明"
          >
            <TextArea
              rows={4}
              placeholder="请详细说明您的评估理由和建议..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectTeamEvaluation;