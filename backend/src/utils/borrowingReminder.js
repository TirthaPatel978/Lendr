const cron = require('node-cron');
const Borrowing = require('../models/Borrowing');
const createNotification = require('./createNotification');


// ============================================
// CHECK BORROWING DEADLINES
// ============================================

const checkBorrowingDeadlines = async () => {

    try {

        const now = new Date();


        // ========================================
        // DATE RANGES
        // ========================================

        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(
            tomorrowStart.getDate() + 1
        );

        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);


        // ========================================
        // 1. DUE TOMORROW
        // ========================================

        const dueTomorrow = await Borrowing.find({
            status: 'ACTIVE',
            'reminders.dueTomorrow': false,
            endDate: {
                $gte: tomorrowStart,
                $lte: tomorrowEnd
            }
        }).populate('item', 'name');


        for (const borrowing of dueTomorrow) {

            await createNotification({
                recipient: borrowing.borrower,
                type: 'DUE_TOMORROW',
                title: 'Your item is due tomorrow',
                message: `Your borrowed item "${borrowing.item.name}" is due tomorrow.`,
                relatedBorrowing: borrowing._id,
                relatedItem: borrowing.item._id
            });


            borrowing.reminders.dueTomorrow = true;

            await borrowing.save();
        }


        // ========================================
        // 2. DUE TODAY
        // ========================================

        const dueToday = await Borrowing.find({
            status: 'ACTIVE',
            'reminders.dueToday': false,
            endDate: {
                $gte: todayStart,
                $lte: todayEnd
            }
        }).populate('item', 'name');


        for (const borrowing of dueToday) {

            await createNotification({
                recipient: borrowing.borrower,
                type: 'DUE_TODAY',
                title: 'Your item is due today',
                message: `Your borrowed item "${borrowing.item.name}" is due today.`,
                relatedBorrowing: borrowing._id,
                relatedItem: borrowing.item._id
            });


            borrowing.reminders.dueToday = true;

            await borrowing.save();
        }


        // ========================================
        // 3. MARK OVERDUE
        // ========================================

        const overdueBorrowings = await Borrowing.find({
            status: 'ACTIVE',
            'reminders.overdue': false,
            endDate: {
                $lt: now
            }
        }).populate('item', 'name');


        for (const borrowing of overdueBorrowings) {

            borrowing.status = 'OVERDUE';
            borrowing.wasOverdue = true;


            await borrowing.save();


            // ------------------------------------
            // Notify borrower
            // ------------------------------------

            await createNotification({
                recipient: borrowing.borrower,
                type: 'OVERDUE',
                title: 'Your borrowed item is overdue',
                message: `Your borrowed item "${borrowing.item.name}" is overdue.`,
                relatedBorrowing: borrowing._id,
                relatedItem: borrowing.item._id
            });


            // ------------------------------------
            // Notify lender
            // ------------------------------------

            await createNotification({
                recipient: borrowing.lender,
                type: 'OVERDUE',
                title: 'A borrowed item is overdue',
                message: `The item "${borrowing.item.name}" is overdue and has not been returned.`,
                relatedBorrowing: borrowing._id,
                relatedItem: borrowing.item._id
            });


            borrowing.reminders.overdue = true;

            await borrowing.save();
        }


        console.log(
            'Borrowing deadline check completed.'
        );

    } catch (error) {

        console.error(
            'Borrowing deadline check failed:',
            error.message
        );
    }
};


// ============================================
// RUN EVERY HOUR
// ============================================

cron.schedule('0 * * * *', () => {
    checkBorrowingDeadlines();
});


module.exports = checkBorrowingDeadlines;