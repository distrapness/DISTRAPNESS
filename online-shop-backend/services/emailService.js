const nodemailer = require('nodemailer');
const pool = require('../db');

const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/\\n/g, '').replace(/\n/g, '').replace(/["']/g, '').trim() : '';
const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\\n/g, '').replace(/\n/g, '').replace(/["']/g, '').trim() : '';

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

// Guard sendMail to prevent "Missing credentials for PLAIN" when EMAIL_USER or EMAIL_PASS are not configured
const originalSendMail = transporter.sendMail.bind(transporter);
transporter.sendMail = async function (mailOptions, callback) {
  if (!emailUser || !emailPass || emailUser === 'your-email@gmail.com' || emailPass === 'your-app-password') {
    console.log(`[EMAIL SERVICE] Email sending bypassed (credentials not configured). Subject: "${mailOptions.subject}"`);
    if (callback) {
      callback(null, { messageId: 'bypassed' });
    }
    return { messageId: 'bypassed' };
  }
  return originalSendMail(mailOptions, callback);
};

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
    messageBody = `Pesanan Anda telah dikirim. ${trackingNumber ? 'Nomor Resi: ' + trackingNumber : ''}`;
  } else if (status === 'processing') {
    statusText = 'Diproses';
    messageBody = `Pesanan Anda sedang diproses oleh admin.`;
  } else if (status === 'delivered') {
    statusText = 'Diterima';
    messageBody = `Pesanan Anda telah sampai di tujuan.`;
  } else if (status === 'completed') {
    statusText = 'Selesai';
    messageBody = `Transaksi pesanan Anda telah selesai. Terima kasih telah berbelanja!`;
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

const sendShippingReceiptEmail = async (orderData) => {
  if (!emailUser || !emailPass) {
    console.log("Email disabled: EMAIL_USER or EMAIL_PASS not set");
    return false;
  }

  const { email, orderId, trackingNumber, courier, cart, total, shippingAddress } = orderData;

  const itemsHtml = cart.map(item => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: left;">
        <span style="font-weight: bold; color: #000; font-size: 14px;">${item.name}</span>
        ${item.selectedSize ? `<br/><span style="font-size: 11px; color: #888; text-transform: uppercase;">Ukuran: ${item.selectedSize}</span>` : ''}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center; color: #666; font-size: 13px;">x${item.qty}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #000; font-size: 14px;">${formatCurrency(item.price * item.qty)}</td>
    </tr>
  `).join('');

  // Generate tracking link based on courier
  let trackingUrl = `https://online-shop-beige-one.vercel.app/order-tracking?orderId=${orderId}`;
  const courierLower = String(courier).toLowerCase();
  if (courierLower.includes('jne')) {
    trackingUrl = `https://www.jne.co.id/id/tracking/trace`;
  } else if (courierLower.includes('pos')) {
    trackingUrl = `https://www.posindonesia.co.id/id/tracking`;
  } else if (courierLower.includes('tiki')) {
    trackingUrl = `https://www.tiki.id/id/tracking`;
  }

  const mailOptions = {
    from: `"Distrapness Shipping" <${emailUser}>`,
    to: email,
    subject: `📦 Pesanan #${orderId} Sedang Dikirim - Resi Pengiriman`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #efefef; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background-color: #000; color: #fff; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; letter-spacing: 4px; font-weight: 900;">DISTRAPNESS</h1>
          <p style="margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #888;">Order Shipped & Tracking Info</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px; color: #333; line-height: 1.6;">
          <h2 style="color: #000; font-size: 20px; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Pesanan Anda Sedang Menuju ke Alamat Tujuan!</h2>
          <p style="font-size: 14px;">Halo,</p>
          <p style="font-size: 14px; color: #555;">Kabar baik! Paket Anda dari Distrapness telah kami serahkan ke kurir dan sedang dalam proses pengiriman. Berikut adalah informasi pelacakan untuk kiriman Anda:</p>
          
          <!-- Tracking Info Box -->
          <div style="background-color: #f9f9f9; border-left: 4px solid #000; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; font-size: 13px; color: #666; width: 130px;"><strong>ID Pesanan:</strong></td>
                <td style="padding: 4px 0; font-size: 13px; color: #000;">#${orderId}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-size: 13px; color: #666;"><strong>Ekspedisi / Kurir:</strong></td>
                <td style="padding: 4px 0; font-size: 13px; color: #000; text-transform: uppercase;"><strong>${courier}</strong></td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-size: 13px; color: #666;"><strong>Nomor Resi:</strong></td>
                <td style="padding: 4px 0; font-size: 14px; color: #d9534f; font-weight: bold; letter-spacing: 1px;">${trackingNumber || '-'}</td>
              </tr>
            </table>
          </div>

          <!-- Lacak Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #000; color: #fff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">Lacak Paket Anda</a>
          </div>

          <!-- Shipping Address -->
          <h3 style="color: #000; font-size: 15px; margin-top: 30px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Alamat Pengiriman</h3>
          <div style="font-size: 13px; color: #555; background-color: #fcfcfc; padding: 15px; border: 1px solid #f0f0f0; border-radius: 6px;">
            <p style="margin: 0 0 5px 0; font-weight: bold; color: #000;">${shippingAddress?.fullName || shippingAddress?.name || '-'}</p>
            <p style="margin: 0 0 5px 0;">${shippingAddress?.phone || '-'}</p>
            <p style="margin: 0; line-height: 1.4; font-style: italic;">
              ${shippingAddress?.address || '-'}, ${shippingAddress?.area || shippingAddress?.district || '-'}, ${shippingAddress?.city || '-'}, ${shippingAddress?.province || '-'}, ${shippingAddress?.postalCode || shippingAddress?.postal_code || '-'}
            </p>
          </div>

          <!-- Item Details -->
          <h3 style="color: #000; font-size: 15px; margin-top: 35px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Rincian Barang</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px 8px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase;">Produk</th>
                <th style="padding: 10px 8px; text-align: center; font-size: 12px; color: #666; text-transform: uppercase;">Jumlah</th>
                <th style="padding: 10px 8px; text-align: right; font-size: 12px; color: #666; text-transform: uppercase;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 15px 8px 5px 8px; font-weight: bold; text-align: right; font-size: 14px; color: #666;">TOTAL PEMBAYARAN</td>
                <td style="padding: 15px 8px 5px 8px; font-weight: bold; text-align: right; font-size: 16px; color: #000;">${formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>

          <p style="font-size: 13px; color: #777; margin-top: 40px; text-align: center; border-top: 1px solid #eee; pt: 20px;">
            Jika Anda memiliki pertanyaan tentang kiriman ini, silakan hubungi tim support kami.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f4f4f4; padding: 25px 20px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee;">
          <p style="margin: 0 0 5px 0;">&copy; 2026 Distrapness. All Rights Reserved.</p>
          <p style="margin: 0; font-size: 10px; color: #aaa;">Jalan Pakaian Minimalis No. 1, Indonesia</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Shipping receipt email sent to ${email} for order #${orderId}: ` + info.response);
    return true;
  } catch (error) {
    console.error('Error sending shipping receipt email:', error);
    return false;
  }
};

const sendPasswordResetOTP = async (userEmail, otpCode) => {
  if (!emailUser || !emailPass) {
    console.log("Email disabled: EMAIL_USER or EMAIL_PASS not set");
    return false;
  }

  const mailOptions = {
    from: `"Distrapness Support" <${emailUser}>`,
    to: userEmail,
    subject: `Kode Verifikasi Lupa Sandi - ${otpCode}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #efefef; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #000; color: #fff; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 900;">DISTRAPNESS</h1>
          <p style="margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1px;">Security Verification</p>
        </div>
        <div style="padding: 40px 30px; text-align: center; color: #333;">
          <h2 style="color: #000; margin-top: 0; font-size: 18px;">Verifikasi Reset Sandi</h2>
          <p style="font-size: 14px; color: #666; line-height: 1.5;">Gunakan kode OTP di bawah ini untuk memverifikasi permintaan reset kata sandi akun Anda. Kode ini berlaku selama 10 menit.</p>
          
          <div style="margin: 30px 0; background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px dashed #ddd; display: inline-block;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #000;">${otpCode}</span>
          </div>

          <p style="font-size: 11px; color: #999; margin-top: 20px;">Jika Anda tidak merasa mengajukan permintaan ini, silakan abaikan email ini secara aman.</p>
        </div>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #888; font-size: 11px;">
          <p>&copy; 2026 Distrapness. All Rights Reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

const sendLowStockNotification = async (product) => {
  if (!emailUser || !emailPass) {
    console.log("Email disabled: EMAIL_USER or EMAIL_PASS not set");
    return false;
  }
  
  const mailOptions = {
    from: `"Distrapness Inventory" <${emailUser}>`,
    to: emailUser,
    subject: `⚠️ PERINGATAN STOK MENIPIS: ${product.name}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #efefef; border-radius: 10px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #000; color: #fff; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h2 style="margin: 0; font-size: 20px; color: #ff4d4d; letter-spacing: 2px;">⚠️ PERINGATAN INVENTARIS</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #eee; border-top: none; border-radius: 0 0 5px 5px;">
          <p>Halo Admin,</p>
          <p>Produk berikut telah mencapai batas minimum stok (di bawah 5 item):</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd; width: 180px;">Nama Produk</th>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>${product.name}</strong></td>
            </tr>
            <tr>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Sisa Stok Global</th>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #ff4d4d; font-weight: bold; font-size: 16px;">${product.stock}</td>
            </tr>
            ${product.sizesInfo ? `
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Detail per Ukuran</th>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-family: monospace;">${product.sizesInfo}</td>
            </tr>
            ` : ''}
          </table>
          <p style="margin-top: 25px;">Mohon segera melakukan pengisian ulang stok agar tidak kehilangan potensi penjualan.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://online-shop-beige-one.vercel.app/product-admin" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Kelola Produk</a>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Low stock notification email sent for product ${product.name} (stock: ${product.stock})`);
    return true;
  } catch (error) {
    console.error('Error sending low stock notification email:', error);
    return false;
  }
};

const checkAndNotifyLowStock = async (productId) => {
  try {
    const [rows] = await pool.promise().query('SELECT name, stock, sizes FROM products WHERE id = ?', [productId]);
    if (rows.length === 0) return;
    const product = rows[0];
    if (product.stock < 5) {
      let sizesInfo = "";
      if (product.sizes) {
        try {
          const sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
          sizesInfo = Object.entries(sizes).map(([sz, qty]) => `${sz.toUpperCase()}: ${qty}`).join(', ');
        } catch(e){}
      }
      await sendLowStockNotification({
        name: product.name,
        stock: product.stock,
        sizesInfo
      });
    }
  } catch (err) {
    console.error("Error in checkAndNotifyLowStock:", err.message);
  }
};

const sendRegistrationOTP = async (userEmail, otpCode) => {
  if (!emailUser || !emailPass) {
    console.log("Email disabled: EMAIL_USER or EMAIL_PASS not set");
    return false;
  }

  const mailOptions = {
    from: `"Distrapness" <${emailUser}>`,
    to: userEmail,
    subject: `Kode Verifikasi Pendaftaran Anda - ${otpCode}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #efefef; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #000; color: #fff; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 900;">DISTRAPNESS</h1>
          <p style="margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1px;">Email Verification</p>
        </div>
        <div style="padding: 40px 30px; text-align: center; color: #333;">
          <h2 style="color: #000; margin-top: 0; font-size: 18px;">Verifikasi Akun Baru</h2>
          <p style="font-size: 14px; color: #666; line-height: 1.5;">Gunakan kode OTP di bawah ini untuk memverifikasi pendaftaran akun baru Anda. Kode ini berlaku selama 5 menit.</p>
          
          <div style="margin: 30px 0; background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px dashed #ddd; display: inline-block;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #000;">${otpCode}</span>
          </div>

          <p style="font-size: 11px; color: #999; margin-top: 20px;">Jika Anda tidak merasa melakukan pendaftaran ini, silakan abaikan email ini secara aman.</p>
        </div>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #888; font-size: 11px;">
          <p>&copy; 2026 Distrapness. All Rights Reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Registration OTP email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending registration OTP email:', error);
    return false;
  }
};

module.exports = {
  sendOrderConfirmation,
  sendAdminNotification,
  sendStatusUpdateEmail,
  sendRegistrationWelcome,
  sendContactNotification,
  sendShippingReceiptEmail,
  sendPasswordResetOTP,
  checkAndNotifyLowStock,
  sendRegistrationOTP
};
