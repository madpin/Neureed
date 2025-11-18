// Quick test of the admin settings API
const API_BASE = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Admin Settings API\n');

  try {
    // Test 1: Get current settings
    console.log('1️⃣ GET /api/admin/settings');
    const getRes = await fetch(`${API_BASE}/api/admin/settings`);
    const getData = await getRes.json();
    console.log('   Status:', getRes.status);
    console.log('   Response:', JSON.stringify(getData, null, 2));

    // Test 2: Update setting to true
    console.log('\n2️⃣ PUT /api/admin/settings (set to true)');
    const putRes1 = await fetch(`${API_BASE}/api/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'embedding_auto_generate',
        value: true,
        description: 'Test update'
      })
    });
    const putData1 = await putRes1.json();
    console.log('   Status:', putRes1.status);
    console.log('   Response:', JSON.stringify(putData1, null, 2));

    // Test 3: Get embedding config
    console.log('\n3️⃣ GET /api/admin/embeddings/config');
    const configRes = await fetch(`${API_BASE}/api/admin/embeddings/config`);
    const configData = await configRes.json();
    console.log('   Status:', configRes.status);
    console.log('   autoGenerate:', configData.data?.autoGenerate);
    console.log('   autoGenerateSource:', configData.data?.autoGenerateSource);

    // Test 4: Update setting to false
    console.log('\n4️⃣ PUT /api/admin/settings (set to false)');
    const putRes2 = await fetch(`${API_BASE}/api/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'embedding_auto_generate',
        value: false,
      })
    });
    const putData2 = await putRes2.json();
    console.log('   Status:', putRes2.status);
    console.log('   Response:', JSON.stringify(putData2, null, 2));

    console.log('\n✅ All API tests completed!');
    console.log('\n💡 If the server is not running, start it with: npm run dev');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   The dev server is not running. Start it with: npm run dev');
    }
  }
}

testAPI();

