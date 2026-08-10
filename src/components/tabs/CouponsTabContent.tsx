import React from 'react';
import CouponSection from '../CouponSection';

export const CouponsTabContent: React.FC<any> = (props) => {
  return (
    <CouponSection 
      user={props.user} 
      allowedUids={props.allowedUids} 
      isActive={props.activeCategory === 'coupons'}
    />
  );
};
