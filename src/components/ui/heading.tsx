import React from "react";

type HeadingTypes = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

const getClassName = (as: HeadingTypes) => {
  switch (as) {
    case 'h1':
      return 'text-3xl font-bold tracking-tight text-gray-900 dark:text-white';
    case 'h2':
      return 'text-2xl font-semibold tracking-tight text-gray-900 dark:text-white';
    case 'h3':
      return 'text-xl font-medium tracking-tight text-gray-900 dark:text-white';
    case 'h4':
      return 'text-lg font-medium tracking-tight text-gray-900 dark:text-white';
    case 'h5':
      return 'text-base font-medium tracking-tight text-gray-900 dark:text-white';
    case 'h6':
      return 'text-sm font-medium tracking-tight text-gray-900 dark:text-white';
    default:
      return '';
  }
}

  export const Heading = ({
    as = 'h1',
    children,
  }: React.PropsWithChildren<{
    as?: HeadingTypes
  }>) => {
    const Component = as;
    return (
      <Component className={getClassName(as)}>
        {children}
      </Component>
    );
  }