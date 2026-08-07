const cron = require('node-cron');
const UserInvestments = require('../models/userinvestments');
const UserDetails = require('../models/userdetails');
const Wallet = require('../models/wallet');

// This cron job runs automatically every day at Midnight server time ('0 0 * * *')
// For testing purposes right now, let's run it every hour at minute 0 ('0 * * * *')
const startCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily interest payout check...');
    try {
      const today = new Date();
      
      // Find all active investments where the nextPayoutDate is today or earlier
      const dueInvestments = await UserInvestments.find({
        status: 'active',
        nextPayoutDate: { $lte: today }
      });

      for (let inv of dueInvestments) {
        // Math: (Principal * (Daily Rate / 100)) * Number of Days
        const totalInterest = (inv.principalAmount * (inv.dailyRate / 100)) * inv.payoutFrequency;
        
        // 1. Give the user the money
        const user = await UserDetails.findById(inv.userId);
        if (user) {
          user.walletBalance += totalInterest;
          await user.save();

          // 2. Log the interest deposit in their wallet history
          await new Wallet({
            userId: inv.userId, type: 'interest', amount: totalInterest, status: 'approved'
          }).save();
        }

        // 3. Push the next payout date forward for the next cycle
        const nextDate = new Date(inv.nextPayoutDate);
        nextDate.setDate(nextDate.getDate() + inv.payoutFrequency);
        inv.nextPayoutDate = nextDate;
        await inv.save();
        
        console.log(`Paid out ₹${totalInterest} to user ${inv.userId}`);
      }
    } catch (error) {
      console.error('Error in interest cron job:', error);
    }
  });
};

module.exports = startCronJobs;