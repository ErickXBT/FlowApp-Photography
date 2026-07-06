async function test() {
  console.log("Starting API integration test...");
  
  // 1. Login
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vendor@senja.id", password: "vendor123" })
  });
  
  console.log("Login status:", loginRes.status);
  const cookie = loginRes.headers.get("set-cookie");
  
  if (!cookie) {
    console.error("Error: No session cookie received from login!");
    return;
  }
  console.log("Login successful! Session cookie obtained.");

  // 2. Create profile settings
  console.log("Configuring studio profile settings...");
  const profileRes = await fetch("http://localhost:5000/api/landing/me/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookie
    },
    body: JSON.stringify({
      studioName: "Senja Studio",
      slug: "senja",
      whatsapp: "+6281234567890"
    })
  });
  console.log("Profile update status:", profileRes.status);
  
  // 3. Create client
  console.log("Creating new client Budi Santoso...");
  const clientRes = await fetch("http://localhost:5000/api/clients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookie
    },
    body: JSON.stringify({
      name: "Budi Santoso",
      whatsapp: "+6281234567890",
      email: "budisantoso@example.com"
    })
  });
  console.log("Create client status:", clientRes.status);
  const client = (await clientRes.json()) as any;
  console.log("Client created successfully with ID:", client.id);
  
  // 4. Create booking project
  console.log("Creating booking project with maxPhotos=10 and additional options...");
  const bookingRes = await fetch("http://localhost:5000/api/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookie
    },
    body: JSON.stringify({
      clientId: client.id,
      eventDate: new Date().toISOString(),
      googleDriveLink: "https://drive.google.com/drive/folders/sample",
      detectSubfolder: true,
      whatsappClient: "+6281234567890",
      whatsappAdmin: "+6281223344556",
      maxPhotos: 10,
      pilihFotoEnabled: true,
      downloadFotoEnabled: true,
      pilihFotoDuration: "14 Hari",
      pilihFotoPassword: "budi123",
      downloadFotoDuration: "14 Hari",
      downloadFotoPassword: "budi123",
      pilihFotoTambahanEnabled: true,
      pilihFotoCetakEnabled: true,
      clientOrigin: "local"
    })
  });
  console.log("Create booking status:", bookingRes.status);
  const booking = (await bookingRes.json()) as any;
  
  if (bookingRes.status === 201) {
    console.log("Booking created successfully!");
    console.log("Project Code:", "PRJ-" + String(booking.id).padStart(4, "0"));
    console.log("Link Client:", `http://localhost:4173/client/senja/${booking.id}`);
  } else {
    console.error("Booking creation failed:", booking);
  }
}

test().catch(console.error);
