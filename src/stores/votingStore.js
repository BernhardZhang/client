import { create } from 'zustand';
import { votingAPI } from '../services/api';

const useVotingStore = create((set, get) => ({
  votingRounds: [],
  activeRound: null,
  votes: [],
  myVotes: [],
  votesReceived: [],
  evaluations: [],
  isLoading: false,
  
  fetchVotingRounds: async () => {
    set({ isLoading: true });
    try {
      const response = await votingAPI.getVotingRounds();
      // 处理可能的分页格式
      const rounds = response.data.results || response.data || [];
      set({ votingRounds: Array.isArray(rounds) ? rounds : [], isLoading: false });
    } catch (error) {
      console.error('Fetch voting rounds error:', error);
      set({ votingRounds: [], isLoading: false });
    }
  },
  
  fetchActiveRound: async () => {
    try {
      const response = await votingAPI.getActiveRound();
      set({ activeRound: response.data });
    } catch (error) {
      console.error('Fetch active round error:', error);
      set({ activeRound: null });
    }
  },
  
  fetchVotes: async (votingRound) => {
    set({ isLoading: true });
    try {
      const response = await votingAPI.getVotes(votingRound);
      // 处理可能的分页格式
      const votes = response.data.results || response.data || [];
      set({ votes: Array.isArray(votes) ? votes : [], isLoading: false });
    } catch (error) {
      console.error('Fetch votes error:', error);
      set({ votes: [], isLoading: false });
    }
  },
  
  fetchMyVotes: async (votingRound) => {
    try {
      const response = await votingAPI.getMyVotes(votingRound);
      set({ myVotes: Array.isArray(response.data) ? response.data : [] });
    } catch (error) {
      console.error('Fetch my votes error:', error);
      set({ myVotes: [] });
    }
  },
  
  fetchVotesReceived: async (votingRound) => {
    try {
      const response = await votingAPI.getVotesReceived(votingRound);
      set({ votesReceived: Array.isArray(response.data) ? response.data : [] });
    } catch (error) {
      console.error('Fetch votes received error:', error);
      set({ votesReceived: [] });
    }
  },
  
  createVote: async (voteData) => {
    try {
      const response = await votingAPI.createVote(voteData);
      // Refresh votes data
      if (voteData.voting_round) {
        get().fetchMyVotes(voteData.voting_round);
        get().fetchVotes(voteData.voting_round);
      }
      return { success: true, vote: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || '投票失败' 
      };
    }
  },
  
  fetchEvaluations: async (votingRound) => {
    try {
      const response = await votingAPI.getEvaluations(votingRound);
      // 处理可能的分页格式
      const evaluations = response.data.results || response.data || [];
      set({ evaluations: Array.isArray(evaluations) ? evaluations : [] });
    } catch (error) {
      console.error('Fetch evaluations error:', error);
      set({ evaluations: [] });
    }
  },
  
  createEvaluation: async (evaluationData) => {
    try {
      const response = await votingAPI.createEvaluation(evaluationData);
      // Refresh evaluations
      if (evaluationData.voting_round) {
        get().fetchEvaluations(evaluationData.voting_round);
      }
      return { success: true, evaluation: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || '评价失败' 
      };
    }
  },
  
  // 编辑投票
  updateVote: async (voteId, voteData) => {
    try {
      const response = await votingAPI.updateVote(voteId, voteData);
      // Refresh votes data
      if (voteData.voting_round) {
        get().fetchMyVotes(voteData.voting_round);
        get().fetchVotes(voteData.voting_round);
      }
      return { success: true, vote: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || '修改投票失败' 
      };
    }
  },
  
  // 删除投票
  deleteVote: async (voteId, votingRound) => {
    try {
      await votingAPI.deleteVote(voteId);
      // Refresh votes data
      if (votingRound) {
        get().fetchMyVotes(votingRound);
        get().fetchVotes(votingRound);
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || '删除投票失败' 
      };
    }
  },
  
  // 编辑评价
  updateEvaluation: async (evaluationId, evaluationData) => {
    try {
      const response = await votingAPI.updateEvaluation(evaluationId, evaluationData);
      // Refresh evaluations
      if (evaluationData.voting_round) {
        get().fetchEvaluations(evaluationData.voting_round);
      }
      return { success: true, evaluation: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || '修改评价失败' 
      };
    }
  },
  
  // 删除评价
  deleteEvaluation: async (evaluationId, votingRound) => {
    try {
      await votingAPI.deleteEvaluation(evaluationId);
      // Refresh evaluations
      if (votingRound) {
        get().fetchEvaluations(votingRound);
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || '删除评价失败' 
      };
    }
  },
  
  // 获取自评列表
  selfEvaluations: [],
  fetchSelfEvaluations: async (votingRound) => {
    try {
      const response = await votingAPI.getSelfEvaluations(votingRound);
      const selfEvaluations = response.data.results || response.data || [];
      set({ selfEvaluations: Array.isArray(selfEvaluations) ? selfEvaluations : [] });
    } catch (error) {
      console.error('Fetch self evaluations error:', error);
      set({ selfEvaluations: [] });
    }
  },
  
  // 创建自评
  createSelfEvaluation: async (evaluationData) => {
    try {
      const response = await votingAPI.createSelfEvaluation(evaluationData);
      // Refresh self evaluations
      if (evaluationData.voting_round) {
        get().fetchSelfEvaluations(evaluationData.voting_round);
      }
      return { success: true, evaluation: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || '自评失败' 
      };
    }
  },
  
  // 编辑自评
  updateSelfEvaluation: async (evaluationId, evaluationData) => {
    try {
      const response = await votingAPI.updateSelfEvaluation(evaluationId, evaluationData);
      // Refresh self evaluations
      if (evaluationData.voting_round) {
        get().fetchSelfEvaluations(evaluationData.voting_round);
      }
      return { success: true, evaluation: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || '修改自评失败' 
      };
    }
  },
  
  // 删除自评
  deleteSelfEvaluation: async (evaluationId, votingRound) => {
    try {
      await votingAPI.deleteSelfEvaluation(evaluationId);
      // Refresh self evaluations
      if (votingRound) {
        get().fetchSelfEvaluations(votingRound);
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || '删除自评失败' 
      };
    }
  },
}));

export default useVotingStore;