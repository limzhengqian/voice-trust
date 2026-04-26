import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.response.use(
  res => res.data,
  err => {
    const message = err.response?.data?.error || 'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export const sendOtp = (phoneNumber) =>
  api.post('/auth/send-otp', { phoneNumber });

export const verifyOtp = (phoneNumber, otp) =>
  api.post('/auth/verify-otp', { phoneNumber, otp });

export const createApplication = (phoneNumber) =>
  api.post('/kyc/application', { phoneNumber });

export const uploadDocument = (applicationId, file) => {
  const form = new FormData();
  form.append('document', file);
  return api.post(`/kyc/application/${applicationId}/document`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
};

export const validatePoa = (applicationId, file) => {
  const form = new FormData();
  form.append('document', file);
  return api.post(`/kyc/application/${applicationId}/poa-validate`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
};

export const uploadSelfie = (applicationId, blob) => {
  const form = new FormData();
  form.append('selfie', blob, 'selfie.jpg');
  return api.post(`/kyc/application/${applicationId}/selfie`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
};

export const finalizeApplication = (applicationId) =>
  api.post(`/kyc/application/${applicationId}/finalize`);

export const getApplication = (applicationId) =>
  api.get(`/kyc/application/${applicationId}`);
