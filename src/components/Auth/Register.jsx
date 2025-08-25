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
  Col 
} from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, HomeOutlined } from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';

const { Title, Text } = Typography;

const Register = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const onFinish = async (values) => {
    const result = await register(values);
    if (result.success) {
      message.success('注册成功！');
      navigate('/');
    } else {
      if (typeof result.error === 'object') {
        Object.keys(result.error).forEach(key => {
          const errors = result.error[key];
          if (Array.isArray(errors)) {
            errors.forEach(error => message.error(`${key}: ${error}`));
          } else {
            message.error(`${key}: ${errors}`);
          }
        });
      } else {
        message.error(result.error);
      }
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
              <Text type="secondary">创建您的账户</Text>
            </div>
            
            <Form
              form={form}
              name="register"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名！' },
                  { min: 3, message: '用户名至少3个字符！' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="用户名"
                />
              </Form.Item>

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
                rules={[
                  { required: true, message: '请输入密码！' },
                  { min: 8, message: '密码至少8个字符！' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                />
              </Form.Item>

              <Form.Item
                name="password_confirm"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码！' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致！'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="确认密码"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={isLoading}
                  style={{ width: '100%' }}
                >
                  注册
                </Button>
              </Form.Item>
            </Form>

            <Button 
              type="default" 
              icon={<HomeOutlined />}
              onClick={handleBackHome}
              style={{ width: '100%', marginBottom: '16px' }}
              size="large"
            >
              返回主页
            </Button>

            <Text>
              已有账户？ <Link to="/login">立即登录</Link>
            </Text>
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

export default Register;