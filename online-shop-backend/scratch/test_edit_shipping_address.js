const http = require('http');
const axios = require('axios');
const pool = require('../db');
const app = require('../server');

const TEST_PORT = 5998;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTest() {
  let server;
  let testOrderId = null;

  try {
    // 1. Start express server on test port
    console.log(`[TEST] Starting server on port ${TEST_PORT}...`);
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
    console.log(`[TEST] Server running at ${BASE_URL}`);

    // 2. Insert mock order in DB
    console.log('[TEST] Creating temporary pending order in DB...');
    const mockShippingAddress = {
      firstName: "Original",
      lastName: "Recipient",
      phone: "0811111111",
      address: "Original Address St. 123",
      province: "DKI Jakarta",
      city: "Jakarta Selatan",
      district: "Kebayoran Baru",
      area: "Selong",
      postalCode: "12110",
      note: "Original Note"
    };

    const [result] = await pool.promise().query(
      'INSERT INTO orders ("userId", items, total, "paymentMethod", status, shipping_address, "createdAt") VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [9, JSON.stringify([{ id: 1, name: "Test Product", price: 100000, qty: 1 }]), 100000, 'midtrans', 'pending', JSON.stringify(mockShippingAddress)]
    );
    testOrderId = result.insertId;
    console.log(`[TEST] Temporary order created with ID: ${testOrderId}`);

    // 3. Update shipping address for pending order
    console.log('[TEST] Calling PUT /api/orders/:orderId/shipping-address...');
    const updatedShippingAddress = {
      ...mockShippingAddress,
      firstName: "UpdatedName",
      address: "New Street 456",
      note: "Updated Note"
    };

    const updateRes = await axios.put(`${BASE_URL}/api/orders/${testOrderId}/shipping-address`, {
      shippingAddress: updatedShippingAddress
    });

    console.log('[TEST] Update response:', updateRes.data);
    if (!updateRes.data.success) {
      throw new Error('Expected success: true in shipping-address update');
    }

    // 4. Verify updated address in DB
    const [rows] = await pool.promise().query('SELECT shipping_address FROM orders WHERE id = ?', [testOrderId]);
    const savedAddress = JSON.parse(rows[0].shipping_address);
    if (savedAddress.firstName !== "UpdatedName" || savedAddress.address !== "New Street 456") {
      throw new Error('Shipping address values in database do not match updated values');
    }
    console.log('[TEST] Address successfully updated and verified in database!');

    // 5. Test constraint: Try editing address when status is NOT pending/waiting_payment
    console.log('[TEST] Changing order status to "paid" in DB...');
    await pool.promise().query('UPDATE orders SET status = ? WHERE id = ?', ['paid', testOrderId]);

    console.log('[TEST] Verifying update constraint on "paid" order...');
    try {
      await axios.put(`${BASE_URL}/api/orders/${testOrderId}/shipping-address`, {
        shippingAddress: { ...updatedShippingAddress, firstName: "ShouldFail" }
      });
      throw new Error('Expected API to fail with 400 when order is already paid, but it succeeded.');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log('[TEST] Correctly blocked address editing on paid order! Response:', err.response.data);
      } else {
        throw err;
      }
    }

    console.log('✅ ALL ADDRESS EDIT TESTS PASSED SUCCESSFULLY!');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('Response details:', error.response.data);
    }
    process.exitCode = 1;
  } finally {
    // 6. Cleanup
    if (testOrderId) {
      console.log('[TEST] Cleaning up test order from DB...');
      await pool.promise().query('DELETE FROM orders WHERE id = ?', [testOrderId]);
      console.log('[TEST] DB Cleanup completed.');
    }

    // 7. Close server
    if (server) {
      console.log('[TEST] Stopping test server...');
      server.close();
    }
    
    process.exit(process.exitCode || 0);
  }
}

runTest();
