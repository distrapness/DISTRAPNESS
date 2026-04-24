const axios = require('axios');

// Ambil config dari environment atau hardcode untuk test
const API_KEY = 'biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiZGlzdHJhcG5lc3MiLCJ1c2VySWQiOiI2OWU3OWUwYTIyMTIwNWI4YjliYmUwOTkiLCJpYXQiOjE3NzY5NzY5NzZ9.FYCY7ZQkPsX1pv_FekkRd0-GlVyjP_SXinfIX9snZRM';
const ORIGIN = 'IDNP9IDNC74IDND6757IDZ16371'; // Tapos 2, Tenjolaya

async function testBiteship() {
    console.log("--- TESTING BITESHIP CONNECTION ---");
    try {
        // 1. Test Kelurahan/Kecamatan di Bogor (yg dekat)
        const query = "Tenjolaya, Bogor";
        console.log(`Searching area for: ${query}...`);
        
        const areaRes = await axios.get('https://api.biteship.com/v1/maps/areas', {
            params: { countries: 'ID', input: query, type: 'single' },
            headers: { authorization: API_KEY }
        });

        const area = areaRes.data.areas?.[0];
        if (!area) {
            console.error("❌ Wilayah tidak ditemukan!");
            return;
        }
        console.log(`✅ Wilayah Ditemukan: ${area.name} (ID: ${area.id})`);

        // 2. Test Hitung Ongkir
        console.log(`Calculating rates from ${ORIGIN} to ${area.id}...`);
        const payload = {
            origin_area_id: ORIGIN,
            destination_area_id: area.id,
            couriers: "jne,sicepat,jnt",
            items: [{ name: "Test Product", value: 50000, weight: 1000, quantity: 1 }]
        };

        const rateRes = await axios.post('https://api.biteship.com/v1/rates/couriers', payload, {
            headers: { authorization: API_KEY, 'Content-Type': 'application/json' }
        });

        console.log("✅ Berhasil mendapatkan harga!");
        console.log("Available Rates:", rateRes.data.pricing.length);
        rateRes.data.pricing.forEach(p => {
            console.log(`- ${p.company} (${p.courier_service_name}): Rp ${p.price}`);
        });

    } catch (error) {
        console.error("❌ ERROR BITESHIP:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Detail:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Message:", error.message);
        }
    }
}

testBiteship();
