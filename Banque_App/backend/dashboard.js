const express = require('express');
const router = express.Router();
const pool = require('../db'); // connexion MySQL
const { authenticateToken } = require('../middleware/auth');

// Récupérer les informations du client
router.get('/client-info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id_user;
    const [rows] = await pool.query(
      'SELECT c.id_client, c.first_name, c.last_name, c.address, c.date_of_birth FROM clients c WHERE c.id_user = ?',
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Client non trouvé' });
    res.json({ success: true, client: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Récupérer comptes du client
router.get('/accounts', authenticateToken, async (req, res) => {
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
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Récupérer transactions récentes du client
router.get('/transactions', authenticateToken, async (req, res) => {
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
       LIMIT 5`,
      [userId]
    );
    res.json({ success: true, transactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
