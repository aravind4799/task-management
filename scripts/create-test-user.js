const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const db = new sqlite3.Database('taskdb.sqlite');

async function createTestUser() {
  try {
    // Wait a bit for backend to create tables
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create organization
    const orgId = uuidv4();
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO organizations (id, name, parentId, createdAt, updatedAt)
         VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
        [orgId, 'Test Organization', null],
        function(err) {
          if (err) {
            if (err.message.includes('no such table')) {
              console.log('Tables not created yet. Please ensure backend is running.');
              reject(err);
            } else if (err.message.includes('UNIQUE constraint')) {
              // Organization might already exist, get existing one
              db.get('SELECT id FROM organizations LIMIT 1', (err, row) => {
                if (row) {
                  resolve(row.id);
                } else {
                  reject(err);
                }
              });
            } else {
              reject(err);
            }
          } else {
            console.log(`✓ Organization created: ${orgId}`);
            resolve(orgId);
          }
        }
      );
    });

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userId = uuidv4();

    // Create user
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (id, email, password, role, organizationId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [userId, 'test@example.com', hashedPassword, 'owner', orgId],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint')) {
              console.log('✓ User already exists');
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log(`✓ User created successfully!`);
            console.log('\n=== Login Credentials ===');
            console.log('Email: test@example.com');
            console.log('Password: password123');
            console.log('Role: owner');
            console.log('Organization ID: ' + orgId);
            console.log('========================\n');
            resolve();
          }
        }
      );
    });

    db.close();
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nTrying alternative: Using API registration...');
    db.close();
    process.exit(1);
  }
}

createTestUser();

