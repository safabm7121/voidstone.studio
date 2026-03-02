// Create application user with limited privileges
db = db.getSiblingDB('admin');

db.createUser({
  user: 'voidstone_prod',
  pwd: 'pZLjWH1nn6K5KbQ',
  roles: [
    { role: 'readWrite', db: 'voidstone_users' },
    { role: 'readWrite', db: 'voidstone_products' },
    { role: 'readWrite', db: 'voidstone_appointments' }
  ]
});

// Create databases if they don't exist
db = db.getSiblingDB('voidstone_users');
db.createCollection('users');

db = db.getSiblingDB('voidstone_products');
db.createCollection('products');

db = db.getSiblingDB('voidstone_appointments');
db.createCollection('appointments');

print('✅ MongoDB initialized with application user');