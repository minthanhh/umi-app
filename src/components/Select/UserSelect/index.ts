// Main component export
export { default as UserSelect, default } from './UserSelect';

// Type exports for consumers
export type {
  FetchStrategy,
  User,
  UserSelectProps,
  UserSelectValue,
} from './types';

// Hook exports for advanced usage / composition
export {
  useDropdownState,
  useMergedOptions,
  useNormalizedInput,
  useUserDataSource,
  useUserHydration,
  useUserList,
} from './hooks';

// Component exports for customization
export {
  DefaultTag,
  LoadingFooter,
  LoadingTag,
  UserDropdownItem,
  UserSelectedItem,
} from './components';
