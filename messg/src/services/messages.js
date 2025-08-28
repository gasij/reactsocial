import api from './api';

export const messageService = {
  // Получить список пользователей
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Отправить сообщение
  sendMessage: async (receiverId, messageText) => {
    const response = await api.post('/messages/send', {
      receiver_id: receiverId,
      message_text: messageText
    });
    return response.data;
  },

  // Получить историю сообщений
  getConversation: async (otherUserId) => {
    const response = await api.get(`/messages/${otherUserId}`);
    return response.data;
  }
};