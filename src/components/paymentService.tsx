//import Stripe from 'stripe';

//const stripe = new Stripe('sk_test_51H...', { apiVersion: '2025-05-28.basil' });

//export async function processPayment(
//    cardNumber: string,
//    expMonth: number,
//    expYear: number,
//    cvc: string,
//    amount: number
//): Promise<Stripe.Charge> {
//    try {
//        // Create card token
//        const token = await stripe.tokens.create({
//            card: {
//                number: cardNumber,
//                exp_month: expMonth,
//                exp_year: expYear,
//                cvc: cvc,
//            },
//        });

//        // Charge the card
//        const charge = await stripe.charges.create({
//            amount: amount * 100, // Convert to cents
//            currency: 'usd',
//            source: token.id,
//            description: 'Cart checkout payment',
//        });

//        return charge;
//    } catch (error) {
//        throw new Error(`Payment failed: ${error.message}`);
//    }
//}
