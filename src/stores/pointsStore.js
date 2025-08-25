import { create } from 'zustand';
import api from '../services/api';

const usePointsStore = create((set, get) => ({
  userPoints: null,
  pointsHistory: [],
  earnStats: [],
  evaluations: [],
  currentEvaluation: null,
  isLoading: false,
  error: null,

  // 获取用户积分概要
  fetchPointsSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/projects/points-summary/');
      set({
        userPoints: response.data.points,
        pointsHistory: response.data.recent_history || [],
        earnStats: response.data.earn_stats || [],
        isLoading: false
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching points summary:', error);
      set({
        error: error.response?.data?.message || error.message || '获取积分概要失败',
        isLoading: false
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // 获取积分历史
  fetchPointsHistory: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/projects/points-history/', { params });
      set({
        pointsHistory: response.data.results || response.data,
        isLoading: false
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching points history:', error);
      set({
        error: error.response?.data?.message || error.message || '获取积分历史失败',
        isLoading: false
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // 获取评分活动列表
  fetchEvaluations: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/projects/evaluations/', { params });
      set({
        evaluations: response.data.results || response.data,
        isLoading: false
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      set({
        error: error.response?.data?.message || error.message || '获取评分活动失败',
        isLoading: false
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // 获取单个评分活动详情
  fetchEvaluation: async (evaluationId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/projects/evaluations/${evaluationId}/`);
      set({
        currentEvaluation: response.data,
        isLoading: false
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching evaluation:', error);
      set({
        error: error.response?.data?.message || error.message || '获取评分活动详情失败',
        isLoading: false
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // 创建评分活动
  createEvaluation: async (evaluationData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/projects/evaluations/', evaluationData);
      const newEvaluation = response.data;
      
      set(state => ({
        evaluations: [newEvaluation, ...state.evaluations],
        isLoading: false
      }));
      
      return { success: true, data: newEvaluation };
    } catch (error) {
      console.error('Error creating evaluation:', error);
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.detail ||
                          error.message ||
                          '创建评分活动失败';
      set({
        error: errorMessage,
        isLoading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  // 参与评分
  participateInEvaluation: async (evaluationId, evaluationsData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/projects/evaluations/${evaluationId}/participate/`, {
        evaluations: evaluationsData
      });
      
      // 更新当前评分活动
      if (get().currentEvaluation?.id === evaluationId) {
        const updatedEvaluation = await get().fetchEvaluation(evaluationId);
        if (updatedEvaluation.success !== false) {
          set({ currentEvaluation: updatedEvaluation });
        }
      }
      
      // 刷新评分活动列表
      get().fetchEvaluations();
      
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error participating in evaluation:', error);
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          error.message ||
                          '参与评分失败';
      set({
        error: errorMessage,
        isLoading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  // 完成评分活动
  completeEvaluation: async (evaluationId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/projects/evaluations/${evaluationId}/complete/`);
      
      // 更新评分活动状态
      set(state => ({
        evaluations: state.evaluations.map(evaluation =>
          evaluation.id === evaluationId
            ? { ...evaluation, status: 'completed' }
            : evaluation
        ),
        currentEvaluation: state.currentEvaluation?.id === evaluationId
          ? { ...state.currentEvaluation, status: 'completed' }
          : state.currentEvaluation,
        isLoading: false
      }));
      
      // 刷新积分信息
      get().fetchPointsSummary();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error completing evaluation:', error);
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          error.message ||
                          '完成评分活动失败';
      set({
        error: errorMessage,
        isLoading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  // 积分转账
  transferPoints: async (transferData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/projects/transfer-points/', transferData);
      
      // 刷新积分信息
      get().fetchPointsSummary();
      
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error transferring points:', error);
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          error.message ||
                          '积分转账失败';
      set({
        error: errorMessage,
        isLoading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  // 获取项目积分分配
  fetchProjectPoints: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/projects/project-points/', {
        params: { project: projectId }
      });
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Error fetching project points:', error);
      set({
        error: error.response?.data?.message || error.message || '获取项目积分分配失败',
        isLoading: false
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // 分配项目积分
  allocateProjectPoints: async (allocationData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/projects/project-points/', allocationData);
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error allocating project points:', error);
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.detail ||
                          error.message ||
                          '分配积分失败';
      set({
        error: errorMessage,
        isLoading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  // 获取用户积分排行榜
  fetchPointsLeaderboard: async (params = {}) => {
    try {
      const response = await api.get('/projects/points/', { params });
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error fetching points leaderboard:', error);
      return [];
    }
  },

  // 清除错误
  clearError: () => set({ error: null }),

  // 清除当前评分活动
  clearCurrentEvaluation: () => set({ currentEvaluation: null }),
}));

export default usePointsStore;