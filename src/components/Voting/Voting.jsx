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
  Tabs,
  Statistic,
  DatePicker,
  Popconfirm,
  Empty,
} from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  ProjectOutlined,
  PlusOutlined,
  TrophyOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import LoginPrompt from '../Auth/LoginPrompt';
import LoginDialog from '../Auth/LoginDialog';
import RegisterDialog from '../Auth/RegisterDialog';
import useAuthStore from '../../stores/authStore';
import useProjectStore from '../../stores/projectStore';
import useVotingStore from '../../stores/votingStore';
import { authAPI, votingAPI } from '../../services/api';
import SelfEvaluationModal from './SelfEvaluationModal';

const { Title, Text } = Typography;
const { Option } = Select;

const Voting = ({ projectId }) => {
  const [form] = Form.useForm();
  const [roundForm] = Form.useForm();
  const [isVoteModalVisible, setIsVoteModalVisible] = useState(false);
  const [isRoundManagementVisible, setIsRoundManagementVisible] = useState(false);
  const [isSelfEvaluationVisible, setIsSelfEvaluationVisible] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [allUsers, setAllUsers] = useState({});
  const [selectedVoteType, setSelectedVoteType] = useState('');
  const [selectedVotedFor, setSelectedVotedFor] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selfEvaluationEntity, setSelfEvaluationEntity] = useState(null);
  const [selfEvaluationType, setSelfEvaluationType] = useState('user');
  const [editingVote, setEditingVote] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  
  const { user, isAuthenticated } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const {
    activeRound,
    votingRounds,
    myVotes,
    votesReceived,
    fetchActiveRound,
    fetchVotingRounds,
    fetchMyVotes,
    fetchVotesReceived,
    createVote,
    updateVote,
    deleteVote,
    isLoading
  } = useVotingStore();

  useEffect(() => {
    fetchProjects();
    fetchActiveRound();
    fetchVotingRounds();
    loadUsers();
    
    // 如果在项目页面，设置默认投票类型
    if (projectId) {
      setSelectedVoteType('project');
      setSelectedProject(projectId);
      form.setFieldsValue({
        vote_type: 'project',
        target_project: projectId,
        target_user: null,
        amount: 1.00
      });
    }
  }, [projectId]);

  useEffect(() => {
    if (activeRound) {
      fetchMyVotes(activeRound.id);
      fetchVotesReceived(activeRound.id);
    }
  }, [activeRound]);

  const loadUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      const userData = response.data || {};
      setAllUsers(userData);
    } catch (error) {
      message.error('加载用户列表失败，请刷新页面重试');
    }
  };

  // 处理投票类型变化
  const handleVoteTypeChange = (value) => {
    setSelectedVoteType(value);
    
    // 确保在选择个人投票时用户数据已加载
    if (value === 'individual' && allUsers.length === 0) {
      loadUsers();
    }
    
    // 根据投票类型设置默认值
    if (value === 'self') {
      form.setFieldsValue({ 
        target_user: user?.id,
        target_project: null,
        amount: 1.00 
      });
      setSelectedVotedFor(user?.id);
    } else if (value === 'project') {
      form.setFieldsValue({ 
        target_user: null,
        amount: 0.00 
      });
    } else {
      form.setFieldsValue({ 
        target_project: null,
        amount: 0.00 
      });
    }
  };

  // 处理投票对象变化
  const handleVotedForChange = (value) => {
    setSelectedVotedFor(value);
    // 如果投票给自己，设置默认金额为1.00
    if (value === user?.id) {
      form.setFieldsValue({ amount: 1.00 });
    } else {
      form.setFieldsValue({ amount: 0.00 });
    }
  };

  // 处理项目变化
  const handleProjectChange = (value) => {
    setSelectedProject(value);
    // 如果是自己参与的项目，设置默认金额为1.00
    const project = myProjects.find(p => p.id === value);
    if (project && project.members_detail?.some(m => m.user === user?.id)) {
      form.setFieldsValue({ amount: 1.00 });
    } else {
      form.setFieldsValue({ amount: 0.00 });
    }
  };

  // 获取金额提示文本
  const getAmountHint = () => {
    if (selectedVoteType === 'self' || selectedVotedFor === user?.id) {
      return '自己默认1.00元';
    }
    if (selectedProject && myProjects.find(p => p.id === selectedProject)?.members_detail?.some(m => m.user === user?.id)) {
      return '自己参与的项目默认1.00元';
    }
    return '其他默认0.00元';
  };

  const handleCreateVote = async () => {
    try {
      const values = await form.validateFields();
      
      // 如果有projectId，强制设置为项目投票
      if (projectId) {
        values.vote_type = 'project';
        values.target_project = projectId;
        values.target_user = null;
      }
      
      const result = await createVote(values);
      
      if (result.success) {
        message.success('投票成功！');
        handleModalClose();
        if (activeRound) {
          fetchMyVotes(activeRound.id);
          fetchVotesReceived(activeRound.id);
        }
      } else {
        message.error(result.error);
      }
    } catch (error) {
      console.error('投票失败:', error);
    }
  };

  // 处理Modal关闭
  const handleModalClose = () => {
    setIsVoteModalVisible(false);
    form.resetFields();
    setSelectedVoteType('');
    setSelectedVotedFor('');
    setSelectedProject('');
  };

  // 处理编辑投票
  const handleEditVote = (record) => {
    // 检查是否可以编辑
    if (record.is_paid) {
      message.warning('已支付的投票无法编辑');
      return;
    }
    if (!activeRound?.is_active) {
      message.warning('投票轮次已结束，无法编辑');
      return;
    }
    
    setEditingVote(record);
    setSelectedVoteType(record.vote_type);
    setSelectedVotedFor(record.target_user);
    setSelectedProject(record.target_project);
    
    // 设置表单值
    form.setFieldsValue({
      vote_type: record.vote_type,
      target_user: record.target_user,
      target_project: record.target_project,
      amount: parseFloat(record.amount)
    });
    
    setIsEditModalVisible(true);
  };
  
  // 处理删除投票
  const handleDeleteVote = async (voteId) => {
    const result = await deleteVote(voteId, activeRound?.id);
    if (result.success) {
      message.success('投票删除成功！');
    } else {
      message.error(result.error || '删除失败');
    }
  };
  
  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      const result = await updateVote(editingVote.id, values);
      
      if (result.success) {
        message.success('投票修改成功！');
        handleEditModalClose();
      } else {
        message.error(result.error || '修改失败');
      }
    } catch (error) {
      console.error('修改投票失败:', error);
    }
  };
  
  // 关闭编辑Modal
  const handleEditModalClose = () => {
    setIsEditModalVisible(false);
    setEditingVote(null);
    form.resetFields();
    setSelectedVoteType('');
    setSelectedVotedFor('');
    setSelectedProject('');
  };

  // 开启个人自评
  const handlePersonalSelfEvaluation = () => {
    if (!activeRound?.is_self_evaluation_open) {
      message.warning('当前轮次未开放自评功能');
      return;
    }
    setSelfEvaluationEntity(user);
    setSelfEvaluationType('user');
    setIsSelfEvaluationVisible(true);
  };

  // 开启项目自评
  const handleProjectSelfEvaluation = (project) => {
    if (!activeRound?.is_self_evaluation_open) {
      message.warning('当前轮次未开放自评功能');
      return;
    }
    setSelfEvaluationEntity(project);
    setSelfEvaluationType('project');
    setIsSelfEvaluationVisible(true);
  };

  // 自评成功回调
  const handleSelfEvaluationSuccess = (result) => {
    message.success(`自评增资成功！新估值：¥${result.newValuation.toFixed(2)}`);
    setIsSelfEvaluationVisible(false);
    setSelfEvaluationEntity(null);
    // 刷新相关数据
    if (activeRound) {
      fetchMyVotes(activeRound.id);
      fetchVotesReceived(activeRound.id);
    }
  };

  // 关闭自评Modal
  const handleSelfEvaluationClose = () => {
    setIsSelfEvaluationVisible(false);
    setSelfEvaluationEntity(null);
  };

  // 创建投票轮次
  const handleCreateRound = async () => {
    try {
      const values = await roundForm.validateFields();
      const response = await votingAPI.createVotingRound({
        ...values,
        is_active: true,
        is_self_evaluation_open: true,
        max_self_investment: 10.00
      });
      
      if (response.data) {
        message.success('投票轮次创建成功！');
        setIsRoundManagementVisible(false);
        roundForm.resetFields();
        fetchActiveRound();
        fetchVotingRounds();
      }
    } catch (error) {
      message.error('创建投票轮次失败');
      console.error('创建轮次失败:', error);
    }
  };

  // 激活轮次
  const handleActivateRound = async (roundId) => {
    try {
      await votingAPI.activateRound(roundId);
      message.success('轮次激活成功！');
      fetchActiveRound();
      fetchVotingRounds();
    } catch (error) {
      message.error('激活轮次失败');
      console.error('激活轮次失败:', error);
    }
  };

  const voteColumns = [
    {
      title: '投票对象',
      key: 'target_user',
        render: (_, record) => {
            // 判断 vote_type
            const targetId = record.vote_type === 'project' ? record.target_name : record.target_user;
            // 你可以根据 targetId 查用户名或项目信息
            return (
                <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {targetId}
                </Space>
            );
        }
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong style={{ color: '#1890ff' }}>
          ¥{amount}
        </Text>
      ),
    },
    {
      title: '类型',
      dataIndex: 'vote_type',
      key: 'vote_type',
      render: (type) => (
        <Tag color={type === 'self' ? 'gold' : type === 'project' ? 'blue' : 'green'}>
          {type === 'self' ? '自投' : type === 'project' ? '项目投票' : '个人投票'}
        </Tag>
      ),
    },
    {
      title: '投票时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const canEdit = activeRound?.is_active && !record.is_paid;
        const canDelete = activeRound?.is_active && !record.is_paid;
        
        return (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditVote(record)}
              disabled={!canEdit}
              title={canEdit ? '编辑投票' : '已支付或轮次已结束，无法编辑'}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定删除这个投票吗？"
              description="删除后无法恢复"
              onConfirm={() => handleDeleteVote(record.id)}
              okText="确定"
              cancelText="取消"
              disabled={!canDelete}
            >
              <Button
                size="small"
                icon={<DeleteOutlined />}
                danger
                disabled={!canDelete}
                title={canDelete ? '删除投票' : '已支付或轮次已结束，无法删除'}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const receivedColumns = [
    {
      title: '投票者',
      dataIndex: 'voter_name',
      key: 'voter_name',
      render: (name) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {name}
        </Space>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>
          ¥{amount}
        </Text>
      ),
    },
    {
      title: '类型',
      dataIndex: 'vote_type',
      key: 'vote_type',
      render: (type) => (
        <Tag color={type === 'self' ? 'gold' : type === 'project' ? 'blue' : 'green'}>
          {type === 'self' ? '自投' : type === 'project' ? '项目投票' : '个人投票'}
        </Tag>
      ),
    },
    {
      title: '投票时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString(),
    },
  ];

  const myProjects = Array.isArray(projects) ? projects.filter(p => 
    p.members_detail?.some(m => m.user === user?.id)
  ) : [];

  const otherUsers = Array.isArray(allUsers) ? allUsers.filter(u => u.id !== user?.id) : [];

  // 根据projectId过滤投票数据
  const filteredMyVotes = projectId 
    ? (Array.isArray(myVotes) ? myVotes.filter(vote => vote.target_project === projectId) : [])
    : (Array.isArray(myVotes) ? myVotes : []);
    
  const filteredVotesReceived = projectId 
    ? (Array.isArray(votesReceived) ? votesReceived.filter(vote => vote.target_project === projectId) : [])
    : (Array.isArray(votesReceived) ? votesReceived : []);

  // 统计数据
  const totalVotedAmount = filteredMyVotes.reduce((sum, vote) => sum + parseFloat(vote.amount || 0), 0);
  const totalReceivedAmount = filteredVotesReceived.reduce((sum, vote) => sum + parseFloat(vote.amount || 0), 0);

  const tabItems = [
    {
      key: '1',
      label: projectId ? '我对此项目的投票' : '我的投票',
      children: (
        <Table
          columns={voteColumns}
          dataSource={filteredMyVotes}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: '2',
      label: projectId ? '此项目收到的投票' : '收到的投票',
      children: (
        <Table
          columns={receivedColumns}
          dataSource={filteredVotesReceived}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  useEffect(() => {
    // 无论是否登录都获取数据
    fetchActiveRound();
    fetchVotingRounds();
    fetchMyVotes();
    loadUsers();
  }, []);

  const handleLoginRequired = () => {
    setShowLoginPrompt(true);
  };

  const handlePromptLogin = () => {
    setLoginModalVisible(true);
  };

  const handlePromptRegister = () => {
    setRegisterModalVisible(true);
  };

  const handleSwitchToRegister = () => {
    setLoginModalVisible(false);
    setRegisterModalVisible(true);
  };

  const handleSwitchToLogin = () => {
    setRegisterModalVisible(false);
    setLoginModalVisible(true);
  };

  // 根据登录状态显示不同的按钮和操作
  const renderVotingActions = () => {
    if (!isAuthenticated()) {
      return (
        <Space>
          <Button onClick={handleLoginRequired}>
            登录后参与投票
          </Button>
        </Space>
      );
    }

    return (
      <Space>
        <Button
          type="default"
          onClick={() => setIsRoundManagementVisible(true)}
        >
          管理轮次
        </Button>
        {activeRound && (
          <>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setIsVoteModalVisible(true);
                if (allUsers.length === 0) {
                  loadUsers();
                }
              }}
            >
              {projectId ? "为项目投票" : "发起投票"}
            </Button>
          </>
        )}
      </Space>
    );
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          {projectId ? '项目投票' : '投票评估系统'}
        </Title>
        {renderVotingActions()}
      </Row>

      {/* 显示当前轮次信息 */}
      {activeRound && (
        <Card style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Space>
              <Text strong>当前轮次:</Text>
              <Text>{activeRound.name}</Text>
              <Tag color={activeRound.is_active ? 'green' : 'orange'}>
                {activeRound.is_active ? '进行中' : '已结束'}
              </Tag>
            </Space>
            {/* 自评按钮 - 只有登录用户才能看到 */}
            {isAuthenticated() && activeRound.is_self_evaluation_open && (
              <Button
                type="default"
                icon={<DollarOutlined />}
                onClick={handlePersonalSelfEvaluation}
              >
                个人自评
              </Button>
            )}
          </Row>
        </Card>
      )}

      {!activeRound ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <TrophyOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={4} type="secondary">暂无活跃的投票轮次</Title>
            <Text type="secondary">请等待管理员开启新的投票轮次</Text>
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
                  value={activeRound.name}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title={projectId ? "我对项目的投票金额" : "我投出的金额"}
                  value={totalVotedAmount}
                  prefix={<DollarOutlined />}
                  suffix="元"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title={projectId ? "项目收到的金额" : "收到的金额"}
                  value={totalReceivedAmount}
                  prefix={<DollarOutlined />}
                  suffix="元"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title={projectId ? "对项目的投票次数" : "投票次数"}
                  value={filteredMyVotes.length}
                  suffix="次"
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* 投票记录 */}
          <Card>
            <Tabs items={tabItems} />
          </Card>
        </>
      )}

      {/* 轮次管理Modal */}
      <Modal
        title="投票轮次管理"
        open={isRoundManagementVisible}
        onCancel={() => {
          setIsRoundManagementVisible(false);
          roundForm.resetFields();
        }}
        width={800}
        footer={null}
      >
        <Tabs
          items={[
            {
              key: '1',
              label: '创建轮次',
              children: (
                <Form form={roundForm} layout="vertical">
                  <Form.Item
                    name="name"
                    label="轮次名称"
                    rules={[{ required: true, message: '请输入轮次名称！' }]}
                  >
                    <Input placeholder="例如：第一轮投融资投票" />
                  </Form.Item>
                  <Form.Item
                    name="description"
                    label="轮次描述"
                  >
                    <Input.TextArea rows={3} placeholder="轮次说明..." />
                  </Form.Item>
                  <Form.Item
                    name="start_time"
                    label="开始时间"
                    rules={[{ required: true, message: '请选择开始时间！' }]}
                  >
                    <DatePicker
                      showTime
                      style={{ width: '100%' }}
                      placeholder="选择开始时间"
                    />
                  </Form.Item>
                  <Form.Item
                    name="end_time"
                    label="结束时间"
                    rules={[{ required: true, message: '请选择结束时间！' }]}
                  >
                    <DatePicker
                      showTime
                      style={{ width: '100%' }}
                      placeholder="选择结束时间"
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" onClick={handleCreateRound} loading={isLoading}>
                      创建轮次
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: '2',
              label: '轮次列表',
              children: (
                <Table
                  dataSource={Array.isArray(votingRounds) ? votingRounds : []}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: '轮次名称',
                      dataIndex: 'name',
                      key: 'name',
                    },
                    {
                      title: '状态',
                      dataIndex: 'is_active',
                      key: 'is_active',
                      render: (isActive) => (
                        <Tag color={isActive ? 'success' : 'default'}>
                          {isActive ? '活跃' : '停用'}
                        </Tag>
                      ),
                    },
                    {
                      title: '开始时间',
                      dataIndex: 'start_time',
                      key: 'start_time',
                      render: (time) => new Date(time).toLocaleString(),
                    },
                    {
                      title: '结束时间',
                      dataIndex: 'end_time',
                      key: 'end_time',
                      render: (time) => new Date(time).toLocaleString(),
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_, record) => (
                        <Space>
                          {!record.is_active && (
                            <Button
                              size="small"
                              type="primary"
                              onClick={() => handleActivateRound(record.id)}
                            >
                              激活
                            </Button>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Modal>

      {/* 创建投票Modal */}
      <Modal
        title={projectId ? "为项目投票" : "创建投票"}
        open={isVoteModalVisible}
        onOk={handleCreateVote}
        onCancel={handleModalClose}
        confirmLoading={isLoading}
      >
        <Form form={form} layout="vertical">
          {!projectId && (
            <Form.Item
              name="vote_type"
              label="投票类型"
              rules={[{ required: true, message: '请选择投票类型！' }]}
            >
              <Select placeholder="选择投票类型" onChange={handleVoteTypeChange}>
                <Option value="individual">个人投票</Option>
                <Option value="project">项目投票</Option>
                <Option value="self">自投</Option>
              </Select>
            </Form.Item>
          )}

          {projectId && (
            <Form.Item>
              <Text type="secondary">当前正在为此项目进行投票</Text>
            </Form.Item>
          )}

          {(selectedVoteType === 'individual' || selectedVoteType === 'self') && (
            <Form.Item
              name="target_user"
              label="投票给用户"
              rules={[{ required: true, message: '请选择投票对象！' }]}
            >
              <Select placeholder="选择投票对象" onChange={handleVotedForChange}>
                {selectedVoteType === 'self' ? (
                  <Option value={user?.id}>自己</Option>
                ) : (
                  <>
                    {(() => {
                      if (Array.isArray(allUsers.results) && allUsers.results.length > 0) {
                        const options = allUsers.results.map(u => {
                          return (
                            <Option key={u.id} value={u.id}>
                              {u.username} {u.id === user?.id ? '(我)' : ''}
                            </Option>
                          );
                        });

                        return options;
                      } else {
                        return (
                          <Option disabled value="">
                            暂无数据
                          </Option>
                        );
                      }
                    })()}
                  </>
                )}
              </Select>
            </Form.Item>
          )}

          {selectedVoteType === 'project' && (
            <Form.Item
              name="target_project"
              label="投票给项目"
              rules={[{ required: true, message: '请选择项目！' }]}
            >
              <Select placeholder="选择项目" onChange={handleProjectChange}>
                {Array.isArray(projects) && projects.map(project => (
                  <Option key={project.id} value={project.id}>
                    {project.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="amount"
            label={`投票金额 (${getAmountHint()})`}
            rules={[
              { required: true, message: '请输入投票金额！' },
              { type: 'number', min: 0.01, max: 1.00, message: '金额必须在0.01-1.00元之间！' }
            ]}
          >
            <InputNumber
              min={0.01}
              max={1.00}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入投票金额 (0.01-1.00元)"
              addonBefore="¥"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑投票Modal */}
      <Modal
        title="编辑投票"
        open={isEditModalVisible}
        onOk={handleSaveEdit}
        onCancel={handleEditModalClose}
        confirmLoading={isLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="vote_type"
            label="投票类型"
            rules={[{ required: true, message: '请选择投票类型！' }]}
          >
            <Select placeholder="选择投票类型" onChange={handleVoteTypeChange}>
              <Option value="individual">个人投票</Option>
              <Option value="project">项目投票</Option>
              <Option value="self">自投</Option>
            </Select>
          </Form.Item>

          {(selectedVoteType === 'individual' || selectedVoteType === 'self') && (
            <Form.Item
              name="target_user"
              label="投票给用户"
              rules={[{ required: true, message: '请选择投票对象！' }]}
            >
              <Select placeholder="选择投票对象" onChange={handleVotedForChange}>
                {selectedVoteType === 'self' ? (
                  <Option value={user?.id}>自己</Option>
                ) : (
                  <>
                    {(() => {
                      if (Array.isArray(allUsers.results) && allUsers.results.length > 0) {
                        const options = allUsers.results.map(u => {
                          return (
                            <Option key={u.id} value={u.id}>
                              {u.username} {u.id === user?.id ? '(我)' : ''}
                            </Option>
                          );
                        });

                        return options;
                      } else {
                        return (
                          <Option disabled value="">
                            暂无数据
                          </Option>
                        );
                      }
                    })()}
                  </>
                )}
              </Select>
            </Form.Item>
          )}

          {selectedVoteType === 'project' && (
            <Form.Item
              name="target_project"
              label="投票给项目"
              rules={[{ required: true, message: '请选择项目！' }]}
            >
              <Select placeholder="选择项目" onChange={handleProjectChange}>
                {Array.isArray(projects) && projects.map(project => (
                  <Option key={project.id} value={project.id}>
                    {project.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="amount"
            label={`投票金额 (${getAmountHint()})`}
            rules={[
              { required: true, message: '请输入投票金额！' },
              { type: 'number', min: 0.01, max: 1.00, message: '金额必须在0.01-1.00元之间！' }
            ]}
          >
            <InputNumber
              min={0.01}
              max={1.00}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入投票金额 (0.01-1.00元)"
              addonBefore="¥"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 自评增资Modal */}
      <SelfEvaluationModal
        visible={isSelfEvaluationVisible}
        onCancel={handleSelfEvaluationClose}
        onSuccess={handleSelfEvaluationSuccess}
        userOrProject={selfEvaluationEntity}
        entityType={selfEvaluationType}
      />

      {/* 登录提示 */}
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="请登录后参与投票和自评功能"
        onLogin={handlePromptLogin}
        onRegister={handlePromptRegister}
      />

      {/* 登录和注册对话框 */}
      <LoginDialog
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />

      <RegisterDialog
        visible={registerModalVisible}
        onClose={() => setRegisterModalVisible(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
};

export default Voting;