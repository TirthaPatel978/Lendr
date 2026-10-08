const Notification = require('../models/Notification');
const Borrowing = require('../models/Borrowing');

const createNotification = async ({
    recipient,
    sender = null,

    type,

    title = '',
    message,

    relatedBorrowing = null,
    relatedItem = null,
    relatedDispute = null,

    // Backward compatibility with older notification calls
    borrowing = null,
    item = null
}) => {
    try {
        const finalBorrowing =
            relatedBorrowing || borrowing || null;

        const finalItem =
            relatedItem || item || null;

        let finalSender = sender;

        /*
         * If the caller did not explicitly provide a sender,
         * try to determine the other participant from the borrowing.
         *
         * This preserves existing notification behavior while
         * giving newer notifications a useful sender relationship.
         */
        if (!finalSender && finalBorrowing) {
            const borrowingRecord =
                await Borrowing.findById(
                    finalBorrowing
                ).select(
                    'borrower lender'
                );

            if (borrowingRecord) {
                const recipientId =
                    recipient.toString();

                if (
                    borrowingRecord.borrower &&
                    borrowingRecord.borrower.toString() !==
                        recipientId
                ) {
                    finalSender =
                        borrowingRecord.borrower;
                } else if (
                    borrowingRecord.lender &&
                    borrowingRecord.lender.toString() !==
                        recipientId
                ) {
                    finalSender =
                        borrowingRecord.lender;
                }
            }
        }

        /*
         * Keep a sensible fallback title for older calls
         * which did not previously provide one.
         */
        const finalTitle =
            title ||
            type
                ?.toLowerCase()
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (letter) =>
                    letter.toUpperCase()
                ) ||
            'Lendr notification';

        const notification =
            await Notification.create({
                recipient,

                sender: finalSender,

                type,

                title: finalTitle,

                message:
                    message ||
                    'You have a new Lendr update.',

                relatedBorrowing:
                    finalBorrowing,

                relatedItem:
                    finalItem,

                relatedDispute,

                isRead: false
            });

        return notification;

    } catch (error) {
        console.error(
            'Failed to create notification:',
            error
        );

        /*
         * Notification failures should not break the
         * main borrowing/dispute/payment operation.
         */
        return null;
    }
};

module.exports = createNotification;