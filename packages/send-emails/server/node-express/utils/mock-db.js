const { v4: uuidv4 } = require('uuid');
const users = [];

const mockDb = {
  findUser: async (id) => {
    return users.find((u) => u.id === id);
  },
  updateUser: async (userId, payload) => {
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) {
      throw new Error('User not found');
    }

    users[idx] = { ...users[idx], ...payload };
    return users[idx];
  },
  createUser: async (payload) => {
    const user = {
      id: uuidv4(),
      ...payload,
    };
    users.push(user);
    return user;
  },
  createOrUpdateUser: async (emailAddress, payload) => {
    const user = await mockDb.findUser(emailAddress);
    if (user) {
      return await mockDb.updateUser(user.id, payload);
    } else {
      return await mockDb.createUser(payload);
    }
  },
};

module.exports = { mockDb };
