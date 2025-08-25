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
    setLoading(true);
    setError('');
    
    try {
      const result = await login(values.username, values.password);
      if (result.success) {
        form.resetFields();
        onClose();
      } else {
        setError(result.error || '登录失败');
      }
    } catch (err) {
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
          name="username"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, message: '用户名至少3个字符' }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="用户名"
            autoComplete="username"
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