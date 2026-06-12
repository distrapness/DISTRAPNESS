const http = require('http');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const app = require('../server');

const TEST_PORT = 5999;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTest() {
  let server;
  let testUserId = null;

  try {
    // 1. Start express server on test port
    console.log(`[TEST] Starting server on port ${TEST_PORT}...`);
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
    console.log(`[TEST] Server running at ${BASE_URL}`);

    // 2. Prepare test user in database
    const email = 'test_reset_flow@distrapness.com';
    const phone = '08999999999';
    const password = 'old_password_123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = 'Test Reset Flow';
    const birthDate = '2000-01-01';

    console.log('[TEST] Creating temporary test user in DB...');
    // Delete if already exists from a previous aborted run
    await pool.promise().query('DELETE FROM users WHERE email = ?', [email]);
    
    await pool.promise().query(
      'INSERT INTO users (email, phone, password, role, birth_date) VALUES (?, ?, ?, ?, ?)',
      [email, phone, hashedPassword, 'customer', birthDate]
    );

    const [rows] = await pool.promise().query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      throw new Error('Failed to create test user in database');
    }
    testUserId = rows[0].id;
    console.log(`[TEST] Temporary test user created with ID: ${testUserId}`);

    // 3. Test Forgot Password - Request OTP (Phone Method for auto-OTP retrieval)
    console.log('[TEST] Testing POST /api/forgot-password (Phone method)...');
    const forgotRes = await axios.post(`${BASE_URL}/api/forgot-password`, {
      identity: phone
    });

    console.log('[TEST] Forgot password response:', forgotRes.data);
    const { token, method, otp_simulated } = forgotRes.data;

    if (method !== 'phone') {
      throw new Error(`Expected method to be 'phone', got: ${method}`);
    }
    if (!otp_simulated) {
      throw new Error('Expected otp_simulated to be present for phone identity');
    }
    if (!token) {
      throw new Error('Expected JWT token to be present');
    }

    console.log(`[TEST] OTP simulated code retrieved: ${otp_simulated}`);

    // 4. Test Verify OTP
    console.log('[TEST] Testing POST /api/verify-otp...');
    const verifyRes = await axios.post(`${BASE_URL}/api/verify-otp`, {
      token,
      code: otp_simulated
    });

    console.log('[TEST] Verify OTP response:', verifyRes.data);
    const { resetToken } = verifyRes.data;
    if (!resetToken) {
      throw new Error('Expected resetToken in verification response');
    }

    // 5. Test Reset Password
    console.log('[TEST] Testing POST /api/reset-password...');
    const newPassword = 'new_password_super_secure';
    const resetRes = await axios.post(`${BASE_URL}/api/reset-password`, {
      resetToken,
      newPassword
    });

    console.log('[TEST] Reset password response:', resetRes.data);
    if (!resetRes.data.success) {
      throw new Error('Expected success: true in reset response');
    }

    // 6. Verify Login with New Password
    // Note: Since login requires recaptchaToken, we need to bypass recaptcha check in test mode.
    // However, wait! Since server.js requires recaptchaToken, let's see: can we login?
    // Wait, let's check if the hashed password in database is updated.
    console.log('[TEST] Verifying password hashing update in DB...');
    const [userRows] = await pool.promise().query('SELECT password FROM users WHERE id = ?', [testUserId]);
    const updatedHashed = userRows[0].password;
    const isNewPasswordValid = await bcrypt.compare(newPassword, updatedHashed);
    if (!isNewPasswordValid) {
      throw new Error('Password was not updated correctly in database');
    }
    console.log('[TEST] Database password hash verified successfully against new password!');

    console.log('✅ ALL TEST PASSED SUCCESSFULLY!');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('Response details:', error.response.data);
    }
    process.exitCode = 1;
  } finally {
    // 7. Cleanup database
    if (testUserId) {
      console.log('[TEST] Cleaning up test user from DB...');
      await pool.promise().query('DELETE FROM users WHERE id = ?', [testUserId]);
      console.log('[TEST] DB Cleanup completed.');
    }

    // 8. Close server
    if (server) {
      console.log('[TEST] Stopping test server...');
      server.close();
    }
    
    // Explicitly exit pool connections
    process.exit(process.exitCode || 0);
  }
}

runTest();
