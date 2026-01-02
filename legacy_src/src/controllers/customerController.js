const db = require('../config/database');
const { logActivity } = require('../utils/logger');

const getCustomers = async (req, res) => {
  try {
    const rows = await db.allAsync('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCustomer = async (req, res) => {
  try {
    const row = await db.getAsync('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Customer not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      gstin,
      pan,
      address,
      city,
      state,
      state_code,
      pincode,
      notes,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Customer name is required' });

    // Scenario 83: Duplicate Check
    if (email) {
      const existing = await db.getAsync('SELECT id FROM customers WHERE email = $1', [email]);
      if (existing) return res.status(400).json({ error: 'Customer with this email already exists' });
    }

    const result = await db.runAsync(
      `INSERT INTO customers (name, email, phone, gstin, pan, address, city, state, state_code, pincode, notes)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [name, email, phone, gstin, pan, address, city, state, state_code, pincode, notes]
    );

    logActivity(null, 'create_customer', `Created customer: ${name}`);
    res.json({ id: result.lastID, message: 'Customer created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      gstin,
      pan,
      address,
      city,
      state,
      state_code,
      pincode,
      notes,
    } = req.body;

    await db.runAsync(
      `UPDATE customers SET name=$1, email=$2, phone=$3, gstin=$4, pan=$5, address=$6, city=$7, state=$8, state_code=$9, pincode=$10, notes=$11, updated_at=NOW() WHERE id=$12`,
      [name, email, phone, gstin, pan, address, city, state, state_code, pincode, notes, req.params.id]
    );
    res.json({ message: 'Customer updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    // Scenario 84: Linked Invoices
    const row = await db.getAsync('SELECT COUNT(*) as count FROM invoices WHERE customer_id = $1', [req.params.id]);
    if (row && parseInt(row.count) > 0) {
      return res.status(400).json({ error: 'Cannot delete customer with linked invoices' });
    }

    const result = await db.runAsync('DELETE FROM customers WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Customer not found' });

    logActivity(null, 'delete_customer', `Deleted customer ID: ${req.params.id}`);
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
