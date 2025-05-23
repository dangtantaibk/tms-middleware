export const CACHE_KEYS = {
  USER: 'users:',
  USER_BY_EMAIL: 'users:email:',
  ROLE: 'roles:',
  PERMISSION: 'permissions:',
  AUTH_TOKEN: 'auth:token:',
};

export const CACHE_TTL = {
  USER: 3600, // 1 hour
  ROLE: 3600, // 1 hour
  PERMISSION: 3600, // 1 hour
  AUTH_TOKEN: 86400, // 24 hours
};

// export const KAFKA_TOPICS = {
//   USER_CREATED: 'user.created',
//   USER_UPDATED: 'user.updated',
//   USER_DELETED: 'user.deleted',
//   ROLE_UPDATED: 'role.updated',
// };

export const TCP_PATTERNS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  ROLE_UPDATED: 'role.updated',
};
