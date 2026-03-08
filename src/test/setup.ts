import '@testing-library/jest-dom';
// Install all IndexedDB globals (IDBFactory, IDBRequest, IDBKeyRange, etc.)
import 'fake-indexeddb/auto';

// Silence React's act() warnings that leak from async hook tests
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
