import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  InputNumber,
  Button,
  Card,
  Typography,
  Space,
  Alert,
  Row,
  Col,
  Statistic,
  message,
  Descriptions,
  Divider,
} from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  CalculatorOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import useVotingStore from '../../stores/votingStore';

const { Title, Text } = Typography;

const SelfEvaluationModal = ({ visible, onCancel, onSuccess, userOrProject, entityType }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentValuation, setCurrentValuation] = useState(0);
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [newValuation, setNewValuation] = useState(0);
  const [equityChange, setEquityChange] = useState({ before: 0, after: 0 });
  
  const { user } = useAuthStore();
  const { activeRound } = useVotingStore();

  useEffect(() => {
    if (visible && userOrProject) {
      // 模拟获取当前估值和股份信息
      const mockCurrentValuation = entityType === 'user' ? 100.00 : 500.00;
      setCurrentValuation(mockCurrentValuation);
      
      // 重置表单
      form.resetFields();
      setInvestmentAmount(0);
      setNewValuation(mockCurrentValuation);
      setEquityChange({ before: 100, after: 100 });
    }
  }, [visible, userOrProject, entityType, form]);

  // 计算估值变化
  const calculateValuation = (amount) => {
    if (!amount || amount <= 0) {
      setNewValuation(currentValuation);
      setEquityChange({ before: 100, after: 100 });
      return;
    }

    // 新估值 = 当前估值 + 投资金额
    const newVal = currentValuation + amount;
    setNewValuation(newVal);

    // 计算股份稀释
    // 原有股份比例 = 当前估值 / 新估值
    // 新增股份比例 = 投资金额 / 新估值
    const originalEquity = (currentValuation / newVal) * 100;
    const newEquity = (amount / newVal) * 100;

    setEquityChange({
      before: 100,
      after: originalEquity
    });
  };

  const handleAmountChange = (value) => {
    setInvestmentAmount(value || 0);
    calculateValuation(value || 0);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 这里应该调用实际的API
      // const result = await selfEvaluationAPI.createSelfInvestment({
      //   entity_type: entityType,
      //   entity_id: userOrProject.id,
      //   amount: values.amount,
      //   voting_round: activeRound?.id,
      //   current_valuation: currentValuation,
      //   new_valuation: newValuation,
      // });

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      message.success('自评增资成功！');
      onSuccess && onSuccess({
        amount: values.amount,
        newValuation,
        equityChange
      });
      
      form.resetFields();
      setInvestmentAmount(0);
      
    } catch (error) {
      console.error('自评增资失败:', error);
      message.error('自评增资失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setInvestmentAmount(0);
    onCancel && onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <RiseOutlined />
          {entityType === 'user' ? '个人' : '项目'}自评增资
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          disabled={investmentAmount <= 0 || investmentAmount > 10.00}
        >
          确认增资
        </Button>,
      ]}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Alert
          message="自评增资说明"
          description="通过自己投资增加估值，但会稀释现有股份。最高可投资10.00元。"
          type="info"
          showIcon
          icon={<WarningOutlined />}
        />

        <Descriptions title="当前状态" bordered size="small">
          <Descriptions.Item label="实体名称">
            {userOrProject?.name || userOrProject?.username}
          </Descriptions.Item>
          <Descriptions.Item label="当前估值">
            ¥{Number(currentValuation || 0).toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="当前股份">
            100%
          </Descriptions.Item>
          <Descriptions.Item label="融资轮次" span={3}>
            {activeRound?.name || '无活跃轮次'}
          </Descriptions.Item>
        </Descriptions>

        <Card title="增资设置">
          <Form form={form} layout="vertical">
            <Form.Item
              name="amount"
              label="增资金额"
              rules={[
                { required: true, message: '请输入增资金额！' },
                { type: 'number', min: 0.01, max: 10.00, message: '增资金额必须在0.01-10.00元之间！' }
              ]}
            >
              <InputNumber
                min={0.01}
                max={10.00}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
                placeholder="请输入增资金额 (0.01-10.00元)"
                addonBefore="¥"
                onChange={handleAmountChange}
              />
            </Form.Item>
          </Form>
        </Card>

        {investmentAmount > 0 && (
          <Card 
            title={
              <Space>
                <CalculatorOutlined />
                估值计算结果
              </Space>
            }
          >
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="新估值"
                  value={Number(newValuation || 0)}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="原股份占比"
                  value={Number(equityChange.after || 0)}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="新增投资占比"
                  value={Number((investmentAmount / newValuation) * 100 || 0)}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>

            <Divider />

            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>估值变化：</Text>
                <Text strong>
                  ¥{Number(currentValuation || 0).toFixed(2)} → ¥{Number(newValuation || 0).toFixed(2)}
                  <Text type="success" style={{ marginLeft: 8 }}>
                    (+¥{Number(investmentAmount || 0).toFixed(2)})
                  </Text>
                </Text>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>股份稀释：</Text>
                <Text strong>
                  100% → {Number(equityChange.after || 0).toFixed(2)}%
                  <Text type="warning" style={{ marginLeft: 8 }}>
                    (-{Number((100 - equityChange.after) || 0).toFixed(2)}%)
                  </Text>
                </Text>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>投资回报率：</Text>
                <Text strong style={{ color: '#722ed1' }}>
                  {Number(((newValuation / currentValuation - 1) * 100) || 0).toFixed(2)}%
                </Text>
              </div>
            </Space>
          </Card>
        )}

        {investmentAmount > 8.00 && (
          <Alert
            message="高额投资提醒"
            description="您的投资金额较高，将显著稀释现有股份。请谨慎考虑。"
            type="warning"
            showIcon
          />
        )}
      </Space>
    </Modal>
  );
};

export default SelfEvaluationModal;