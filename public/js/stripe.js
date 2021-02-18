import axios from 'axios';

import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51IM7UvJReELAIWy8mtaakShsCgh8HF2qg3TShtx5wEgOuXdSDrcGpVleGVd4JsOaaG2bOn4owf3a6iGVi8b8PVE400Fy4IbpX4'
  );

  try {
    // 1. Get checkout session from our API
    const { data } = await axios(
      `/api/v1/bookings/check-out-session/${tourId}`
    );

    // Checkout form and charge credit card
    await stripe.redirectToCheckout({ sessionId: data.session.id });
  } catch (e) {
    console.log(e);
    showAlert('error', e);
  }
};
