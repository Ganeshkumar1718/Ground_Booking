const { createClient } = require('@libsql/client');
const path = require('path');
const bcrypt = require('bcrypt');

let dbClient;

async function initDB() {
  try {
    dbClient = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:playspot.sqlite',
      authToken: process.env.TURSO_AUTH_TOKEN
    });

    console.log('✅ Connected to database (Turso/SQLite)');

    // Wrapper for existing queries in initDB
    const db = {
      exec: async (sql) => dbClient.execute(sql),
      run: async (sql, params = []) => {
        const res = await dbClient.execute({ sql, args: params });
        return { lastID: res.lastInsertRowid ? Number(res.lastInsertRowid) : 0, changes: res.rowsAffected };
      },
      all: async (sql, params = []) => {
        const res = await dbClient.execute({ sql, args: params });
        return res.rows;
      },
      get: async (sql, params = []) => {
        const res = await dbClient.execute({ sql, args: params });
        return res.rows[0];
      }
    };

    // Create necessary tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await db.exec(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`);
    } catch (e) {
      // Column may already exist
    }

    await db.exec(`
      CREATE TABLE IF NOT EXISTS districts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS areas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        district_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS sports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS grounds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT,
        city TEXT,
        district_id INTEGER,
        area_id INTEGER,
        state TEXT,
        latitude REAL,
        longitude REAL,
        advance_percentage INTEGER DEFAULT 20,
        price_type TEXT,
        ground_type TEXT,
        pitch_type TEXT,
        status TEXT DEFAULT 'pending',
        owner_email TEXT,
        owner_phone TEXT,
        average_rating REAL DEFAULT 0,
        total_likes INTEGER DEFAULT 0,
        main_photo TEXT,
        verified_at DATETIME,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )
    `);

    try {
      await db.exec(`ALTER TABLE grounds ADD COLUMN main_photo TEXT`);
    } catch (e) {
      // Column may already exist
    }

    try {
      await db.exec(`ALTER TABLE grounds ADD COLUMN verified_at DATETIME`);
    } catch (e) {
      // Column may already exist
    }

    await db.exec(`
      CREATE TABLE IF NOT EXISTS ground_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ground_id INTEGER NOT NULL,
        photo_url TEXT NOT NULL,
        category TEXT,
        latitude REAL,
        longitude REAL,
        captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ground_id) REFERENCES grounds(id) ON DELETE CASCADE
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS ground_sports (
        ground_id INTEGER NOT NULL,
        sport_id INTEGER NOT NULL,
        PRIMARY KEY (ground_id, sport_id),
        FOREIGN KEY (ground_id) REFERENCES grounds(id) ON DELETE CASCADE,
        FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER,
        ground_id INTEGER,
        name TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        description TEXT,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (owner_id) REFERENCES users(id),
        FOREIGN KEY (ground_id) REFERENCES grounds(id)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS tournament_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        team_name TEXT,
        status TEXT DEFAULT 'registered',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(tournament_id, user_id)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ground_id INTEGER NOT NULL,
        sport_id INTEGER NOT NULL,
        booking_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        price REAL NOT NULL,
        status TEXT DEFAULT 'available',
        FOREIGN KEY (ground_id) REFERENCES grounds(id),
        FOREIGN KEY (sport_id) REFERENCES sports(id)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        slot_id INTEGER NOT NULL,
        booking_ref TEXT,
        amount REAL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (slot_id) REFERENCES slots(id)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ground_id INTEGER NOT NULL,
        booking_id INTEGER,
        rating INTEGER NOT NULL,
        review_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (ground_id) REFERENCES grounds(id),
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ground_id INTEGER NOT NULL,
        parent_comment_id INTEGER,
        comment TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (ground_id) REFERENCES grounds(id)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS likes (
        user_id INTEGER NOT NULL,
        ground_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, ground_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (ground_id) REFERENCES grounds(id)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ground_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (ground_id) REFERENCES grounds(id)
      )
    `);

    // Seed Admin Account
    const adminUser = await db.get('SELECT * FROM users WHERE email = ?', ['admin@playspot.com']);
    const hashedPassword = await bcrypt.hash('admin123', 10);
    if (!adminUser) {
      await db.run(
        'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['PlaySpot Administrator', 'admin@playspot.com', '9999999999', hashedPassword, 'admin', 'active']
      );
      console.log('✅ Admin user initialized: admin@playspot.com / admin123');
    } else {
      await db.run("UPDATE users SET password = ?, role = 'admin', status = 'active' WHERE email = ?", [hashedPassword, 'admin@playspot.com']);
    }

    // Dummy data initialization
    const districts = await db.all('SELECT * FROM districts');
    if (districts.length === 0) {
      const { lastID: d1 } = await db.run("INSERT INTO districts (name) VALUES ('Downtown')");
      const { lastID: d2 } = await db.run("INSERT INTO districts (name) VALUES ('Suburbs')");
      await db.run(`INSERT INTO areas (district_id, name) VALUES (?, 'Central Park')`, [d1]);
      await db.run(`INSERT INTO areas (district_id, name) VALUES (?, 'East Side')`, [d1]);
      await db.run(`INSERT INTO areas (district_id, name) VALUES (?, 'Westend')`, [d2]);
      await db.run(`INSERT INTO areas (district_id, name) VALUES (?, 'North Hills')`, [d2]);
      
      const { lastID: s1 } = await db.run("INSERT INTO sports (name) VALUES ('Cricket')");
      const { lastID: s2 } = await db.run("INSERT INTO sports (name) VALUES ('Football')");
      const { lastID: s3 } = await db.run("INSERT INTO sports (name) VALUES ('Tennis')");
      
      // Dummy ground
      const { lastID: g1 } = await db.run(`
        INSERT INTO grounds (name, description, address, city, district_id, area_id, state, advance_percentage, price_type, status, owner_email, owner_phone)
        VALUES ('Vanguard Turf Center', 'A premium indoor turf.', '123 Main St', 'Chennai', ?, ?, 'Tamil Nadu', 20, 'hour', 'approved', 'owner@example.com', '9876543210')
      `, [d1, 1]);
      
      await db.run(`INSERT INTO ground_sports (ground_id, sport_id) VALUES (?, ?)`, [g1, s1]);
      
      // Dummy slots
      const today = new Date().toISOString().split('T')[0];
      await db.run(`INSERT INTO slots (ground_id, sport_id, booking_date, start_time, end_time, price, status) VALUES (?, ?, ?, '10:00:00', '11:00:00', 1000, 'available')`, [g1, s1, today]);
      await db.run(`INSERT INTO slots (ground_id, sport_id, booking_date, start_time, end_time, price, status) VALUES (?, ?, ?, '11:00:00', '12:00:00', 1000, 'available')`, [g1, s1, today]);

      console.log('✅ Added default dummy location, sports, grounds, and slots data');
    }

  } catch (err) {
    console.error('❌ Failed to connect to or initialize SQLite:', err.message);
  }
}

module.exports = {
  initDB,
  query: async (sql, params = []) => {
    if (!dbClient) throw new Error('Database not initialized');
    
    const result = await dbClient.execute({ sql, args: params });
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return [result.rows]; 
    } else {
      return [{ insertId: result.lastInsertRowid ? Number(result.lastInsertRowid) : 0, affectedRows: result.rowsAffected }]; 
    }
  }
};
