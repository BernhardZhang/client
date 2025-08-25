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
  Tabs,
  Select,
  InputNumber,
  Progress,
  Statistic,
  Timeline,
  Badge,
  Tooltip,
  Divider,
} from 'antd';
import {
  TrophyOutlined,
  GiftOutlined,
  HistoryOutlined,
  SwapOutlined,
  StarOutlined,
  CrownOutlined,
  FireOutlined,
  UserOutlined,
  CalendarOutlined,
  PlusOutlined,
  SendOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import usePointsStore from '../../stores/pointsStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const Points = () => {
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { user } = useAuthStore();
  const {
    userPoints,
    pointsHistory,
    earnStats,
    evaluations,
    fetchPointsSummary,
    fetchPointsHistory,
    fetchEvaluations,
    transferPoints,
    isLoading
  } = usePointsStore();

  useEffect(() => {
    if (user) {
      fetchPointsSummary();
      fetchPointsHistory();
      fetchEvaluations();
    }
  }, [user, fetchPointsSummary, fetchPointsHistory, fetchEvaluations]);

  const handleTransferPoints = async (values) => {
    try {
      const result = await transferPoints(values);
      if (result.success !== false) {
        message.success('积分转账成功！');
        setTransferModalVisible(false);
        transferForm.resetFields();
        fetchPointsSummary();
        fetchPointsHistory();
      } else {
        message.error(result.error || '转账失败');
      }
    } catch (error) {
      message.error('转账失败');
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      1: '#8c8c8c', // 新手 - 灰色
      2: '#cd7f32', // 青铜 - 青铜色
      3: '#c0c0c0', // 白银 - 银色
      4: '#ffd700', // 黄金 - 金色
      5: '#b9f2ff', // 钻石 - 钻石蓝
    };
    return colors[level] || '#8c8c8c';
  };

  const getLevelIcon = (level) => {
    const icons = {
      1: <UserOutlined />,
      2: <StarOutlined />,
      3: <TrophyOutlined />,
      4: <CrownOutlined />,
      5: <FireOutlined />,
    };
    return icons[level] || <UserOutlined />;
  };

  const getChangeTypeColor = (changeType) => {
    const colors = {
      'earn': 'success',
      'spend': 'error',
      'transfer': 'processing',
      'reward': 'warning',
      'penalty': 'error',
      'refund': 'default',
    };
    return colors[changeType] || 'default';
  };

  const historyColumns = [
    {
      title: '类型',
      dataIndex: 'change_type_display',
      key: 'change_type',
      render: (text, record) => (
        <Tag color={getChangeTypeColor(record.change_type)}>
          {text}
        </Tag>
      ),
    },
    {
      title: '积分变动',
      dataIndex: 'points',
      key: 'points',
      render: (points) => (
        <Text style={{ 
          color: points > 0 ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {points > 0 ? '+' : ''}{points}
        </Text>
      ),
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '相关项目',
      dataIndex: 'related_project_name',
      key: 'related_project_name',
      render: (name) => name ? <Tag color="blue">{name}</Tag> : '-',
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => (
        <Tooltip title={dayjs(time).format('YYYY-MM-DD HH:mm:ss')}>
          {dayjs(time).fromNow()}
        </Tooltip>
      ),
    },
    {
      title: '余额',
      dataIndex: 'balance_after',
      key: 'balance_after',
      render: (balance) => <Text strong>{balance}</Text>,
    },
  ];

  const evaluationColumns = [
    {
      title: '评分活动',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.project_name}
          </Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          'active': { color: 'processing', text: '进行中' },
          'completed': { color: 'success', text: '已完成' },
          'cancelled': { color: 'default', text: '已取消' },
        };
        const config = statusConfig[status] || { color: 'default', text: '未知' };
        return <Badge status={config.color} text={config.text} />;
      },
    },
    {
      title: '参与人数',
      dataIndex: 'participant_count',
      key: 'participant_count',
      render: (count) => `${count} 人`,
    },
    {
      title: '评分进度',
      dataIndex: 'evaluation_count',
      key: 'evaluation_count',
      render: (count, record) => {
        const total = record.participant_count * (record.participant_count - 1); // 每人评分其他所有人
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <Progress 
            percent={percent} 
            size="small" 
            format={() => `${count}/${total}`}
          />
        );
      },
    },
    {
      title: '时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time, record) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: 12 }}>
            开始: {dayjs(time).format('MM-DD HH:mm')}
          </Text>
          <Text style={{ fontSize: 12 }}>
            结束: {dayjs(record.end_time).format('MM-DD HH:mm')}
          </Text>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>积分中心</Title>
        <Button 
          type="primary" 
          icon={<SendOutlined />}
          onClick={() => setTransferModalVisible(true)}
        >
          积分转账
        </Button>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="积分概览" key="overview">
          {userPoints && (
            <>
              {/* 积分概览卡片 */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="总积分"
                      value={userPoints.total_points}
                      prefix={<TrophyOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="可用积分"
                      value={userPoints.available_points}
                      prefix={<GiftOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="已使用积分"
                      value={userPoints.used_points}
                      prefix={<SwapOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* 等级信息 */}
              <Card style={{ marginBottom: 24 }}>
                <Row align="middle">
                  <Col span={4}>
                    <div style={{ textAlign: 'center' }}>
                      <Avatar 
                        size={80} 
                        style={{ 
                          backgroundColor: getLevelColor(userPoints.level),
                          fontSize: 32
                        }}
                        icon={getLevelIcon(userPoints.level)}
                      />
                    </div>
                  </Col>
                  <Col span={20}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Title level={3} style={{ margin: 0, display: 'inline-block' }}>
                          {userPoints.level_name} 等级
                        </Title>
                        <Tag 
                          color={getLevelColor(userPoints.level)}
                          style={{ marginLeft: 8 }}
                        >
                          Lv.{userPoints.level}
                        </Tag>
                      </div>
                      <div>
                        <Text type="secondary">
                          当前积分: {userPoints.total_points} 分
                        </Text>
                      </div>
                      {/* 升级进度条 */}
                      {userPoints.level < 5 && (
                        <div style={{ width: '60%' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            距离下一等级还需积分: 
                          </Text>
                          <Progress 
                            percent={Math.min(100, (userPoints.total_points % 1000) / 10)}
                            size="small"
                            style={{ marginTop: 4 }}
                          />
                        </div>
                      )}
                    </Space>
                  </Col>
                </Row>
              </Card>

              {/* 积分来源统计 */}
              {earnStats && earnStats.length > 0 && (
                <Card title="积分来源统计" style={{ marginBottom: 24 }}>
                  <Row gutter={16}>
                    {earnStats.map((stat, index) => (
                      <Col span={8} key={index}>
                        <Card size="small">
                          <Statistic
                            title={stat.reason}
                            value={stat.total_points}
                            suffix={`(${stat.count}次)`}
                            valueStyle={{ fontSize: 16 }}
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}

              {/* 最近积分变动 */}
              <Card title="最近积分变动">
                {pointsHistory && pointsHistory.length > 0 ? (
                  <Timeline>
                    {pointsHistory.slice(0, 8).map(record => (
                      <Timeline.Item
                        key={record.id}
                        color={record.points > 0 ? 'green' : 'red'}
                      >
                        <Space direction="vertical" size="small">
                          <Space>
                            <Tag color={getChangeTypeColor(record.change_type)}>
                              {record.change_type_display}
                            </Tag>
                            <Text style={{ 
                              color: record.points > 0 ? '#52c41a' : '#ff4d4f',
                              fontWeight: 'bold'
                            }}>
                              {record.points > 0 ? '+' : ''}{record.points}分
                            </Text>
                          </Space>
                          <Text>{record.reason}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(record.created_at).format('MM-DD HH:mm')}
                            {record.related_project_name && (
                              <Tag color="blue" size="small" style={{ marginLeft: 8 }}>
                                {record.related_project_name}
                              </Tag>
                            )}
                          </Text>
                        </Space>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                ) : (
                  <Text type="secondary">暂无积分变动记录</Text>
                )}
              </Card>
            </>
          )}
        </Tabs.TabPane>

        <Tabs.TabPane tab="积分历史" key="history">
          <Card>
            <Table
              columns={historyColumns}
              dataSource={pointsHistory}
              rowKey="id"
              loading={isLoading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane tab="功分互评" key="evaluations">
          <Card>
            <Table
              columns={evaluationColumns}
              dataSource={evaluations}
              rowKey="id"
              loading={isLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个评分活动`,
              }}
            />
          </Card>
        </Tabs.TabPane>
      </Tabs>

      {/* 积分转账Modal */}
      <Modal
        title="积分转账"
        open={transferModalVisible}
        onOk={() => transferForm.submit()}
        onCancel={() => {
          setTransferModalVisible(false);
          transferForm.resetFields();
        }}
        confirmLoading={isLoading}
      >
        <Form
          form={transferForm}
          layout="vertical"
          onFinish={handleTransferPoints}
        >
          <Form.Item
            name="to_user"
            label="接收用户ID"
            rules={[
              { required: true, message: '请输入接收用户ID' },
              { type: 'number', message: '请输入有效的用户ID' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入要转账的用户ID"
              min={1}
            />
          </Form.Item>

          <Form.Item
            name="points"
            label="转账积分"
            rules={[
              { required: true, message: '请输入转账积分数量' },
              { type: 'number', min: 1, message: '转账积分必须大于0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入转账积分数量"
              min={1}
              max={userPoints?.available_points || 0}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="转账说明"
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入转账说明（可选）"
              maxLength={200}
            />
          </Form.Item>

          {userPoints && (
            <div style={{ padding: 12, backgroundColor: '#f6f6f6', borderRadius: 4 }}>
              <Text type="secondary">
                可用积分: <Text strong>{userPoints.available_points}</Text> 分
              </Text>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Points;