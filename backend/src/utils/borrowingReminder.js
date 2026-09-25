const cron = require('node-cron');
const Borrowing = require('../models/Borrowing');
const createNotification = require('./createNotification');

const checkBorrowingDeadlines = async () => {
    try {
        const now = new Date();

        // -----------------------------
        // Date ranges
        // -----------------------------

        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);

        // -----------------------------
        // 1. Due tomorrow
        // -----------------------------

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
                message: `Your borrowed item "${borrowing.item.name}" is due tomorrow.`,
                borrowing: borrowing._id
            });

            borrowing.reminders.dueTomorrow = true;

            await borrowing.save();
        }

        // -----------------------------
        // 2. Due today
        // -----------------------------

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
                message: `Your borrowed item "${borrowing.item.name}" is due today.`,
                borrowing: borrowing._id
            });

            borrowing.reminders.dueToday = true;

            await borrowing.save();
        }

        // -----------------------------
        // 3. Mark overdue
        // -----------------------------

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

            // Notify borrower
            await createNotification({
                recipient: borrowing.borrower,
                type: 'OVERDUE',
                message: `Your borrowed item "${borrowing.item.name}" is overdue.`,
                borrowing: borrowing._id
            });

            // Notify lender
            await createNotification({
                recipient: borrowing.lender,
                type: 'OVERDUE',
                message: `The item "${borrowing.item.name}" is overdue and has not been returned.`,
                borrowing: borrowing._id
            });

            borrowing.reminders.overdue = true;

            await borrowing.save();
        }

        console.log('Borrowing deadline check completed.');

    } catch (error) {
        console.error(
            'Borrowing deadline check failed:',
            error.message
        );
    }
};


// Run every hour
cron.schedule('0 * * * *', () => {
    checkBorrowingDeadlines();
});


module.exports = checkBorrowingDeadlines;