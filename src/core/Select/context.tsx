import React from 'react';
import { SelectStore } from './store';

const SelectContext = React.createContext<null>(null);

interface Props extends React.PropsWithChildren {
  initialValues: any;
  config: any;
  adapter: any;
}

export const SelectProvider: React.FC<Props> = ({
  children,
  adapter,
  initialValues,
  config,
}) => {
  const store = React.useMemo(() => {
    return new SelectStore({
      adapter,
      config,
      initialValues,
    });
  }, []);

  return (
    <SelectContext.Provider value={store}>{children}</SelectContext.Provider>
  );
};

export function useSelectStore(): SelectStore {
  const store = React.useContext(SelectContext);
  if (!store)
    throw new Error('useSelectStore must be used within SelectProvider');
  return store;
}
