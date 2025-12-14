import React from 'react';

interface DependFieldProps {
  children: React.ReactElement | (() => React.ReactElement);
}

export const DependField: React.FC<DependFieldProps> = ({
  children,
  options,
  name,
}) => {
  if (typeof children === 'function') {
    return children();
  }

  return React.cloneElement(children, {});
};
