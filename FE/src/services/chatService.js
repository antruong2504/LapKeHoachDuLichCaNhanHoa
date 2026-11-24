import api from './api';

export const chatService = {
  // Lấy danh sách nhóm chat của tôi (PB12 - UI_24)
  getMyGroups: async () => {
    return await api.get('/chat/groups');
  },

  // Tạo nhóm chat mới
  createGroup: async (data) => {
    return await api.post('/chat/groups', data);
  },

  // Thêm thành viên vào nhóm
  addMember: async (groupId, payload) => {
    return await api.post(`/chat/groups/${groupId}/members`, payload);
  },

  // Lấy lịch sử tin nhắn của nhóm
  getMessages: async (groupId) => {
    return await api.get(`/chat/groups/${groupId}/messages`);
  },

  // Gửi tin nhắn qua REST (dự phòng khi cần)
  sendMessageRest: async (groupId, noi_dung) => {
    return await api.post(`/chat/groups/${groupId}/messages`, { noi_dung });
  },

  // Tìm kiếm người dùng để mời vào nhóm
  searchUsers: async (search = '') => {
    return await api.get('/chat/users', { params: { search } });
  },
};

export default chatService;
