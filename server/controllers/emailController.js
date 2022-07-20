
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const { templates } = require('../emailTemplates/templates');
const ToggleModel = require('../models/toggleModel');
const { getToggleState, getEmailRecipient } = require('../util/helpers');

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
      return resolve(false);
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
      return resolve(false);
    });
  })
}

const sendUserApplicationResult = (data = {}) => {
  return new Promise(async (resolve) => {
    const {
      cause_id,
      first_name,
      last_name,
      email,
      phone,
      age_group,
      location,
      position,
      organization,
      additional_info
    } = data;

    const recipient = await getEmailRecipient(email);

    const thankYouMsg = {
      to: recipient,
      from: 'info@hokela.ca',
      subject: 'Thanks for Your Application!',
      text: 'TEST!!!',
      html: templates.userApplicationResult({
        cause_id,
        first_name,
        last_name,
        email,
        phone,
        age_group,
        location,
        position,
        organization,
        additional_info: !!additional_info ? additional_info : 'N/A'
      })
    };

    sgMail.send(thankYouMsg).then((res) => {
      console.log('THANK YOU EMAIL SENT:', email);
      console.log('res:', res);
      return resolve(true);
    })
    .catch(err => {
      console.log('THANK YOU EMAIL ERR:', email);
      console.log('err:', err);
      return resolve(false);
    });
  });
}

const sendApplicationToOrg = (data = {}) => {
  return new Promise(async (resolve) => {
    const {
      cause_id,
      contact_name,
      contact_email,
      first_name,
      last_name,
      email,
      phone,
      age_group,
      location,
      position,
      organization,
      additional_info
    } = data;

    const recipient = await getEmailRecipient(contact_email);

    const thankYouMsg = {
      to: recipient,
      from: 'info@hokela.ca',
      subject: 'Application Received!',
      text: 'TEST!!!',
      html: templates.sendApplicationToOrg({
        cause_id,
        contact_name,
        first_name,
        last_name,
        email,
        phone,
        age_group,
        location,
        position,
        organization,
        additional_info: !!additional_info ? additional_info : 'N/A'
      })
    };

    sgMail.send(thankYouMsg).then((res) => {
      console.log('THANK YOU EMAIL SENT:', email);
      console.log('res:', res);
      return resolve(true);
    })
    .catch(err => {
      console.log('THANK YOU EMAIL ERR:', email);
      console.log('err:', err);
      return resolve(false);
    });
  });
}

const sendApplicationToHokela = (data = {}) => {
  return new Promise(async (resolve) => {
    const {
      cause_id,
      contact_name,
      contact_email,
      contact_phone,
      first_name,
      last_name,
      email,
      phone,
      age_group,
      location,
      position,
      organization,
      application_count,
      additional_info
    } = data;

    const recipient = await getEmailRecipient('mathieu.mackay@hokela.ca');

    const thankYouMsg = {
      to: recipient,
      from: 'info@hokela.ca',
      subject: 'User Application Received!',
      text: 'TEST!!!',
      html: templates.sendApplicationToHokela({
        cause_id,
        contact_name,
        contact_email,
        contact_phone,
        first_name,
        last_name,
        email,
        phone,
        age_group,
        location,
        position,
        organization,
        application_count,
        additional_info: !!additional_info ? additional_info : 'N/A'
      })
    };

    sgMail.send(thankYouMsg).then((res) => {
      console.log('THANK YOU EMAIL SENT:', email);
      console.log('res:', res);
      return resolve(true);
    })
    .catch(err => {
      console.log('THANK YOU EMAIL ERR:', email);
      console.log('err:', err);
      return resolve(false);
    });
  });
}

const emailController = {
  sendEmail: (type, data = {}) => {
    return new Promise(async (resolve) => {
      console.log('\nemailController data:', data);

      if (type === 'contact-us') {
        const emailRes = await sendContactUsEmail(data);
        const thankYouRes = await sendThankYouForContactingUsEmail(data);
        return resolve(emailRes && thankYouRes);
      }
      if (type === 'user-application') {
        const sendOrgEmail = await getToggleState('send_email_to_org');
        const userApplicationResult = await sendUserApplicationResult(data);
        const applicationToOrg = sendOrgEmail ? await sendApplicationToOrg(data) : true;
        const applicationToHokela = await sendApplicationToHokela(data);
        return resolve(userApplicationResult && applicationToOrg && applicationToHokela);
      }

      console.log('email type does not exist:', type);
      return resolve(`email type does not exist:' ${type}`);
    })
    
  }
}

module.exports = emailController;