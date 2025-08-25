import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Space, 
  message,
  Row,
  Col,
  Divider 
} from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, HomeOutlined } from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';

const { Title, Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const onFinish = async (values) => {
    const result = await login(values.email, values.password);
    if (result.success) {
      message.success('登录成功！');
      navigate('/');
    } else {
      message.error(result.error);
    }
  };

  const handleBackHome = () => {
    navigate('/');
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Col xs={20} sm={16} md={12} lg={8} xl={6}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
            <div>
              <Title level={2}>功分易</Title>
              <Text type="secondary">请登录您的账户</Text>
            </div>
            
            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱地址！' },
                  { type: 'email', message: '请输入有效的邮箱地址！' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="邮箱地址"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码！' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={isLoading}
                  style={{ width: '100%' }}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>

            <Divider>或</Divider>
            
            <Button 
              type="default" 
              icon={<HomeOutlined />}
              onClick={handleBackHome}
              style={{ width: '100%' }}
              size="large"
            >
              返回主页
            </Button>

            <Text>
              还没有账户？ <Link to="/register">立即注册</Link>
            </Text>
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

export default Login;