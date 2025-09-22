import { create } from 'zustand';
import api, { tasksAPI } from '../services/api';

const useTaskStore = create((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,

  // 获取任务列表
  fetchTasks: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.getTasks(params);
      // 确保tasks总是数组
      const tasksData = response.data.results || response.data;
      const tasks = Array.isArray(tasksData) ? tasksData : [];
      set({ tasks, isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({
        error: error.response?.data?.message || error.message || '获取任务列表失败',
        isLoading: false,
        tasks: [] // 确保在错误情况下tasks也是数组
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // 获取单个任务详情
  fetchTask: async (taskId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.getTask(taskId);
      set({ currentTask: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Error fetching task:', error);
      set({ 
        error: error.response?.data?.message || error.message || '获取任务详情失败',
        isLoading: false 
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // 创建任务
  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.createTask(taskData);
      const newTask = response.data;
      
      set(state => ({
        tasks: [newTask, ...(Array.isArray(state.tasks) ? state.tasks : [])],
        isLoading: false
      }));
      
      return { success: true, data: newTask };
    } catch (error) {
      console.error('Error creating task:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          '创建任务失败';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  // 更新任务
  updateTask: async (taskId, taskData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.updateTask(taskId, taskData);
      const updatedTask = response.data;

      set(state => ({
        tasks: Array.isArray(state.tasks) ? state.tasks.map(task =>
          task.id === taskId ? updatedTask : task
        ) : [],
        currentTask: state.currentTask?.id === taskId ? updatedTask : state.currentTask,
        isLoading: false
      }));

      return { success: true, data: updatedTask };
    } catch (error) {
      console.error('Error updating task:', error);
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.detail ||
                          error.message ||
                          '更新任务失败';
      set({
        error: errorMessage,
        isLoading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  // 删除任务
  deleteTask: async (taskId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.deleteTask(taskId);
      console.log('Delete task response:', response);
      
      // 任务删除成功，从列表中移除
      set(state => ({
        tasks: Array.isArray(state.tasks) ? state.tasks.filter(task => task.id !== taskId) : [],
        currentTask: state.currentTask?.id === taskId ? null : state.currentTask,
        isLoading: false
      }));
      
      return { success: true, message: '任务删除成功' };
    } catch (error) {
      console.error('Error deleting task:', error);
      
      // 处理204响应 (删除成功无内容返回)
      if (error.response?.status === 204) {
        console.log('Task deleted successfully (204 No Content)');
        set(state => ({
          tasks: Array.isArray(state.tasks) ? state.tasks.filter(task => task.id !== taskId) : [],
          currentTask: state.currentTask?.id === taskId ? null : state.currentTask,
          isLoading: false
        }));
        return { success: true, message: '任务删除成功' };
      }
      
      // 处理其他成功响应状态码
      if (error.response?.status >= 200 && error.response?.status < 300) {
        console.log('Task deleted successfully (HTTP success status)');
        set(state => ({
          tasks: Array.isArray(state.tasks) ? state.tasks.filter(task => task.id !== taskId) : [],
          currentTask: state.currentTask?.id === taskId ? null : state.currentTask,
          isLoading: false
        }));
        return { success: true, message: '任务删除成功' };
      }
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          '删除任务失败';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  // 添加任务评论
  addTaskComment: async (taskId, content) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/projects/tasks/${taskId}/add_comment/`, {
        content
      });
      
      // 重新获取任务详情以更新评论列表
      const taskResponse = await api.get(`/projects/tasks/${taskId}/`);
      const updatedTask = taskResponse.data;
      
      set(state => ({
        tasks: Array.isArray(state.tasks) ? state.tasks.map(task =>
          task.id === taskId ? updatedTask : task
        ) : [],
        currentTask: state.currentTask?.id === taskId ? updatedTask : state.currentTask,
        isLoading: false
      }));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding comment:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          '添加评论失败';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  // 添加任务附件
  addTaskAttachment: async (taskId, formData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/projects/tasks/${taskId}/add_attachment/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // 重新获取任务详情以更新附件列表
      const taskResponse = await api.get(`/projects/tasks/${taskId}/`);
      const updatedTask = taskResponse.data;
      
      set(state => ({
        tasks: Array.isArray(state.tasks) ? state.tasks.map(task =>
          task.id === taskId ? updatedTask : task
        ) : [],
        currentTask: state.currentTask?.id === taskId ? updatedTask : state.currentTask,
        isLoading: false
      }));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding attachment:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          '添加附件失败';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  // 获取任务统计
  taskStatistics: async () => {
    try {
      const response = await api.get('/projects/task-stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching task statistics:', error);
      return null;
    }
  },

  // 根据项目获取任务
  fetchTasksByProject: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/projects/tasks/', {
        params: { project: projectId }
      });
      const projectTasks = response.data.results || response.data;
      set({ isLoading: false });
      return projectTasks;
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      set({ 
        error: error.response?.data?.message || error.message || '获取项目任务失败',
        isLoading: false 
      });
      return [];
    }
  },

  // 根据用户获取任务
  fetchTasksByUser: async (userId, type = 'all') => {
    set({ isLoading: true, error: null });
    try {
      const params = {};
      if (type === 'assigned') {
        params.assignee = userId;
      } else if (type === 'created') {
        params.creator = userId;
      }
      
      const response = await api.get('/projects/tasks/', { params });
      const userTasks = response.data.results || response.data;
      set({ isLoading: false });
      return userTasks;
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      set({ 
        error: error.response?.data?.message || error.message || '获取用户任务失败',
        isLoading: false 
      });
      return [];
    }
  },

  // 搜索任务
  searchTasks: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/projects/tasks/', {
        params: { search: query }
      });
      set({ tasks: response.data.results || response.data, isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Error searching tasks:', error);
      set({ 
        error: error.response?.data?.message || error.message || '搜索任务失败',
        isLoading: false 
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // 评估任务
  evaluateTask: async (taskId, evaluationData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/tasks/${taskId}/evaluate/`, evaluationData);
      
      // 重新获取任务详情以更新评分信息
      const taskResponse = await api.get(`/projects/tasks/${taskId}/`);
      const updatedTask = taskResponse.data;
      
      set(state => ({
        tasks: Array.isArray(state.tasks) ? state.tasks.map(task =>
          task.id === taskId ? updatedTask : task
        ) : [],
        currentTask: state.currentTask?.id === taskId ? updatedTask : state.currentTask,
        isLoading: false
      }));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error evaluating task:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          '任务评估失败';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  // 获取任务评估列表
  fetchTaskEvaluations: async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}/evaluations/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task evaluations:', error);
      return [];
    }
  },

  // 获取用户任务分数汇总
  fetchUserTaskScoreSummary: async () => {
    try {
      const response = await api.get('/tasks/user-score-summary/');
      return response.data;
    } catch (error) {
      console.error('Error fetching user task score summary:', error);
      return null;
    }
  },

  // 清除错误
  clearError: () => set({ error: null }),

  // 清除当前任务
  clearCurrentTask: () => set({ currentTask: null }),

  // 评估会话相关功能
  evaluationSessions: [],
  currentEvaluationSession: null,

  // 获取评估会话列表
  fetchEvaluationSessions: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.getEvaluationSessions(params);
      set({ evaluationSessions: response.data.results || response.data, isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Error fetching evaluation sessions:', error);
      set({ 
        error: error.response?.data?.message || error.message || '获取评估会话失败',
        isLoading: false 
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // 创建评估会话
  createEvaluationSession: async (sessionData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.createEvaluationSession(sessionData);
      const newSession = response.data;
      
      set(state => ({
        evaluationSessions: [newSession, ...state.evaluationSessions],
        isLoading: false
      }));
      
      return { success: true, data: newSession };
    } catch (error) {
      console.error('Error creating evaluation session:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          '创建评估会话失败';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  // 获取单个评估会话详情
  fetchEvaluationSession: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.getEvaluationSession(sessionId);
      set({ currentEvaluationSession: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Error fetching evaluation session:', error);
      set({ 
        error: error.response?.data?.message || error.message || '获取评估会话详情失败',
        isLoading: false 
      });
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // 批量提交评估
  submitBatchEvaluation: async (sessionId, evaluations) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.submitBatchEvaluation(sessionId, evaluations);
      
      // 更新评估会话状态
      if (get().currentEvaluationSession?.id === sessionId) {
        set(state => ({
          currentEvaluationSession: {
            ...state.currentEvaluationSession,
            completion_percentage: response.data.completion_percentage
          },
          isLoading: false
        }));
      } else {
        set({ isLoading: false });
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error submitting batch evaluation:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          '提交评估失败';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  // 完成评估会话
  completeEvaluationSession: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.completeEvaluationSession(sessionId);
      
      // 更新评估会话状态
      set(state => ({
        currentEvaluationSession: response.data.session,
        evaluationSessions: state.evaluationSessions.map(session =>
          session.id === sessionId ? response.data.session : session
        ),
        isLoading: false
      }));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error completing evaluation session:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          '完成评估会话失败';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  // 获取评估会话摘要
  fetchEvaluationSessionSummary: async (sessionId) => {
    try {
      const response = await tasksAPI.getEvaluationSessionSummary(sessionId);
      return response.data;
    } catch (error) {
      console.error('Error fetching evaluation session summary:', error);
      return null;
    }
  },

  // 清除当前评估会话
  clearCurrentEvaluationSession: () => set({ currentEvaluationSession: null }),
}));

export default useTaskStore;