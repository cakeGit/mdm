// Test setup file for backend
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.DB_PATH = ':memory:';