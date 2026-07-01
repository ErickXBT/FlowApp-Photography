import {
  db,
  pool,
  categoriesTable,
  packagesTable,
  addOnsTable,
  teamMembersTable,
  clientsTable,
  bookingsTable,
  invoicesTable,
  deliveryFilesTable,
} from "@workspace/db";

async function seed() {
  console.log("Seeding database...");

  const [wedding, portrait, event] = await db
    .insert(categoriesTable)
    .values([
      { name: "Wedding", description: "Full-day wedding coverage" },
      { name: "Portrait", description: "Studio and outdoor portrait sessions" },
      { name: "Event", description: "Corporate and private events" },
    ])
    .returning();

  const [essential, premium, deluxe] = await db
    .insert(packagesTable)
    .values([
      {
        categoryId: wedding.id,
        name: "Essential Wedding",
        description: "6 hours coverage, 1 photographer, online gallery",
        price: "8500000",
        includedEditedPhotos: 150,
        estimatedDays: 21,
      },
      {
        categoryId: wedding.id,
        name: "Premium Wedding",
        description: "10 hours coverage, 2 photographers, 1 videographer, cinematic highlight film",
        price: "18500000",
        includedEditedPhotos: 300,
        estimatedDays: 30,
      },
      {
        categoryId: portrait.id,
        name: "Studio Portrait",
        description: "2 hours studio session, 1 photographer, 1 MUA",
        price: "2500000",
        includedEditedPhotos: 30,
        estimatedDays: 7,
      },
    ])
    .returning();

  const [makeup, drone, secondShooter] = await db
    .insert(addOnsTable)
    .values([
      { name: "Bridal Makeup & Hair", description: "Full bridal makeup and hairstyling on the day", price: "1500000" },
      { name: "Drone Coverage", description: "Aerial photo and video coverage", price: "1200000" },
      { name: "Extra Photographer", description: "Add a second shooter for the day", price: "2000000" },
    ])
    .returning();

  const [alice, budi] = await db
    .insert(teamMembersTable)
    .values([
      {
        name: "Alicia Ramadhan",
        role: "photographer",
        photoUrl: null,
        bio: "Lead photographer specializing in candid wedding storytelling, 8 years experience.",
        portfolioUrl: "https://example.com/portfolio/alicia",
      },
      {
        name: "Budi Santoso",
        role: "videographer",
        photoUrl: null,
        bio: "Cinematic videographer with a background in documentary filmmaking.",
        portfolioUrl: "https://example.com/portfolio/budi",
      },
      {
        name: "Citra Dewi",
        role: "mua",
        photoUrl: null,
        bio: "Bridal makeup artist known for natural, long-lasting looks.",
        portfolioUrl: "https://example.com/portfolio/citra",
      },
      {
        name: "Dimas Prasetyo",
        role: "editor",
        photoUrl: null,
        bio: "Photo and video editor focused on fast turnaround without compromising quality.",
        portfolioUrl: null,
      },
    ])
    .returning();

  const [client1, client2, client3] = await db
    .insert(clientsTable)
    .values([
      {
        name: "Sarah & James",
        email: "sarah.james@example.com",
        whatsapp: "+62811222333",
        city: "Jakarta",
        province: "DKI Jakarta",
        country: "Indonesia",
        clientOrigin: "local",
        notes: "Prefers golden hour shots, allergic to peanuts (catering note).",
      },
      {
        name: "Rina Kusuma",
        email: "rina.kusuma@example.com",
        whatsapp: "+62812345678",
        city: "Surabaya",
        province: "East Java",
        country: "Indonesia",
        clientOrigin: "out_of_city",
        notes: "Wants a moody, dark editing style.",
      },
      {
        name: "Michael Tan",
        email: "michael.tan@example.com",
        whatsapp: "+6591234567",
        city: "Singapore",
        province: null,
        country: "Singapore",
        clientOrigin: "international",
        notes: "Flying in for a 3-day trip, needs itinerary coordination.",
      },
    ])
    .returning();

  const now = new Date();
  const inDays = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    return date;
  };

  const [booking1, booking2, booking3] = await db
    .insert(bookingsTable)
    .values([
      {
        clientId: client1.id,
        categoryId: wedding.id,
        packageId: premium.id,
        eventDate: inDays(30),
        locationName: "The Grand Ballroom",
        locationAddress: "Jl. Sudirman Kav. 45, Jakarta",
        mapsLink: "https://maps.google.com/?q=grand+ballroom+jakarta",
        status: "dp_paid",
        totalAmount: "20500000",
        clientOrigin: "local",
        specialRequest: "Please capture the surprise reveal at the reception.",
        moodboardLinks: ["https://pinterest.com/board/example1"],
        teamMemberIds: [alice.id, budi.id],
        addOnIds: [drone.id],
      },
      {
        clientId: client2.id,
        categoryId: portrait.id,
        packageId: essential.id,
        eventDate: inDays(-10),
        locationName: "Sunset Beach",
        locationAddress: "Pantai Kuta, Bali",
        mapsLink: null,
        status: "delivered",
        totalAmount: "8500000",
        clientOrigin: "out_of_city",
        specialRequest: null,
        moodboardLinks: [],
        teamMemberIds: [alice.id],
        addOnIds: [],
      },
      {
        clientId: client3.id,
        categoryId: portrait.id,
        packageId: deluxe.id,
        eventDate: inDays(5),
        locationName: "Studio A",
        locationAddress: "Jl. Kemang Raya No. 12, Jakarta",
        mapsLink: "https://maps.google.com/?q=studio+a+kemang",
        status: "pending",
        totalAmount: "2500000",
        clientOrigin: "international",
        specialRequest: "Needs English-speaking coordinator on site.",
        moodboardLinks: [],
        teamMemberIds: [alice.id, budi.id],
        addOnIds: [makeup.id],
      },
    ])
    .returning();

  await db.insert(invoicesTable).values([
    {
      bookingId: booking1.id,
      invoiceNumber: `INV-${now.getFullYear()}-${String(booking1.id).padStart(4, "0")}`,
      dueDate: inDays(3),
      lineItems: [
        { label: "Premium Wedding", amount: 18500000 },
        { label: "Drone Coverage", amount: 1200000 },
      ],
      subtotal: "20500000",
      total: "20500000",
      paidAmount: "8000000",
      status: "partial",
    },
    {
      bookingId: booking2.id,
      invoiceNumber: `INV-${now.getFullYear()}-${String(booking2.id).padStart(4, "0")}`,
      dueDate: inDays(-7),
      lineItems: [{ label: "Essential Wedding", amount: 8500000 }],
      subtotal: "8500000",
      total: "8500000",
      paidAmount: "8500000",
      status: "paid",
    },
    {
      bookingId: booking3.id,
      invoiceNumber: `INV-${now.getFullYear()}-${String(booking3.id).padStart(4, "0")}`,
      dueDate: inDays(8),
      lineItems: [
        { label: "Studio Portrait", amount: 2500000 },
        { label: "Bridal Makeup & Hair", amount: 1500000 },
      ],
      subtotal: "4000000",
      total: "4000000",
      paidAmount: "0",
      status: "unpaid",
    },
  ]);

  await db.insert(deliveryFilesTable).values([
    {
      bookingId: booking2.id,
      folderType: "edited",
      fileName: "sunset-beach-001.jpg",
      fileUrl: "https://picsum.photos/seed/flowapp1/1200/800",
      selected: true,
    },
    {
      bookingId: booking2.id,
      folderType: "edited",
      fileName: "sunset-beach-002.jpg",
      fileUrl: "https://picsum.photos/seed/flowapp2/1200/800",
      selected: false,
    },
    {
      bookingId: booking2.id,
      folderType: "final_video",
      fileName: "sunset-beach-highlight.mp4",
      fileUrl: "https://example.com/videos/sunset-beach-highlight.mp4",
      selected: true,
    },
  ]);

  console.log("Seed complete.");
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
