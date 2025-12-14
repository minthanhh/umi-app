import React from 'react';
import { useDependentField } from '../hooks/useDependentField';

interface Props {
  fieldName: string;
  dependsOn: string | string[];
  children: React.ReactNode | (() => React.ReactNode);
  onDependencyChange: (value: any) => void;
  options: any[]
}

export const SelectDependent: React.FC<Props> = ({ options, fieldName, dependsOn, onDependencyChange, children }) => {
  const value = useDependentField({ fieldName, dependsOn, onDependencyChange });

  if (typeof children === 'function') {
    return children();
  }

  return React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        value,
      });
    }
    return child;
  });
};
