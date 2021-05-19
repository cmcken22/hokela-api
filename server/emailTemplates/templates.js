const templates = {
  thankYou: (first_name) => {
    return (
      `
      <div style="width: 100%; background: rgb(248, 248, 248); padding: 20px 0px;">
        <div style="width: 80%; margin: 0 auto; padding-top: 60px; background: white; padding: 40px 30px">
          <div style="height: 75px; width: 100%; margin-bottom: 60px;">
            <div style=" height: 100%; margin: 0 auto; background-image: url('https://storage.googleapis.com/hokela-bucket/companies/hokela%20technologies/logos/hokela_logo_original.png'); background-size: contain; background-position: center; background-repeat: no-repeat;">
            </div>
          </div>
          <h1 style="font-family: open sans,Arial,sans-serif; color: #ff6161; text-align: center;">
            Thank you for your application!
          </h1>

          <br></br>

          <p style="font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 16px;">
            Hi ${first_name},
          </p>
          <p style="font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 16px;">
            Thank you for your interest and desire to volunteer! We will review your application and a representative will
            contact you shortly regarding the next steps.
          </p>
          <p style="font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 16px;">
            In the meantime, feel free to browse our other available positions!
          </p>
          <p style="font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 16px;">
            And as always, if you have any questions or would like to get in touch with us, you may contact us at
            <a href="mailto:info@hokela.ca"
              style="color: #15c; font-family: helvetica,sans-serif; font-size: 16px; font-weight: 700; text-decoration: none;">info@hokela.ca</a>.
          </p>

          <br></br>

          <div style="display: inline-flex; align-items: center; width: 100%;">

            <div
              style="height: 39px; width: 185px; background: #ff6161; margin: auto; border-radius: 100px; display: inline-flex; margin-bottom: 20px;">
              <a href="https://test-hokela.herokuapp.com/causes"
                style="color: #ffffff; font-family: tahoma,sans-serif; font-size: 16px; text-align: center; margin: 0 auto; text-decoration: none; padding-top: 7px;">
                Find more causes
              </a>
            </div>
          </div>

          <br></br>

          <p style="text-align: center; font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 12px;">
            Please do not reply to this email.
          </p>
          <p style="text-align: center; font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 12px;">
            If you have any questions, you may contact us at <a href="mailto:info@hokela.ca"
              style="color: #15c; font-size: 12px; font-weight: 700; text-decoration: none;">info@hokela.ca</a>.
          </p>
          <p style="text-align: center; font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 12px;">
            To view our Terms of Use, click <a href="https://test-hokela.herokuapp.com/terms"
              style="color: #109fff; font-size: 12px; font-weight: 400;">here</a>.
          </p>
          <p style="text-align: center; font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 12px;">
            Toronto, Ontario, Canada
          </p>

          <br></br>

          <p style="text-align: center; font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 12px;">
            <a href="https://test-hokela.herokuapp.com" style="color: #2f2e2c; text-decoration: none;">
              Go to Hokela
            </a>
          </p>
        </div>
      </div>
      `
    );
  },
  followUp: (email, name, contactEmail) => {
    return (
      `
      <p>
        User with email <strong>${email}</strong> has just applied to cause <strong>${name}</strong>!
        <br></br>
        Cause Owner: <strong>${contactEmail}</strong>
      </p>
      `
    )
  }
}

module.exports = { templates };