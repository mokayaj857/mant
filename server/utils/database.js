import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database connection
const dbPath = join(__dirname, '..', 'data', 'events.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create events table
const createEventsTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT NOT NULL,
      event_date TEXT NOT NULL,
      venue TEXT NOT NULL,
      regular_price TEXT,
      vip_price TEXT,
      vvip_price TEXT,
      description TEXT,
      flyer_image TEXT,
      creator_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

    db.exec(sql);
    console.log('✅ Events table created/verified');
};

// Initialize database
export const initDatabase = () => {
    try {
        createEventsTable();
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
};

// Insert new event
export const insertEvent = (eventData) => {
    const sql = `
    INSERT INTO events (
      event_name, event_date, venue, regular_price, 
      vip_price, vvip_price, description, flyer_image, creator_address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const stmt = db.prepare(sql);
    const result = stmt.run(
        eventData.eventName,
        eventData.eventDate,
        eventData.venue,
        eventData.regularPrice || null,
        eventData.vipPrice || null,
        eventData.vvipPrice || null,
        eventData.description || null,
        eventData.flyerImage || null,
        eventData.creatorAddress || null
    );

    return result.lastInsertRowid;
};

// Get all events
export const getAllEvents = () => {
    const sql = 'SELECT * FROM events ORDER BY created_at DESC';
    return db.prepare(sql).all();
};

// Get event by ID
export const getEventById = (id) => {
    const sql = 'SELECT * FROM events WHERE id = ?';
    return db.prepare(sql).get(id);
};

// Update event
export const updateEvent = (id, eventData) => {
    const sql = `
    UPDATE events 
    SET event_name = ?, event_date = ?, venue = ?, 
        regular_price = ?, vip_price = ?, vvip_price = ?,
        description = ?, flyer_image = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

    const stmt = db.prepare(sql);
    const result = stmt.run(
        eventData.eventName,
        eventData.eventDate,
        eventData.venue,
        eventData.regularPrice || null,
        eventData.vipPrice || null,
        eventData.vvipPrice || null,
        eventData.description || null,
        eventData.flyerImage || null,
        id
    );

    return result.changes;
};

// Delete event
export const deleteEvent = (id) => {
    const sql = 'DELETE FROM events WHERE id = ?';
    const stmt = db.prepare(sql);
    const result = stmt.run(id);
    return result.changes;
};

export default db;
