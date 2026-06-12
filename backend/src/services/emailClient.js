const { Resend } = require('resend');

let resendClient = null;

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(key);
  }

  return resendClient;
}

module.exports = { getResendClient };
