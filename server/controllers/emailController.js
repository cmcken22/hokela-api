
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const { templates } = require('../emailTemplates/templates');

const sendContactUsEmail = (data = {}) => {
  return new Promise((resolve) => {
    const { name, email, message } = data;
    const thankYouMsg = {
      // TODO: replace with our info email
      to: 'conner.mckenna@hokela.ca',
      from: 'conner.mckenna@hokela.ca',
      subject: 'User email received!',
      text: 'TEST!!!',
      html: templates.contactUs({ first_name: name, email, message })
    }
  
    sgMail.send(thankYouMsg).then(() => {
      console.log('CONTACT US EMAIL SENT:', email);
      return resolve(true);
    })
    .catch(err => {
      console.log('CONTACT US EMAIL ERR:', email);
      console.log('err:', err);
      return resolve(err);
    });
  })
}

const sendThankYouForContactingUsEmail = (data = {}) => {
  return new Promise((resolve) => {
    const { name, email, message } = data;
    const thankYouMsg = {
      to: email,
      from: 'conner.mckenna@hokela.ca',
      subject: 'Thanks for Contacting Us!',
      text: 'TEST!!!',
      html: templates.thankYouForContactingUs({ first_name: name, message })
    }
  
    sgMail.send(thankYouMsg).then(() => {
      console.log('THANK YOU EMAIL SENT:', email);
      return resolve(true);
    })
    .catch(err => {
      console.log('THANK YOU EMAIL ERR:', email);
      console.log('err:', err);
      return resolve(err);
    });
  })
}

const emailController = {
  sendEmail: (type, data = {}) => {
    return new Promise(async (resolve) => {
  
      if (type === 'contact-us') {
        const emailRes = await sendContactUsEmail(data);
        if (emailRes !== true) return resolve(emailRes);
        const thankYouRes = await sendThankYouForContactingUsEmail(data);
        return resolve(thankYouRes);
      }

      console.log('email type does not exist:', type);
      return resolve(`email type does not exist:' ${type}`);
    })
    
  }
}

module.exports = emailController;