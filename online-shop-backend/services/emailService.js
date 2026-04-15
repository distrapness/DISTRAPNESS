const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
};

const sendOrderConfirmation = async (orderData) => {
    const { email, orderId, cart, total } = orderData;

    // Buat list item HTML
    const itemsHtml = cart.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name} (x${item.qty})</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price * item.qty)}</td>
    </tr>
  `).join('');

    const mailOptions = {
        from: `"Online Shop" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Konfirmasi Pesanan #${orderId}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-w-600px; margin: 0 auto; color: #333;">
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

const sendAdminNotification = async (orderData) => {
    const { orderId, cart, total, email, shippingAddress } = orderData;
    const adminEmail = process.env.EMAIL_USER || 'distrapness@gmail.com';

    const itemsHtml = cart.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name} (x${item.qty})</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price * item.qty)}</td>
    </tr>
  `).join('');

    const mailOptions = {
        from: `"Online Shop Admin" <${process.env.EMAIL_USER}>`,
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

        <p><a href="https://online-shop-beige-one.vercel.app/admin/orders" style="display: inline-block; padding: 10px 20px; background-color: #0275d8; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Buka Dashboard Admin</a></p>
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

module.exports = { sendOrderConfirmation, sendAdminNotification };
