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
  Popconfirm,
  Typography,
  Row,
  Col,
  Avatar,
  Progress,
  Tabs,
  Divider,
  Rate
} from 'antd';
import {
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  SettingOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const TaskTeamManagement = ({ taskId, projectId, isProjectOwner }) => {
  const [teams, setTeams] = useState([]);
  const [team, setTeam] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [evaluationModalVisible, setEvaluationModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [memberForm] = Form.useForm();
  const [evaluationForm] = Form.useForm();
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (taskId) {
      fetchTaskTeam();
    }
    if (projectId) {
      fetchProjectMembers();
    }
  }, [taskId, projectId]);

  const fetchTaskTeam = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects/task-teams/', {
        params: { task: taskId }
      });
      const teamData = response.data.results?.[0] || response.data[0];
      setTeam(teamData);
    } catch (error) {
      console.error('Error fetching task team:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/`);
      setProjectMembers(response.data.members_detail || []);
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  };

  const handleCreateTeam = () => {
    setModalVisible(true);
    form.resetFields();
    form.setFieldsValue({ task: taskId });
  };

  const handleCreateTeamOk = async () => {
    try {
      const values = await form.validateFields();
      await api.post('/projects/task-teams/', values);
      message.success('任务团队创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchTaskTeam();
    } catch (error) {
      message.error('创建任务团队失败');
      console.error('Error creating team:', error);
    }
  };

  const handleAddMember = () => {
    setMemberModalVisible(true);
    memberForm.resetFields();
  };

  const handleAddMemberOk = async () => {
    try {
      const values = await memberForm.validateFields();
      await api.post(`/projects/task-teams/${team.id}/add_member/`, values);
      message.success('成员添加成功');
      setMemberModalVisible(false);
      memberForm.resetFields();
      fetchTaskTeam();
    } catch (error) {
      message.error('添加成员失败');
      console.error('Error adding member:', error);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await api.post(`/projects/task-teams/${team.id}/remove_member/`, {
        user_id: userId
      });
      message.success('成员移除成功');
      fetchTaskTeam();
    } catch (error) {
      message.error('移除成员失败');
      console.error('Error removing member:', error);
    }
  };

  const handleEvaluateMember = (member) => {
    setSelectedMember(member);
    setEvaluationModalVisible(true);
    evaluationForm.setFieldsValue({
      peer_evaluation_score: member.peer_evaluation_score || 0,
      self_evaluation_score: member.self_evaluation_score || 0
    });
  };

  const handleEvaluationOk = async () => {
    try {
      const values = await evaluationForm.validateFields();
      await api.post(`/projects/task-teams/${team.id}/evaluate_member/`, {
        user_id: selectedMember.user,
        ...values
      });
      message.success('评估提交成功');
      setEvaluationModalVisible(false);
      evaluationForm.resetFields();
      fetchTaskTeam();
    } catch (error) {
      message.error('评估提交失败');
      console.error('Error evaluating member:', error);
    }
  };

  const memberColumns = [
    {
      title: '成员',
      key: 'member',
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div>{record.user_name}</div>
            <Tag size="small" color={record.role === 'leader' ? 'gold' : 'blue'}>
              {record.role_display}
            </Tag>
          </div>
        </Space>
      )
    },
    {
      title: '工作权重',
      dataIndex: 'work_weight',
      key: 'work_weight',
      render: (weight) => (
        <div style={{ width: 80 }}>
          <Progress 
            percent={weight * 100} 
            size="small" 
            showInfo={false}
          />
          <Text style={{ fontSize: 12 }}>{weight}</Text>
        </div>
      )
    },
    {
      title: '同行评分',
      dataIndex: 'peer_evaluation_score',
      key: 'peer_score',
      render: (score) => (
        <div>
          <Rate disabled value={score / 20} count={5} />
          <div style={{ fontSize: 12, color: '#666' }}>{score}/100</div>
        </div>
      )
    },
    {
      title: '自评分数',
      dataIndex: 'self_evaluation_score',
      key: 'self_score',
      render: (score) => (
        <div>
          <Rate disabled value={score / 20} count={5} />
          <div style={{ fontSize: 12, color: '#666' }}>{score}/100</div>
        </div>
      )
    },
    {
      title: '加入时间',
      dataIndex: 'joined_at',
      key: 'joined_at',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<StarOutlined />}
            onClick={() => handleEvaluateMember(record)}
          >
            评估
          </Button>
          
          {(isProjectOwner || team?.team_leader) && (
            <Popconfirm
              title="确定要移除这个成员吗？"
              onConfirm={() => handleRemoveMember(record.user)}
            >
              <Button
                size="small"
                danger
                icon={<UserDeleteOutlined />}
              >
                移除
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  if (!team) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <TeamOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
          <Title level={4} type="secondary">此任务尚未组建团队</Title>
          <Text type="secondary">创建团队后可以邀请项目成员协作完成任务</Text>
          <div style={{ marginTop: 24 }}>
            {(isProjectOwner) && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTeam}>
                创建任务团队
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>{team.task_title} - 任务团队</span>
            <Tag color="blue">{team.member_count}/{team.max_members}</Tag>
          </Space>
        }
        extra={
          <Space>
            {team.can_add_member && (isProjectOwner || team.team_leader) && (
              <Button
                type="primary"
                size="small"
                icon={<UserAddOutlined />}
                onClick={handleAddMember}
              >
                添加成员
              </Button>
            )}
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="团队规模"
              value={team.member_count}
              suffix={`/ ${team.max_members}`}
              prefix={<TeamOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="团队负责人"
              value={team.team_leader_name || '未指定'}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={6}>
            <div>
              <Text type="secondary">团队状态</Text>
              <div>
                <Tag color={team.can_add_member ? 'green' : 'orange'}>
                  {team.can_add_member ? '可添加成员' : '团队已满'}
                </Tag>
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div>
              <Text type="secondary">创建时间</Text>
              <div>{new Date(team.created_at).toLocaleDateString()}</div>
            </div>
          </Col>
        </Row>

        <Table
          columns={memberColumns}
          dataSource={team.memberships || []}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* 创建团队Modal */}
      <Modal
        title="创建任务团队"
        open={modalVisible}
        onOk={handleCreateTeamOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="task" hidden>
            <Input />
          </Form.Item>
          
          <Form.Item
            name="team_leader"
            label="团队负责人"
            rules={[{ required: true, message: '请选择团队负责人' }]}
          >
            <Select placeholder="选择团队负责人">
              {projectMembers.map(member => (
                <Option key={member.user} value={member.user}>
                  {member.user_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="max_members"
            label="最大成员数"
            rules={[{ required: true, message: '请设置最大成员数' }]}
          >
            <InputNumber min={1} max={10} placeholder="设置团队最大成员数" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="members" label="初始成员">
            <Select
              mode="multiple"
              placeholder="选择初始团队成员"
              style={{ width: '100%' }}
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

      {/* 添加成员Modal */}
      <Modal
        title="添加团队成员"
        open={memberModalVisible}
        onOk={handleAddMemberOk}
        onCancel={() => {
          setMemberModalVisible(false);
          memberForm.resetFields();
        }}
      >
        <Form form={memberForm} layout="vertical">
          <Form.Item
            name="user_id"
            label="选择成员"
            rules={[{ required: true, message: '请选择要添加的成员' }]}
          >
            <Select placeholder="选择项目成员">
              {projectMembers
                .filter(member => 
                  !team?.memberships?.some(m => m.user === member.user)
                )
                .map(member => (
                  <Option key={member.user} value={member.user}>
                    {member.user_name}
                  </Option>
                ))
              }
            </Select>
          </Form.Item>

          <Form.Item name="role" label="角色" initialValue="member">
            <Select>
              <Option value="member">团队成员</Option>
              <Option value="reviewer">评审员</Option>
            </Select>
          </Form.Item>

          <Form.Item name="work_weight" label="工作权重" initialValue={1.0}>
            <InputNumber
              min={0.1}
              max={3.0}
              step={0.1}
              placeholder="工作权重"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 成员评估Modal */}
      <Modal
        title={`评估成员：${selectedMember?.user_name}`}
        open={evaluationModalVisible}
        onOk={handleEvaluationOk}
        onCancel={() => {
          setEvaluationModalVisible(false);
          evaluationForm.resetFields();
          setSelectedMember(null);
        }}
      >
        <Form form={evaluationForm} layout="vertical">
          <Form.Item name="peer_evaluation_score" label="同行评分 (0-100)">
            <Slider
              min={0}
              max={100}
              marks={{
                0: '0',
                25: '25',
                50: '50',
                75: '75',
                100: '100'
              }}
            />
          </Form.Item>

          {selectedMember && selectedMember.user === selectedMember.user && (
            <Form.Item name="self_evaluation_score" label="自评分数 (0-100)">
              <Slider
                min={0}
                max={100}
                marks={{
                  0: '0',
                  25: '25',
                  50: '50',
                  75: '75',
                  100: '100'
                }}
              />
            </Form.Item>
          )}

          <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
            <Text type="secondary">
              <strong>评分说明：</strong><br />
              • 0-30分：表现不佳，需要改进<br />
              • 30-60分：表现一般，达到基本要求<br />
              • 60-80分：表现良好，超出预期<br />
              • 80-100分：表现优秀，远超预期
            </Text>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskTeamManagement;