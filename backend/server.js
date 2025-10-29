const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Banco de dados em memória (mock)
let products = [
  { id: 1, sku: 'SKU-2025-001', name: 'Produto Exemplo 1', category: 'Eletrônicos', price: 299.90, stock: 50, status: 'active' },
  { id: 2, sku: 'SKU-2025-002', name: 'Produto Exemplo 2', category: 'Alimentos', price: 19.90, stock: 3, status: 'active' },
  { id: 3, sku: 'SKU-2025-003', name: 'Produto Exemplo 3', category: 'Roupas', price: 89.90, stock: 25, status: 'active' },
  { id: 4, sku: 'SKU-2025-004', name: 'Produto Exemplo 4', category: 'Livros', price: 45.00, stock: 100, status: 'active' },
  { id: 5, sku: 'SKU-2025-005', name: 'Produto Exemplo 5', category: 'Brinquedos', price: 120.00, stock: 15, status: 'active' },
  { id: 6, sku: 'SKU-2025-006', name: 'Produto Exemplo 6', category: 'Móveis', price: 599.00, stock: 8, status: 'active' }
];

let orders = [
  { 
    id: 1, 
    customerId: 1, 
    customerName: 'João Silva', 
    date: '2025-10-20', 
    createdAt: '2025-10-20T10:30:00Z',
    status: 'completed', 
    total: 450.00, 
    salesChannel: 'Loja Física',
    destination: 'Balcão',
    items: [
      { productId: 1, productName: 'Produto Exemplo 1', quantity: 2, unitPrice: 299.90, subtotal: 599.80 }
    ] 
  },
  { 
    id: 2, 
    customerId: 2, 
    customerName: 'Maria Santos', 
    date: '2025-10-21', 
    createdAt: '2025-10-21T14:20:00Z',
    status: 'pending', 
    total: 99.50, 
    salesChannel: 'PDV',
    destination: 'Balcão',
    items: [
      { productId: 2, productName: 'Produto Exemplo 2', quantity: 5, unitPrice: 19.90, subtotal: 99.50 }
    ] 
  },
  { 
    id: 3, 
    customerId: 3, 
    customerName: 'Pedro Costa', 
    date: '2025-10-22', 
    createdAt: '2025-10-22T16:45:00Z',
    status: 'completed', 
    total: 299.90, 
    salesChannel: 'PDV',
    destination: 'Balcão',
    items: [
      { productId: 1, productName: 'Produto Exemplo 1', quantity: 1, unitPrice: 299.90, subtotal: 299.90 }
    ] 
  }
];

let users = [
  { id: 1, name: 'Admin', email: 'admin@restooq.com', password: '123456' }
];

let returns = [
  { id: 1, orderId: 1, productId: 1, quantity: 1, reason: 'Produto danificado', date: '2025-10-23', value: 299.90 },
  { id: 2, orderId: 2, productId: 2, quantity: 2, reason: 'Cliente desistiu', date: '2025-10-24', value: 39.80 }
];

let purchases = [
  { id: 1, productId: 1, quantity: 100, unitCost: 200.00, totalCost: 20000.00, date: '2025-10-15', supplier: 'Fornecedor A' },
  { id: 2, productId: 2, quantity: 200, unitCost: 10.00, totalCost: 2000.00, date: '2025-10-16', supplier: 'Fornecedor B' },
  { id: 3, productId: 3, quantity: 50, unitCost: 60.00, totalCost: 3000.00, date: '2025-10-17', supplier: 'Fornecedor C' }
];

let productIdCounter = 7;
let orderIdCounter = 4;
let userIdCounter = 2;
let returnIdCounter = 3;
let purchaseIdCounter = 4;

// ==================== AUTH ROUTES ====================
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    res.json({
      token: 'fake-jwt-token-' + user.id,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } else {
    res.status(401).json({ message: 'Credenciais inválidas' });
  }
});

app.post('/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Email já cadastrado' });
  }
  
  const newUser = {
    id: userIdCounter++,
    name,
    email,
    password
  };
  
  users.push(newUser);
  res.status(201).json({
    token: 'fake-jwt-token-' + newUser.id,
    user: { id: newUser.id, name: newUser.name, email: newUser.email }
  });
});

// ==================== PRODUCTS ROUTES ====================
app.get('/products', (req, res) => {
  const { page = 1, limit = 10, q = '', status = '' } = req.query;
  
  let filtered = products;
  
  // Filtro de busca
  if (q) {
    const search = q.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(search) ||
      p.sku.toLowerCase().includes(search) ||
      (p.category && p.category.toLowerCase().includes(search))
    );
  }
  
  // Filtro de status
  if (status) {
    filtered = filtered.filter(p => p.status === status);
  }
  
  // Paginação
  const total = filtered.length;
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const items = filtered.slice(start, end);
  
  res.json({
    items,
    total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

app.post('/products', (req, res) => {
  const { sku, name, category, price, stock, status, costPrice, profitMargin } = req.body;
  
  if (!sku || !name || !price || stock === undefined) {
    return res.status(400).json({ message: 'Dados incompletos' });
  }
  
  const newProduct = {
    id: productIdCounter++,
    sku,
    name,
    category: category || '',
    price: parseFloat(price),
    costPrice: costPrice ? parseFloat(costPrice) : 0,
    profitMargin: profitMargin ? parseFloat(profitMargin) : 0,
    stock: parseInt(stock),
    status: status || 'active'
  };
  
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.delete('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Produto não encontrado' });
  }
  
  products.splice(index, 1);
  res.json({ message: 'Produto removido com sucesso' });
});

app.put('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Produto não encontrado' });
  }
  
  const { sku, name, category, price, stock, status } = req.body;
  
  products[index] = {
    ...products[index],
    sku: sku || products[index].sku,
    name: name || products[index].name,
    category: category !== undefined ? category : products[index].category,
    price: price !== undefined ? parseFloat(price) : products[index].price,
    stock: stock !== undefined ? parseInt(stock) : products[index].stock,
    status: status || products[index].status
  };
  
  res.json(products[index]);
});

// ==================== ORDERS ROUTES ====================
app.get('/orders', (req, res) => {
  const { page = 1, limit = 10, status = '' } = req.query;
  
  let filtered = orders;
  
  // Filtro de status
  if (status) {
    filtered = filtered.filter(o => o.status === status);
  }
  
  // Paginação
  const total = filtered.length;
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const items = filtered.slice(start, end);
  
  res.json({
    items,
    total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

app.post('/orders', (req, res) => {
  const { customerId, items, customerName } = req.body;
  
  if (!customerId || !items || items.length === 0) {
    return res.status(400).json({ message: 'Dados incompletos' });
  }
  
  // Calcula o total e atualiza estoque
  let total = 0;
  const orderItems = [];
  
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ message: `Produto ${item.productId} não encontrado` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ message: `Estoque insuficiente para ${product.name}` });
    }
    
    const subtotal = product.price * item.quantity;
    total += subtotal;
    
    // Adiciona informações completas do item
    orderItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      subtotal: subtotal
    });
    
    // Atualiza o estoque
    product.stock -= item.quantity;
  }
  
  const now = new Date();
  const newOrder = {
    id: orderIdCounter++,
    customerId,
    customerName: customerName || 'Cliente #' + customerId,
    date: now.toISOString().split('T')[0],
    createdAt: now.toISOString(),
    status: 'completed',
    total,
    salesChannel: 'PDV',
    destination: 'Balcão',
    items: orderItems
  };
  
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

app.get('/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const order = orders.find(o => o.id === id);
  
  if (!order) {
    return res.status(404).json({ message: 'Pedido não encontrado' });
  }
  
  res.json(order);
});

app.delete('/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = orders.findIndex(o => o.id === id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Pedido não encontrado' });
  }
  
  orders.splice(index, 1);
  res.json({ message: 'Pedido removido com sucesso' });
});

// ==================== RETURNS ROUTES ====================
app.get('/returns', (req, res) => {
  res.json({ items: returns, total: returns.length });
});

app.post('/returns', (req, res) => {
  const { orderId, productId, quantity, reason, value } = req.body;
  
  if (!orderId || !productId || !quantity || !value) {
    return res.status(400).json({ message: 'Dados incompletos' });
  }
  
  const newReturn = {
    id: returnIdCounter++,
    orderId,
    productId,
    quantity: parseInt(quantity),
    reason: reason || 'Sem motivo informado',
    date: new Date().toISOString().split('T')[0],
    value: parseFloat(value)
  };
  
  // Atualiza o estoque (devolve os produtos)
  const product = products.find(p => p.id === productId);
  if (product) {
    product.stock += parseInt(quantity);
  }
  
  returns.push(newReturn);
  res.status(201).json(newReturn);
});

// ==================== PURCHASES ROUTES ====================
app.get('/purchases', (req, res) => {
  res.json({ items: purchases, total: purchases.length });
});

app.post('/purchases', (req, res) => {
  const { productId, quantity, unitCost, supplier } = req.body;
  
  if (!productId || !quantity || !unitCost) {
    return res.status(400).json({ message: 'Dados incompletos' });
  }
  
  const totalCost = parseFloat(unitCost) * parseInt(quantity);
  
  const newPurchase = {
    id: purchaseIdCounter++,
    productId,
    quantity: parseInt(quantity),
    unitCost: parseFloat(unitCost),
    totalCost,
    date: new Date().toISOString().split('T')[0],
    supplier: supplier || 'Sem fornecedor'
  };
  
  // Atualiza o estoque
  const product = products.find(p => p.id === productId);
  if (product) {
    product.stock += parseInt(quantity);
  }
  
  purchases.push(newPurchase);
  res.status(201).json(newPurchase);
});

// ==================== DASHBOARD ROUTES ====================
app.get('/dashboard', (req, res) => {
  // Calcula receita total (vendas concluídas)
  const revenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0);
  
  // Calcula devoluções totais
  const salesReturn = returns.reduce((sum, r) => sum + r.value, 0);
  
  // Calcula compras totais
  const purchase = purchases.reduce((sum, p) => sum + p.totalCost, 0);
  
  // Calcula lucro (receita - devoluções - compras)
  const income = revenue - salesReturn - purchase;
  
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const lowStock = products.filter(p => p.stock <= 5);
  
  // Top 5 produtos mais vendidos
  const productSales = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = 0;
      }
      productSales[item.productId] += item.quantity;
    });
  });
  
  const topSelling = Object.entries(productSales)
    .map(([productId, qty]) => {
      const product = products.find(p => p.id === parseInt(productId));
      return {
        name: product ? product.name : 'Produto ' + productId,
        qty: qty
      };
    })
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  
  res.json({
    cards: {
      revenue,
      salesReturn,
      purchase,
      income
    },
    totalOrders,
    totalProducts,
    stockAlert: lowStock,
    topSelling
  });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
  console.log('📦 Produtos:', products.length);
  console.log('📋 Pedidos:', orders.length);
  console.log('👥 Usuários:', users.length);
  console.log('↩️  Devoluções:', returns.length);
  console.log('🛒 Compras:', purchases.length);
});

