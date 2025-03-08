const mockStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
};

export class MMKVLoader {
  initialize() {
    return mockStorage;
  }
}

export default mockStorage; 