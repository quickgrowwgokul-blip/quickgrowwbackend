const cron = require('node-cron');
const UserInvestments = require('../models/userinvestments');
const UserDetails = require('../models/userdetails');
const Wallet = require('../models/wallet');

// 1. Core logic wrapped in a reusable function
const processPayouts = async () => {
  console.log('🔄 [CRON] Scanning database for due interest payouts...');
  try {
    const today = new Date();
    
    // Finds any active investment where the payout date is today OR in the past
    const dueInvestments = await UserInvestments.find({
      status: 'active',
      nextPayoutDate: { $lte: today }
    });

    // Added this log so you can clearly see when it successfully checks but finds nothing
    if (dueInvestments.length === 0) {
      console.log('✅ [CRON] Scan complete: No payouts are due right now.');
      return; 
    }

    console.log(`⚠️ [CRON] Found ${dueInvestments.length} payouts due. Processing now...`);

    for (let inv of dueInvestments) {
      // Calculate interest
      const totalInterest = (inv.principalAmount * (inv.dailyRate / 100)) * inv.payoutFrequency;
      
      // Give the user the money
      const user = await UserDetails.findById(inv.userId);
      if (user) {
        user.walletBalance += totalInterest;
        await user.save();

        // Log the transaction
        await new Wallet({
          userId: inv.userId, type: 'interest', amount: totalInterest, status: 'approved'
        }).save();
      }

      // Push the next payout date forward
      const nextDate = new Date(inv.nextPayoutDate);
      nextDate.setDate(nextDate.getDate() + inv.payoutFrequency);
      inv.nextPayoutDate = nextDate;
      await inv.save();
      
      console.log(`💰 [CRON] SUCCESS: Paid out ₹${totalInterest} to user ${inv.userId}`);
    }
    
    console.log('✅ [CRON] All due payouts have been successfully processed.');
  } catch (error) {
    console.error('❌ [CRON] Error in interest cron job:', error);
  }
};

const startCronJobs = () => {
  // 2. Run INSTANTLY the exact second the server starts or wakes up from sleep
  console.log('🚀 [CRON] Server started/woke up! Initializing instant check...');
  processPayouts();

  // 3. Then, schedule it to run every 5 minutes normally while awake
  cron.schedule('*/5 * * * *', () => {
    processPayouts();
  });
};

module.exports = startCronJobs;