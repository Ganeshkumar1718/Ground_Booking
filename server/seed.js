const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function seed() {
  const db = await open({
    filename: path.join(__dirname, 'playspot.sqlite'),
    driver: sqlite3.Database
  });

  console.log('Connected to DB');

  // Clear existing data
  await db.exec('DELETE FROM ground_sports');
  await db.exec('DELETE FROM grounds');
  await db.exec('DELETE FROM areas');
  await db.exec('DELETE FROM districts');
  await db.exec('DELETE FROM sports');

  console.log('Cleared old data');

  await db.exec('BEGIN TRANSACTION');

  // 1. SPORTS
  await db.exec("INSERT INTO sports (id, name) VALUES (1, 'Cricket'), (2, 'Football'), (3, 'Tennis')");

  // 2. DISTRICTS
  const districtsData = [
    { id: 1, name: 'Chennai' },
    { id: 2, name: 'Kanchipuram' },
    { id: 3, name: 'Tambaram' },
    { id: 4, name: 'Thiruvallur' }
  ];

  for (let d of districtsData) {
    await db.run('INSERT INTO districts (id, name) VALUES (?, ?)', [d.id, d.name]);
  }

  // 3. AREAS PER DISTRICT (Unique per district)
  const districtAreas = {
    1: [ // Chennai
      'Adyar', 'Alwarpet', 'Anna Nagar', 'Besant Nagar', 'Chepauk', 'Egmore', 
      'Guindy', 'Iyyappanthangal', 'Kodambakkam', 'Kottivakkam', 
      'Mangadu', 'Mogappair', 'Mugalivakkam', 'Mylapore', 
      'Nandanam', 'Nolambur', 'Nungambakkam', 'Pattinapakkam', 'Perambur', 
      'Periyamet', 'Poonamallee High Rd', 'Porur', 'R.A. Puram', 'Ramapuram', 
      'Royapettah', 'Saidapet', 'Santhome', 'Shenoy Nagar', 
      'T. Nagar', 'Thiruvanmiyur', 
      'Triplicane', 'Vadapalani', 'Valasaravakkam', 'Velachery', 'West Mambalam'
    ],
    2: [ // Kanchipuram
      'Kanchipuram Town', 'Sriperumbudur', 'Walajabad', 'Uthiramerur', 
      'Sunguvarchatram', 'Oragadam', 'Enathur', 'Pillayarpalayam', 
      'Kundrathur', 'Padappai'
    ],
    3: [ // Tambaram
      'East Tambaram', 'West Tambaram', 'Chromepet', 'Pallavaram', 
      'Tambaram Sanatorium', 'Selaiyur', 'Medavakkam', 'Perungalathur', 
      'Vandalur', 'Guduvanchery', 'Maraimalai Nagar', 'Chengalpattu Town', 
      'Kelambakkam', 'Padur', 'Navalur', 'Siruseri', 'Mahindra World City',
      'Madambakkam', 'Semmancheri', 'Sholinganallur'
    ],
    4: [ // Thiruvallur
      'Thiruvallur Town', 'Avadi', 'Poonamallee', 'Ambattur', 'Redhills', 
      'Gummidipoondi', 'Ponneri', 'Minjur', 'Tiruninravur', 'Pattabiram', 
      'Manavala Nagar', 'Veppampattu', 'Thirumazhisai', 'Korattur', 'Tirumullaivayal'
    ]
  };

  let areaIdCounter = 1;
  const areaLookup = {}; // "AreaName.toLowerCase() -> { id, district_id, name, district_name }"
  const districtNameMap = { 1: 'Chennai', 2: 'Kanchipuram', 3: 'Tambaram', 4: 'Thiruvallur' };

  for (let distId of [1, 2, 3, 4]) {
    for (let areaName of districtAreas[distId]) {
      await db.run('INSERT INTO areas (id, district_id, name) VALUES (?, ?, ?)', [areaIdCounter, distId, areaName]);
      areaLookup[areaName.toLowerCase()] = { 
        id: areaIdCounter, 
        district_id: distId, 
        name: areaName, 
        district_name: districtNameMap[distId] 
      };
      areaIdCounter++;
    }
  }

  // 4. GROUNDS WITH PRECISE AREA MATCHING & EXACT USER IMAGE NUMBERS
  // Ground definitions: [id, name, area_name, address, rating]
  const groundsList = [
    [1, 'M.A. Chidambaram Stadium', 'Chepauk', 'Wallahajah Road, Chepauk', 4.8],
    [2, 'SDAT Tennis Stadium', 'Nungambakkam', 'Lake Area, Nungambakkam', 4.5],
    [3, 'Jawaharlal Nehru Stadium', 'Periyamet', 'Sydenhams Road, Periyamet', 4.6],
    [4, 'YMCA College Ground', 'Nandanam', 'YMCA College, Nandanam', 4.3],
    [5, 'Rajarathinam Stadium', 'Egmore', 'Rukmani Lakshmipathi Road, Egmore', 4.2],
    [6, 'Corporation Sports Complex', 'Shenoy Nagar', 'Shenoy Nagar', 4.1],
    [7, 'CEG Sports Ground', 'Guindy', 'Anna University Campus, Guindy', 4.4],
    [8, 'Nehru Park SDAT Facility', 'Poonamallee High Rd', 'Poonamallee High Road', 4.3],
    [9, 'Somasundaram Ground', 'T. Nagar', 'Prakasam Road, T. Nagar', 4.1],
    [10, 'Corporation Playground', 'Saidapet', 'Mettuppalayam, Saidapet', 3.9],
    [11, 'Dr. Ambedkar Ground', 'West Mambalam', 'West Mambalam', 4.0],
    [12, 'Corporation Ground V Rd', 'T. Nagar', 'Venkatanarayana Road, T. Nagar', 3.8],
    [13, 'Bakthavatchalam Ground', 'West Mambalam', 'Postal Colony, West Mambalam', 3.9],
    [14, 'Alphonso Ground', 'R.A. Puram', 'R.A. Puram', 4.1],
    [15, 'Evergreen Playground', 'R.A. Puram', 'R.A. Puram', 4.0],
    [16, 'Shastri Nagar Ground', 'Adyar', 'Shastri Nagar, Adyar', 4.2],
    [17, 'Pattinapakkam Playground', 'Pattinapakkam', 'Foreshore Estate, Pattinapakkam', 4.2],
    [18, 'St. Bedes Playground', 'Mylapore', 'Santhome High Road, Mylapore', 4.5],
    [19, 'CLRI Grounds', 'Adyar', 'CLRI Campus, Adyar', 4.3],
    [20, 'Tiki Taka', 'T. Nagar', 'Rooftop, T. Nagar', 4.4],
    [21, 'Turf 137', 'Guindy', 'Guindy Industrial Estate', 4.3],
    [22, 'F10 Futsal Arena', 'Saidapet', 'Saidapet', 4.2],
    [23, 'SPR Sports Academy', 'Nolambur', 'Nolambur', 4.1],
    [24, 'Flash Sports Hub', 'Mugalivakkam', 'Mugalivakkam', 4.3],
    [25, 'Pitch And Play', 'Valasaravakkam', 'Valasaravakkam', 4.2],
    [26, 'FC Marina Turf Iyy', 'Iyyappanthangal', 'Iyyappanthangal', 4.4],
    [27, 'ARK Sports Academy', 'Mangadu', 'Mangadu', 4.0],
    [28, 'Dugout Sports', 'Velachery', 'Grand Square Mall, Velachery', 4.1],
    [29, 'South Zone Sports World', 'Ramapuram', 'Ramapuram', 4.2],
    [30, 'CCC Arena', 'Mugalivakkam', 'Mugalivakkam', 4.0],
    [31, 'Smash It Sports Academy', 'Madambakkam', 'Madambakkam Main Road', 4.3],
    [32, 'Impulz Sports Club', 'Korattur', 'North Avenue, Korattur', 4.1],
    [33, 'Froliic Sports Club', 'Kodambakkam', 'Kodambakkam', 4.2],
    [34, 'Ruckus Sporting Hub', 'Kodambakkam', 'Kodambakkam', 4.0],
    [35, 'Rush Madras', 'Santhome', 'Santhome', 4.3],
    [36, 'Blues by Tiki Taka', 'Saidapet', 'Saidapet', 4.2],
    [37, 'Cricket Labs', 'Saidapet', 'Saidapet', 4.5],
    [38, 'Aeros Pickleball Zone', 'Saidapet', 'Saidapet', 4.1],
    [39, 'CJ Shuttle Sports Hub', 'West Mambalam', 'West Mambalam', 4.0],
    [40, 'M Square Sports Arena', 'T. Nagar', 'T. Nagar', 4.1],
    [41, 'FC Marina Turf Kot', 'Kottivakkam', 'East Coast Road, Kottivakkam', 4.5],
    [42, 'Thiram Sports Academy', 'Semmancheri', 'Semmancheri, OMR', 4.4],
    [43, 'Letz Grow Sports', 'Sholinganallur', 'OMR, Sholinganallur', 4.1],
    [44, 'Playmaxx Arena', 'Tirumullaivayal', 'CTH Road, Tirumullaivayal', 4.2]
  ];

  const groundImageMap = {
    1: '/uploads/1.jpeg',
    2: '/uploads/2.avif',
    3: '/uploads/3.jpg',
    4: '/uploads/4.avif',
    5: '/uploads/5.jpeg',
    6: '/uploads/6.jpg',
    7: '/uploads/7.jpg',
    8: '/uploads/8.jpg',
    9: '/uploads/9.jpg',
    10: '/uploads/10.jpg',
    11: '/uploads/11.jpg',
    12: '/uploads/12.jpg',
    13: '/uploads/13.jpeg',
    14: '/uploads/14.webp',
    15: '/uploads/15.avif',
    16: '/uploads/16.jpg',
    17: '/uploads/17.jpg',
    18: '/uploads/18.jpg',
    19: '/uploads/19.avif',
    20: '/uploads/20.jpg',
    21: '/uploads/21.webp',
    22: '/uploads/22.jpg',
    23: '/uploads/23.jpg',
    24: '/uploads/24.jpg',
    25: '/uploads/25.jpg',
    26: '/uploads/26.jpg',
    27: '/uploads/27.webp',
    28: '/uploads/28.avif',
    29: '/uploads/29.webp',
    30: '/uploads/30.webp',
    31: '/uploads/31.avif',
    32: '/uploads/32.jpg',
    33: '/uploads/33.webp',
    34: '/uploads/34.webp',
    35: '/uploads/35.jpg',
    36: '/uploads/36.webp',
    37: '/uploads/37.webp',
    38: '/uploads/38.jpg',
    39: '/uploads/39.jpg',
    40: '/uploads/40.avif',
    41: '/uploads/41.jpg',
    42: '/uploads/42.jpg',
    43: '/uploads/43.jpg',
    44: '/uploads/44.jpg'
  };

  for (let g of groundsList) {
    const photo = groundImageMap[g[0]] || '/uploads/default-main.jpg';
    const areaInfo = areaLookup[g[2].toLowerCase()] || { id: 1, district_id: 1, district_name: 'Chennai' };

    await db.run(
      'INSERT INTO grounds (id, name, district_id, area_id, address, city, state, average_rating, status, price_type, advance_percentage, main_photo) VALUES (?, ?, ?, ?, ?, ?, "Tamil Nadu", ?, "approved", "hour", 20, ?)',
      [g[0], g[1], areaInfo.district_id, areaInfo.id, g[3], areaInfo.district_name, g[4], photo]
    );
  }

  // 5. GROUND SPORTS
  const gs = [
    [1, 1], [2, 3], [3, 2], [4, 1], [4, 2], [5, 2], [6, 3], [7, 1], [7, 2], [8, 2], [8, 3],
    [9, 1], [10, 1], [11, 1], [11, 2], [12, 1], [13, 1], [14, 1], [15, 1], [15, 2], [16, 1], [17, 1], [17, 2], [18, 1], [19, 1],
    [20, 1], [20, 2], [21, 1], [21, 2], [22, 1], [22, 2], [23, 1], [23, 2], [24, 1], [24, 2], [25, 1], [25, 2], [26, 1], [26, 2], 
    [27, 1], [27, 2], [27, 3], [28, 1], [28, 2], [29, 1], [30, 1], [30, 2], [31, 1], [31, 2], [31, 3], [32, 1], [32, 2], [33, 1], 
    [34, 1], [34, 2], [35, 1], [35, 2], [36, 1], [36, 2], [37, 1], [38, 1], [39, 1], [40, 1], [41, 1], [41, 2], [42, 1], [42, 2], 
    [42, 3], [43, 1], [43, 2], [44, 1], [44, 2]
  ];

  for (let pair of gs) {
    await db.run('INSERT INTO ground_sports (ground_id, sport_id) VALUES (?, ?)', [pair[0], pair[1]]);
  }

  // 6. RICH SLOTS (14 days ahead)
  await db.exec('DELETE FROM slots');
  const today = new Date();
  const timeSlots = [
    { start: '06:00', end: '07:00', price: 800 },
    { start: '07:00', end: '08:00', price: 800 },
    { start: '08:00', end: '09:00', price: 900 },
    { start: '09:00', end: '10:00', price: 900 },
    { start: '16:00', end: '17:00', price: 1000 },
    { start: '17:00', end: '18:00', price: 1200 },
    { start: '18:00', end: '19:00', price: 1400 },
    { start: '19:00', end: '20:00', price: 1400 },
    { start: '20:00', end: '21:00', price: 1500 },
    { start: '21:00', end: '22:00', price: 1200 }
  ];

  for (let pair of gs) {
    const gId = pair[0];
    const sId = pair[1];
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + dayOffset);
      const dateStr = d.toISOString().split('T')[0];
      
      for (let ts of timeSlots) {
        await db.run(
          "INSERT INTO slots (ground_id, sport_id, booking_date, start_time, end_time, price, status) VALUES (?, ?, ?, ?, ?, ?, 'available')",
          [gId, sId, dateStr, ts.start, ts.end, ts.price]
        );
      }
    }
  }

  await db.exec('COMMIT');

  console.log('Successfully seeded database with Chennai, Kanchipuram, Tambaram, and Thiruvallur districts & areas.');
  await db.close();
}

seed().catch(console.error);
