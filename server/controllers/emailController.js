
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const { templates } = require('../emailTemplates/templates');

const sendContactUsEmail = (data = {}) => {
  return new Promise((resolve) => {
    const { name, email, message } = data;
    const thankYouMsg = {
      to: 'info@hokela.ca',
      from: 'info@hokela.ca',
      subject: `User email received! (${email})`,
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
      from: 'info@hokela.ca',
      subject: 'Thanks for Contacting Us!',
      text: 'TEST!!!',
      html: templates.thankYouForContactingUs({ first_name: name, message })
    }
  
    sgMail.send(thankYouMsg).then((res) => {
      console.log('THANK YOU EMAIL SENT:', email);
      console.log('res:', res);
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
        console.log('\ndata:', data);
        // const emailRes = await sendContactUsEmail(data);
        // if (emailRes !== true) return resolve(emailRes);
        const thankYouRes = await sendThankYouForContactingUsEmail(data);
        console.log('thankYouRes:', thankYouRes);
        return resolve(thankYouRes);
      }

      console.log('email type does not exist:', type);
      return resolve(`email type does not exist:' ${type}`);
    })
    
  }
}

module.exports = emailController;