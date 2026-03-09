const fetch = require('node-fetch');

async function createAdmin() {
  try {
    const response = await fetch('http://localhost:3000/api/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `INSERT INTO users (username, password, email, is_admin, created_at)
                VALUES ('admin', '$2b$10$mbCZb2qC44kx7m2jc0hLk.WuTZpBQgQ7Y1yy/4PnYA5PBZpgUxO3K', 'admin@alleycatdumpsters.com', true, NOW())
                ON CONFLICT (username) DO NOTHING;`
      })
    });

    const result = await response.json();
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdmin();