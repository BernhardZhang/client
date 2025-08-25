import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Rate,
  Space,
  Typography,
  Card,
  Row,
  Col,
  InputNumber,
  Select,
  Divider,
  Tag,
  Avatar,
  Button,
  message,
} from 'antd';
import {
  UserOutlined,
  StarOutlined,
  TrophyOutlined,
  LineChartOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TaskEvaluationModal = ({ visible, task, onCancel, onSubmit }) => {
  const [form] = Form.useForm();
  const [evaluationMode, setEvaluationMode] = useState('peer'); // peer, self
  const [criteriaScores, setCriteriaScores] = useState({
    quality: 0,      // 工作质量
    efficiency: 0,   // 工作效率
    communication: 0, // 沟通协调
    innovation: 0,   // 创新性
    teamwork: 0,     // 团队协作
  });

  useEffect(() => {
    if (visible && task) {
      form.resetFields();
      setCriteriaScores({
        quality: 0,
        efficiency: 0,
        communication: 0,
        innovation: 0,
        teamwork: 0,
      });
    }
  }, [visible, task, form]);

  const criteriaConfig = {
    quality: { name: '工作质量', weight: 0.3, description: '任务完成质量、代码质量、文档质量等' },
    efficiency: { name: '工作效率', weight: 0.25, description: '任务完成速度、时间利用效率等' },
    communication: { name: '沟通协调', weight: 0.2, description: '与团队成员沟通、协调能力等' },
    innovation: { name: '创新性', weight: 0.15, description: '解决方案的创新性、技术创新等' },
    teamwork: { name: '团队协作', weight: 0.1, description: '团队合作精神、协助其他成员等' },
  };

  const calculateTotalScore = () => {
    let total = 0;
    Object.entries(criteriaScores).forEach(([key, score]) => {
      const weight = criteriaConfig[key]?.weight || 0;
      total += score * weight * 20; // 转换为100分制
    });
    return Math.round(total * 100) / 100;
  };

  const handleCriteriaScoreChange = (criteria, score) => {
    setCriteriaScores(prev => ({
      ...prev,
      [criteria]: score
    }));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const evaluationData = {
        ...values,
        criteria_scores: criteriaScores,
        total_score: calculateTotalScore(),
        evaluation_mode: evaluationMode,
      };

      onSubmit(evaluationData);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  if (!task) return null;

  return (
    <Modal
      title={`任务评估评分 - ${task.title}`}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      width={800}
      okText="提交评分"
      cancelText="取消"
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 任务信息 */}
        <Card size="small" title="任务信息">
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>任务标题：</Text>{task.title}
            </Col>
            <Col span={12}>
              <Text strong>项目：</Text>{task.project_name}
            </Col>
            <Col span={12}>
              <Text strong>负责人：</Text>
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                {task.assignee_name}
              </Space>
            </Col>
            <Col span={12}>
              <Text strong>当前分数：</Text>
              <Tag color="blue">系统分: {Number(task.system_score || 0).toFixed(1)}</Tag>
              <Tag color="green">功分: {Number(task.function_score || 0).toFixed(1)}</Tag>
            </Col>
          </Row>
          {task.description && (
            <div style={{ marginTop: 12 }}>
              <Text strong>任务描述：</Text>
              <Paragraph ellipsis={{ rows: 2, expandable: true }}>
                {task.description}
              </Paragraph>
            </div>
          )}
        </Card>

        {/* 评分表单 */}
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            score_type: 'function', // 默认为功分评估
          }}
        >
          {/* 评分模式选择 */}
          <Form.Item label="评分模式">
            <Select value={evaluationMode} onChange={setEvaluationMode}>
              <Option value="peer">同行评分</Option>
              <Option value="self">自我评分</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="score_type"
            label="评分类型"
            rules={[{ required: true, message: '请选择评分类型！' }]}
          >
            <Select>
              <Option value="function">功分评估</Option>
              <Option value="system">系统分调整</Option>
            </Select>
          </Form.Item>

          {/* 多维度评分 */}
          <Card size="small" title="多维度评分" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries(criteriaConfig).map(([key, config]) => (
                <Row key={key} align="middle" gutter={16}>
                  <Col span={6}>
                    <Text strong>{config.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      权重: {(config.weight * 100)}%
                    </Text>
                  </Col>
                  <Col span={8}>
                    <Rate
                      value={criteriaScores[key]}
                      onChange={(value) => handleCriteriaScoreChange(key, value)}
                      style={{ fontSize: 16 }}
                    />
                  </Col>
                  <Col span={10}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {config.description}
                    </Text>
                  </Col>
                </Row>
              ))}
              
              <Divider />
              
              <Row align="middle">
                <Col span={6}>
                  <Text strong style={{ color: '#722ed1' }}>综合评分</Text>
                </Col>
                <Col span={18}>
                  <Text strong style={{ fontSize: 16, color: '#722ed1' }}>
                    {calculateTotalScore().toFixed(2)} 分
                  </Text>
                </Col>
              </Row>
            </Space>
          </Card>

          {/* 评分理由 */}
          <Form.Item
            name="comment"
            label="评分理由"
            rules={[{ required: true, message: '请填写评分理由！' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细说明评分理由，包括任务完成情况、工作质量、贡献度等..."
            />
          </Form.Item>

          {/* 改进建议 */}
          <Form.Item
            name="improvement_suggestions"
            label="改进建议"
          >
            <TextArea
              rows={3}
              placeholder="可选：对未来工作的改进建议..."
            />
          </Form.Item>

          {/* 权重分配（如果是团队任务） */}
          {task.team_members && task.team_members.length > 1 && (
            <Form.Item
              name="work_weight"
              label="工作量权重"
              tooltip="在团队任务中，您认为被评估人在此任务中的工作量占比"
            >
              <InputNumber
                min={0}
                max={1}
                step={0.1}
                precision={2}
                placeholder="0.1 - 1.0"
                style={{ width: '100%' }}
                formatter={value => `${value}`}
                parser={value => value.replace('%', '')}
              />
            </Form.Item>
          )}

          {/* 评分标准说明 */}
          <Card size="small" title="评分标准说明" style={{ backgroundColor: '#fafafa' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Title level={5}>星级对应标准：</Title>
                <Space direction="vertical">
                  <Text>⭐ - 不满意 (1分)</Text>
                  <Text>⭐⭐ - 基本满意 (2分)</Text>
                  <Text>⭐⭐⭐ - 满意 (3分)</Text>
                  <Text>⭐⭐⭐⭐ - 很满意 (4分)</Text>
                  <Text>⭐⭐⭐⭐⭐ - 非常满意 (5分)</Text>
                </Space>
              </Col>
              <Col span={12}>
                <Title level={5}>综合评分计算：</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  综合评分 = Σ(各维度评分 × 对应权重) × 20<br/>
                  最终功分 = 综合评分 × 工作量权重 × 时效系数
                </Text>
              </Col>
            </Row>
          </Card>
        </Form>
      </Space>
    </Modal>
  );
};

export default TaskEvaluationModal;