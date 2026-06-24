const axios = require('axios');

/**
 * sendWhatsAppOTP sends the OTP code to the target phone number using Fonnte API Gateway.
 * It formats the phone number to standard international format (e.g. 628xxxxxxxxxx).
 * If FONNTE_TOKEN is not configured, it will simulate a successful send in console.
 * 
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} otp - The generated OTP code.
 * @returns {Promise<boolean>} - Resolves to true if sent successfully or simulated, false otherwise.
 */
async function sendWhatsAppOTP(phoneNumber, otp) {
  const token = process.env.FONNTE_TOKEN ? process.env.FONNTE_TOKEN.replace(/\\n/g, '').replace(/\n/g, '').replace(/["']/g, '').trim() : '';

  // Format phone number to standard international format (starts with 62 for Indonesia)
  let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone.slice(1);
  } else if (!formattedPhone.startsWith('62') && formattedPhone.length > 0) {
    formattedPhone = '62' + formattedPhone;
  }

  const message = `Kode OTP pendaftaran Distrapness Anda adalah: ${otp}. Kode ini berlaku selama 5 menit. Harap tidak membagikan kode ini kepada siapa pun.`;

  // Fallback to local simulation if token is not configured
  if (!token || token === 'your-fonnte-token' || token === '') {
    console.log(`[WHATSAPP SERVICE SIMULATION] Send OTP to ${formattedPhone}: "${message}"`);
    return true; // Return true to allow flow to succeed locally
  }

  try {
    console.log(`[WHATSAPP SERVICE] Sending Fonnte WhatsApp OTP to ${formattedPhone}...`);
    const response = await axios.post('https://api.fonnte.com/send', {
      target: formattedPhone,
      message: message
    }, {
      headers: {
        'Authorization': token
      },
      timeout: 5000 // 5 seconds timeout
    });

    if (response.data && response.data.status === true) {
      console.log(`[WHATSAPP SERVICE] Fonnte success sending to ${formattedPhone}`);
      return true;
    } else {
      console.error(`[WHATSAPP SERVICE] Fonnte API error:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`[WHATSAPP SERVICE] Error sending Fonnte WhatsApp OTP:`, error.message);
    return false;
  }
}

module.exports = { sendWhatsAppOTP };
