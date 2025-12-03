// server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db'); // connexion MySQL
const crypto = require("crypto");
const helmet = require("helmet");
require('dotenv').config();

const app = express();
app.use(cors({
  origin: 'http://localhost:3000', // ton frontend
  credentials: true // autorise l'envoi des cookies
}));
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(helmet());
// 🔥 RAJOUTER ICI : middleware refreshSession (avant authenticateToken)
function refreshSession(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return next();

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const now = Math.floor(Date.now() / 1000);

    // Si expiration dans moins de 5 minutes → Renvoie un nouveau token
    if (decoded.exp - now < 5 * 60) {
      const newToken = jwt.sign(
        { id_user: decoded.id_user, role: decoded.role, id_client: decoded.id_client },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      res.setHeader('x-refresh-token', newToken);
    }

    req.user = decoded;
    next();
  } catch (err) {
    next(); // Token expiré → authenticateToken s'occupera du reste
  }
}
async function logSecurity(id_user, action, status, req) {
  try {
    await pool.query(
      `INSERT INTO logs_security (id_user, action, ip_address, user_agent, status)
       VALUES (?, ?, ?, ?, ?)`,
      [id_user, action, req.ip, req.get("user-agent"), status]
    );
  } catch (err) {
    console.error("Erreur insertion logs_security:", err);
  }
}

app.use(refreshSession); // <--- IMPORTANT : doit être avant authenticateToken

// Stockage temporaire des OTPs (clé: userId, valeur: otp)
const otpStore = {};

// Middleware pour vérifier JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalide' });
    req.user = user;
    next();
  });
};

// Générer OTP aléatoire
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const {sendOTP} = require("./emailService");

// Login (mise à jour)
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 10 * 60 * 1000; // 10 minutes

