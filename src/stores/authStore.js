import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.login(email, password);
      const { user, token } = response.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      set({ user, token, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { 
        success: false, 
        error: error.response?.data?.message || '登录失败' 
      };
    }
  },
  
  register: async (userData) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      set({ user, token, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { 
        success: false, 
        error: error.response?.data || '注册失败' 
      };
    }
  },
  
  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },
  
  updateProfile: async () => {
    try {
      const response = await authAPI.getProfile();
      const user = response.data;
      
      // 只有当用户数据真正发生变化时才更新
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
      }
    } catch (error) {
      console.error('Update profile error:', error);
    }
  },
  
  isAuthenticated: () => {
    const { token } = get();
    return !!token;
  },
}));

export default useAuthStore;