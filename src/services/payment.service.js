export const simulatePayment = () => {
  // 50% success, 50% failure
  return Math.random() < 0.5;
};
