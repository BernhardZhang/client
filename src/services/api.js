import axios from 'axios';

// 全局配置状态
let apiBaseURL = '/api'; // 默认相对路径
let configLoaded = false;

// 同步加载配置并立即设置
const loadConfigSync = async () => {
    try {
        const response = await fetch('/config.json');
        const config = await response.json();
        console.log('Loaded config:', config);

        if (config.API_BASE_URL) {
            apiBaseURL = config.API_BASE_URL;
            console.log('Set API base URL to:', apiBaseURL);
            return config.API_BASE_URL;
        } else {
            return config.API_BASE_URL || `http://${config.SERVER_HOST}:${config.SERVER_PORT}/api`;
        }
    } catch (error) {
        console.error('Failed to load config:', error);
        throw error;
    }
};

// 立即加载配置
const configPromise = loadConfigSync().then(baseURL => {
    configLoaded = true;
    return baseURL;
}).catch(error => {
    console.error('Config loading failed:', error);
    configLoaded = true;
    return '/api'; // 失败时保持相对路径
});

// Create axios instance - 不设置baseURL
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// 重写request interceptor，确保每次请求都使用正确的baseURL
api.interceptors.request.use(
  async (config) => {
    // 等待配置加载完成
    if (!configLoaded) {
        await configPromise;
    }

    // 强制设置正确的baseURL
    if (!config.baseURL) {
        config.baseURL = apiBaseURL;
    }

    console.log('Request interceptor: 使用baseURL:', config.baseURL);
    console.log('Request interceptor: 完整URL:', config.baseURL + config.url);

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    // 如果数据是FormData，移除Content-Type让浏览器自动设置
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and special status codes
api.interceptors.response.use(
  (response) => {
    // 特殊处理204响应，确保它被视为成功
    if (response.status === 204) {
      return { ...response, data: { success: true, message: '操作成功' } };
    }
    return response;
  },
  (error) => {
    // 特殊处理204响应被错误地归类为错误的情况
    if (error.response?.status === 204) {
      return Promise.resolve({ 
        status: 204, 
        data: { success: true, message: '操作成功' },
        config: error.config,
        headers: error.response.headers,
        request: error.request
      });
    }
    
    if (error.response?.status === 401) {
      // 只有在用户已登录的情况下才清除token并跳转到登录页
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => {
    console.log('authAPI.login called with:', { email, password: '***' });
    console.log('Current API base URL:', api.defaults.baseURL);
    return api.post('/auth/login/', { email, password });
  },
  register: (userData) =>
    api.post('/auth/register/', userData),
  logout: () =>
    api.post('/auth/logout/'),
  getProfile: () =>
    api.get('/auth/profile/'),
  getUsers: () =>
    api.get('/auth/users/'),
};

// Projects API
export const projectsAPI = {
  getProjects: () =>
    api.get('/projects/'),
  createProject: (projectData) =>
    api.post('/projects/', projectData),
  getProject: (id) =>
    api.get(`/projects/${id}/`),
  updateProject: (id, projectData) =>
    api.put(`/projects/${id}/`, projectData),
  deleteProject: (id) =>
    api.delete(`/projects/${id}/`),
  joinProject: (projectId) =>
    api.post(`/projects/${projectId}/join/`),
  leaveProject: (projectId) =>
    api.post(`/projects/${projectId}/leave/`),
  
  // 项目日志相关API
  getProjectLogs: (projectId, params = {}) =>
    api.get(`/projects/${projectId}/logs/`, { params }),
  createProjectLog: (projectId, logData) =>
    api.post(`/projects/${projectId}/logs/create/`, logData),
  getProjectLogTypes: () =>
    api.get('/projects/log-types/'),
};

// Voting API
export const votingAPI = {
  getVotingRounds: () =>
    api.get('/voting/rounds/'),
  getActiveRound: () =>
    api.get('/voting/rounds/active/'),
  createVotingRound: (roundData) =>
    api.post('/voting/rounds/', roundData),
  activateRound: (roundId) =>
    api.post(`/voting/rounds/${roundId}/activate/`),
  getVotes: (votingRound) =>
    api.get('/voting/votes/', { params: { voting_round: votingRound } }),
  createVote: (voteData) =>
    api.post('/voting/votes/', voteData),
  getVote: (voteId) =>
    api.get(`/voting/votes/${voteId}/`),
  updateVote: (voteId, voteData) =>
    api.put(`/voting/votes/${voteId}/`, voteData),
  deleteVote: (voteId) =>
    api.delete(`/voting/votes/${voteId}/`),
  getMyVotes: (votingRound) =>
    api.get('/voting/votes/my/', { params: { voting_round: votingRound } }),
  getVotesReceived: (votingRound) =>
    api.get('/voting/votes/received/', { params: { voting_round: votingRound } }),
  getEvaluations: (votingRound) =>
    api.get('/voting/evaluations/', { params: { voting_round: votingRound } }),
  createEvaluation: (evaluationData) =>
    api.post('/voting/evaluations/', evaluationData),
  getEvaluation: (evaluationId) =>
    api.get(`/voting/evaluations/${evaluationId}/`),
  updateEvaluation: (evaluationId, evaluationData) =>
    api.put(`/voting/evaluations/${evaluationId}/`, evaluationData),
  deleteEvaluation: (evaluationId) =>
    api.delete(`/voting/evaluations/${evaluationId}/`),
  getSelfEvaluations: (votingRound) =>
    api.get('/voting/self-evaluations/', { params: { voting_round: votingRound } }),
  createSelfEvaluation: (evaluationData) =>
    api.post('/voting/self-evaluations/', evaluationData),
  getSelfEvaluation: (evaluationId) =>
    api.get(`/voting/self-evaluations/${evaluationId}/`),
  updateSelfEvaluation: (evaluationId, evaluationData) =>
    api.put(`/voting/self-evaluations/${evaluationId}/`, evaluationData),
  deleteSelfEvaluation: (evaluationId) =>
    api.delete(`/voting/self-evaluations/${evaluationId}/`),
};

// Rating API - 更新为voting路径
export const ratingAPI = {
  // 评分活动管理
  getRatingSessions: (projectId) =>
    api.get('/voting/rating-sessions/', { params: { project: projectId } }),
  createRatingSession: (sessionData) =>
    api.post('/voting/rating-sessions/', sessionData),
  getRatingSession: (sessionId) =>
    api.get(`/voting/rating-sessions/${sessionId}/`),
  updateRatingSession: (sessionId, sessionData) =>
    api.put(`/voting/rating-sessions/${sessionId}/`, sessionData),
  deleteRatingSession: (sessionId) =>
    api.delete(`/voting/rating-sessions/${sessionId}/`),
  endRatingSession: (sessionId) =>
    api.post(`/voting/rating-sessions/${sessionId}/end/`),

  // 评分记录管理
  getRatings: (sessionId) =>
    api.get('/voting/ratings/', { params: { session: sessionId } }),
  createRating: (ratingData) =>
    api.post('/voting/ratings/', ratingData),
  getRating: (ratingId) =>
    api.get(`/voting/ratings/${ratingId}/`),
  updateRating: (ratingId, ratingData) =>
    api.put(`/voting/ratings/${ratingId}/`, ratingData),
  deleteRating: (ratingId) =>
    api.delete(`/voting/ratings/${ratingId}/`),

  // 获取我的评分记录
  getMyRatings: (sessionId) =>
    api.get('/voting/ratings/my/', { params: { session: sessionId } }),

  // 评分结果统计
  getRatingResults: (sessionId) =>
    api.get(`/voting/rating-sessions/${sessionId}/results/`),
};

// Finance API
export const financeAPI = {
  getReports: (votingRound, showAll = false) =>
    api.get('/finance/reports/', { 
      params: { 
        voting_round: votingRound,
        show_all: showAll 
      } 
    }),
  createReport: (reportData) =>
    api.post('/finance/reports/', reportData),
  generateReport: (reportData) =>
    api.post('/finance/reports/generate/', reportData),
  authorizeReport: (reportId) =>
    api.post(`/finance/reports/${reportId}/authorize/`),
  getTransactions: () =>
    api.get('/finance/transactions/'),
  getEquity: (votingRound) =>
    api.get('/finance/equity/', { params: { voting_round: votingRound } }),
  getRealEquity: (votingRound) =>
    api.get('/finance/equity/real/', { params: { voting_round: votingRound } }),
  getPortfolio: (votingRound) =>
    api.get('/finance/portfolio/', { params: { voting_round: votingRound } }),
  createWechatPayment: (paymentData) =>
    api.post('/finance/payment/wechat/', paymentData),
};

// WISlab API
export const wislabApi = {
  // 仪表板
  getDashboard: () =>
    api.get('/projects/wislab-dashboard/'),
  
  // 项目管理
  getProjects: (params = {}) =>
    api.get('/projects/wislab-projects/', { params }),
  createProject: (projectData) =>
    api.post('/projects/wislab-projects/', projectData),
  getProject: (id) =>
    api.get(`/projects/wislab-projects/${id}/`),
  updateProject: (id, projectData) =>
    api.put(`/projects/wislab-projects/${id}/`, projectData),
  deleteProject: (id) =>
    api.delete(`/projects/wislab-projects/${id}/`),
    // 项目大厅相关
    getProjectHall: (params) =>
        api.get('/projects/hall/', { params }),

  // 任务管理
  getProjectTasks: (projectId) =>
    api.get(`/projects/tasks/`, { params: { project: projectId } }),
  assignTask: (projectId, assignmentData) =>
    api.post(`/projects/wislab-projects/${projectId}/assign_task/`, assignmentData),
  calculateProjectScores: (projectId) =>
    api.post(`/projects/wislab-projects/${projectId}/calculate_scores/`),
  
  // 任务分配
  getTaskAssignments: (params = {}) =>
    api.get('/projects/task-assignments/', { params }),
  getMyAssignments: () =>
    api.get('/projects/task-assignments/my_assignments/'),
  bulkCalculateScores: (assignmentIds) =>
    api.post('/projects/task-assignments/bulk_calculate_scores/', { assignment_ids: assignmentIds }),
  
  // 评分活动
  getEvaluations: (params = {}) =>
    api.get('/projects/evaluations/', { params }),
  startEvaluation: (projectId, evaluationData) =>
    api.post(`/projects/wislab-projects/${projectId}/start_evaluation/`, evaluationData),
  participateEvaluation: (evaluationId, evaluationData) =>
    api.post(`/projects/evaluations/${evaluationId}/participate/`, evaluationData),
  completeEvaluation: (evaluationId) =>
    api.post(`/projects/evaluations/${evaluationId}/complete/`),
  
  // 数据分析
  getProjectAnalysis: (projectId) =>
    api.get(`/projects/wislab-projects/${projectId}/data_analysis/`),
  
  // 会员管理
  getMyMembership: () =>
    api.get('/projects/wislab-membership/my_membership/'),
  upgradeToVip: (paymentData) =>
    api.post('/projects/wislab-membership/upgrade_to_vip/', paymentData),
  
  // 系统统计
  getSystemStatistics: () =>
    api.get('/projects/system-statistics/'),
};

// Tasks API
export const tasksAPI = {
  getTasks: (params) =>
    api.get('/tasks/', { params }),
  createTask: (taskData) =>
    api.post('/tasks/', taskData),
  getTask: (id) =>
    api.get(`/tasks/${id}/`),
  updateTask: (id, taskData) =>
    api.put(`/tasks/${id}/`, taskData),
  deleteTask: (id) =>
    api.delete(`/tasks/${id}/`),
  updateTaskStatus: (id, status) =>
    api.post(`/tasks/${id}/status/`, { status }),
  evaluateTask: (id, evaluationData) =>
    api.post(`/tasks/${id}/evaluate/`, evaluationData),
  getTaskEvaluations: (id) =>
    api.get(`/tasks/${id}/evaluations/`),
  getTaskSummary: () =>
    api.get('/tasks/summary/'),
  getUserScoreSummary: () =>
    api.get('/tasks/score-summary/'),

  claimTask: (taskId) =>
    api.post(`/tasks/${taskId}/claim/`),
    
  // 任务日志相关
  getTaskLogs: (taskId) =>
    api.get(`/tasks/${taskId}/logs/`),
  getTaskUserLogs: (taskId) =>
    api.get(`/tasks/${taskId}/user-logs/`),
  createTaskUserLog: (taskId, logData) =>
    api.post(`/tasks/${taskId}/user-logs/`, logData),
  updateTaskUserLog: (logId, logData) =>
    api.put(`/tasks/user-logs/${logId}/`, logData),
  deleteTaskUserLog: (logId) =>
    api.delete(`/tasks/user-logs/${logId}/`),
    
  // 评估会话相关
  getEvaluationSessions: (params) =>
    api.get('/tasks/evaluation-sessions/', { params }),
  createEvaluationSession: (sessionData) =>
    api.post('/tasks/evaluation-sessions/', sessionData),
  getEvaluationSession: (id) =>
    api.get(`/tasks/evaluation-sessions/${id}/`),
  updateEvaluationSession: (id, sessionData) =>
    api.put(`/tasks/evaluation-sessions/${id}/`, sessionData),
  deleteEvaluationSession: (id) =>
    api.delete(`/tasks/evaluation-sessions/${id}/`),
  submitBatchEvaluation: (sessionId, evaluations) =>
    api.post(`/tasks/evaluation-sessions/${sessionId}/submit/`, { evaluations }),
  completeEvaluationSession: (sessionId) =>
    api.post(`/tasks/evaluation-sessions/${sessionId}/complete/`),
  getEvaluationSessionSummary: (sessionId) =>
    api.get(`/tasks/evaluation-sessions/${sessionId}/summary/`),
    
  // 功分计算相关
  getMeritCalculation: (taskId) =>
    api.get(`/tasks/${taskId}/merit-calculation/`),
  saveMeritCalculation: (taskId, calculationData) =>
    api.post(`/tasks/${taskId}/merit-calculation/`, calculationData),
  finalizeMeritCalculation: (taskId) =>
    api.post(`/tasks/${taskId}/merit-calculation/finalize/`),
  getContributionRecords: (taskId) =>
    api.get(`/tasks/${taskId}/contribution-records/`),
  addContributionRecord: (taskId, contributionData) =>
    api.post(`/tasks/${taskId}/contribution-records/`, contributionData),
  getUserMeritSummary: () =>
    api.get('/tasks/merit-summary/'),
};

export default api;