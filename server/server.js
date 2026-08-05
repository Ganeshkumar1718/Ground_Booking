const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();
const db = require('./db');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'playspot_uploads',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});
const upload = multer({ storage: storage });

const app = express();
app.use(cors());
app.use(express.json());
// /uploads static route removed since we use Cloudinary directly

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Secret Key
const SECRET_KEY = process.env.JWT_SECRET || 'supersecret';

// Basic Auth Middleware
const protect = async (req, res, next) => {
  let token = req.headers.authorization;
  if (token && token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      const [users] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
      if (users.length > 0) {
        req.user = users[0];
        next();
      } else {
        res.status(401).json({ message: 'Not authorized, user not found' });
      }
    } catch (e) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// WebSocket logic
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
  });
});

const sendNotification = async (userId, message) => {
  const [result] = await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [userId, message]);
  const [notifs] = await db.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
  if (notifs.length > 0) {
    io.to(`user_${userId}`).emit('newNotification', notifs[0]);
  }
};

// --- AUTH ROUTES ---

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '30d' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/check-availability', async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (email) {
      const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length > 0) return res.status(400).json({ message: 'Email taken' });
    }
    if (phone) {
      const [users] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
      if (users.length > 0) return res.status(400).json({ message: 'Phone taken' });
    }
    res.json({ message: 'Available' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ? OR phone = ?', [email, phone]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const [result] = await db.query(
      'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, hashedPassword, role || 'user']
    );

    const newUser = { id: result.insertId, name, email, phone, role: role || 'user' };
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, SECRET_KEY, { expiresIn: '30d' });
    
    res.status(201).json({ token, user: newUser });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/me', protect, (req, res) => {
  res.json({ id: req.user.id, name: req.user.name, email: req.user.email, phone: req.user.phone, role: req.user.role });
});

// --- LOCATIONS ROUTES ---

