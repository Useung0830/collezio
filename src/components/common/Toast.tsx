"use client";

import { ToastContainer } from "react-toastify/unstyled";

export default function Toast() {
  return (
    <ToastContainer
      position="top-center"
      autoClose={6000}
      aria-label="알림"
      hideProgressBar
      toastClassName="text-body-14 text-black-900 break-keep"
    />
  );
}
