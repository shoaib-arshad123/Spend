
async function testAuth() {
  const API_URL = "http://localhost:4444/api";
  
  console.log("Testing Wrong Email...");
  const res1 = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "nonexistent@test.com", password: "any" })
  });
  const data1 = await res1.json();
  console.log("Response:", data1);

  console.log("\nTesting Wrong Password...");
  // Assuming 'test@test.com' exists. If not, this might fail differently.
  const res2 = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "shoaib@example.com", password: "wrong" })
  });
  const data2 = await res2.json();
  console.log("Response:", data2);
}

testAuth();
