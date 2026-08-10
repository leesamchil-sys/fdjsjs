import React from 'react';
import EncyclopediaSection from '../EncyclopediaSection';

export interface EncyclopediaTabContentProps {
  [key: string]: any;
}

export const EncyclopediaTabContent: React.FC<EncyclopediaTabContentProps> = (props) => {
  return <EncyclopediaSection {...props} />;
};
