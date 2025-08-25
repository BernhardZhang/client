import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Space,
  Typography,
  Alert,
  Descriptions,
  Tag,
  message,
  Tabs,
  Select,
  Input,
  Progress,
  Statistic,
  Row,
  Col,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  CalculatorOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SaveOutlined,
  LockOutlined
} from '@ant-design/icons';
import { tasksAPI } from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const MeritCalculation = ({ taskId, visible, onClose, taskInfo }) => {
  const [form] = Form.useForm();
  const [contributionForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [calculation, setCalculation] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [contributionRecords, setContributionRecords] = useState([]);
  const [contributionTypes, setContributionTypes] = useState([]);
  const [activeTab, setActiveTab] = useState('calculation');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);

  // 获取功分计算数据
  const fetchMeritCalculation = async () => {
    if (!taskId) return;
    
    setLoading(true);
    try {
      const response = await tasksAPI.getMeritCalculation(taskId);
      setCalculation(response.data.calculation);
      setParticipants(response.data.participants || []);
    } catch (error) {
      console.error('获取功分计算失败:', error);
      if (error.response?.status !== 404) {
        message.error('获取功分计算失败');
      }
    } finally {
      setLoading(false);
    }
  };

  // 获取贡献记录
  const fetchContributionRecords = async () => {
    if (!taskId) return;
    
    try {
      const response = await tasksAPI.getContributionRecords(taskId);
      setContributionRecords(response.data.contributors || []);
      setContributionTypes(response.data.contribution_types || []);
    } catch (error) {
      console.error('获取贡献记录失败:', error);
    }
  };

  useEffect(() => {
    if (visible && taskId) {
      fetchMeritCalculation();
      fetchContributionRecords();
    }
  }, [visible, taskId]);

  // 保存功分计算
  const handleSaveCalculation = async () => {
    try {
      const values = await form.validateFields();
      const participantData = participants.map((participant, index) => ({
        user_id: participant.user_id,
        contribution_value: values[`contribution_${index}`] || 0
      }));

      setLoading(true);
      await tasksAPI.saveMeritCalculation(taskId, {
        participants: participantData
      });

      message.success('功分计算已保存');
      await fetchMeritCalculation();
      setIsEditMode(false);
    } catch (error) {
      console.error('保存功分计算失败:', error);
      message.error('保存功分计算失败');
    } finally {
      setLoading(false);
    }
  };

  // 确定功分计算
  const handleFinalizeCalculation = async () => {
    try {
      setLoading(true);
      await tasksAPI.finalizeMeritCalculation(taskId);
      message.success('功分计算已确定');
      await fetchMeritCalculation();
    } catch (error) {
      console.error('确定功分计算失败:', error);
      message.error(error.response?.data?.error || '确定功分计算失败');
    } finally {
      setLoading(false);
    }
  };

  // 添加贡献记录
  const handleAddContribution = async () => {
    try {
      const values = await contributionForm.validateFields();
      
      await tasksAPI.addContributionRecord(taskId, values);
      message.success('贡献记录已添加');
      
      contributionForm.resetFields();
      setShowContributionModal(false);
      await fetchContributionRecords();
    } catch (error) {
      console.error('添加贡献记录失败:', error);
      message.error('添加贡献记录失败');
    }
  };

  // 添加参与者到计算列表
  const handleAddParticipant = () => {
    const newParticipant = {
      user_id: null,
      username: '',
      contribution_value: 0,
      merit_points: 0,
      merit_percentage: 0
    };
    setParticipants([...participants, newParticipant]);
    setIsEditMode(true);
  };

  // 移除参与者
  const handleRemoveParticipant = (index) => {
    const newParticipants = participants.filter((_, i) => i !== index);
    setParticipants(newParticipants);
    setIsEditMode(true);
  };

  // 功分计算方法说明
  const getCalculationMethodInfo = () => {
    if (!calculation) return null;

    const methodInfo = {
      single: {
        title: '单人参与',
        description: '功分等于贡献值',
        formula: '功分 = 贡献值'
      },
      duo: {
        title: '双人协作',
        description: '根据贡献差异进行调整',
        formula: '功分i = Si × (1 + 0.1 × |S1-S2|/max(S1,S2))'
      },
      small_group: {
        title: '小组协作',
        description: '综合考虑权重因子和调整因子',
        formula: '功分i = Si × Wi × Ai'
      },
      large_group: {
        title: '大组协作',
        description: '使用分布因子和对数调整因子',
        formula: '功分i = Si × Ti × Bi'
      }
    };

    return methodInfo[calculation.method] || methodInfo.single;
  };

  // 参与者表格列
  const participantColumns = [
    {
      title: '参与者',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      )
    },
    {
      title: '贡献值',
      dataIndex: 'contribution_value',
      key: 'contribution_value',
      render: (value, record, index) => (
        isEditMode ? (
          <Form.Item
            name={`contribution_${index}`}
            initialValue={value}
            style={{ margin: 0 }}
            rules={[
              { required: true, message: '请输入贡献值' },
              { type: 'number', min: 0, max: 100, message: '贡献值应在0-100之间' }
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
        ) : (
          <Text strong>{value?.toFixed(2) || '0.00'}</Text>
        )
      )
    },
    {
      title: '计算功分',
      dataIndex: 'merit_points',
      key: 'merit_points',
      render: (value) => (
        <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
          {value?.toFixed(2) || '0.00'}
        </Text>
      )
    },
    {
      title: '功分占比',
      dataIndex: 'merit_percentage',
      key: 'merit_percentage',
      render: (percentage) => (
        <Progress
          percent={percentage?.toFixed(1) || 0}
          size="small"
          format={(percent) => `${percent}%`}
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record, index) => (
        isEditMode && (
          <Button
            type="link"
            danger
            size="small"
            onClick={() => handleRemoveParticipant(index)}
          >
            移除
          </Button>
        )
      )
    }
  ];

  // 贡献记录表格列
  const contributionColumns = [
    {
      title: '贡献者',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '总加权分数',
      dataIndex: 'total_weighted_score',
      key: 'total_weighted_score',
      render: (score) => (
        <Text strong style={{ color: '#1890ff' }}>
          {score?.toFixed(2) || '0.00'}
        </Text>
      )
    },
    {
      title: '贡献详情',
      dataIndex: 'contributions',
      key: 'contributions',
      render: (contributions) => (
        <Space direction="vertical" size="small">
          {contributions?.map((contrib, index) => (
            <Tag key={index} color="blue">
              {contrib.contribution_type_display}: {contrib.weighted_score?.toFixed(1)}分
            </Tag>
          ))}
        </Space>
      )
    }
  ];

  const methodInfo = getCalculationMethodInfo();

  return (
    <Modal
      title={
        <Space>
          <CalculatorOutlined />
          任务功分计算 - {taskInfo?.title}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="功分计算" key="calculation">
          <Card>
            {calculation && (
              <Alert
                message={
                  <Space>
                    <InfoCircleOutlined />
                    计算方法: {methodInfo?.title}
                    {calculation.is_finalized && (
                      <Tag color="green" icon={<LockOutlined />}>已确定</Tag>
                    )}
                  </Space>
                }
                description={
                  <div>
                    <Paragraph>{methodInfo?.description}</Paragraph>
                    <Text code>{methodInfo?.formula}</Text>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {calculation && (
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <Statistic
                    title="参与人数"
                    value={calculation.participant_count}
                    prefix={<TeamOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="总贡献值"
                    value={calculation.total_contribution}
                    precision={2}
                    prefix={<TrophyOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="计算状态"
                    value={calculation.is_finalized ? '已确定' : '草稿'}
                    valueStyle={{
                      color: calculation.is_finalized ? '#3f8600' : '#cf1322'
                    }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="计算时间"
                    value={new Date(calculation.calculated_at).toLocaleDateString()}
                  />
                </Col>
              </Row>
            )}

            <Form form={form} layout="vertical">
              <div style={{ marginBottom: 16 }}>
                <Space>
                  {!calculation?.is_finalized && (
                    <>
                      {!isEditMode ? (
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => setIsEditMode(true)}
                        >
                          编辑计算
                        </Button>
                      ) : (
                        <Space>
                          <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={loading}
                            onClick={handleSaveCalculation}
                          >
                            保存计算
                          </Button>
                          <Button onClick={() => setIsEditMode(false)}>
                            取消
                          </Button>
                        </Space>
                      )}
                      <Button
                        icon={<PlusOutlined />}
                        onClick={handleAddParticipant}
                      >
                        添加参与者
                      </Button>
                    </>
                  )}
                  {calculation && !calculation.is_finalized && (
                    <Popconfirm
                      title="确定要固化功分计算结果吗？确定后将无法修改。"
                      onConfirm={handleFinalizeCalculation}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="primary"
                        danger
                        icon={<CheckCircleOutlined />}
                        loading={loading}
                      >
                        确定计算结果
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              </div>

              <Table
                columns={participantColumns}
                dataSource={participants}
                rowKey="user_id"
                loading={loading}
                pagination={false}
                locale={{
                  emptyText: '暂无参与者数据，请添加参与者进行功分计算'
                }}
              />
            </Form>
          </Card>
        </TabPane>

        <TabPane tab="贡献记录" key="contributions">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowContributionModal(true)}
              >
                添加贡献记录
              </Button>
            </div>

            <Table
              columns={contributionColumns}
              dataSource={contributionRecords}
              rowKey="user_id"
              pagination={false}
              locale={{
                emptyText: '暂无贡献记录'
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 添加贡献记录Modal */}
      <Modal
        title="添加贡献记录"
        open={showContributionModal}
        onOk={handleAddContribution}
        onCancel={() => {
          setShowContributionModal(false);
          contributionForm.resetFields();
        }}
        okText="添加"
        cancelText="取消"
      >
        <Form form={contributionForm} layout="vertical">
          <Form.Item
            name="contributor_id"
            label="贡献者"
            rules={[{ required: true, message: '请选择贡献者' }]}
          >
            <Select placeholder="选择贡献者">
              {/* 这里需要根据项目成员动态填充 */}
              <Option value={taskInfo?.creator?.id}>
                {taskInfo?.creator?.username}
              </Option>
              {taskInfo?.assignee && (
                <Option value={taskInfo?.assignee?.id}>
                  {taskInfo?.assignee?.username}
                </Option>
              )}
            </Select>
          </Form.Item>

          <Form.Item
            name="contribution_type"
            label="贡献类型"
            rules={[{ required: true, message: '请选择贡献类型' }]}
          >
            <Select placeholder="选择贡献类型">
              {contributionTypes.map(([value, label]) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="score"
            label="贡献分数"
            rules={[
              { required: true, message: '请输入贡献分数' },
              { type: 'number', min: 0, max: 100, message: '分数应在0-100之间' }
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              precision={2}
              style={{ width: '100%' }}
              placeholder="输入贡献分数"
            />
          </Form.Item>

          <Form.Item
            name="weight"
            label="权重"
            initialValue={1.0}
            rules={[
              { required: true, message: '请输入权重' },
              { type: 'number', min: 0, max: 1, message: '权重应在0-1之间' }
            ]}
          >
            <InputNumber
              min={0}
              max={1}
              step={0.1}
              precision={2}
              style={{ width: '100%' }}
              placeholder="输入权重"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="贡献描述"
          >
            <TextArea
              rows={3}
              placeholder="详细描述该贡献内容..."
            />
          </Form.Item>

          <Form.Item
            name="evidence"
            label="支撑证据"
          >
            <TextArea
              rows={2}
              placeholder="提供相关证据或链接..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

export default MeritCalculation;