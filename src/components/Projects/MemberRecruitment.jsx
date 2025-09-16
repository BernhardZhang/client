import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Tag,
  Space,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Descriptions,
  Avatar,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  TeamOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const MemberRecruitment = ({ projectId, isProjectOwner }) => {
  const [recruitments, setRecruitments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [applicationModalVisible, setApplicationModalVisible] = useState(false);
  const [editingRecruitment, setEditingRecruitment] = useState(null);
  const [selectedRecruitment, setSelectedRecruitment] = useState(null);
  const [form] = Form.useForm();
  const [applicationForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('recruitments');

  useEffect(() => {
    fetchRecruitments();
    if (isProjectOwner) {
      fetchApplications();
    }
  }, [projectId, isProjectOwner]);

  const fetchRecruitments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects/recruitments/', {
        params: { project: projectId }
      });
      setRecruitments(response.data.results || response.data);
    } catch (error) {
      message.error('获取招募信息失败');
      console.error('Error fetching recruitments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get('/projects/applications/', {
        params: { recruitment__project: projectId }
      });
      setApplications(response.data.results || response.data);
    } catch (error) {
      message.error('获取申请信息失败');
      console.error('Error fetching applications:', error);
    }
  };

  const handleCreateRecruitment = () => {
    setEditingRecruitment(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEditRecruitment = (recruitment) => {
    setEditingRecruitment(recruitment);
    setModalVisible(true);
    form.setFieldsValue({
      ...recruitment,
      deadline: recruitment.deadline ? dayjs(recruitment.deadline) : null,
      required_skills: recruitment.required_skills || []
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const recruitmentData = {
        ...values,
        project: projectId,
        deadline: values.deadline ? values.deadline.toISOString() : null
      };

      if (editingRecruitment) {
        await api.put(`/projects/recruitments/${editingRecruitment.id}/`, recruitmentData);
        message.success('招募更新成功');
      } else {
        await api.post('/projects/recruitments/', recruitmentData);
        message.success('招募创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      fetchRecruitments();
    } catch (error) {
      message.error('操作失败');
      console.error('Error saving recruitment:', error);
    }
  };

  const handleCloseRecruitment = async (recruitmentId) => {
    try {
      await api.post(`/projects/recruitments/${recruitmentId}/close_recruitment/`);
      message.success('招募已关闭');
      fetchRecruitments();
    } catch (error) {
      message.error('关闭招募失败');
      console.error('Error closing recruitment:', error);
    }
  };

  const handleApplyRecruitment = (recruitment) => {
    setSelectedRecruitment(recruitment);
    setApplicationModalVisible(true);
    applicationForm.resetFields();
  };

  const handleSubmitApplication = async () => {
    try {
      const values = await applicationForm.validateFields();
      await api.post('/projects/applications/', {
        ...values,
        recruitment: selectedRecruitment.id
      });
      message.success('申请已提交');
      setApplicationModalVisible(false);
      applicationForm.resetFields();
    } catch (error) {
      message.error('提交申请失败');
      console.error('Error submitting application:', error);
    }
  };

  const handleApproveApplication = async (applicationId, equityPercentage = 0, role = 'member') => {
    try {
      await api.post(`/projects/applications/${applicationId}/approve/`, {
        equity_percentage: equityPercentage,
        role
      });
      message.success('申请已批准');
      fetchApplications();
      fetchRecruitments();
    } catch (error) {
      message.error('批准申请失败');
      console.error('Error approving application:', error);
    }
  };

  const handleRejectApplication = async (applicationId, notes = '') => {
    try {
      await api.post(`/projects/applications/${applicationId}/reject/`, { notes });
      message.success('申请已拒绝');
      fetchApplications();
    } catch (error) {
      message.error('拒绝申请失败');
      console.error('Error rejecting application:', error);
    }
  };

  const recruitmentColumns = [
    {
      title: '招募标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          <Text type="secondary" ellipsis style={{ maxWidth: 200 }}>
            {record.description}
          </Text>
          {record.required_skills && record.required_skills.length > 0 && (
            <div>
              {record.required_skills.slice(0, 3).map(skill => (
                <Tag key={skill} size="small" color="blue">{skill}</Tag>
              ))}
              {record.required_skills.length > 3 && (
                <Tag size="small">+{record.required_skills.length - 3}</Tag>
              )}
            </div>
          )}
        </Space>
      )
    },
    {
      title: '工作类型',
      dataIndex: 'work_type_display',
      key: 'work_type',
      render: (text) => <Tag color="green">{text}</Tag>
    },
    {
      title: '技能要求',
      dataIndex: 'skill_level_required_display',
      key: 'skill_level'
    },
    {
      title: '招募进度',
      key: 'progress',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text>
            {record.positions_filled}/{record.positions_needed} 人
          </Text>
          <div style={{ width: 80 }}>
            <div 
              style={{ 
                height: 4, 
                backgroundColor: '#f0f0f0', 
                borderRadius: 2, 
                overflow: 'hidden' 
              }}
            >
              <div 
                style={{
                  height: '100%',
                  width: `${(record.positions_filled / record.positions_needed) * 100}%`,
                  backgroundColor: '#1890ff'
                }}
              />
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '股份范围',
      key: 'equity_range',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text>{record.equity_percentage_min}% - {record.equity_percentage_max}%</Text>
          {record.salary_range && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              薪资: {record.salary_range}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status_display',
      key: 'status',
      render: (text, record) => {
        const color = record.status === 'open' ? 'success' : 
                     record.status === 'paused' ? 'warning' : 'default';
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '无限制'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {!isProjectOwner && record.is_active && (
            <Button
              type="primary"
              size="small"
              icon={<UserAddOutlined />}
              onClick={() => handleApplyRecruitment(record)}
            >
              申请
            </Button>
          )}
          
          {isProjectOwner && (
            <>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditRecruitment(record)}
              >
                编辑
              </Button>
              {record.status === 'open' && (
                <Popconfirm
                  title="确定要关闭这个招募吗？"
                  onConfirm={() => handleCloseRecruitment(record.id)}
                >
                  <Button size="small" danger icon={<CloseOutlined />}>
                    关闭
                  </Button>
                </Popconfirm>
              )}
            </>
          )}
        </Space>
      )
    }
  ];

  const applicationColumns = [
    {
      title: '申请人',
      dataIndex: 'applicant_name',
      key: 'applicant',
      render: (text) => (
        <Space>
          <Avatar size="small" icon={<TeamOutlined />} />
          {text}
        </Space>
      )
    },
    {
      title: '招募职位',
      dataIndex: 'recruitment_title',
      key: 'recruitment'
    },
    {
      title: '申请理由',
      dataIndex: 'cover_letter',
      key: 'cover_letter',
      render: (text) => (
        <Text ellipsis style={{ maxWidth: 200 }}>
          {text}
        </Text>
      )
    },
    {
      title: '技能',
      dataIndex: 'skills',
      key: 'skills',
      render: (skills) => (
        <div>
          {(skills || []).slice(0, 3).map(skill => (
            <Tag key={skill} size="small">{skill}</Tag>
          ))}
          {skills && skills.length > 3 && (
            <Tag size="small">+{skills.length - 3}</Tag>
          )}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status_display',
      key: 'status',
      render: (text, record) => {
        const color = record.status === 'approved' ? 'success' : 
                     record.status === 'rejected' ? 'error' : 
                     record.status === 'reviewing' ? 'processing' : 'warning';
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {isProjectOwner && record.status === 'pending' && (
            <>
              <Popconfirm
                title="批准申请"
                description="确定要批准这个申请吗？将分配默认股份比例。"
                onConfirm={() => {
                  // 使用默认值批准申请
                  const equity = 0; // 默认股份比例
                  const role = 'member'; // 默认角色
                  handleApproveApplication(record.id, equity, role);
                }}
              >
                <Button type="primary" size="small" icon={<CheckOutlined />}>
                  批准
                </Button>
              </Popconfirm>
              
              <Popconfirm
                title="确定要拒绝这个申请吗？"
                onConfirm={() => handleRejectApplication(record.id)}
              >
                <Button danger size="small" icon={<CloseOutlined />}>
                  拒绝
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="招募信息" key="recruitments">
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Title level={4}>成员招募</Title>
            {isProjectOwner && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateRecruitment}
              >
                发布招募
              </Button>
            )}
          </div>

          <Table
            columns={recruitmentColumns}
            dataSource={recruitments}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个招募`
            }}
          />
        </Tabs.TabPane>

        {isProjectOwner && (
          <Tabs.TabPane tab={`申请管理 (${applications.length})`} key="applications">
            <Table
              columns={applicationColumns}
              dataSource={applications}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个申请`
              }}
            />
          </Tabs.TabPane>
        )}
      </Tabs>

      {/* 创建/编辑招募Modal */}
      <Modal
        title={editingRecruitment ? '编辑招募' : '发布招募'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={720}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="招募标题"
                rules={[{ required: true, message: '请输入招募标题' }]}
              >
                <Input placeholder="请输入招募标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="work_type"
                label="工作类型"
                rules={[{ required: true, message: '请选择工作类型' }]}
              >
                <Select placeholder="请选择工作类型">
                  <Option value="full_time">全职</Option>
                  <Option value="part_time">兼职</Option>
                  <Option value="contract">合同工</Option>
                  <Option value="volunteer">志愿者</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="招募描述"
            rules={[{ required: true, message: '请输入招募描述' }]}
          >
            <TextArea rows={4} placeholder="详细描述招募的职位要求和工作内容" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="positions_needed"
                label="招募人数"
                rules={[{ required: true, message: '请输入招募人数' }]}
              >
                <InputNumber min={1} placeholder="招募人数" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="skill_level_required"
                label="技能等级要求"
              >
                <Select placeholder="请选择技能等级">
                  <Option value="beginner">初级</Option>
                  <Option value="intermediate">中级</Option>
                  <Option value="advanced">高级</Option>
                  <Option value="expert">专家</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="deadline" label="截止时间">
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  placeholder="选择截止时间"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="equity_percentage_min" label="最小股份比例 (%)">
                <InputNumber
                  min={0}
                  max={100}
                  step={0.01}
                  placeholder="0.00"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="equity_percentage_max" label="最大股份比例 (%)">
                <InputNumber
                  min={0}
                  max={100}
                  step={0.01}
                  placeholder="0.00"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="salary_range" label="薪资范围">
                <Input placeholder="如：5000-8000元/月" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expected_commitment" label="预期投入时间">
                <Input placeholder="如：每周20小时" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="required_skills" label="所需技能">
            <Select
              mode="tags"
              placeholder="输入所需技能，按回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 申请招募Modal */}
      <Modal
        title={`申请：${selectedRecruitment?.title}`}
        open={applicationModalVisible}
        onOk={handleSubmitApplication}
        onCancel={() => {
          setApplicationModalVisible(false);
          applicationForm.resetFields();
        }}
        width={600}
      >
        <Form form={applicationForm} layout="vertical">
          <Form.Item
            name="cover_letter"
            label="申请理由"
            rules={[{ required: true, message: '请输入申请理由' }]}
          >
            <TextArea
              rows={4}
              placeholder="请说明您为什么适合这个职位，以及您能为项目带来什么价值"
            />
          </Form.Item>

          <Form.Item name="skills" label="您的技能">
            <Select
              mode="tags"
              placeholder="输入您的技能，按回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="experience" label="相关经验">
            <TextArea
              rows={3}
              placeholder="请描述您的相关工作经验或项目经验"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="portfolio_url" label="作品集链接">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expected_commitment" label="可投入时间">
                <Input placeholder="如：每周15小时" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MemberRecruitment;