// Маршрут отправки сообщения
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user.id;

    // Сохраняем в базу данных
    const message = await Message.create({
      senderId,
      receiverId,
      text,
      timestamp: new Date()
    });

    // Отправляем через WebSocket получателю
    io.to(receiverId).emit('new_message', message);
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});