app.get('/api/locations/districts', async (req, res) => {
  try {
    const [districts] = await db.query('SELECT * FROM districts');
    res.json(districts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch districts' });
  }
});

app.get('/api/locations/districts/:id/areas', async (req, res) => {
  try {
    const districtId = req.params.id;
    const [areas] = await db.query('SELECT * FROM areas WHERE district_id = ?', [districtId]);
    res.json(areas);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch areas' });
  }
});

app.get('/api/locations/grounds', async (req, res) => {
  try {
    const { district_id, area_id } = req.query;
    let sql = `
      SELECT g.*, d.name as district_name, a.name as area_name, u.name as owner_name 
      FROM grounds g 
      LEFT JOIN districts d ON g.district_id = d.id 
      LEFT JOIN areas a ON g.area_id = a.id
      LEFT JOIN users u ON g.owner_id = u.id
      WHERE 1=1
    `;
    let params = [];
    if (district_id) { sql += ' AND g.district_id = ?'; params.push(district_id); }
    if (area_id) { sql += ' AND g.area_id = ?'; params.push(area_id); }
    
    const [grounds] = await db.query(sql, params);
    res.json(grounds);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- SPORTS ---
app.get('/api/sports', async (req, res) => {
  try {
    const [sports] = await db.query('SELECT * FROM sports');
    res.json(sports);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sports' });
  }
});

// --- GROUNDS ---
app.post('/api/grounds', protect, async (req, res) => {
  try {
    const { name, description, address, city, district_id, area_id, state, latitude, longitude, advance_percentage, price_type, ground_type, pitch_type, sports } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO grounds (owner_id, name, description, address, city, district_id, area_id, state, latitude, longitude, advance_percentage, price_type, ground_type, pitch_type, status, owner_email, owner_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "pending", ?, ?)',
      [req.user.id, name, description, address, city, district_id || null, area_id || null, state || 'Tamil Nadu', latitude || null, longitude || null, advance_percentage || 20, price_type || 'hour', ground_type || null, pitch_type || null, req.user.email, req.user.phone]
    );

    const groundId = result.insertId;

    if (sports && Array.isArray(sports) && sports.length > 0) {
      for (let sportId of sports) {
        await db.query('INSERT OR IGNORE INTO ground_sports (ground_id, sport_id) VALUES (?, ?)', [groundId, sportId]);
      }
    }

    res.json({ success: true, groundId });
  } catch (err) {
    console.error('Error adding ground:', err);
    res.status(500).json({ message: 'Server error creating ground' });
  }
});

app.post('/api/grounds/:id/photos', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No photo uploaded' });
    const groundId = req.params.id;
    // CloudinaryStorage sets the secure URL in req.file.path
    const photoUrl = req.file.path;
    const { latitude, longitude, category } = req.body;

    await db.query(
      'INSERT INTO ground_photos (ground_id, photo_url, category, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
      [groundId, photoUrl, category || 'general', latitude || null, longitude || null]
    );

    // Set as main_photo if ground doesn't have one or has default
    const [grounds] = await db.query('SELECT main_photo FROM grounds WHERE id = ?', [groundId]);
    if (grounds.length > 0 && (!grounds[0].main_photo || grounds[0].main_photo === '/uploads/default-main.jpg')) {
      await db.query('UPDATE grounds SET main_photo = ? WHERE id = ?', [photoUrl, groundId]);
    }

    res.json({ success: true, file: req.file, photoUrl });
  } catch (err) {
    console.error('Error uploading ground photo:', err);
    res.status(500).json({ message: 'Server error uploading photo' });
  }
});

app.delete('/api/grounds/:id/photos', protect, async (req, res) => {
  try {
    const { photoId } = req.body;
    if (photoId) {
      await db.query('DELETE FROM ground_photos WHERE id = ? AND ground_id = ?', [photoId, req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/grounds/:id/submit', protect, async (req, res) => {
  try {
    const groundId = req.params.id;
    // Ground is strictly pending admin verification
    await db.query('UPDATE grounds SET status = "pending" WHERE id = ?', [groundId]);
    
    const [grounds] = await db.query('SELECT name, owner_id FROM grounds WHERE id = ?', [groundId]);
    const groundName = grounds[0]?.name || 'Arena';
    
    // Notify owner
    await sendNotification(req.user.id, `Your ground "${groundName}" has been submitted for admin verification. It will be live and bookable once approved by admin.`);
    
    // Notify admin
    const [admins] = await db.query('SELECT id FROM users WHERE role = "admin"');
    for (let admin of admins) {
      await sendNotification(admin.id, `New ground "${groundName}" submitted by ${req.user.name} for verification.`);
    }

    res.json({ success: true, message: 'Ground submitted for admin verification.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/owner/grounds', protect, async (req, res) => {
  try {
    let sql = `
      SELECT g.*, d.name as district_name, a.name as area_name,
      (SELECT MIN(price) FROM slots WHERE ground_id = g.id AND status = 'available') as starting_price
      FROM grounds g
      LEFT JOIN districts d ON g.district_id = d.id
      LEFT JOIN areas a ON g.area_id = a.id
    `;
    let params = [];
    if (req.user.role !== 'admin') {
      sql += ' WHERE g.owner_id = ?';
      params.push(req.user.id);
    }
    sql += ' ORDER BY g.id DESC';
    const [grounds] = await db.query(sql, params);
    for (let g of grounds) {
      const [sports] = await db.query('SELECT s.* FROM sports s JOIN ground_sports gs ON s.id = gs.sport_id WHERE gs.ground_id = ?', [g.id]);
      g.sports = sports;
    }
    res.json(grounds);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/grounds', async (req, res) => {
  try {
    const { search, sport_id, gtype, ptype, district, area, rating, sort } = req.query;
    let sql = `
      SELECT g.*, d.name as district_name, a.name as area_name,
      (SELECT GROUP_CONCAT(s.name, ', ') FROM sports s JOIN ground_sports gs ON s.id = gs.sport_id WHERE gs.ground_id = g.id) as sports_names,
      (SELECT MIN(price) FROM slots WHERE ground_id = g.id AND status = 'available') as starting_price
      FROM grounds g
      LEFT JOIN districts d ON g.district_id = d.id
      LEFT JOIN areas a ON g.area_id = a.id
      WHERE g.status = "approved"
    `;
    let params = [];
    if (search) {
      sql += ' AND (g.name LIKE ? OR g.address LIKE ? OR a.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (sport_id) {
      sql += ' AND g.id IN (SELECT ground_id FROM ground_sports WHERE sport_id = ?)';
      params.push(sport_id);
    }
    if (district && district !== 'all' && district !== 'nearby' && district !== 'All Chennai Region' && district !== 'Nearby Chennai') {
      if (!isNaN(parseInt(district))) {
        sql += ' AND g.district_id = ?';
        params.push(parseInt(district));
      } else {
        sql += ' AND (d.name LIKE ? OR g.city LIKE ?)';
        params.push(`%${district}%`, `%${district}%`);
      }
    }
    if (area) {
      if (!isNaN(parseInt(area))) {
        sql += ' AND g.area_id = ?';
        params.push(parseInt(area));
      } else {
        sql += ' AND (a.name LIKE ? OR g.address LIKE ?)';
        params.push(`%${area}%`, `%${area}%`);
      }
    }
    if (rating) {
      sql += ' AND g.average_rating >= ?';
      params.push(rating);
    }

    if (sort === 'rating') {
      sql += ' ORDER BY g.average_rating DESC';
    } else if (sort === 'price_asc') {
      sql += ' ORDER BY starting_price ASC';
    } else if (sort === 'price_desc') {
      sql += ' ORDER BY starting_price DESC';
    } else {
      sql += ' ORDER BY g.id ASC';
    }

    const [grounds] = await db.query(sql, params);
    res.json({ success: true, data: { grounds, pagination: { totalPages: 1, total: grounds.length } } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/pending-grounds', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const [grounds] = await db.query(`
      SELECT g.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
      d.name as district_name, a.name as area_name
      FROM grounds g
      LEFT JOIN users u ON g.owner_id = u.id
      LEFT JOIN districts d ON g.district_id = d.id
      LEFT JOIN areas a ON g.area_id = a.id
      WHERE g.status IN ('pending', 'pending_verification')
      ORDER BY g.id DESC
    `);

    for (let g of grounds) {
      const [sports] = await db.query('SELECT s.name FROM sports s JOIN ground_sports gs ON s.id = gs.sport_id WHERE gs.ground_id = ?', [g.id]);
      g.sports = sports.map(s => s.name);

      const [photos] = await db.query('SELECT id, photo_url as image_url, photo_url, category, latitude, longitude, captured_at FROM ground_photos WHERE ground_id = ?', [g.id]);
      g.photos = photos;
    }

    res.json(grounds);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/admin/grounds/:id/approve', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const groundId = req.params.id;
    await db.query('UPDATE grounds SET status = "approved", verified_at = CURRENT_TIMESTAMP WHERE id = ?', [groundId]);
    
    const [grounds] = await db.query('SELECT g.*, u.name as owner_name, u.id as owner_user_id FROM grounds g LEFT JOIN users u ON g.owner_id = u.id WHERE g.id = ?', [groundId]);
    const ground = grounds[0];

    // Check if slots exist for this ground; if none, auto-generate standard slots for the next 14 days so users can book it immediately!
    const [existingSlots] = await db.query('SELECT COUNT(*) as count FROM slots WHERE ground_id = ?', [groundId]);
    if (existingSlots[0].count === 0) {
      const [sports] = await db.query('SELECT sport_id FROM ground_sports WHERE ground_id = ?', [groundId]);
      const sportsToGenerate = sports.length > 0 ? sports.map(s => s.sport_id) : [1];
      
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

      for (let sportId of sportsToGenerate) {
        for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
          const d = new Date(today);
          d.setDate(d.getDate() + dayOffset);
          const dateStr = d.toISOString().split('T')[0];
          
          for (let ts of timeSlots) {
            await db.query(
              "INSERT INTO slots (ground_id, sport_id, booking_date, start_time, end_time, price, status) VALUES (?, ?, ?, ?, ?, ?, 'available')",
              [groundId, sportId, dateStr, ts.start, ts.end, ts.price]
            );
          }
        }
      }
    }

    if (ground?.owner_id) {
      await sendNotification(ground.owner_id, `🎉 Great news! Your arena "${ground.name}" has been verified and approved by admin. It is now open for player bookings!`);
    }

    io.emit('groundStatusUpdated', { groundId: parseInt(groundId), status: 'approved' });
    res.json({ success: true, message: 'Ground approved successfully and live for bookings.' });
  } catch (err) {
    console.error('Error approving ground:', err);
    res.status(500).json({ message: 'Server error approving ground' });
  }
});

app.patch(['/api/admin/grounds/:id/cancel-approval', '/api/admin/grounds/:id/revoke', '/api/admin/grounds/:id/suspend'], protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const groundId = req.params.id;
    const { reason, status } = req.body;
    const targetStatus = status || 'rejected';
    
    await db.query('UPDATE grounds SET status = ? WHERE id = ?', [targetStatus, groundId]);
    
    const [grounds] = await db.query('SELECT name, owner_id FROM grounds WHERE id = ?', [groundId]);
    if (grounds[0]?.owner_id) {
      await sendNotification(
        grounds[0].owner_id, 
        `⚠️ Notice: Admin has cancelled / revoked the approval for your arena "${grounds[0].name}". Status is now set to "${targetStatus}". Reason: ${reason || 'Administrative Review & Quality Policy'}`
      );
    }

    io.emit('groundStatusUpdated', { groundId: parseInt(groundId), status: targetStatus });
    res.json({ success: true, message: `Ground approval cancelled successfully (Status: ${targetStatus}).` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error cancelling ground approval' });
  }
});

app.patch('/api/admin/grounds/:id/reject', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const groundId = req.params.id;
    const { reason } = req.body;
    await db.query('UPDATE grounds SET status = "rejected" WHERE id = ?', [groundId]);
    
    const [grounds] = await db.query('SELECT name, owner_id FROM grounds WHERE id = ?', [groundId]);
    if (grounds[0]?.owner_id) {
      await sendNotification(grounds[0].owner_id, `Your ground verification for "${grounds[0].name}" was not approved by admin. Reason: ${reason || 'Details could not be verified'}`);
    }

    io.emit('groundStatusUpdated', { groundId: parseInt(groundId), status: 'rejected' });
    res.json({ success: true, message: 'Ground rejected.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/grounds', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const [grounds] = await db.query(`
      SELECT g.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
      d.name as district_name, a.name as area_name
      FROM grounds g
      LEFT JOIN users u ON g.owner_id = u.id
      LEFT JOIN districts d ON g.district_id = d.id
      LEFT JOIN areas a ON g.area_id = a.id
      ORDER BY g.id DESC
    `);
    res.json(grounds);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/admin/grounds/:id', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { name, description, address, city, status } = req.body;
    let sql = 'UPDATE grounds SET ';
    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push('name = ?'); params.push(name); }
    if (description !== undefined) { sets.push('description = ?'); params.push(description); }
    if (address !== undefined) { sets.push('address = ?'); params.push(address); }
    if (city !== undefined) { sets.push('city = ?'); params.push(city); }
    if (status !== undefined) { sets.push('status = ?'); params.push(status); }
    
    if (sets.length === 0) return res.json({ success: true });
    
    sql += sets.join(', ') + ' WHERE id = ?';
    params.push(req.params.id);
    await db.query(sql, params);
    res.json({ success: true, message: 'Ground updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/admin/grounds/:id/status', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { status } = req.body;
    await db.query('UPDATE grounds SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/users', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const [users] = await db.query('SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY id DESC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/admin/users/:id/status', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { status } = req.body;
    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/reports', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const [reports] = await db.query(`
      SELECT r.*, u.name as reporter_name, u.email as reporter_email, g.name as ground_name, g.status as ground_status
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN grounds g ON r.ground_id = g.id
      ORDER BY r.created_at DESC
    `);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/admin/reports/:id', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    await db.query('DELETE FROM reports WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Report dismissed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error dismissing report' });
  }
});

app.get('/api/grounds/:id', async (req, res) => {
  try {
    const [grounds] = await db.query(`
      SELECT g.*, d.name as district_name, a.name as area_name
      FROM grounds g
      LEFT JOIN districts d ON g.district_id = d.id
      LEFT JOIN areas a ON g.area_id = a.id
      WHERE g.id = ?
    `, [req.params.id]);
    if (grounds.length === 0) return res.status(404).json({ message: 'Ground not found' });
    
    const ground = grounds[0];
    const [sports] = await db.query('SELECT s.* FROM sports s JOIN ground_sports gs ON s.id = gs.sport_id WHERE gs.ground_id = ?', [ground.id]);
    ground.sports = sports;

    const [photos] = await db.query('SELECT * FROM ground_photos WHERE ground_id = ?', [ground.id]);
    ground.photos = photos;
    
    res.json(ground);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- REVIEWS, COMMENTS, LIKES & REPORTS ---
app.get('/api/grounds/:id/reviews', async (req, res) => {
  try {
    const [reviews] = await db.query(`
      SELECT r.*, u.name as user_name 
      FROM reviews r 
      JOIN users u ON r.user_id = u.id 
      WHERE r.ground_id = ? 
      ORDER BY r.created_at DESC
    `, [req.params.id]);
    res.json(reviews);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/grounds/:id/reviews', protect, async (req, res) => {
  try {
    const rating = parseInt(req.body?.rating) || 5;
    const reviewText = req.body?.review_text || req.body?.comment || '';
    const bookingId = req.body?.booking_id || null;

    await db.query(
      'INSERT INTO reviews (user_id, ground_id, booking_id, rating, review_text) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, req.params.id, bookingId, rating, reviewText]
    );
    
    // Update ground average_rating
    const [avg] = await db.query('SELECT AVG(rating) as avg_rating FROM reviews WHERE ground_id = ?', [req.params.id]);
    if (avg.length > 0 && avg[0].avg_rating) {
      await db.query('UPDATE grounds SET average_rating = ? WHERE id = ?', [parseFloat(avg[0].avg_rating).toFixed(1), req.params.id]);
    }
    
    res.json({ success: true, message: 'Review added successfully' });
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ message: 'Server error adding review' });
  }
});

app.get('/api/grounds/:id/comments', async (req, res) => {
  try {
    const [comments] = await db.query(`
      SELECT c.*, u.name as user_name, u.role as user_role 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.ground_id = ? 
      ORDER BY c.created_at ASC
    `, [req.params.id]);
    
    const rootComments = [];
    const commentMap = {};
    for (let c of comments) {
      c.replies = [];
      commentMap[c.id] = c;
      if (!c.parent_comment_id) {
        rootComments.push(c);
      }
    }
    for (let c of comments) {
      if (c.parent_comment_id && commentMap[c.parent_comment_id]) {
        commentMap[c.parent_comment_id].replies.push(c);
      }
    }
    res.json(rootComments);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/grounds/:id/comments', protect, async (req, res) => {
  try {
    const { comment, parent_comment_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO comments (user_id, ground_id, parent_comment_id, comment) VALUES (?, ?, ?, ?)',
      [req.user.id, req.params.id, parent_comment_id || null, comment]
    );
    res.json({
      id: result.insertId,
      user_id: req.user.id,
      user_name: req.user.name,
      user_role: req.user.role,
      comment,
      parent_comment_id: parent_comment_id || null,
      created_at: new Date().toISOString(),
      replies: []
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error posting comment' });
  }
});

app.post('/api/grounds/:id/like', protect, async (req, res) => {
  try {
    await db.query('INSERT OR IGNORE INTO likes (user_id, ground_id) VALUES (?, ?)', [req.user.id, req.params.id]);
    const [likes] = await db.query('SELECT COUNT(*) as count FROM likes WHERE ground_id = ?', [req.params.id]);
    await db.query('UPDATE grounds SET total_likes = ? WHERE id = ?', [likes[0].count, req.params.id]);
    res.json({ success: true, total_likes: likes[0].count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/grounds/:id/like', protect, async (req, res) => {
  try {
    await db.query('DELETE FROM likes WHERE user_id = ? AND ground_id = ?', [req.user.id, req.params.id]);
    const [likes] = await db.query('SELECT COUNT(*) as count FROM likes WHERE ground_id = ?', [req.params.id]);
    await db.query('UPDATE grounds SET total_likes = ? WHERE id = ?', [likes[0].count, req.params.id]);
    res.json({ success: true, total_likes: likes[0].count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/reports/ground/:id', protect, async (req, res) => {
  try {
    const { reason, description } = req.body;
    await db.query('INSERT INTO reports (user_id, ground_id, reason, description) VALUES (?, ?, ?, ?)', [req.user.id, req.params.id, reason, description]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- TOURNAMENTS ---
app.get('/api/tournaments', async (req, res) => {
  try {
    const [tournaments] = await db.query(`
      SELECT t.*, g.name as ground_name, g.city as location, 
      (SELECT name FROM sports WHERE id = (SELECT sport_id FROM ground_sports WHERE ground_id = g.id LIMIT 1)) as sport_name
      FROM tournaments t
      JOIN grounds g ON t.ground_id = g.id
      WHERE t.status = 'approved'
      ORDER BY t.start_date ASC
    `);
    res.json(tournaments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/tournaments/admin', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const [tournaments] = await db.query(`
      SELECT t.*, g.name as ground_name, u.name as owner_name 
      FROM tournaments t
      JOIN grounds g ON t.ground_id = g.id
      JOIN users u ON t.owner_id = u.id
      WHERE t.status = 'pending'
    `);
    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/tournaments/:id/status', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { status } = req.body;
    await db.query('UPDATE tournaments SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/tournaments', protect, async (req, res) => {
  try {
    const { ground_id, name, start_date, end_date, description } = req.body;
    await db.query(
      'INSERT INTO tournaments (owner_id, ground_id, name, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, ground_id, name, start_date, end_date, description]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/tournaments/:id/register', protect, async (req, res) => {
  try {
    const { team_name } = req.body;
    const tournament_id = req.params.id;
    
    const [existing] = await db.query(
      'SELECT * FROM tournament_registrations WHERE tournament_id = ? AND user_id = ?', 
      [tournament_id, req.user.id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'You have already registered for this tournament' });
    }
    
    await db.query(
      'INSERT INTO tournament_registrations (tournament_id, user_id, team_name) VALUES (?, ?, ?)',
      [tournament_id, req.user.id, team_name || null]
    );
    
    res.json({ success: true, message: 'Successfully registered for tournament' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- SLOTS & BOOKINGS ---
app.get('/api/slots', async (req, res) => {
  try {
    const { ground_id, sport_id, booking_date } = req.query;
    let sql = 'SELECT * FROM slots WHERE 1=1';
    let params = [];
    if (ground_id) { sql += ' AND ground_id = ?'; params.push(ground_id); }
    if (sport_id) { sql += ' AND sport_id = ?'; params.push(sport_id); }
    if (booking_date) { sql += ' AND booking_date = ?'; params.push(booking_date); }
    sql += ' ORDER BY start_time ASC';
    
    const [slots] = await db.query(sql, params);
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/slots', protect, async (req, res) => {
  try {
    const { ground_id, sport_id, booking_date, opening_time, closing_time, base_price, price_config } = req.body;
    
    const startHour = parseInt((opening_time || '06:00:00').split(':')[0]);
    const endHour = parseInt((closing_time || '22:00:00').split(':')[0]);
    
    for (let hour = startHour; hour < endHour; hour++) {
      const st = `${hour.toString().padStart(2, '0')}:00`;
      const et = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      let price = parseFloat(base_price) || 1000;
      if (price_config && Array.isArray(price_config)) {
        for (let conf of price_config) {
          const confStart = parseInt(conf.start.split(':')[0]);
          const confEnd = parseInt(conf.end.split(':')[0]);
          if (hour >= confStart && hour < confEnd) {
            price = parseFloat(conf.price);
          }
        }
      }
      
      const [existing] = await db.query(
        'SELECT id FROM slots WHERE ground_id = ? AND sport_id = ? AND booking_date = ? AND start_time = ?',
        [ground_id, sport_id, booking_date, st]
      );
      if (existing.length === 0) {
        await db.query(
          'INSERT INTO slots (ground_id, sport_id, booking_date, start_time, end_time, price, status) VALUES (?, ?, ?, ?, ?, ?, "available")',
          [ground_id, sport_id, booking_date, st, et, price]
        );
      }
    }
    
    res.json({ success: true, message: 'Slots generated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating slots' });
  }
});

app.patch('/api/slots/:id/block', protect, async (req, res) => {
  try {
    await db.query('UPDATE slots SET status = "blocked" WHERE id = ?', [req.params.id]);
    io.emit('slotStatusUpdated', { slotId: parseInt(req.params.id), status: 'blocked' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/slots/:id/unblock', protect, async (req, res) => {
  try {
    await db.query('UPDATE slots SET status = "available" WHERE id = ?', [req.params.id]);
    io.emit('slotStatusUpdated', { slotId: parseInt(req.params.id), status: 'available' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/bookings/my', protect, async (req, res) => {
  try {
    let sql = `
      SELECT b.id, b.user_id, b.slot_id, b.booking_ref, b.booking_ref as booking_reference,
             b.amount, b.status as booking_status, b.status, b.created_at,
             s.booking_date, s.start_time, s.end_time, s.price, s.ground_id,
             g.name as ground_name, g.city, g.address, g.main_photo,
             sp.name as sport_name,
             CASE WHEN b.status = 'confirmed' THEN 'paid'
                  WHEN b.status = 'cancelled' THEN 'cancelled'
                  ELSE 'pending' END as payment_status,
             (SELECT id FROM reviews WHERE booking_id = b.id LIMIT 1) as review_id
      FROM bookings b
      JOIN slots s ON b.slot_id = s.id
      JOIN grounds g ON s.ground_id = g.id
      JOIN sports sp ON s.sport_id = sp.id
    `;
    let params = [];
    if (req.user.role === 'user') {
      sql += ' WHERE b.user_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'owner') {
      sql += ' WHERE g.owner_id = ?';
      params.push(req.user.id);
    }
    sql += ' ORDER BY b.created_at DESC, s.booking_date DESC, s.start_time ASC';

    const [bookings] = await db.query(sql, params);
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
});

app.post('/api/bookings', protect, async (req, res) => {
  try {
    const { slot_id } = req.body;
    const [slots] = await db.query('SELECT * FROM slots WHERE id = ?', [slot_id]);
    if (slots.length === 0) return res.status(404).json({ message: 'Slot not found' });
    
    const slot = slots[0];
    const bookingRef = 'BKG' + Date.now();
    
    const [result] = await db.query(
      'INSERT INTO bookings (user_id, slot_id, booking_ref, amount, status) VALUES (?, ?, ?, ?, "pending")',
      [req.user.id, slot_id, bookingRef, slot.price]
    );
    
    res.json({ bookingId: result.insertId, bookingRef, amount: slot.price });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/bookings/:id/pay', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (status === 'success') {
      await db.query('UPDATE bookings SET status = "confirmed" WHERE id = ?', [req.params.id]);
      
      const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
      if (bookings.length > 0) {
        const slot_id = bookings[0].slot_id;
        await db.query('UPDATE slots SET status = "booked" WHERE id = ?', [slot_id]);
        
        const [slots] = await db.query('SELECT * FROM slots WHERE id = ?', [slot_id]);
        if (slots.length > 0) {
          const ground_id = slots[0].ground_id;
          const [grounds] = await db.query('SELECT * FROM grounds WHERE id = ?', [ground_id]);
          
          io.emit('slotStatusUpdated', { slotId: slot_id, status: 'booked', userId: req.user.id });
          
          await sendNotification(req.user.id, `Your booking for ${grounds[0]?.name || 'Arena'} on ${slots[0].booking_date} at ${slots[0].start_time} is confirmed.`);
          
          if (grounds[0]?.owner_id) {
            await sendNotification(grounds[0].owner_id, `New booking! ${req.user.name} booked a slot on ${slots[0].booking_date} at ${slots[0].start_time}.`);
          }
        }
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/bookings/:id/cancel', protect, async (req, res) => {
  try {
    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (bookings.length === 0) return res.status(404).json({ message: 'Booking not found' });
    const booking = bookings[0];
    
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    await db.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [req.params.id]);
    await db.query('UPDATE slots SET status = "available" WHERE id = ?', [booking.slot_id]);
    
    io.emit('slotStatusUpdated', { slotId: booking.slot_id, status: 'available' });
    
    res.json({ success: true, message: 'Booking cancelled successfully and slot freed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', protect, async (req, res) => {
  try {
    const [notifs] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/notifications/:id/read', protect, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const [users] = await db.query('SELECT COUNT(*) as count FROM users');
    const [grounds] = await db.query('SELECT COUNT(*) as count FROM grounds');
    const [bookings] = await db.query('SELECT COUNT(*) as count, SUM(amount) as revenue FROM bookings WHERE status = "confirmed"');
    res.json({
      totalUsers: users[0]?.count || 0,
      totalGrounds: grounds[0]?.count || 0,
      totalBookings: bookings[0]?.count || 0,
      totalRevenue: bookings[0]?.revenue || 0
    });
  } catch (err) {
    res.json({ totalUsers: 0, totalGrounds: 0, totalBookings: 0, totalRevenue: 0 });
  }
});

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Generic fallbacks for API
app.post('*', (req, res) => res.json({ success: true }));
app.put('*', (req, res) => res.json({ success: true }));
app.patch('*', (req, res) => res.json({ success: true }));
app.delete('*', (req, res) => res.json({ success: true }));

// For any other GET request, send the React index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await db.initDB();
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  }
);
}

// Export the Express app for Vercel serverless deployment
module.exports = app;

// Start the server only when run directly (local development)
if (require.main === module) {
  startServer();
}
