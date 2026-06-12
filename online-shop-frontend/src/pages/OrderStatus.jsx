import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OrderStatus = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/profile", { replace: true });
  }, [navigate]);

  return null;
};

export default OrderStatus;
