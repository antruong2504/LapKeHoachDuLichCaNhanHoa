import api from './api';

export const reviewService = {
  // Gửi đánh giá 1-5 sao cho địa điểm (PB10 - UI_16)
  createReview: async (data) => {
    return await api.post('/reviews', data);
  },

  // Lấy danh sách đánh giá của 1 địa điểm
  getReviewsByDestination: async (diaDiemId) => {
    return await api.get(`/reviews/destination/${diaDiemId}`);
  },

  // Xóa đánh giá
  deleteReview: async (reviewId) => {
    return await api.delete(`/reviews/${reviewId}`);
  },
};

export default reviewService;
