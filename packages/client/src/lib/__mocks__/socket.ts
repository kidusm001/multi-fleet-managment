// Mock for socket.io client
/* eslint-disable @typescript-eslint/no-explicit-any */

const mockSocket: any = {
  connected: true,
  id: 'mock-socket-id',
  on: jest.fn((event: string, callback: (...args: any[]) => void) => {
    // Immediately call callbacks for testing
    if (event === 'connect') {
      setTimeout(() => callback(), 0);
    }
    return mockSocket;
  }),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};

export const socketClient = {
  connect: jest.fn(() => mockSocket),
  disconnect: jest.fn(),
};

export default socketClient;