app.post('/api/login', async (req, res) => {
      function cleanInput(input) {
      if (!input) return "";
      return input.replace(/[<>/'"]/g, ""); // retire les caractères dangereux
    }
  const email = cleanInput(req.body.email);
  const password = req.body.password.trim();

  try {
    const [rows] = await pool.query(`SELECT u.*, c.id_client, c.first_name, c.last_name 
      FROM users u LEFT JOIN clients c ON u.id_user = c.id_user WHERE u.email = ?`, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = rows[0];

    // Vérifier si le compte est verrouillé
    const now = Date.now();
    if (user.lock_until && now < new Date(user.lock_until).getTime()) {
      const minutes = Math.ceil((new Date(user.lock_until).getTime() - now) / 60000);
      return res.status(403).json({ message: `Compte bloqué. Réessayez dans ${minutes} minutes.` });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      await logSecurity(user.id_user, "Connexion", "échouée", req);
      let failed = user.failed_attempts + 1;
      if (failed >= MAX_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCK_TIME);
        await pool.query("UPDATE users SET failed_attempts = ?, lock_until = ? WHERE id_user = ?", [failed, lockUntil, user.id_user]);
        await logSecurity(user.id_user, "Blocage compte", "échouée", req);
        return res.status(403).json({ message: `Trop de tentatives. Compte bloqué pendant 10 minutes.` });
        
      } else {
        await pool.query("UPDATE users SET failed_attempts = ? WHERE id_user = ?", [failed, user.id_user]);
      }
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    await logSecurity(user.id_user, "Connexion", "réussie", req);


    // Reset tentatives si succès
    await pool.query("UPDATE users SET failed_attempts = 0, lock_until = NULL WHERE id_user = ?", [user.id_user]);

    // Générer JWT avec expiration (15 min)
    const token = jwt.sign(
      { id_user: user.id_user, role: user.role, id_client: user.id_client },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    function generateSecureOTP_Admin() {
      return crypto.randomBytes(4).toString("hex").toUpperCase(); // ex : "A7F3D9C1"
    }

    // OTP pour client
    let needsOTP = false;
    if (user.role === 'client' || user.role === 'support'|| user.role==='admin'){
      needsOTP = true;
      const otp=generateSecureOTP_Admin()
      otpStore[user.id_user] = otp;
      await sendOTP(user.email, otp);
      console.log(`OTP pour ${user.email}: ${otp}`);
    }

    res.json({ success: true, token, user: { id_user: user.id_user, id_client: user.id_client, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role }, needsOTP });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// Vérification OTP
app.post('/api/verify-otp', async (req, res) => {
  const { otp, userId } = req.body;

  // Vérification de base
  if (!userId || !otpStore[userId]) {
    await logSecurity(userId, "Vérification OTP", "échouée", req);
    return res.status(401).json({ success: false, message: 'OTP invalide' });
  }

  // Vérification OTP correcte
  if (otpStore[userId] === otp) {
    delete otpStore[userId]; // OTP consommé
    await logSecurity(userId, "Vérification OTP", "réussie", req);
    return res.json({ success: true });
  }

  // OTP incorrect
  await logSecurity(userId, "Vérification OTP", "échouée", req);
  return res.status(401).json({ success: false, message: 'OTP invalide' });
});

// Inscription (Signup)
// Inscription (Signup)
app.post('/api/signup', async (req, res) => {
  const { email, password, firstName, lastName, phone, address, dateOfBirth } = req.body;
  
  const connection = await pool.getConnection();
  
  try {
    // Validation des champs obligatoires
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Email, mot de passe, prénom et nom sont obligatoires' });
    }

    // Vérifier que l'email n'existe pas déjà
    const [existingUsers] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }

    // Commencer une transaction
    await connection.beginTransaction();

    // Hasher le mot de passe
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 1. Insérer dans la table users (role par défaut: 'client')
    const [userResult] = await connection.query(
      'INSERT INTO users (email, password_hash, role, phone_number, last_login) VALUES (?, ?, ?, ?, NOW())',
      [email, passwordHash, 'client', phone || null]
    );

    const userId = userResult.insertId;

    // 2. Insérer dans la table clients
    const [clientResult] = await connection.query(
      'INSERT INTO clients (id_user, first_name, last_name, address, date_of_birth) VALUES (?, ?, ?, ?, ?)',
      [userId, firstName, lastName, address || null, dateOfBirth || null]
    );

    const clientId = clientResult.insertId;

    // 3. Créer un compte courant par défaut pour le nouveau client
    const accountNumber = `TN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const rib = `${accountNumber.slice(0, 20)}`; // RIB simplifié
    const iban = `TN59${accountNumber}`; // IBAN simplifié

    await connection.query(
      'INSERT INTO accounts (id_client, account_number, rib, iban, balance, account_type) VALUES (?, ?, ?, ?, ?, ?)',
      [clientId, accountNumber, rib, iban, 0, 'courant']
    );

    // Valider la transaction
    await connection.commit();

    // Générer token JWT
    const token = jwt.sign(
      { id_user: userId, role: 'client', id_client: clientId }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    // Log de sécurité
    await pool.query(
      'INSERT INTO logs_security (id_user, action, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?)',
      [userId, 'Inscription', req.ip, req.get('user-agent'), 'réussie']
    );

    res.status(201).json({ 
      success: true, 
      token,
      user: { 
        id_user: userId,
        id_client: clientId,
        email, 
        firstName, 
        lastName,
        role: 'client' 
      },
      message: 'Inscription réussie ! Un compte courant a été créé automatiquement.' 
    });
  } catch (err) {
    // Annuler la transaction en cas d'erreur
    await connection.rollback();
    console.error('Erreur lors de l\'inscription:', err);
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
  } finally {
    connection.release();
  }
});

// Exemple route protégée
    app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({ message: `Bonjour ${req.user.id_user}, vous êtes connecté !` });
    });

// Renvoyer un nouvel OTP
    // Renvoyer un nouvel OTP
app.post('/api/resend-otp', async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ success: false, message: 'userId manquant' });

  if (!otpStore[userId]) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé ou OTP déjà validé' });

  // Générer un nouvel OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[userId] = otp;

  try {
    // Récupérer l'email depuis la base
    const [rows] = await pool.query('SELECT email FROM users WHERE id_user = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }
    const email = rows[0].email;

    // Envoyer le nouvel OTP
    await sendOTP(email, otp);

    console.log(`Nouveau OTP pour ${email}: ${otp}`);

    res.json({ success: true, message: 'Nouveau code OTP envoyé' });
  } catch (err) {
    console.error('Erreur envoi OTP:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'envoi de l\'OTP' });
  }
});

// Récupérer comptes et transactions d'un client
// Ajouter APRÈS la route /api/client/:id_client dans index.js

// Récupérer les informations du client connecté
app.get('/api/client-info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id_user;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non authentifié' 
      });
    }

    const [rows] = await pool.query(
      'SELECT c.id_client, c.first_name, c.last_name, c.address, c.date_of_birth FROM clients c WHERE c.id_user = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client non trouvé' 
      });
    }
    
    res.json({ success: true, client: rows[0] });
  } catch (err) {
    console.error('Erreur /client-info:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Récupérer les comptes du client connecté
app.get('/api/accounts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id_user;
    
    const [accounts] = await pool.query(
      `SELECT a.id_account, a.account_number, a.iban, a.rib, a.balance, a.account_type 
       FROM accounts a
       JOIN clients c ON a.id_client = c.id_client
       WHERE c.id_user = ?`,
      [userId]
    );
    
    res.json({ success: true, accounts });
  } catch (err) {
    console.error('Erreur /accounts:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      accounts: [] 
    });
  }
});
// Mettre à jour le profil client
app.put('/api/update-profile', authenticateToken, async (req, res) => {
  const { firstName, lastName, address, dateOfBirth } = req.body;
  const userId = req.user.id_user;

  try {
    await pool.query(
      'UPDATE clients SET first_name = ?, last_name = ?, address = ?, date_of_birth = ? WHERE id_user = ?',
      [firstName, lastName, address || null, dateOfBirth || null, userId]
    );

    res.json({ success: true, message: 'Profil mis à jour avec succès' });
  } catch (err) {
    console.error('Erreur mise à jour profil:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Changer le mot de passe
app.put('/api/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id_user;

  try {
    // Récupérer le mot de passe actuel
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id_user = ?', [userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe actuel
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    
    if (!valid) {
      await logSecurity(user.id_user, "Changement mot de passe", "échouée", req);

      return res.status(401).json({ success: false, message: 'Mot de passe actuel incorrect' });
    }

    // Hasher le nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Mettre à jour
    await pool.query('UPDATE users SET password_hash = ? WHERE id_user = ?', [newPasswordHash, userId]);
    await logSecurity(user.id_user, "Changement mot de passe", "réussie", req);

    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    console.error('Erreur changement mot de passe:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Récupérer les transactions du client connecté
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id_user;
    
    const [transactions] = await pool.query(
      `SELECT t.id_transaction, t.id_account_from, t.id_account_to, t.amount, t.status, t.created_at
       FROM transactions t
       WHERE t.id_account_from IN (
         SELECT a.id_account 
         FROM accounts a
         JOIN clients c ON a.id_client = c.id_client
         WHERE c.id_user = ?
       )
       ORDER BY t.created_at DESC
       LIMIT 10`,
      [userId]
    );
    
    res.json({ success: true, transactions });
  } catch (err) {
    console.error('Erreur /transactions:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      transactions: [] 
    });
  }
});


// =============================================
// 🎫 ROUTES SUPPORT - DÉBUT
// =============================================

app.post('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { subject, message, priority } = req.body;
    const userId = req.user.id_user;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Sujet et message requis' });
    }

    const [clients] = await pool.query(
      'SELECT id_client FROM clients WHERE id_user = ?',
      [userId]
    );

    if (clients.length === 0) {
      return res.status(403).json({ message: 'Client non trouvé' });
    }

    const clientId = clients[0].id_client;

    // ✅ CORRECTION : Utiliser 'open' au lieu de 'ouvert'
    const [result] = await pool.query(
      'INSERT INTO tickets (id_client, subject, description, status, priority) VALUES (?, ?, ?, ?, ?)',
      [clientId, subject, message, 'open', priority || 'medium']
    );

    const [newTickets] = await pool.query(`
      SELECT 
        t.*,
        c.first_name,
        c.last_name,
        u.id_user as user_id
      FROM tickets t
      INNER JOIN clients c ON t.id_client = c.id_client
      INNER JOIN users u ON c.id_user = u.id_user
      WHERE t.id_ticket = ?
    `, [result.insertId]);

    const newTicket = newTickets[0];

    const formattedTicket = {
      id: `tick${newTicket.id_ticket}`,
      userId: newTicket.user_id.toString(),
      userName: `${newTicket.first_name} ${newTicket.last_name}`,
      subject: newTicket.subject,
      message: newTicket.description,
      status: 'open',
      priority: newTicket.priority || 'medium',
      createdAt: newTicket.created_at,
      updatedAt: newTicket.updated_at,
      responses: []
    };

    res.status(201).json(formattedTicket);
  } catch (error) {
    console.error('Erreur lors de la création du ticket:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 2️⃣ Corriger le mapping des statuts dans GET /api/tickets (ligne ~495)
app.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { status, search } = req.query;
    const userId = req.user.id_user;
    const userRole = req.user.role;

    let query = `
      SELECT 
        t.id_ticket,
        t.subject,
        t.description as message,
        t.status,
        t.priority,
        t.created_at,
        t.updated_at,
        c.first_name,
        c.last_name,
        c.id_client,
        u.id_user as user_id,
        (SELECT COUNT(*) FROM ticket_responses WHERE id_ticket = t.id_ticket) as response_count
      FROM tickets t
      INNER JOIN clients c ON t.id_client = c.id_client
      INNER JOIN users u ON c.id_user = u.id_user
      WHERE 1=1
    `;

    const params = [];

    if (userRole === 'client') {
      query += ' AND u.id_user = ?';
      params.push(userId);
    }

    // ✅ CORRECTION : Mapping correct
    if (status && status !== 'all') {
      const statusMap = {
        'open': 'open',
        'in_progress': 'in_progress',
        'resolved': 'resolved'
      };
      query += ' AND t.status = ?';
      params.push(statusMap[status] || status);
    }

    if (search) {
      query += ' AND (t.subject LIKE ? OR t.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY t.created_at DESC';

    const [tickets] = await pool.query(query, params);

    // ✅ CORRECTION : Pas besoin de mapper, utiliser directement le statut
    const formattedTickets = tickets.map(ticket => ({
      id: `tick${ticket.id_ticket}`,
      userId: ticket.user_id.toString(),
      userName: `${ticket.first_name} ${ticket.last_name}`,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status, // Utiliser directement sans mapping
      priority: ticket.priority || 'medium',
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      responses: []
    }));

    res.json(formattedTickets);
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 3️⃣ Corriger GET /api/tickets/:id (ligne ~530)
app.get('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id.replace('tick', '');
    const userId = req.user.id_user;
    const userRole = req.user.role;

    let query = `
      SELECT 
        t.*,
        c.first_name,
        c.last_name,
        c.id_client,
        u.id_user as user_id
      FROM tickets t
      INNER JOIN clients c ON t.id_client = c.id_client
      INNER JOIN users u ON c.id_user = u.id_user
      WHERE t.id_ticket = ?
    `;

    const params = [ticketId];

    if (userRole === 'client') {
      query += ' AND u.id_user = ?';
      params.push(userId);
    }

    const [tickets] = await pool.query(query, params);

    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }

    const ticket = tickets[0];

    const [responses] = await pool.query(`
      SELECT 
        tr.*,
        u.email,
        COALESCE(c.first_name, 'Support') as first_name,
        COALESCE(c.last_name, '') as last_name
      FROM ticket_responses tr
      INNER JOIN users u ON tr.id_user = u.id_user
      LEFT JOIN clients c ON u.id_user = c.id_user
      WHERE tr.id_ticket = ?
      ORDER BY tr.created_at ASC
    `, [ticketId]);

    // ✅ CORRECTION : Pas de mapping nécessaire
    const formattedTicket = {
      id: `tick${ticket.id_ticket}`,
      userId: ticket.user_id.toString(),
      userName: `${ticket.first_name} ${ticket.last_name}`,
      subject: ticket.subject,
      message: ticket.description,
      status: ticket.status, // Utiliser directement
      priority: ticket.priority || 'medium',
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      responses: responses.map((resp, index) => ({
        id: `resp${index + 1}`,
        userId: resp.id_user.toString(),
        userName: `${resp.first_name} ${resp.last_name}`.trim(),
        message: resp.message,
        createdAt: resp.created_at
      }))
    };

    res.json(formattedTicket);
  } catch (error) {
    console.error('Erreur lors de la récupération du ticket:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 4️⃣ Corriger POST /api/tickets/:id/responses (ligne ~615)
app.post('/api/tickets/:id/responses', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id.replace('tick', '');
    const { message } = req.body;
    const userId = req.user.id_user;
    const userRole = req.user.role;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message requis' });
    }

    let query = `
      SELECT t.*, c.id_client, u.id_user as owner_id
      FROM tickets t
      INNER JOIN clients c ON t.id_client = c.id_client
      INNER JOIN users u ON c.id_user = u.id_user
      WHERE t.id_ticket = ?
    `;
    const params = [ticketId];

    if (userRole === 'client') {
      query += ' AND u.id_user = ?';
      params.push(userId);
    }

    const [tickets] = await pool.query(query, params);

    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }

    const ticket = tickets[0];

    await pool.query(
      'INSERT INTO ticket_responses (id_ticket, id_user, message) VALUES (?, ?, ?)',
      [ticketId, userId, message]
    );

    // ✅ CORRECTION : Utiliser 'in_progress' au lieu de 'en traitement'
    if (userRole === 'support' && ticket.status === 'open') {
      await pool.query(
        'UPDATE tickets SET status = ?, id_support = ? WHERE id_ticket = ?',
        ['in_progress', userId, ticketId]
      );
    }

    res.status(201).json({ message: 'Réponse ajoutée avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la réponse:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 5️⃣ Corriger PATCH /api/tickets/:id/resolve (ligne ~655)
app.patch('/api/tickets/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id.replace('tick', '');
    const userId = req.user.id_user;
    const userRole = req.user.role;

    if (userRole !== 'support') {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    // ✅ CORRECTION : Utiliser 'resolved' directement
    const [result] = await pool.query(
      'UPDATE tickets SET status = ? WHERE id_ticket = ?',
      ['resolved', ticketId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }

    res.json({ message: 'Ticket marqué comme résolu' });
  } catch (error) {
    console.error('Erreur lors de la résolution du ticket:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});// =============================================
// 🎫 ROUTES SUPPORT - FIN
// =============================================
// =============================================
// 🔐 ROUTES ADMIN - DÉBUT
// =============================================

// Middleware pour vérifier le rôle admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé. Administrateurs uniquement.' });
  }
  next();
};

// =============================================
// 📊 STATISTIQUES GLOBALES
// =============================================

app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Compter les utilisateurs par rôle
    const [userStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'client' THEN 1 ELSE 0 END) as client_users,
        SUM(CASE WHEN role = 'support' THEN 1 ELSE 0 END) as support_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users
      FROM users
    `);

    // Compter les transactions
    const [transactionStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'réussie' THEN amount ELSE 0 END) as total_volume,
        SUM(CASE WHEN status = 'en attente' THEN 1 ELSE 0 END) as pending_transactions,
        SUM(CASE WHEN status = 'réussie' THEN 1 ELSE 0 END) as completed_transactions,
        SUM(CASE WHEN status = 'refusée' THEN 1 ELSE 0 END) as failed_transactions
      FROM transactions
    `);

    // Compter les tickets
    const [ticketStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_tickets,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tickets,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_tickets
      FROM tickets
    `);

    res.json({
      success: true,
      stats: {
        users: userStats[0],
        transactions: transactionStats[0],
        tickets: ticketStats[0]
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// =============================================
// 👥 GESTION DES UTILISATEURS
// =============================================

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, search } = req.query;

    let query = `
      SELECT 
        u.id_user,
        u.email,
        u.role,
        u.phone_number,
        u.created_at,
        u.last_login,
        u.failed_attempts,
        u.lock_until,
        c.first_name,
        c.last_name,
        c.address,
        c.date_of_birth
      FROM users u
      LEFT JOIN clients c ON u.id_user = c.id_user
      WHERE 1=1
    `;

    const params = [];

    if (role && role !== 'all') {
      query += ' AND u.role = ?';
      params.push(role);
    }

    if (search) {
      query += ' AND (u.email LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY u.created_at DESC';

    const [users] = await pool.query(query, params);

    const formattedUsers = users.map(user => ({
      id: user.id_user,
      email: user.email,
      name: user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user.email.split('@')[0],
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      phoneNumber: user.phone_number,
      address: user.address,
      dateOfBirth: user.date_of_birth,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      failedAttempts: user.failed_attempts || 0,
      isLocked: user.lock_until && new Date(user.lock_until) > new Date(),
      lockUntil: user.lock_until
    }));

    res.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const [users] = await pool.query(`
      SELECT 
        u.*,
        c.first_name,
        c.last_name,
        c.address,
        c.date_of_birth,
        c.id_client
      FROM users u
      LEFT JOIN clients c ON u.id_user = c.id_user
      WHERE u.id_user = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    // Récupérer les comptes si c'est un client
    let accounts = [];
    if (user.id_client) {
      [accounts] = await pool.query(
        'SELECT * FROM accounts WHERE id_client = ?',
        [user.id_client]
      );
    }

    // Récupérer l'historique des connexions
    const [loginHistory] = await pool.query(
      'SELECT * FROM logs_security WHERE id_user = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    res.json({
      success: true,
      user: {
        ...user,
        accounts,
        loginHistory
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Mettre à jour un utilisateur
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { email, role, phoneNumber, firstName, lastName, address, dateOfBirth } = req.body;

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Mettre à jour la table users
      await connection.query(
        'UPDATE users SET email = ?, role = ?, phone_number = ? WHERE id_user = ?',
        [email, role, phoneNumber, userId]
      );

      // Si c'est un client, mettre à jour la table clients
      if (role === 'client' && (firstName || lastName || address || dateOfBirth)) {
        const [clients] = await connection.query(
          'SELECT id_client FROM clients WHERE id_user = ?',
          [userId]
        );

        if (clients.length > 0) {
          await connection.query(
            'UPDATE clients SET first_name = ?, last_name = ?, address = ?, date_of_birth = ? WHERE id_user = ?',
            [firstName, lastName, address, dateOfBirth, userId]
          );
        }
      }

      await connection.commit();
      res.json({ success: true, message: 'Utilisateur mis à jour avec succès' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Supprimer un utilisateur
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Vérifier que l'admin ne se supprime pas lui-même
    if (parseInt(userId) === req.user.id_user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vous ne pouvez pas supprimer votre propre compte' 
      });
    }

    const [result] = await pool.query('DELETE FROM users WHERE id_user = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});
// Vérifie la session de l’utilisateur
app.get('/api/check-session', async (req, res) => {
  try {
    // Vérifier le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.json({ authenticated: false });

    const token = authHeader.split(' ')[1];
    if (!token) return res.json({ authenticated: false });

    // Vérifier et décoder le JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l’utilisateur depuis la base
    const [rows] = await pool.query('SELECT u.*, c.id_client, c.first_name, c.last_name FROM users u LEFT JOIN clients c ON u.id_user = c.id_user WHERE u.id_user = ?', [decoded.id_user]);
    
    if (rows.length === 0) return res.json({ authenticated: false });

    const user = rows[0];

    res.json({ authenticated: true, user: { 
      id_user: user.id_user, 
      id_client: user.id_client, 
      email: user.email, 
      firstName: user.first_name, 
      lastName: user.last_name, 
      role: user.role 
    }});
  } catch (err) {
    console.error(err);
    res.json({ authenticated: false });
  }
});


// Débloquer un utilisateur
app.post('/api/admin/users/:id/unlock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    await pool.query(
      'UPDATE users SET failed_attempts = 0, lock_until = NULL WHERE id_user = ?',
      [userId]
    );

    res.json({ success: true, message: 'Compte débloqué avec succès' });
  } catch (error) {
    console.error('Erreur lors du déblocage du compte:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Changer le rôle d'un utilisateur
app.patch('/api/admin/users/:id/change-role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { newRole } = req.body;

    // Vérifier que l'admin ne change pas son propre rôle
    if (parseInt(userId) === req.user.id_user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vous ne pouvez pas modifier votre propre rôle' 
      });
    }

    // Vérifier que le rôle est valide
    if (!['client', 'support', 'admin'].includes(newRole)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rôle invalide' 
      });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Récupérer l'ancien rôle
      const [users] = await connection.query(
        'SELECT role FROM users WHERE id_user = ?',
        [userId]
      );

      if (users.length === 0) {
        await connection.rollback();
        return res.status(404).json({ 
          success: false, 
          message: 'Utilisateur non trouvé' 
        });
      }

      const oldRole = users[0].role;

      // Mettre à jour le rôle
      await connection.query(
        'UPDATE users SET role = ? WHERE id_user = ?',
        [newRole, userId]
      );

      // Si on passe à client, vérifier/créer les entrées nécessaires
      if (newRole === 'client' && oldRole !== 'client') {
        // Vérifier si l'utilisateur a déjà une entrée client
        const [clients] = await connection.query(
          'SELECT id_client FROM clients WHERE id_user = ?',
          [userId]
        );

        // Si pas d'entrée client, en créer une
        if (clients.length === 0) {
          const [userInfo] = await connection.query(
            'SELECT email FROM users WHERE id_user = ?',
            [userId]
          );
          
          await connection.query(
            'INSERT INTO clients (id_user, first_name, last_name) VALUES (?, ?, ?)',
            [userId, 'À compléter', 'À compléter']
          );

          // Créer un compte par défaut
          const [clientResult] = await connection.query(
            'SELECT id_client FROM clients WHERE id_user = ?',
            [userId]
          );
          const clientId = clientResult[0].id_client;

          const accountNumber = `TN${Date.now()}${Math.floor(Math.random() * 1000)}`;
          const rib = `${accountNumber.slice(0, 20)}`;
          const iban = `TN59${accountNumber}`;

          await connection.query(
            'INSERT INTO accounts (id_client, account_number, rib, iban, balance, account_type) VALUES (?, ?, ?, ?, ?, ?)',
            [clientId, accountNumber, rib, iban, 0, 'courant']
          );
        }
      }

      // Log de sécurité
      await connection.query(
        'INSERT INTO logs_security (id_user, action, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?)',
        [req.user.id_user, `Changement de rôle: ${oldRole} → ${newRole} pour user ${userId}`, req.ip, req.get('user-agent'), 'réussie']
      );

      await connection.commit();

      res.json({ 
        success: true, 
        message: `Rôle changé de ${oldRole} à ${newRole} avec succès`,
        oldRole,
        newRole
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erreur lors du changement de rôle:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Réinitialiser le mot de passe d'un utilisateur
app.post('/api/admin/users/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = ?, failed_attempts = 0, lock_until = NULL WHERE id_user = ?',
      [passwordHash, userId]
    );

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// =============================================
// 📝 LOGS DE SÉCURITÉ
// =============================================

app.get('/api/admin/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type, severity, userId, startDate, endDate, limit = 50 } = req.query;

    let query = `
      SELECT 
        ls.*,
        u.email,
        c.first_name,
        c.last_name
      FROM logs_security ls
      INNER JOIN users u ON ls.id_user = u.id_user
      LEFT JOIN clients c ON u.id_user = c.id_user
      WHERE 1=1
    `;

    const params = [];

    if (type) {
      query += ' AND ls.action LIKE ?';
      params.push(`%${type}%`);
    }

    if (severity) {
      query += ' AND ls.status = ?';
      params.push(severity);
    }

    if (userId) {
      query += ' AND ls.id_user = ?';
      params.push(userId);
    }

    if (startDate) {
      query += ' AND ls.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND ls.created_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY ls.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [logs] = await pool.query(query, params);

    const formattedLogs = logs.map(log => ({
      id: log.id_log,
      userId: log.id_user,
      user: log.first_name && log.last_name 
        ? `${log.first_name} ${log.last_name}` 
        : log.email,
      email: log.email,
      action: log.action,
      type: log.action.toLowerCase().replace(/ /g, '_'),
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      status: log.status,
      severity: log.status === 'échouée' ? 'warning' : 'info',
      timestamp: log.created_at,
      createdAt: log.created_at
    }));

    res.json({ success: true, logs: formattedLogs });
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});


// =============================================
// 💰 TRANSACTIONS (vue admin)
// =============================================

app.get('/api/admin/transactions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, startDate, endDate, minAmount, maxAmount, limit = 50 } = req.query;

    let query = `
      SELECT 
        t.*,
        a1.account_number as from_account,
        a2.account_number as to_account,
        c1.first_name as from_first_name,
        c1.last_name as from_last_name,
        c2.first_name as to_first_name,
        c2.last_name as to_last_name
      FROM transactions t
      INNER JOIN accounts a1 ON t.id_account_from = a1.id_account
      INNER JOIN accounts a2 ON t.id_account_to = a2.id_account
      INNER JOIN clients c1 ON a1.id_client = c1.id_client
      INNER JOIN clients c2 ON a2.id_client = c2.id_client
      WHERE 1=1
    `;

    const params = [];

    if (status && status !== 'all') {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (startDate) {
      query += ' AND t.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND t.created_at <= ?';
      params.push(endDate);
    }

    if (minAmount) {
      query += ' AND t.amount >= ?';
      params.push(parseFloat(minAmount));
    }

    if (maxAmount) {
      query += ' AND t.amount <= ?';
      params.push(parseFloat(maxAmount));
    }

    query += ' ORDER BY t.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [transactions] = await pool.query(query, params);

    const formattedTransactions = transactions.map(t => ({
      id: t.id_transaction,
      fromAccount: t.from_account,
      toAccount: t.to_account,
      fromName: `${t.from_first_name} ${t.from_last_name}`,
      toName: `${t.to_first_name} ${t.to_last_name}`,
      recipient: `${t.to_first_name} ${t.to_last_name}`,
      amount: parseFloat(t.amount),
      currency: t.currency,
      status: t.status,
      reason: t.reason,
      date: t.created_at,
      createdAt: t.created_at,
      confirmedAt: t.confirmed_at
    }));

    res.json({ success: true, transactions: formattedTransactions });
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// =============================================
// 🎫 TICKETS (vue admin - tous les tickets)
// =============================================

app.get('/api/admin/tickets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, priority, search } = req.query;

    let query = `
      SELECT 
        t.*,
        c.first_name,
        c.last_name,
        u.email,
        u.id_user as user_id,
        s.email as support_email,
        sc.first_name as support_first_name,
        sc.last_name as support_last_name,
        (SELECT COUNT(*) FROM ticket_responses WHERE id_ticket = t.id_ticket) as response_count
      FROM tickets t
      INNER JOIN clients c ON t.id_client = c.id_client
      INNER JOIN users u ON c.id_user = u.id_user
      LEFT JOIN users s ON t.id_support = s.id_user
      LEFT JOIN clients sc ON s.id_user = sc.id_user
      WHERE 1=1
    `;

    const params = [];

    if (status && status !== 'all') {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (priority && priority !== 'all') {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    if (search) {
      query += ' AND (t.subject LIKE ? OR t.description LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY t.created_at DESC';

    const [tickets] = await pool.query(query, params);

    const formattedTickets = tickets.map(ticket => ({
      id: `tick${ticket.id_ticket}`,
      userId: ticket.user_id.toString(),
      userName: `${ticket.first_name} ${ticket.last_name}`,
      userEmail: ticket.email,
      subject: ticket.subject,
      message: ticket.description,
      status: ticket.status,
      priority: ticket.priority || 'medium',
      assignedTo: ticket.id_support 
        ? (ticket.support_first_name 
            ? `${ticket.support_first_name} ${ticket.support_last_name}` 
            : ticket.support_email)
        : null,
      responseCount: ticket.response_count,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at
    }));

    res.json({ success: true, tickets: formattedTickets });
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Assigner un ticket à un agent support
app.patch('/api/admin/tickets/:id/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const ticketId = req.params.id.replace('tick', '');
    const { supportId } = req.body;

    await pool.query(
      'UPDATE tickets SET id_support = ?, status = ? WHERE id_ticket = ?',
      [supportId, 'in_progress', ticketId]
    );

    res.json({ success: true, message: 'Ticket assigné avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'assignation du ticket:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// =============================================
// 🔒 SÉCURITÉ - Alertes et paramètres
// =============================================

app.get('/api/admin/security/alerts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Détecter les tentatives de connexion suspectes
    const [suspiciousLogins] = await pool.query(`
SELECT 
  ls.ip_address,
  COUNT(*) as attempt_count,
  MAX(ls.created_at) as last_attempt,
  GROUP_CONCAT(DISTINCT u.email) as targeted_accounts
FROM logs_security ls
INNER JOIN users u ON ls.id_user = u.id_user
WHERE ls.status = 'échouée'
  AND ls.action LIKE '%connexion%'
  AND ls.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY ls.ip_address
HAVING attempt_count >= 3
ORDER BY attempt_count DESC;

    `);

    // Détecter les transactions inhabituelles
    const [unusualTransactions] = await pool.query(`
      SELECT 
        t.*,
        a.account_number,
        c.first_name,
        c.last_name
      FROM transactions t
      INNER JOIN accounts a ON t.id_account_from = a.id_account
      INNER JOIN clients c ON a.id_client = c.id_client
      WHERE t.amount > 5000
        AND t.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY t.created_at DESC
      LIMIT 10
    `);

    // Comptes récemment verrouillés
    const [lockedAccounts] = await pool.query(`
      SELECT 
        u.id_user,
        u.email,
        u.lock_until,
        u.failed_attempts,
        c.first_name,
        c.last_name
      FROM users u
      LEFT JOIN clients c ON u.id_user = c.id_user
      WHERE u.lock_until > NOW()
      ORDER BY u.lock_until DESC
    `);

    res.json({
      success: true,
      alerts: {
        suspiciousLogins: suspiciousLogins.map(sl => ({
          type: 'suspicious_login',
          severity: sl.attempt_count >= 5 ? 'critical' : 'warning',
          ipAddress: sl.ip_address,
          attemptCount: sl.attempt_count,
          lastAttempt: sl.last_attempt,
          targetedAccounts: sl.targeted_accounts,
          message: `${sl.attempt_count} tentatives de connexion échouées depuis l'IP ${sl.ip_address}`
        })),
        unusualTransactions: unusualTransactions.map(t => ({
          type: 'unusual_transaction',
          severity: 'warning',
          transactionId: t.id_transaction,
          amount: parseFloat(t.amount),
          accountNumber: t.account_number,
          userName: `${t.first_name} ${t.last_name}`,
          createdAt: t.created_at,
          message: `Virement de ${t.amount} ${t.currency} détecté`
        })),
        lockedAccounts: lockedAccounts.map(acc => ({
          type: 'locked_account',
          severity: 'info',
          userId: acc.id_user,
          email: acc.email,
          userName: acc.first_name && acc.last_name 
            ? `${acc.first_name} ${acc.last_name}` 
            : acc.email,
          lockUntil: acc.lock_until,
          failedAttempts: acc.failed_attempts,
          message: `Compte verrouillé après ${acc.failed_attempts} tentatives échouées`
        }))
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes de sécurité:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Bloquer une adresse IP
app.post('/api/admin/security/block-ip', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { ipAddress, reason } = req.body;

    // Créer une table blocked_ips si elle n'existe pas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL UNIQUE,
        reason VARCHAR(255),
        blocked_by INT NOT NULL,
        blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (blocked_by) REFERENCES users(id_user) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await pool.query(
      'INSERT INTO blocked_ips (ip_address, reason, blocked_by) VALUES (?, ?, ?)',
      [ipAddress, reason, req.user.id_user]
    );

    res.json({ success: true, message: `IP ${ipAddress} bloquée avec succès` });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Cette IP est déjà bloquée' });
    }
    console.error('Erreur lors du blocage de l\'IP:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// =============================================
// 🔐 ROUTES ADMIN - FIN
// =============================================
// =============================================
// 💸 ROUTES TRANSFER - DÉBUT
// =============================================

// Récupérer les bénéficiaires d'un client
app.get('/api/beneficiaries', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id_user;
    
    // Récupérer l'id_client depuis l'utilisateur
    const [clients] = await pool.query(
      'SELECT id_client FROM clients WHERE id_user = ?',
      [userId]
    );
    
    if (clients.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client non trouvé' 
      });
    }
    
    const clientId = clients[0].id_client;
    
    // Récupérer tous les bénéficiaires du client
    const [beneficiaries] = await pool.query(
      `SELECT 
        id_beneficiary as id,
        name,
        bank_name as bank,
        account_number as accountNumber,
        rib,
        iban,
        type,
        created_at as createdAt
      FROM beneficiaries 
      WHERE id_client = ?
      ORDER BY created_at DESC`,
      [clientId]
    );
    
    res.json({ 
      success: true, 
      beneficiaries 
    });
  } catch (error) {
    console.error('Erreur récupération bénéficiaires:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Ajouter un nouveau bénéficiaire
app.post('/api/beneficiaries', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { name, bankName, accountNumber, rib, iban, type } = req.body;

    // Masquage pour les logs
    

    // 🔎 1. Validation
    if (!name || !bankName || !iban || !type) {
      await logSecurity(
        userId,
        `ajout_beneficiaire: données manquantes (name=${name}, bank=${bankName}, iban=${iban}, type=${type})`,
        "failed",
        req
      );

      return res.status(400).json({
        success: false,
        message: 'Nom, banque, IBAN et type sont requis'
      });
    }

    // 🔎 2. Récupérer id_client
    const [clients] = await pool.query(
      'SELECT id_client FROM clients WHERE id_user = ?',
      [userId]
    );

    if (clients.length === 0) {
      await logSecurity(
        userId,
        `ajout_beneficiaire: client introuvable (iban=${iban})`,
        "failed",
        req
      );

      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    const clientId = clients[0].id_client;

    // 🔎 3. Vérifier l’existence
    const [existing] = await pool.query(
      'SELECT id_beneficiary FROM beneficiaries WHERE id_client = ? AND iban = ?',
      [clientId, iban]
    );

    if (existing.length > 0) {
      await logSecurity(
        userId,
        `ajout_beneficiaire: doublon (iban=${iban})`,
        "failed",
        req
      );

      return res.status(409).json({
        success: false,
        message: 'Ce bénéficiaire existe déjà'
      });
    }

    // 🔎 4. Insertion
    const [result] = await pool.query(
      `INSERT INTO beneficiaries 
        (id_client, name, bank_name, account_number, rib, iban, type) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        clientId,
        name,
        bankName,
        accountNumber || null,
        rib || null,
        iban,
        type
      ]
    );

    // 🔎 5. Récupérer le créé
    const [newBeneficiary] = await pool.query(
      `SELECT 
        id_beneficiary as id,
        name,
        bank_name as bank,
        account_number as accountNumber,
        rib,
        iban,
        type,
        created_at as createdAt
      FROM beneficiaries 
      WHERE id_beneficiary = ?`,
      [result.insertId]
    );

    // 🔎 6. Log succès
    await logSecurity(
      userId,
      `ajout_beneficiaire réussi (name=${name}, iban=${iban})`,
      "success",
      req
    );

    res.status(201).json({
      success: true,
      beneficiary: newBeneficiary[0],
      message: 'Bénéficiaire ajouté avec succès'
    });

  } catch (error) {
    console.error('Erreur ajout bénéficiaire:', error);

    await logSecurity(
      req.user.id_user,
      `ajout_beneficiaire: erreur serveur (${error.message})`,
      "failed",
      req
    );

    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});


// Supprimer un bénéficiaire
app.delete('/api/beneficiaries/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id_user;
    const beneficiaryId = req.params.id;
  
    // 1. Récupérer id_client
    const [clients] = await pool.query(
      'SELECT id_client FROM clients WHERE id_user = ?',
      [userId]
    );

    if (clients.length === 0) {
      await logSecurity(
        userId,
        `suppression_beneficiaire: client introuvable`,
        "failed",
        req
      );

      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    const clientId = clients[0].id_client;

    // 2. Récupérer infos du bénéficiaire pour logs AVANT suppression
    const [beneficiary] = await pool.query(
      `SELECT name, iban 
       FROM beneficiaries 
       WHERE id_beneficiary = ? AND id_client = ?`,
      [beneficiaryId, clientId]
    );

    if (beneficiary.length === 0) {
      await logSecurity(
        userId,
        `suppression_beneficiaire: bénéficiaire introuvable (id=${beneficiaryId})`,
        "failed",
        req
      );

      return res.status(404).json({
        success: false,
        message: 'Bénéficiaire non trouvé'
      });
    }

 
    const name = beneficiary[0].name;
    const iban = beneficiary[0].iban;
    

    // 3. Suppression
    const [result] = await pool.query(
      'DELETE FROM beneficiaries WHERE id_beneficiary = ? AND id_client = ?',
      [beneficiaryId, clientId]
    );

    if (result.affectedRows === 0) {
      await logSecurity(
        userId,
        `suppression_beneficiaire: échec (id=${beneficiaryId})`,
        "failed",
        req
      );

      return res.status(404).json({
        success: false,
        message: 'Bénéficiaire non trouvé'
      });
    }

    // 4. Log SUCCÈS
    await logSecurity(
      userId,
      `suppression_bénéficiaire réussi (id=${beneficiaryId}, name=${name}, iban=${iban})`,
      "success",
      req
    );

    res.json({
      success: true,
      message: 'Bénéficiaire supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression bénéficiaire:', error);

    await logSecurity(
      req.user.id_user,
      `suppression_beneficiaire: erreur serveur (${error.message})`,
      "failed",
      req
    );

    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});


// Initier un transfert (génère OTP)
app.post('/api/transfer/initiate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { sourceAccountId, beneficiaryId, amount, currency, reference } = req.body;

    // Vérif champs obligatoires
    if (!sourceAccountId || !beneficiaryId || !amount || !currency) {
      await logSecurity(
        userId,
        "initiation_virement: champs manquants",
        "failed",
        req
      );

      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    if (parseFloat(amount) <= 0) {
      await logSecurity(
        userId,
        `initiation_virement: montant invalide (${amount})`,
        "failed",
        req
      );

      return res.status(400).json({
        success: false,
        message: "Le montant doit être supérieur à 0",
      });
    }

    // Récupérer l'id_client
    const [clients] = await pool.query(
      "SELECT id_client FROM clients WHERE id_user = ?",
      [userId]
    );

    if (clients.length === 0) {
      await logSecurity(
        userId,
        "initiation_virement: client introuvable",
        "failed",
        req
      );

      return res.status(404).json({
        success: false,
        message: "Client non trouvé",
      });
    }

    const clientId = clients[0].id_client;

    // Vérifier que le compte source appartient au client
    const [accounts] = await pool.query(
      "SELECT balance, iban FROM accounts WHERE id_account = ? AND id_client = ?",
      [sourceAccountId, clientId]
    );

    if (accounts.length === 0) {
      await logSecurity(
        userId,
        `initiation_virement: compte source introuvable (id=${sourceAccountId})`,
        "failed",
        req
      );

      return res.status(404).json({
        success: false,
        message: "Compte source non trouvé",
      });
    }

    const accountBalance = parseFloat(accounts[0].balance);

    // Vérifier solde
    if (accountBalance < parseFloat(amount)) {
      await logSecurity(
        userId,
        `initiation_virement: solde insuffisant (solde=${accountBalance}, montant=${amount})`,
        "failed",
        req
      );

      return res.status(400).json({
        success: false,
        message: "Solde insuffisant",
      });
    }

    // Vérifier bénéficiaire
    const [beneficiaries] = await pool.query(
      "SELECT name, bank_name, iban FROM beneficiaries WHERE id_beneficiary = ? AND id_client = ?",
      [beneficiaryId, clientId]
    );

    if (beneficiaries.length === 0) {
      await logSecurity(
        userId,
        `initiation_virement: bénéficiaire introuvable (id=${beneficiaryId})`,
        "failed",
        req
      );

      return res.status(404).json({
        success: false,
        message: "Bénéficiaire non trouvé",
      });
    }

    const beneficiary = beneficiaries[0];

    

    // Générer OTP
    const otp = crypto.randomBytes(3).toString("hex").toUpperCase();

    otpStore[`transfer_${userId}`] = {
      sourceAccountId,
      beneficiaryId,
      amount,
      currency,
      reference: reference || null,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
    };

    // Récupérer email utilisateur
    const [users] = await pool.query(
      "SELECT email FROM users WHERE id_user = ?",
      [userId]
    );

    // Envoi de l’OTP
    await sendOTP(users[0].email, otp);

    // LOG SUCCESS (pas de données sensibles)
    await logSecurity(
      userId,
      `initiation_virement réussie
        Compte source: ${sourceAccountId}
        Bénéficiaire: ${beneficiary.name} (${beneficiary.iban})
        Montant: ${amount} ${currency}
        Référence: ${reference || "aucune"}`,
      "success",
      req
    );

    res.json({
      success: true,
      message: "Code OTP envoyé par email",
      expiresIn: 300,
    });
  } catch (error) {
    console.error("Erreur initiation transfert:", error);

    await logSecurity(
      req.user.id_user,
      `initiation_virement: erreur serveur (${error.message})`,
      "failed",
      req
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});


// Confirmer le transfert avec OTP
app.post('/api/transfer/confirm', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const userId = req.user.id_user;
    const { otp } = req.body;
    
    if (!otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code OTP requis' 
      });
    }
    
    // Récupérer les données du transfert
    const transferKey = `transfer_${userId}`;
    const transferData = otpStore[transferKey];
    
    if (!transferData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session de transfert expirée ou introuvable' 
      });
    }
    
    // Vérifier l'expiration
    if (Date.now() > transferData.expiresAt) {
      delete otpStore[transferKey];
      return res.status(400).json({ 
        success: false, 
        message: 'Code OTP expiré' 
      });
    }
    
    // Vérifier l'OTP
    if (transferData.otp !== otp.toUpperCase()) {
      await logSecurity(userId, "Vérification OTP transfert", "échouée", req);
      return res.status(401).json({ 
        success: false, 
        message: 'Code OTP invalide' 
      });
    }
    
    // OTP valide, supprimer de la mémoire
    delete otpStore[transferKey];
    
    await logSecurity(userId, "Vérification OTP transfert", "réussie", req);
    
    // Commencer la transaction
    await connection.beginTransaction();
    
    const { sourceAccountId, beneficiaryId, amount, currency, reference } = transferData;
    
    // Récupérer l'id_client
    const [clients] = await connection.query(
      'SELECT id_client FROM clients WHERE id_user = ?',
      [userId]
    );
    
    const clientId = clients[0].id_client;
    
    // Vérifier à nouveau le solde (sécurité)
    const [accounts] = await connection.query(
      'SELECT balance FROM accounts WHERE id_account = ? AND id_client = ? FOR UPDATE',
      [sourceAccountId, clientId]
    );
    
    if (accounts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Compte source non trouvé' 
      });
    }
    
    const currentBalance = parseFloat(accounts[0].balance);
    
    if (currentBalance < parseFloat(amount)) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Solde insuffisant' 
      });
    }
    
    // Récupérer les infos du bénéficiaire
    const [beneficiaries] = await connection.query(
      'SELECT * FROM beneficiaries WHERE id_beneficiary = ? AND id_client = ?',
      [beneficiaryId, clientId]
    );
    
    if (beneficiaries.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Bénéficiaire non trouvé' 
      });
    }
    
    const beneficiary = beneficiaries[0];
    let destinationAccountId = null;
    let transferType = beneficiary.type; // 'meme banque', 'autre banque nationale', 'banque etrangere'
    let transactionStatus = 'réussie';
    
    // Traitement selon le type de bénéficiaire
    if (transferType === 'meme banque') {
      // 🏦 MÊME BANQUE - Transfert instantané
      const [destinationAccounts] = await connection.query(
        'SELECT id_account, id_client FROM accounts WHERE iban = ?',
        [beneficiary.iban]
      );
      
      if (destinationAccounts.length > 0) {
        destinationAccountId = destinationAccounts[0].id_account;
        
        // Créditer immédiatement le compte destination
        await connection.query(
          'UPDATE accounts SET balance = balance + ? WHERE id_account = ?',
          [amount, destinationAccountId]
        );
        
        transactionStatus = 'réussie';
      } else {
        // IBAN introuvable dans notre banque
        await connection.rollback();
        return res.status(404).json({ 
          success: false, 
          message: 'Compte destination introuvable dans notre banque' 
        });
      }
    } else if (transferType === 'autre banque nationale') {
      // 🏦 AUTRE BANQUE NATIONALE - Transfert en attente (1-2 jours)
      destinationAccountId = null;
      transactionStatus = 'en attente';
    } else if (transferType === 'banque etrangere') {
      // 🌍 BANQUE ÉTRANGÈRE - Transfert en attente (3-5 jours)
      destinationAccountId = null;
      transactionStatus = 'en attente';
    }
    
    // Débiter le compte source dans tous les cas
    await connection.query(
      'UPDATE accounts SET balance = balance - ? WHERE id_account = ?',
      [amount, sourceAccountId]
    );
    
    // Créer la transaction
    const [transactionResult] = await connection.query(
      `INSERT INTO transactions 
        (id_account_from, id_account_to, id_beneficiary, amount, currency, status, reason, created_at, confirmed_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ${transactionStatus === 'réussie' ? 'NOW()' : 'NULL'})`,
      [
        sourceAccountId, 
        destinationAccountId, 
        beneficiaryId, 
        amount, 
        currency, 
        transactionStatus, 
        reference
      ]
    );
    
    // Log de sécurité avec le type de transfert
await connection.query(
  'INSERT INTO logs_security (id_user, action, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?)',
  [userId, `Virement ${transferType} de ${amount} ${currency} vers ${beneficiary.name}`, req.ip, req.get('user-agent'), 'success']
);

    await connection.commit();
    
    // Récupérer les infos de l'utilisateur pour les notifications
    const [users] = await pool.query(
      'SELECT email, phone_number FROM users WHERE id_user = ?',
      [userId]
    );
    
    const user = users[0];
    
    // Message selon le type de transfert
    let statusMessage = '';
    if (transferType === 'meme banque') {
      statusMessage = 'Virement effectué instantanément';
    } else if (transferType === 'autre banque nationale') {
      statusMessage = 'Virement en cours de traitement (1-2 jours ouvrés)';
    } else if (transferType === 'banque etrangere') {
      statusMessage = 'Virement international en cours de traitement (3-5 jours ouvrés)';
    }
    
    // TODO: Envoyer les notifications (email + SMS)
    // await sendTransferNotification(user.email, { amount, currency, beneficiary: beneficiary.name, transferType });
    // await sendSMS(user.phone_number, `Virement de ${amount} ${currency} effectué vers ${beneficiary.name}`);
    
    res.json({ 
      success: true, 
      message: statusMessage,
      transaction: {
        id: transactionResult.insertId,
        amount,
        currency,
        beneficiary: beneficiary.name,
        beneficiaryBank: beneficiary.bank_name,
        transferType,
        reference,
        status: transactionStatus
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur confirmation transfert:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors du transfert' 
    });
  } finally {
    connection.release();
  }
});

// Récupérer l'historique des transactions avec détails
app.get('/api/transactions/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { limit = 20, status, startDate, endDate } = req.query;
    
    // Récupérer l'id_client
    const [clients] = await pool.query(
      'SELECT id_client FROM clients WHERE id_user = ?',
      [userId]
    );
    
    if (clients.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client non trouvé' 
      });
    }
    
    const clientId = clients[0].id_client;
    
    let query = `
      SELECT 
        t.id_transaction,
        t.amount,
        t.currency,
        t.status,
        t.reason,
        t.created_at,
        t.confirmed_at,
        a_from.account_number as from_account_number,
        a_from.account_type as from_account_type,
        a_to.account_number as to_account_number,
        b.name as beneficiary_name,
        b.bank_name as beneficiary_bank,
        b.type as beneficiary_type
      FROM transactions t
      INNER JOIN accounts a_from ON t.id_account_from = a_from.id_account
      LEFT JOIN accounts a_to ON t.id_account_to = a_to.id_account
      LEFT JOIN beneficiaries b ON t.id_beneficiary = b.id_beneficiary
      WHERE a_from.id_client = ?
    `;
    
    const params = [clientId];
    
    if (status && status !== 'all') {
      query += ' AND t.status = ?';
      params.push(status);
    }
    
    if (startDate) {
      query += ' AND t.created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND t.created_at <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY t.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [transactions] = await pool.query(query, params);
    
    const formattedTransactions = transactions.map(t => ({
      id: t.id_transaction,
      amount: parseFloat(t.amount),
      currency: t.currency,
      status: t.status,
      reference: t.reason,
      createdAt: t.created_at,
      confirmedAt: t.confirmed_at,
      fromAccount: {
        number: t.from_account_number,
        type: t.from_account_type
      },
      toAccount: t.to_account_number ? {
        number: t.to_account_number
      } : null,
      beneficiary: {
        name: t.beneficiary_name,
        bank: t.beneficiary_bank,
        type: t.beneficiary_type
      }
    }));
    
    res.json({ 
      success: true, 
      transactions: formattedTransactions 
    });
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});
// Modifier un bénéficiaire
app.put('/api/beneficiaries/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id_user;
    const beneficiaryId = req.params.id;
    const { name, bankName, accountNumber, rib, iban, type } = req.body;

    // Validation
    if (!name || !bankName || !iban || !type) {
      await logSecurity(
        userId,
        "modification_beneficiaire: champs manquants",
        "failed",
        req
      );

      return res.status(400).json({
        success: false,
        message: 'Nom, banque, IBAN et type sont requis'
      });
    }

    // 1. Récupérer id_client
    const [clients] = await pool.query(
      "SELECT id_client FROM clients WHERE id_user = ?",
      [userId]
    );

    if (clients.length === 0) {
      await logSecurity(
        userId,
        "modification_beneficiaire: client introuvable",
        "failed",
        req
      );

      return res.status(404).json({
        success: false,
        message: "Client non trouvé",
      });
    }

    const clientId = clients[0].id_client;

    // 2. Récupérer l'ancien bénéficiaire
    const [oldData] = await pool.query(
      `SELECT name, bank_name, account_number, rib, iban, type
       FROM beneficiaries
       WHERE id_beneficiary = ? AND id_client = ?`,
      [beneficiaryId, clientId]
    );

    if (oldData.length === 0) {
      await logSecurity(
        userId,
        `modification_beneficiaire: bénéficiaire introuvable (id=${beneficiaryId})`,
        "failed",
        req
      );

      return res.status(404).json({
        success: false,
        message: "Bénéficiaire non trouvé",
      });
    }

    const old = oldData[0];
    const OldIban = old.iban;
    const NewIban = iban;

    // 3. Mise à jour
    await pool.query(
      `UPDATE beneficiaries
       SET name = ?, bank_name = ?, account_number = ?, rib = ?, iban = ?, type = ?
       WHERE id_beneficiary = ? AND id_client = ?`,
      [name, bankName, accountNumber || null, rib || null, iban, type, beneficiaryId, clientId]
    );

    // 4. Récupérer les nouvelles données
    const [updatedBeneficiary] = await pool.query(
      `SELECT 
        id_beneficiary as id,
        name,
        bank_name as bank,
        account_number as accountNumber,
        rib,
        iban,
        type,
        created_at as createdAt
      FROM beneficiaries 
      WHERE id_beneficiary = ?`,
      [beneficiaryId]
    );

    // 5. Log SUCCESS avec ancien + nouveau
    await logSecurity(
      userId,
      `modification_beneficiaire réussie (id=${beneficiaryId})
       Ancien: { name=${old.name}, iban=${OldIban}, bank=${old.bank_name}, type=${old.type} }
       Nouveau: { name=${name}, iban=${NewIban}, bank=${bankName}, type=${type} }`,
      "success",
      req
    );

    res.json({
      success: true,
      beneficiary: updatedBeneficiary[0],
      message: "Bénéficiaire modifié avec succès",
    });

  } catch (error) {
    console.error("Erreur modification bénéficiaire:", error);

    await logSecurity(
      req.user.id_user,
      `modification_beneficiaire: erreur serveur (${error.message})`,
      "failed",
      req
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});


// =============================================
// 💸 ROUTES TRANSFER - FIN
// =============================================// Démarrage serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

