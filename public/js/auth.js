import axios from 'axios';

import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: { email, password },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'You are now logged in successfully!');
      window.setTimeout(() => {
        location.assign('/overview');
      }, 1500);
    }
  } catch (e) {
    showAlert('error', e.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });

    if (res.data.status === 'success') {
      window.setTimeout(() => {
        location.assign('/overview');
      }, 5000);
    }
  } catch (e) {
    showAlert('error', 'Something went wrong! Please try again.');
  }
};

export const signup = async (data) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data,
    });

    if (res.data.status === 'success') {
      showAlert(
        'success',
        'Your account has been created. Check your mail to verify it.'
      );
      window.setTimeout(() => {
        location.assign('/overview');
      }, 1500);
    }
  } catch (e) {
    console.log(e);
    showAlert('error', 'Something went wrong! Please try again.');
  }
};
