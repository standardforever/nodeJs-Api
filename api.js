 /* Server Side -- Stripe API calls */
 require('dotenv').config();
 const stripe = require('stripe')(process.env.STRIPE_API_KEY);
 
 function formatUSD(stripeAmount) {
   return `$${(stripeAmount / 100).toFixed(2)}`;
 }
 
 function formatStripeAmount(USDString) {
   return parseFloat(USDString) * 100;
 }
 
 router.get('/customerView', (req, res) => {
   Promise.all([
     stripe.products.list({}),
     stripe.plans.list({})
   ]).then(([productsData, plansData]) => {
     const products = productsData.data;
     let plans = plansData.data;
 
     plans = plans.sort((a, b) => {
       /* Sort plans in ascending order of price (amount) */
       return a.amount - b.amount;
     }).map(plan => {
       /* Format plan price (amount) */
       amount = formatUSD(plan.amount);
       return { ...plan, amount };
     });
 
     products.forEach(product => {
       const filteredPlans = plans.filter(plan => {
         return plan.product === product.id;
       });
 
       product.plans = filteredPlans;
     });
 
     const filteredProducts = products.filter(product => {
       return product.plans.length > 0;
     });
 
     res.json({ products: filteredProducts });
   }).catch(err => {
     res.status(500).json({ error: err.message });
   });
 });
 
//  module.exports = {
//    getAllProductsAndPlans,
//  };


(async () => console.log(await getAllProductsAndPlans()))()