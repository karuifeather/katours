import axios from 'axios';
import { showAlert } from './alerts';

// type can be either 'password' or 'data
export const updateData = async (data, type) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/${type === 'data' ? 'updateMe' : 'updatePassword'}`,
      data,
    });

    if (res.data.status === 'success') {
      showAlert(
        'success',
        `${type.toUpperCase()} updated! You might need to reload the page to see the changes.`
      );
    }
  } catch (e) {
    showAlert('error', e.response.data.message);
  }
};
