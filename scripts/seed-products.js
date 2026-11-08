require('dotenv').config();
const supabase = require('../lib/supabase');

const products = [
  { id: 'sample_a', name: 'Sample Bread', description: 'Sample product', amount: 800, is_active: true },
  { id: 'sample_b', name: 'Sample Roll', description: 'Sample product', amount: 1000, is_active: true },
  { id: 'sample_c', name: 'Sample Cookie', description: 'Sample product', amount: 1200, is_active: true }
];

supabase.from('products').upsert(products, { onConflict: 'id' }).then(({ error }) => {
  if (error) {
    console.error(error);
    process.exitCode = 1;
  }
});
