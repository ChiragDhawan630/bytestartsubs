const Razorpay = require('razorpay');
const env = require('../config/env');

const getInstance = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys not configured');
  }
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
};

const createPlan = async (planData) => {
  const instance = getInstance();
  const { name, amount, period, interval, description } = planData;

  return await instance.plans.create({
    period: period, // "daily", "weekly", "monthly", "yearly"
    interval: parseInt(interval) || 1,
    item: {
      name: name,
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      description: description,
    },
  });
};

const fetchPlans = async () => {
  const instance = getInstance();
  return await instance.plans.all({ count: 100 });
};

const fetchSubscriptions = async (count = 100) => {
  const instance = getInstance();
  return await instance.subscriptions.all({ count });
};

const fetchSubscription = async (subId) => {
  const instance = getInstance();
  return await instance.subscriptions.fetch(subId);
};

module.exports = {
  getInstance,
  createPlan,
  fetchPlans,
  fetchSubscriptions,
  fetchSubscription,
};
