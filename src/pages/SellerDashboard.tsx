import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

/** Legacy /seller route → account listings hub */
export default function SellerDashboard() {
  useEffect(() => {}, []);
  return <Navigate to="/account/listings" replace />;
}
