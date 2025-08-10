export default async function handler(req, res) {
  const storeHash = req.query.store_hash; // or from verified JWT
  console.warn('storeHash callback.ts')
  console.warn(storeHash)
  res.redirect('/settings');
}