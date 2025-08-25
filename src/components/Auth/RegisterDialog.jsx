import React, { useState } from 'react';
import { Modal, Form, Input, Button, Alert, Typography, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, UserAddOutlined } from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';

const { Text, Link } = Typography;

const RegisterDialog = ({ 
  visible, 
  onClose, 
  onSwitchToLogin 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuthStore();

  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await register({
        username: values.username,
        email: values.email,
        password: values.password,
        password_confirm: values.password_confirm
      });
      
      if (result.success) {
        form.resetFields();
        onClose();
      } else {
        if (typeof result.error === 'object') {
          // 处理字段错误
          const errorMessages = Object.entries(result.error)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          setError(errorMessages);
        } else {
          setError(result.error || '注册失败');
        }
      }
    } catch (err) {
      setError('注册时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setError('');
    onClose();
  };

  const handleSwitchToLogin = () => {
    form.resetFields();
    setError('');
    onSwitchToLogin();
  };

  return (
    <Modal
      title={
        <Space>
          <UserAddOutlined />
          注册功分易账号
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
        name="register"
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
            { min: 3, message: '用户名至少3个字符' },
            { max: 20, message: '用户名不能超过20个字符' },
            { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '用户名只能包含字母、数字、下划线和中文' }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="用户名"
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: '请输入邮箱地址' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="邮箱地址"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6个字符' },
            { max: 128, message: '密码不能超过128个字符' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="password_confirm"
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="确认密码"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
          >
            注册
          </Button>
        </Form.Item>

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            已有账号？{' '}
            <Link onClick={handleSwitchToLogin}>
              立即登录
            </Link>
          </Text>
        </div>
      </Form>
    </Modal>
  );
};

export default RegisterDialog;