const create = (createState) => {
  const store = {
    getState: jest.fn(),
    setState: jest.fn(),
    subscribe: jest.fn(),
    destroy: jest.fn(),
  };
  
  const initialState = typeof createState === 'function' 
    ? createState(() => {}, () => store)
    : createState;

  store.getState.mockImplementation(() => initialState);
  
  return () => store;
};

const createStore = (createState) => {
  const store = create(createState)();
  return store;
};

export { create, createStore };

export default { create, createStore }; 