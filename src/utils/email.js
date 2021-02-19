const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.lastName = user.name.split(' ')[1];
    this.url = url;
    this.from = `${process.env.EMAIL_FROM}`;
  }

  getTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      // Activate in your gmail account "less secure app" if using gmail
    });
  }

  async send(template, subject, type) {
    // 1. Render html based on pug
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
        type,
      }
    );

    // 2. Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    // 3. Create a transpor and send email
    await this.getTransport().sendMail(mailOptions);
  }

  async sendWelcomeEmail() {
    await this.send('welcome', 'Welcome to the gang!', 'promo');
  }

  async sendResetTokenEmail() {
    await this.send(
      'passwordReset',
      'Reset password instructions for your Natours account'
    );
  }

  async sendConfirmEmail() {
    await this.send('emailConfirm', 'Confirm your Natours Account');
  }
};
