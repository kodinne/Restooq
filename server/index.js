const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'db.json');

function readDb(){
  if (!fs.existsSync(DB_FILE)){
    const seed = {
      users: [
        { id: 1, name: 'Admin', email: 'admin@example.com', password: 'admin' },
        { id: 2, name: 'Cliente Demo', email: 'cliente@example.com', password: '123456' }
      ],
      products: [
        { id: 1, sku: 'SKU-001', name: 'Café Expresso', category: 'Bebidas', price: 7.5, stock: 20, status: 'active' },
        { id: 2, sku: 'SKU-002', name: 'Cappuccino', category: 'Bebidas', price: 12.9, stock: 15, status: 'active' },
        { id: 3, sku: 'SKU-003', name: 'Croissant', category: 'Padaria', price: 8.0, stock: 8, status: 'active' },
        { id: 4, sku: 'SKU-004', name: 'Cookie', category: 'Doces', price: 5.5, stock: 50, status: 'active' }
      ],
      orders: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(db){ fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

function paginate(items, page = 1, limit = 10){
  page = Number(page) || 1; limit = Number(limit) || 10;
  const total = items.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  return { items: items.slice(start, end), total, page, limit };
}

// Auth
app.post('/auth/login', (req, res)=>{
  const { email, password } = req.body || {};
  const db = readDb();
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  // Fake JWT: header.payload.signature
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: user.id, email: user.email, name: user.name })).toString('base64url');
  const token = `${header}.${payload}.signature`;
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// Users CRUD
app.get('/users', (req, res)=>{ const db = readDb(); res.json(db.users.map(u => ({ id:u.id, name:u.name, email:u.email })) ); });
app.get('/users/:id', (req, res)=>{ const db = readDb(); const u=db.users.find(x=>x.id==req.params.id); if(!u) return res.sendStatus(404); res.json({ id:u.id, name:u.name, email:u.email }); });
app.post('/users', (req, res)=>{ const db=readDb(); const body=req.body||{}; const id = (Math.max(0, ...db.users.map(u=>u.id)) + 1); const user={ id, name: body.name, email: body.email, password: body.password || '123456' }; db.users.push(user); writeDb(db); res.status(201).json({ id, name:user.name, email:user.email }); });
app.patch('/users/:id', (req, res)=>{ const db=readDb(); const u=db.users.find(x=>x.id==req.params.id); if(!u) return res.sendStatus(404); Object.assign(u, req.body||{}); writeDb(db); res.json({ id:u.id, name:u.name, email:u.email }); });
app.delete('/users/:id', (req, res)=>{ const db=readDb(); db.users = db.users.filter(x=>x.id!=req.params.id); writeDb(db); res.sendStatus(204); });

// Products
app.get('/products', (req, res)=>{
  const db = readDb();
  const { q, status, page, limit } = req.query;
  let items = [...db.products];
  if (q){
    const term = q.toString().toLowerCase();
    items = items.filter(p => p.sku.toLowerCase().includes(term) || p.name.toLowerCase().includes(term) || (p.category||'').toLowerCase().includes(term));
  }
  if (status){ items = items.filter(p => p.status === status); }
  res.json(paginate(items, page, limit));
});
app.get('/products/:id', (req, res)=>{ const db=readDb(); const p=db.products.find(x=>x.id==req.params.id); if(!p) return res.sendStatus(404); res.json(p); });
app.post('/products', (req, res)=>{
  const db = readDb();
  const body = req.body || {};
  const id = (Math.max(0, ...db.products.map(p=>p.id)) + 1);
  const product = { id, sku: body.sku, name: body.name, category: body.category || '', price: Number(body.price)||0, stock: Number(body.stock)||0, status: body.status || 'active' };
  db.products.push(product); writeDb(db); res.status(201).json(product);
});
app.patch('/products/:id', (req, res)=>{ const db=readDb(); const p = db.products.find(x=>x.id==req.params.id); if(!p) return res.sendStatus(404); Object.assign(p, req.body||{}); writeDb(db); res.json(p); });
app.delete('/products/:id', (req, res)=>{ const db=readDb(); db.products = db.products.filter(x=>x.id!=req.params.id); writeDb(db); res.sendStatus(204); });

// Orders
app.get('/orders', (req, res)=>{
  const db = readDb();
  const { q, status, page, limit } = req.query;
  let items = [...db.orders];
  if (q){
    const term = q.toString().toLowerCase();
    items = items.filter(o => (o.customer?.name||'').toLowerCase().includes(term) || (o.destination||'').toLowerCase().includes(term) || (''+o.id).includes(term));
  }
  if (status){ items = items.filter(o => o.status === status); }
  // Ensure shape matches frontend expectations
  res.json(paginate(items.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)), page, limit));
});
app.post('/orders', (req, res)=>{
  const db = readDb();
  const body = req.body || {};
  const id = (Math.max(0, ...db.orders.map(o=>o.id)) + 1);
  const customer = db.users.find(u => u.id == body.customerId) || { id: 0, name: 'Consumidor', email: '' };
  const items = (body.items||[]).map(it => {
    const prod = db.products.find(p => p.id == it.productId);
    if (!prod) return null;
    // reduce stock
    prod.stock = Math.max(0, Number(prod.stock||0) - Number(it.quantity||0));
    return { quantity: Number(it.quantity||0), product: { name: prod.name, price: Number(prod.price) } };
  }).filter(Boolean);
  const order = {
    id,
    createdAt: new Date().toISOString(),
    salesChannel: 'PDV',
    destination: 'Loja Física',
    status: 'completed',
    customer: { id: customer.id, name: customer.name, email: customer.email },
    items
  };
  db.orders.push(order);
  writeDb(db);
  res.status(201).json(order);
});

// Dashboard
app.get('/dashboard', (req, res)=>{
  const db = readDb();
  const revenue = db.orders.reduce((sum, o)=> sum + o.items.reduce((s,i)=> s + i.product.price * i.quantity, 0), 0);
  const topSellingMap = new Map();
  db.orders.forEach(o => o.items.forEach(i => { const k=i.product.name; topSellingMap.set(k, (topSellingMap.get(k)||0)+i.quantity); }));
  const topSelling = Array.from(topSellingMap.entries()).map(([name, qty])=>({ name, qty })).sort((a,b)=>b.qty-a.qty).slice(0,5);
  const stockAlert = db.products.filter(p => p.stock<=5).map(p => ({ id:p.id, name:p.name, stock:p.stock, sku:p.sku, status:p.status }));
  const data = {
    cards: { revenue, salesReturn: 0, purchase: Math.round(revenue*0.4), income: Math.round(revenue*0.6) },
    topSelling,
    stockAlert
  };
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`API listening on http://localhost:${PORT}`));
