__webpack_nonce__ = window.NONCE_ID;

import '@babel/polyfill';

import { login, logout, signup } from './auth';
import { updateData } from './updateSettings';
import { displayMap } from './mapbox';
import { bookTour } from './stripe';
import { showAlert, hideAlert } from './alerts';

// DOM Elements
const $closeAlert = document.getElementById('close-error');
const $mapbox = document.getElementById('map');
const $loginForm = document.querySelector('.form--login');
const $signupForm = document.querySelector('.form--signup');
const $logoutButton = document.querySelector('.nav__el--logout');
const $updateMyData = document.querySelector('.form-user-data');

const $updateMyPassword = document.querySelector('.form-user-password');
const $passwordCurrent = document.getElementById('password-current');
const $password = document.getElementById('password');
const $passwordConfirm = document.getElementById('password-confirm');

const $bookTour = document.getElementById('book-tour');

// Values

// Delegation
if ($closeAlert) {
  $closeAlert.addEventListener('click', hideAlert);
}

if ($mapbox) {
  const locations = JSON.parse($mapbox.dataset.locations);

  displayMap(locations);
}

if ($loginForm) {
  $loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    document.getElementById('btn-login').innerHTML = 'Loggin in...';
    await login(email, password);
    document.getElementById('btn-login').innerHTML = 'All done';
  });
}

if ($signupForm) {
  $signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    if (password !== passwordConfirm)
      return showAlert('error', 'Passwords must match.');

    document.getElementById('btn-signup').innerHTML = 'Creating...';
    await signup({ name, email, password, passwordConfirm });
    document.getElementById('btn-signup').innerHTML = 'All done';
  });
}

if ($logoutButton) {
  $logoutButton.addEventListener('click', logout);
}

if ($updateMyData) {
  $updateMyData.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append('email', document.getElementById('email').value);
    form.append('name', document.getElementById('name').value);
    form.append('photo', document.getElementById('photo').files[0]);

    document.querySelector('.btn-save-data').innerHTML = 'Updating...';
    updateData(form, 'data');
    document.querySelector('.btn-save-data').innerHTML = 'Save settings';
  });
}

if ($updateMyPassword) {
  $updateMyPassword.addEventListener('submit', async (e) => {
    e.preventDefault();

    const passwordCurrent = $passwordCurrent.value;
    const password = $password.value;
    const passwordConfirm = $passwordConfirm.value;

    document.querySelector('.btn-save-password').innerHTML = 'Updating...';
    await updateData(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );
    document.querySelector('.btn-save-password').innerHTML = 'Save password';

    $passwordCurrent.value = '';
    $password.value = '';
    $passwordConfirm.value = '';
  });
}

if ($bookTour) {
  $bookTour.addEventListener('click', (e) => {
    const { tourId } = e.target.dataset;

    e.target.textContent = 'Processing...';
    bookTour(tourId);
  });
}

const alert = document.querySelector('body').dataset.alert;

if (alert) showAlert('success', alert, 20);
