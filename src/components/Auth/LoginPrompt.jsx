import React from 'react';
import { Modal, Button, Space, Typography } from 'antd';
import { LoginOutlined, UserAddOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const LoginPrompt = ({ 
  visible, 
  onClose, 
  message = '请登录后使用此功能',
  onLogin,
  onRegister
}) => {
  const handleLogin = () => {
    onClose();
    if (onLogin) {
      onLogin();
    }
  };

  const handleRegister = () => {
    onClose();
    if (onRegister) {
      onRegister();
    }
  };

  return (
    <Modal
      title="需要登录"
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Title level={4} style={{ color: '#1890ff' }}>
          {message}
        </Title>
        <Text type="secondary">
          登录后即可使用完整功能，包括项目管理、投票评估、财务管理等
        </Text>
        
        <div style={{ marginTop: '24px' }}>
          <Space>
            <Button 
              size="large" 
              onClick={handleLogin}
              icon={<LoginOutlined />}
            >
              登录
            </Button>
            <Button 
              type="primary" 
              size="large" 
              onClick={handleRegister}
              icon={<UserAddOutlined />}
            >
              注册新账号
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default LoginPrompt;