import React, { useState } from 'react';
import { Modal, Form, Input, Button, Alert, Typography, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';

const { Text, Link } = Typography;

const LoginDialog = ({ 
  visible, 
  onClose, 
  onSwitchToRegister 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  const handleSubmit = async (values) => {
    console.log('LoginDialog: Form values:', values);
    setLoading(true);
    setError('');
    
    try {
      // 注意这里使用email而不是username
      const result = await login(values.email, values.password);
      console.log('LoginDialog: Login result:', result);
      if (result.success) {
        form.resetFields();
        onClose();
      } else {
        setError(result.error || '登录失败');
      }
    } catch (err) {
      console.error('LoginDialog: Login error:', err);
      setError('登录时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setError('');
    onClose();
  };

  const handleSwitchToRegister = () => {
    form.resetFields();
    setError('');
    onSwitchToRegister();
  };

  return (
    <Modal
      title={
        <Space>
          <LoginOutlined />
          登录到功分易
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={400}
      centered
      maskClosable={false}
    >
      <Form
        form={form}
        name="login"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
      >
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setError('')}
          />
        )}

        <Form.Item
          name="email"
          rules={[
            { required: true, message: '请输入邮箱地址' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="邮箱地址"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6个字符' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
          >
            登录
          </Button>
        </Form.Item>

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            还没有账号？{' '}
            <Link onClick={handleSwitchToRegister}>
              立即注册
            </Link>
          </Text>
        </div>
      </Form>
    </Modal>
  );
};

export default LoginDialog;