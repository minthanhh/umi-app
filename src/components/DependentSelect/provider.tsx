import { DependentSelectContext } from './context';

export const DependentSelectProvider = ({
  children,
}: React.PropsWithChildren) => {
  return (
    <DependentSelectContext.Provider value={null}>
      {children}
    </DependentSelectContext.Provider>
  );
};
