const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/\\n/g, '').trim() : '';
const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\\n/g, '').trim() : '';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  connectionTimeout: 5000,
  socketTimeout: 5000,
  greetingTimeout: 5000
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
};

const sendOrderConfirmation = async (orderData) => {
  if (!emailUser || !emailPass) {
    console.log("Email disabled: EMAIL_USER or EMAIL_PASS not set");
    return false;
  }

  const { email, orderId, cart, total } = orderData;

  // Buat list item HTML
  const itemsHtml = cart.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name} (x${item.qty})</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price * item.qty)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"Online Shop" <${emailUser}>`,
    to: email,
    subject: `Konfirmasi Pesanan #${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #000;">Terima Kasih atas Pesanan Anda!</h2>
        <p>Halo,</p>
        <p>Pesanan Anda dengan ID <strong>#${orderId}</strong> telah kami terima dan sedang diproses.</p>
        
        <h3>Detail Pesanan:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Produk</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Harga</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 8px; font-weight: bold;">TOTAL</td>
              <td style="padding: 8px; font-weight: bold; text-align: right;">${formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>

        <p>Kami akan segera mengirimkan nomor resi setelah barang dikirim.</p>
        <br/>
        <p>Salam hangat,<br/>Tim Online Shop</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const sendStatusUpdateEmail = async (orderData) => {
  if (!emailUser || !emailPass) {
    console.log("Email disabled: EMAIL_USER or EMAIL_PASS not set");
    return false;
  }

  const { email, orderId, status, trackingNumber } = orderData;

  let statusText = status;
  let messageBody = `Status pesanan Anda telah diperbarui menjadi <strong>${status}</strong>.`;

  if (status === 'shipped') {
    statusText = 'Dikirim';
    messageBody = `Pesanan Anda telah dikirim! <br/> Nomor Resi: <strong>${trackingNumber || '-'}</strong>`;
  } else if (status === 'paid') {
    statusText = 'Lunas';
    messageBody = `Pembayaran Anda telah kami terima. Pesanan sedang disiapkan untuk dikirim.`;
  } else if (status === 'cancelled') {
    statusText = 'Dibatalkan';
    messageBody = `Pesanan Anda telah dibatalkan. Jika ini kesalahan, silakan hubungi kami.`;
  }

  const mailOptions = {
    from: `"Distrapness Support" <${emailUser}>`,
    to: email,
    subject: `Update Pesanan #${orderId} - ${statusText}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #efefef; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">DISTRAPNESS</h1>
        </div>
        <div style="padding: 30px; color: #333; line-height: 1.6;">
          <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">Update Pesanan</h2>
          <p>Halo,</p>
          <p style="font-size: 16px;">${messageBody}</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>ID Pesanan:</strong> #${orderId}</p>
            <p style="margin: 5px 0 0 0;"><strong>Status:</strong> ${statusText}</p>
          </div>

          <p>Anda dapat memantau detail pesanan melalui halaman profil Anda di situs kami.</p>
          <a href="https://online-shop-beige-one.vercel.app/profile" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Cek Pesanan Saya</a>
        </div>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #888; font-size: 12px;">
          <p>&copy; 2026 Distrapness. All Rights Reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Status update email sent to ${email} for order #${orderId}`);
    return true;
  } catch (error) {
    console.error('Error sending status update email:', error);
    return false;
  }
};

const sendRegistrationWelcome = async (userEmail) => {
  const mailOptions = {
    from: `"Distrapness" <${emailUser}>`,
    to: userEmail,
    subject: `Selamat Datang di Distrapness!`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #efefef; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #000; color: #fff; padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 4px;">WELCOME</h1>
          <p style="margin-top: 10px; opacity: 0.8;">Thank you for joining us.</p>
        </div>
        <div style="padding: 40px; text-align: center; color: #333;">
          <h2 style="color: #000; margin-bottom: 20px;">Halo ${userEmail.split('@')[0]}!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Akun Anda telah berhasil dibuat. Nikmati pengalaman belanja pakaian berkualitas dengan desain minimalis namun berkarakter hanya di Distrapness.</p>
          
          <div style="margin: 30px 0;">
            <a href="https://online-shop-beige-one.vercel.app/shop" style="display: inline-block; background-color: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Mulai Belanja</a>
          </div>

          <p style="font-size: 14px; color: #666;">Gunakan kode promo <strong style="color: #000;">WELCOME10</strong> untuk diskon 10% pada pembelian pertama Anda.</p>
        </div>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #888; font-size: 12px;">
          <p>&copy; 2026 Distrapness. All Rights Reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to: ' + userEmail);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

const sendContactNotification = async (contactData) => {
  const { name, email, message } = contactData;
  const adminEmail = emailUser;

  const mailOptions = {
    from: `"Distrapness Contact" <${emailUser}>`,
    to: adminEmail,
    replyTo: email,
    subject: `📩 Pesan Baru dari ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #000; border-bottom: 2px solid #333; padding-bottom: 10px;">Pesan Kontak Baru</h2>
        <p><strong>Nama:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 15px; border-left: 4px solid #000;">
          <p><strong>Pesan:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending contact email:', error);
    return false;
  }
};

const sendAdminNotification = async (orderData) => {
  if (!emailUser || !emailPass) {
    console.log("Email disabled: EMAIL_USER or EMAIL_PASS not set");
    return false;
  }

  const { orderId, cart, total, email, shippingAddress } = orderData;
  const adminEmail = emailUser || 'distrapness@gmail.com';

  const itemsHtml = cart.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name} (x${item.qty})</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price * item.qty)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"Online Shop Admin" <${emailUser}>`,
    to: adminEmail,
    subject: `🚨 PESANAN BARU MASUK! - #${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #d9534f;">PESANAN BARU! (ID: #${orderId})</h2>
        <p>Halo Admin,</p>
        <p>Ada pesanan baru masuk dari <strong>${email || 'Guest'}</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="margin-top: 0;">Info Pengiriman:</h3>
          <p><strong>Nama:</strong> ${shippingAddress?.fullName || '-'}</p>
          <p><strong>No. HP:</strong> ${shippingAddress?.phone || '-'}</p>
          <p><strong>Alamat:</strong> ${shippingAddress?.address || '-'}, ${shippingAddress?.city || '-'}</p>
          <p><strong>Metode Pembayaran:</strong> ${orderData.paymentMethod || '-'}</p>
        </div>

        <h3>Detail Pesanan:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Produk</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Harga</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 8px; font-weight: bold;">TOTAL</td>
              <td style="padding: 8px; font-weight: bold; text-align: right; color: #d9534f;">${formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>

        <p><a href="https://online-shop-beige-one.vercel.app/admin/orders" style="display: inline-block; padding: 10px 20px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Buka Dashboard Admin</a></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Admin notification sent for order #' + orderId);
    return true;
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return false;
  }
};

module.exports = {
  sendOrderConfirmation,
  sendAdminNotification,
  sendStatusUpdateEmail,
  sendRegistrationWelcome,
  sendContactNotification
};
