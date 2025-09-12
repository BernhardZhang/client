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
  InputNumber,
  Select,
  Space,
  Tag,
  Avatar,
  Typography,
  message,
  Tabs,
  Statistic,
  Popconfirm,
  Empty,
} from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  ProjectOutlined,
  PlusOutlined,
  TrophyOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import LoginPrompt from '../Auth/LoginPrompt';
import LoginDialog from '../Auth/LoginDialog';
import RegisterDialog from '../Auth/RegisterDialog';
import useAuthStore from '../../stores/authStore';
import useProjectStore from '../../stores/projectStore';
import useVotingStore from '../../stores/votingStore';
import { authAPI } from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const Voting = ({ projectId }) => {
  const [form] = Form.useForm();
  const [isVoteModalVisible, setIsVoteModalVisible] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [allUsers, setAllUsers] = useState({});
  const [selectedVoteType, setSelectedVoteType] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [localVotes, setLocalVotes] = useState([]);
  const [isParticipateModalVisible, setIsParticipateModalVisible] = useState(false);
  const [currentVote, setCurrentVote] = useState(null);
  const [participateForm] = Form.useForm();
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [voteResults, setVoteResults] = useState(null);
  
  const { user, isAuthenticated } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const {
    myVotes,
    fetchMyVotes,
    createVote,
    isLoading
  } = useVotingStore();

  useEffect(() => {
    fetchProjects();
    loadUsers();
    
    // 如果在项目页面，设置默认值
    if (projectId) {
      setSelectedVoteType('project');
      setSelectedProject(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMyVotes();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      const userData = response.data || {};
      setAllUsers(userData);
    } catch (error) {
      message.error('加载用户列表失败，请刷新页面重试');
    }
  };


  const handleCreateVote = async () => {
    try {
      console.log('开始创建投票...');
      const values = await form.validateFields();
      console.log('表单验证通过，表单值:', values);
      
      // 检查必要字段
      if (!values.title) {
        message.error('请输入评分标题！');
        return;
      }
      if (!values.description) {
        message.error('请输入评分内容！');
        return;
      }
      if (!values.evaluators || values.evaluators.length === 0) {
        message.error('请选择评分人员！');
        return;
      }
      
      // 构建投票数据
      const voteData = {
        title: values.title,
        description: values.description,
        evaluators: values.evaluators,
        vote_type: 'project',
        target_project: projectId,
        target_user: null,
        participant_count: values.evaluators ? values.evaluators.length : 0
      };
      
      console.log('准备提交投票数据:', voteData);
      
      // 临时模拟创建投票成功，用于测试
      const mockResult = {
        success: true,
        data: {
          id: Date.now(),
          ...voteData,
          created_at: new Date().toISOString(),
          created_by: user?.id,
          target_name: projects.find(p => p.id === projectId)?.name || '项目投票'
        }
      };
      
      console.log('模拟投票创建结果:', mockResult);
      
      // 临时使用模拟数据，实际应该调用 createVote(voteData)
      // const result = await createVote(voteData);
      const result = mockResult;
      
      if (result && result.success) {
        message.success('投票创建成功！');
        handleModalClose();
        
        // 将新创建的投票添加到本地状态中，立即显示
        if (result.data) {
          console.log('添加新投票到本地状态:', result.data);
          setLocalVotes(prev => [...prev, result.data]);
        }
        
        fetchMyVotes();
      } else {
        message.error(result?.error || '创建投票失败，请重试');
      }
    } catch (error) {
      console.error('创建投票失败:', error);
      if (error.errorFields) {
        message.error('请检查表单填写是否完整');
      } else {
        message.error('创建投票失败，请重试');
      }
    }
  };

  // 处理Modal关闭
  const handleModalClose = () => {
    setIsVoteModalVisible(false);
    form.resetFields();
    setSelectedVoteType('');
    setSelectedProject('');
  };


  // 处理参与投票
  const handleParticipateVote = (vote) => {
    setCurrentVote(vote);
    
    // 获取参与成员信息
    const currentProject = projects.find(p => p.id === vote.target_project);
    const participants = currentProject?.members_detail || [];
    
    // 初始化表单，每个成员默认分值为0
    const initialValues = {};
    participants.forEach((member) => {
      initialValues[`score_${member.user}`] = 0;
    });
    
    participateForm.setFieldsValue(initialValues);
    setIsParticipateModalVisible(true);
  };

  // 处理查看投票结果
  const handleViewVoteResults = (vote) => {
    setCurrentVote(vote);
    
    // 模拟投票数据，实际应该从API获取
    const mockVoteData = generateMockVoteData(vote);
    
    // 根据功分易功分互评方案计算最终结果
    const results = calculateVoteResults(mockVoteData);
    
    setVoteResults(results);
    setIsResultModalVisible(true);
  };

  // 生成模拟投票数据
  const generateMockVoteData = (vote) => {
    const currentProject = projects.find(p => p.id === vote.target_project);
    const participants = currentProject?.members_detail || [];
    
    // 模拟每个参与者的投票数据
    const voteData = participants.map(participant => {
      const scores = {};
      let totalScore = 0;
      
      // 为每个参与者生成对其他人的评分
      participants.forEach(target => {
        if (target.user === participant.user) {
          // 自己给自己打分（通常偏高）
          scores[target.user] = Math.floor(Math.random() * 20) + 70; // 70-90分
      } else {
          // 给其他人打分
          scores[target.user] = Math.floor(Math.random() * 30) + 30; // 30-60分
        }
        totalScore += scores[target.user];
      });
      
      // 调整总分到100
      const adjustment = 100 - totalScore;
      const keys = Object.keys(scores);
      if (keys.length > 0) {
        scores[keys[0]] += adjustment;
      }
      
      return {
        voter: participant,
        scores: scores
      };
    });
    
    return {
      vote: vote,
      participants: participants,
      voteData: voteData
    };
  };

  // 根据功分易功分互评方案计算最终结果
  const calculateVoteResults = (data) => {
    const { participants, voteData } = data;
    const n = participants.length;
    
    if (n < 2) {
      return { error: '参与人数不足，无法进行互评' };
    }
    
    const results = participants.map(participant => {
      const participantId = participant.user;
      
      // 收集其他人对该参与者的评分
      const othersScores = voteData
        .filter(vote => vote.voter.user !== participantId)
        .map(vote => vote.scores[participantId])
        .filter(score => score !== undefined);
      
      if (othersScores.length === 0) {
        return {
          participant: participant,
          originalSelfScore: 0,
          othersAverageScore: 0,
          adjustedScore: 0,
          finalScore: 0
        };
      }
      
      // 获取该参与者给自己的评分
      const selfVote = voteData.find(vote => vote.voter.user === participantId);
      const originalSelfScore = selfVote ? selfVote.scores[participantId] : 0;
      
      // 根据参与人数选择不同的计算方法
      let baseScore, adjustedScore;
      
      if (n === 2) {
        // n=2的情况：使用对方评分作为基准
        baseScore = othersScores[0];
        const deviation = Math.abs(originalSelfScore - baseScore);
        if (deviation > 30) {
          // 偏差过大，需要第三方仲裁（这里简化为取平均值）
          adjustedScore = (originalSelfScore + baseScore) / 2;
        } else {
          // 正常调整
          const r = deviation / baseScore;
          const k = 0.2 + 0.7 * r;
          if (originalSelfScore >= baseScore) {
            adjustedScore = originalSelfScore - k * (originalSelfScore - baseScore);
          } else {
            adjustedScore = originalSelfScore + k * (baseScore - originalSelfScore);
          }
        }
      } else if (n >= 3 && n <= 10) {
        // 3<=n<=10的情况：双基准交叉验证
        const mean = othersScores.reduce((sum, score) => sum + score, 0) / othersScores.length;
        const sorted = [...othersScores].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        
        // 去除异常值
        const stdDev = Math.sqrt(othersScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / othersScores.length);
        const filteredScores = othersScores.filter(score => Math.abs(score - mean) <= 3 * stdDev);
        
        const finalMean = filteredScores.length >= 2 ? 
          filteredScores.reduce((sum, score) => sum + score, 0) / filteredScores.length : mean;
        
        baseScore = 0.6 * finalMean + 0.4 * median;
        
        const r = Math.abs(originalSelfScore - baseScore) / baseScore;
        const k = 0.3 + 0.6 * r;
        
        if (originalSelfScore >= baseScore) {
          adjustedScore = originalSelfScore - k * (originalSelfScore - baseScore);
        } else {
          adjustedScore = originalSelfScore + k * (baseScore - originalSelfScore);
        }
      } else {
        // n>10的情况：贝叶斯平均
        const othersMean = othersScores.reduce((sum, score) => sum + score, 0) / othersScores.length;
        const globalMean = 75; // 假设全局平均分为75
        const m = 5; // 权重
        
        baseScore = (othersMean * (n - 1) + m * globalMean) / (n - 1 + m);
        
        const r = Math.abs(originalSelfScore - baseScore) / baseScore;
        const k = 0.4 + 0.5 * r;
        
        if (originalSelfScore >= baseScore) {
          adjustedScore = originalSelfScore - k * (originalSelfScore - baseScore);
        } else {
          adjustedScore = originalSelfScore + k * (baseScore - originalSelfScore);
        }
      }
      
      // 确保分数在合理范围内
      adjustedScore = Math.max(0, Math.min(100, adjustedScore));
      
      return {
        participant: participant,
        originalSelfScore: originalSelfScore,
        othersAverageScore: othersScores.reduce((sum, score) => sum + score, 0) / othersScores.length,
        baseScore: baseScore,
        adjustedScore: adjustedScore,
        finalScore: Math.round(adjustedScore * 10) / 10 // 保留一位小数
      };
    });
    
    return {
      vote: data.vote,
      participants: participants,
      results: results,
      calculationMethod: n === 2 ? '双人互评' : n <= 10 ? '双基准交叉验证' : '贝叶斯平均'
    };
  };

  // 提交投票参与
  const handleSubmitParticipation = async () => {
    try {
      const values = await participateForm.validateFields();
      
      // 验证总分是否为100
      const totalScore = Object.values(values).reduce((sum, score) => sum + (score || 0), 0);
      if (totalScore !== 100) {
        message.error('总分必须为100分，请重新分配！');
        return;
      }
      
      console.log('提交投票参与:', values);
      
      // 这里应该调用API提交投票数据
      // const result = await submitVoteParticipation(currentVote.id, values);
      
      // 模拟提交成功
      message.success('投票提交成功！');
      setIsParticipateModalVisible(false);
      participateForm.resetFields();
      
    } catch (error) {
      console.error('提交投票失败:', error);
      if (error.errorFields) {
        message.error('请检查表单填写是否完整');
      } else {
        message.error('提交投票失败，请重试');
      }
    }
  };

  // 关闭参与投票Modal
  const handleCloseParticipation = () => {
    setIsParticipateModalVisible(false);
    participateForm.resetFields();
    setCurrentVote(null);
  };

  // 关闭结果Modal
  const handleCloseResult = () => {
    setIsResultModalVisible(false);
    setVoteResults(null);
    setCurrentVote(null);
  };


  // 检查是否可以删除投票
  const canDeleteVote = (vote) => {
    if (!user) return false;
    
    // 创建者可以删除
    if (vote.created_by === user.id) {
      return true;
    }
    
    // 管理员可以删除（这里假设user对象有is_admin字段，如果没有可以调整）
    if (user.is_admin || user.is_staff || user.role === 'admin') {
      return true;
    }
    
    // 项目创建者可以删除（如果当前用户在项目页面）
    if (projectId) {
      const currentProject = projects.find(p => p.id === projectId);
      if (currentProject && currentProject.created_by === user.id) {
        return true;
      }
    }
    
    return false;
  };

  // 处理删除投票
  const handleDeleteVote = async (voteId) => {
    try {
      console.log('准备删除投票:', voteId);
      
      // 从本地状态中删除
      setLocalVotes(prev => prev.filter(vote => vote.id !== voteId));
      
      // 这里应该调用API删除投票，目前使用模拟
      // const result = await deleteVote(voteId);
      
      // 模拟删除成功
      const result = { success: true };
      
      if (result.success) {
        message.success('投票删除成功！');
        // 刷新投票列表
        fetchMyVotes();
      } else {
        message.error('删除投票失败，请重试');
        // 如果删除失败，重新加载数据
        fetchMyVotes();
      }
    } catch (error) {
      console.error('删除投票失败:', error);
      message.error('删除投票失败，请重试');
      // 如果删除失败，重新加载数据
      fetchMyVotes();
    }
  };






  const myProjects = Array.isArray(projects) ? projects.filter(p => 
    p.members_detail?.some(m => m.user === user?.id)
  ) : [];

  const otherUsers = Array.isArray(allUsers) ? allUsers.filter(u => u.id !== user?.id) : [];

  // 合并本地投票和store中的投票
  const allVotes = [...(Array.isArray(myVotes) ? myVotes : []), ...localVotes];
  
  // 过滤已发起项目的投票数据 - 显示用户创建的投票
  const filteredMyVotes = projectId 
    ? allVotes.filter(vote => 
        vote.vote_type === 'project' && 
        vote.target_project === projectId && 
        vote.created_by === user?.id
      )
    : allVotes.filter(vote => 
        vote.vote_type === 'project' && 
        vote.created_by === user?.id
      );

  // 统计数据
  const totalVoteCount = filteredMyVotes.length;
  
  // 调试信息
  console.log('调试信息:', {
    projectId,
    userId: user?.id,
    userInfo: user,
    myVotes: myVotes,
    localVotes: localVotes,
    allVotes: allVotes,
    filteredMyVotes: filteredMyVotes,
    totalVoteCount,
    canDeleteVotes: filteredMyVotes.map(vote => ({
      id: vote.id,
      title: vote.title,
      canDelete: canDeleteVote(vote)
    }))
  });

  const tabItems = [
    {
      key: '1',
      label: '已发起项目的投票',
      children: (
        <div>
          {filteredMyVotes.length > 0 ? (
            <Row gutter={[20, 20]}>
              {filteredMyVotes.map((vote) => (
                <Col span={24} key={vote.id}>
                  <Card
                    style={{
                      marginBottom: 0,
                      borderRadius: 12,
                      border: '1px solid #f0f0f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'all 0.3s ease',
                      ':hover': {
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                    bodyStyle={{
                      padding: 24
                    }}
                  >
                    {/* 卡片头部 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 20,
                      paddingBottom: 16,
                      borderBottom: '1px solid #f5f5f5'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          marginBottom: 8
                        }}>
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: 16
                          }}>
                            📊
                          </div>
                          <div>
                            <h3 style={{
                              margin: 0,
                              fontSize: 18,
                              fontWeight: 600,
                              color: '#262626',
                              lineHeight: 1.4
                            }}>
                              {vote.title || vote.target_name || '项目投票'}
                            </h3>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginTop: 4
                            }}>
                              <Tag 
                                color="blue" 
                                style={{
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 500
                                }}
                              >
                                项目投票
        </Tag>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {new Date(vote.created_at).toLocaleDateString()}
                              </Text>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* 操作按钮 */}
                      <div style={{ display: 'flex', gap: 8 }}>
            <Button
                          type="primary" 
              size="small"
                          onClick={() => handleParticipateVote(vote)}
                          style={{
                            borderRadius: 6,
                            height: 32,
                            fontSize: 12,
                            fontWeight: 500,
                            background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
                            border: 'none',
                            boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)'
                          }}
                        >
                          <span style={{ marginRight: 4 }}>✋</span>
                          参与投票
            </Button>
                        <Button 
                          size="small"
                          onClick={() => handleViewVoteResults(vote)}
                          style={{
                            borderRadius: 6,
                            height: 32,
                            fontSize: 12,
                            fontWeight: 500,
                            borderColor: '#d9d9d9',
                            color: '#595959'
                          }}
                        >
                          <span style={{ marginRight: 4 }}>📈</span>
                          查看结果
                        </Button>
                        {canDeleteVote(vote) && (
            <Popconfirm
              title="确定删除这个投票吗？"
              description="删除后无法恢复"
                            onConfirm={() => handleDeleteVote(vote.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                size="small"
                danger
                              icon={<DeleteOutlined />}
                              style={{
                                borderRadius: 6,
                                height: 32,
                                fontSize: 12
                              }}
              >
                删除
              </Button>
            </Popconfirm>
                        )}
                      </div>
                    </div>

                    {/* 卡片内容 - 一行显示 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 24,
                      padding: 16,
                      background: '#fafafa',
                      borderRadius: 8,
                      border: '1px solid #f0f0f0'
                    }}>
                      {/* 评分标题 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flex: 1,
                        minWidth: 0
                      }}>
                        <span style={{ color: '#1890ff', fontSize: 16 }}>📝</span>
                        <div style={{ minWidth: 0 }}>
                          <Text strong style={{ fontSize: 12, color: '#8c8c8c', display: 'block' }}>
                            评分标题
        </Text>
                          <Text style={{ 
                            fontSize: 14, 
                            color: '#262626',
                            fontWeight: 500,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {vote.title || vote.target_name || '项目投票'}
                          </Text>
                        </div>
                      </div>

                      {/* 评分内容 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flex: 2,
                        minWidth: 0
                      }}>
                        <span style={{ color: '#fa8c16', fontSize: 16 }}>📋</span>
                        <div style={{ minWidth: 0 }}>
                          <Text strong style={{ fontSize: 12, color: '#8c8c8c', display: 'block' }}>
                            评分内容
                          </Text>
                          <Text style={{ 
                            fontSize: 14, 
                            color: '#262626',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {vote.description || '暂无描述'}
                          </Text>
                        </div>
                      </div>

                      {/* 参与成员数量 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flex: '0 0 auto'
                      }}>
                        <span style={{ color: '#52c41a', fontSize: 16 }}>👥</span>
                        <div style={{ textAlign: 'center' }}>
                          <Text strong style={{ fontSize: 12, color: '#8c8c8c', display: 'block' }}>
                            参与成员
                          </Text>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <Text style={{ 
                              fontSize: 18, 
                              fontWeight: 600,
                              color: '#52c41a'
                            }}>
                              {vote.participant_count || (vote.evaluators ? vote.evaluators.length : 0)}
                            </Text>
                            <Text style={{ 
                              fontSize: 12, 
                              color: '#52c41a'
                            }}>
                              人
                            </Text>
                          </div>
                        </div>
                      </div>

                      {/* 投票时间 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flex: '0 0 auto'
                      }}>
                        <span style={{ color: '#8c8c8c', fontSize: 16 }}>🕒</span>
                        <div style={{ textAlign: 'right' }}>
                          <Text strong style={{ fontSize: 12, color: '#8c8c8c', display: 'block' }}>
                            创建时间
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                            {new Date(vote.created_at).toLocaleDateString()}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="暂无已发起的项目投票" />
          )}
        </div>
      ),
    },
  ];

  useEffect(() => {
    // 无论是否登录都获取数据
    fetchMyVotes();
    loadUsers();
  }, []);

  const handleLoginRequired = () => {
    setShowLoginPrompt(true);
  };

  const handlePromptLogin = () => {
    setLoginModalVisible(true);
  };

  const handlePromptRegister = () => {
    setRegisterModalVisible(true);
  };

  const handleSwitchToRegister = () => {
    setLoginModalVisible(false);
    setRegisterModalVisible(true);
  };

  const handleSwitchToLogin = () => {
    setRegisterModalVisible(false);
    setLoginModalVisible(true);
  };

  // 根据登录状态显示不同的按钮和操作
  const renderVotingActions = () => {
    if (!isAuthenticated()) {
      return (
        <Space>
          <Button onClick={handleLoginRequired}>
            登录后参与投票
          </Button>
        </Space>
      );
    }

    return (
      <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setIsVoteModalVisible(true);
                if (allUsers.length === 0) {
                  loadUsers();
                }
              }}
            >
          {projectId ? "创建投票" : "发起投票"}
            </Button>
      </Space>
    );
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          {projectId ? '项目投票' : '投票评估系统'}
        </Title>
        {renderVotingActions()}
      </Row>


          {/* 统计卡片 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
              <Card>
                <Statistic
              title={projectId ? "对项目的投票次数" : "已发起项目投票次数"}
              value={totalVoteCount}
              suffix="次"
              prefix={<UserOutlined />}
                />
              </Card>
            </Col>
        <Col span={12}>
              <Card>
                <Statistic
              title="参与成员总数"
              value={filteredMyVotes.reduce((sum, vote) => sum + (vote.participant_count || 0), 0)}
              suffix="人"
                  prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 投票记录 */}
          <Card>
            <Tabs items={tabItems} />
          </Card>


      {/* 创建投票Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ 
              width: 4, 
              height: 20, 
              backgroundColor: '#52c41a', 
              borderRadius: 2 
            }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              创建投票
            </span>
          </div>
        }
        open={isVoteModalVisible}
        onCancel={handleModalClose}
        width={700}
        destroyOnClose={true}
        footer={null}
        styles={{
          header: {
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: 16,
            marginBottom: 0
          }
        }}
      >
        <div>
          {/* 创建说明卡片 */}
          <div style={{
            background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 100,
              height: 100,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '50%'
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                fontSize: 16, 
                fontWeight: 600, 
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ fontSize: 18 }}>✨</span>
                创建新的投票
              </div>
              <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6 }}>
                为项目成员创建一个公平的互评投票，让每个人都能参与评分并得到合理的评价结果。
              </div>
            </div>
          </div>

        <Form form={form} layout="vertical">
            <div style={{
              background: '#fafafa',
              borderRadius: 12,
              padding: 20,
              border: '1px solid #f0f0f0'
            }}>
              {/* 评分标题 */}
              <div style={{
                background: 'white',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
                border: '1px solid #f0f0f0'
              }}>
            <Form.Item
                  name="title"
                  label={
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      marginBottom: 8
                    }}>
                      <span style={{ color: '#1890ff', fontSize: 16 }}>📝</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#262626' }}>
                        评分标题
                      </span>
                      <span style={{ 
                        color: '#ff4d4f', 
                        fontSize: 12,
                        marginLeft: 4
                      }}>
                        *
                      </span>
                    </div>
                  }
                  rules={[{ required: true, message: '请输入评分标题！' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input 
                    placeholder="请输入评分标题，如：项目贡献度评价" 
                    size="large"
                    style={{ height: 40, fontSize: 14 }}
                  />
            </Form.Item>
              </div>

              {/* 评分内容 */}
              <div style={{
                background: 'white',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
                border: '1px solid #f0f0f0'
              }}>
                <Form.Item
                  name="description"
                  label={
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      marginBottom: 8
                    }}>
                      <span style={{ color: '#1890ff', fontSize: 16 }}>📋</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#262626' }}>
                        评分内容
                      </span>
                      <span style={{ 
                        color: '#ff4d4f', 
                        fontSize: 12,
                        marginLeft: 4
                      }}>
                        *
                      </span>
                    </div>
                  }
                  rules={[{ required: true, message: '请输入评分内容！' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input.TextArea 
                    rows={4} 
                    placeholder="请详细描述评分标准和内容，帮助参与者更好地理解如何评分..." 
                    showCount 
                    maxLength={500}
                    style={{ fontSize: 14 }}
                  />
            </Form.Item>
              </div>

              {/* 选择评分人员 */}
              <div style={{
                background: 'white',
                borderRadius: 8,
                padding: 16,
                border: '1px solid #f0f0f0'
              }}>
            <Form.Item
                  name="evaluators"
                  label={
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      marginBottom: 8
                    }}>
                      <span style={{ color: '#1890ff', fontSize: 16 }}>👥</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#262626' }}>
                        选择评分人员
                      </span>
                      <span style={{ 
                        color: '#ff4d4f', 
                        fontSize: 12,
                        marginLeft: 4
                      }}>
                        *
                      </span>
                    </div>
                  }
                  rules={[{ required: true, message: '请选择评分人员！' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    mode="multiple"
                    placeholder="请选择参与评分的成员..."
                    style={{ width: '100%' }}
                    showSearch
                    size="large"
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {projectId ? (
                      // 如果在项目页面，只显示项目成员
                      (() => {
                        const currentProject = projects.find(p => p.id === projectId);
                        const projectMembers = currentProject?.members_detail || [];
                        return projectMembers.map(member => (
                          <Option key={member.user} value={member.user}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: member.user === user?.id 
                                  ? 'linear-gradient(135deg, #1890ff, #40a9ff)' 
                                  : 'linear-gradient(135deg, #52c41a, #73d13d)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: 10
                              }}>
                                {member.username ? member.username.charAt(0).toUpperCase() : 
                                 member.user_name ? member.user_name.charAt(0).toUpperCase() : 
                                 'U'}
                              </div>
                              <span>
                                {member.username || member.user_name}
                                {member.user === user?.id && ' (我)'}
                              </span>
                            </div>
                          </Option>
                        ));
                      })()
                    ) : (
                      // 如果不在项目页面，显示所有用户
                      (() => {
                      if (Array.isArray(allUsers.results) && allUsers.results.length > 0) {
                          return allUsers.results.map(u => (
                            <Option key={u.id} value={u.id}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #52c41a, #73d13d)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: 10
                                      }}>
                                        {u.username ? u.username.charAt(0).toUpperCase() : 'U'}
                                      </div>
                                      <span>
                                        {u.username}
                                        {u.id === user?.id && ' (我)'}
                                      </span>
                                    </div>
                            </Option>
                          ));
                      } else {
                        return (
                          <Option disabled value="">
                            暂无数据
                          </Option>
                        );
                      }
                      })()
                )}
              </Select>
            </Form.Item>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div style={{ 
              marginTop: 24, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#8c8c8c',
                fontSize: 12
              }}>
                <span>💡</span>
                <span>创建后所有选中的成员都可以参与投票</span>
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <Button 
                  onClick={handleModalClose}
                  size="large"
                  style={{
                    height: 40,
                    paddingLeft: 24,
                    paddingRight: 24,
                    borderRadius: 6
                  }}
                >
                  取消
                </Button>
                <Button 
                  type="primary" 
                  onClick={handleCreateVote} 
                  loading={isLoading}
                  size="large"
                  style={{
                    height: 40,
                    paddingLeft: 24,
                    paddingRight: 24,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #52c41a, #73d13d)',
                    border: 'none',
                    boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
                  }}
                >
                  <span style={{ marginRight: 4 }}>✨</span>
                  创建投票
                </Button>
              </div>
            </div>
        </Form>
        </div>
      </Modal>

      {/* 参与投票Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ 
              width: 4, 
              height: 20, 
              backgroundColor: '#1890ff', 
              borderRadius: 2 
            }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              参与投票 - {currentVote?.title || ''}
            </span>
          </div>
        }
        open={isParticipateModalVisible}
        onCancel={handleCloseParticipation}
        width={900}
        destroyOnClose={true}
        footer={null}
        styles={{
          header: {
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: 16,
            marginBottom: 0
          }
        }}
      >
        {currentVote && (
          <div>
            {/* 投票说明卡片 */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }} />
              <div style={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 100,
                height: 100,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '50%'
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{ fontSize: 18 }}>📋</span>
                  投票说明
                </div>
                <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6 }}>
                  {currentVote.description || '请为每个参与成员分配分数，总分必须为100分。请根据各成员的实际贡献和表现进行公平评分。'}
                </div>
              </div>
            </div>

            {/* 总分提示 */}
            <div style={{
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{ color: '#52c41a', fontSize: 16 }}>💡</span>
              <Text style={{ color: '#52c41a', fontWeight: 500 }}>
                请为所有成员分配分数，总分必须为100分
              </Text>
            </div>
            
            <Form form={participateForm} layout="vertical">
              <div style={{
                background: '#fafafa',
                borderRadius: 12,
                padding: 20,
                border: '1px solid #f0f0f0'
              }}>
                    {(() => {
                  const currentProject = projects.find(p => p.id === currentVote.target_project);
                  const participants = currentProject?.members_detail || [];
                  
                  return participants.map((member, index) => (
                    <div key={member.user} style={{
                      background: 'white',
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: index < participants.length - 1 ? 12 : 0,
                      border: '1px solid #f0f0f0',
                      transition: 'all 0.3s ease',
                      ':hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }
                    }}>
            <Form.Item
                        name={`score_${member.user}`}
                        label={
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8,
                            marginBottom: 8
                          }}>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: member.user === user?.id 
                                ? 'linear-gradient(135deg, #1890ff, #40a9ff)' 
                                : 'linear-gradient(135deg, #52c41a, #73d13d)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: 14
                            }}>
                              {member.username ? member.username.charAt(0).toUpperCase() : 
                               member.user_name ? member.user_name.charAt(0).toUpperCase() : 
                               'U'}
                            </div>
                            <div>
                              <div style={{ 
                                fontSize: 14, 
                                fontWeight: 600,
                                color: '#262626'
                              }}>
                                {member.username || member.user_name}
                                {member.user === user?.id && (
                                  <Tag 
                                    color="blue" 
                                    size="small" 
                                    style={{ marginLeft: 8 }}
                                  >
                                    我
                                  </Tag>
                                )}
                              </div>
                              <div style={{ 
                                fontSize: 12, 
                                color: '#8c8c8c',
                                marginTop: 2
                              }}>
                                成员ID: {member.user}
                              </div>
                            </div>
                          </div>
                        }
            rules={[
                          { required: true, message: '请输入分数！' },
                          { type: 'number', min: 0, max: 100, message: '分数必须在0-100之间！' }
            ]}
                        style={{ marginBottom: 0 }}
          >
            <InputNumber
                          min={0}
                          max={100}
                          step={1}
                          style={{ 
                            width: '100%',
                            height: 40,
                            fontSize: 16
                          }}
                          placeholder="请输入分数 (0-100)"
                          addonAfter={
                            <span style={{ 
                              color: '#1890ff', 
                              fontWeight: 600,
                              fontSize: 14
                            }}>
                              分
                            </span>
                          }
                          size="large"
            />
          </Form.Item>
                    </div>
                  ));
                })()}
              </div>
              
              {/* 操作按钮 */}
              <div style={{ 
                marginTop: 24, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#8c8c8c',
                  fontSize: 12
                }}>
                  <span>⚠️</span>
                  <span>请确保总分等于100分</span>
                </div>
                
                <div style={{ display: 'flex', gap: 12 }}>
                  <Button 
                    onClick={handleCloseParticipation}
                    size="large"
                    style={{
                      height: 40,
                      paddingLeft: 24,
                      paddingRight: 24,
                      borderRadius: 6
                    }}
                  >
                    取消
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={handleSubmitParticipation}
                    size="large"
                    style={{
                      height: 40,
                      paddingLeft: 24,
                      paddingRight: 24,
                      borderRadius: 6,
                      background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
                      border: 'none',
                      boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)'
                    }}
                  >
                    <span style={{ marginRight: 4 }}>✓</span>
                    提交投票
                  </Button>
                </div>
              </div>
        </Form>
          </div>
        )}
      </Modal>

      {/* 投票结果Modal */}
      <Modal
        title={`投票结果 - ${voteResults?.vote?.title || ''}`}
        open={isResultModalVisible}
        onCancel={handleCloseResult}
        width={1000}
        destroyOnClose={true}
        footer={[
          <Button key="close" onClick={handleCloseResult}>
            关闭
          </Button>
        ]}
      >
        {voteResults && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>计算方法：</Text>
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {voteResults.calculationMethod}
              </Tag>
            </div>
            
            <Table
              dataSource={voteResults.results}
              rowKey={(record) => record.participant.user}
              pagination={false}
              columns={[
                {
                  title: '参与者',
                  dataIndex: ['participant', 'username'],
                  key: 'participant',
                  render: (text, record) => (
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      {text || record.participant.user_name} {record.participant.user === user?.id ? '(我)' : ''}
                    </Space>
                  ),
                },
                {
                  title: '自评分数',
                  dataIndex: 'originalSelfScore',
                  key: 'originalSelfScore',
                  render: (score) => <Text>{score}分</Text>,
                },
                {
                  title: '他人平均分',
                  dataIndex: 'othersAverageScore',
                  key: 'othersAverageScore',
                  render: (score) => <Text>{Math.round(score * 10) / 10}分</Text>,
                },
                {
                  title: '基准分数',
                  dataIndex: 'baseScore',
                  key: 'baseScore',
                  render: (score) => <Text>{Math.round(score * 10) / 10}分</Text>,
                },
                {
                  title: '调整后分数',
                  dataIndex: 'adjustedScore',
                  key: 'adjustedScore',
                  render: (score) => <Text>{Math.round(score * 10) / 10}分</Text>,
                },
                {
                  title: '最终分数',
                  dataIndex: 'finalScore',
                  key: 'finalScore',
                  render: (score) => (
                    <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                      {score}分
                    </Text>
                  ),
                },
              ]}
            />
            
            <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
              <Text strong>计算说明：</Text>
              <br />
              <Text type="secondary">
                {voteResults.calculationMethod === '双人互评' && 
                  '双人互评采用对方评分作为基准，通过偏差率动态调整自评分数，确保评分的合理性。'}
                {voteResults.calculationMethod === '双基准交叉验证' && 
                  '双基准交叉验证结合平均值和中位数，去除异常值后计算基准分数，通过动态系数调整自评分数。'}
                {voteResults.calculationMethod === '贝叶斯平均' && 
                  '贝叶斯平均结合他人评分和全局平均分，通过权重平衡计算基准分数，适用于大群体评分。'}
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* 登录提示 */}
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="请登录后参与投票和自评功能"
        onLogin={handlePromptLogin}
        onRegister={handlePromptRegister}
      />

      {/* 登录和注册对话框 */}
      <LoginDialog
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />

      <RegisterDialog
        visible={registerModalVisible}
        onClose={() => setRegisterModalVisible(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
};

export default Voting;