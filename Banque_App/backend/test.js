const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const saltRounds = 10;
const password = 'MotDePasseSecurise123!';

async function main() {
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Hash bcrypt généré :', hash);

  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'banque_app'
  });
  
  
  // Supprimer l’ancien admin si existant
  await pool.query("DELETE FROM users WHERE email = 'admin@example.com'");

  // Insérer le nouvel admin
  await pool.query(
    `INSERT INTO users (email, password_hash, role, phone_number, created_at, last_login, failed_attempts, lock_until)
     VALUES (?, ?, 'admin', '+21600000000', NOW(), NULL, 0, NULL)`,
    ['admin@example.com', hash]
  );

  console.log('Admin créé avec succès !');
  process.exit();
}

main();
