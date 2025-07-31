export function calculateMembershipData(tipComments, settings) {
    if (!settings || !tipComments) return [];

    const memberPayments = {};

    tipComments.forEach(comment => {
        const userId = comment.author.id;
        if (!memberPayments[userId]) {
            memberPayments[userId] = {
                user: comment.author,
                payments: []
            };
        }
        memberPayments[userId].payments.push({
            amount: comment.card_data.credits_spent,
            date: new Date(comment.created_at)
        });
    });
    
    return Object.values(memberPayments).map(memberData => {
        memberData.payments.sort((a,b) => a.date - b.date);

        const totalPaid = memberData.payments.reduce((sum, p) => sum + p.amount, 0);
        const { price, pricingModel } = settings;

        if (price <= 0) return { ...memberData, totalPaid, membershipEndDate: null, status: 'Invalid Settings' };
        
        let totalDurationDays = 0;
        switch (pricingModel) {
            case 'daily': totalDurationDays = Math.floor(totalPaid / price); break;
            case 'weekly': totalDurationDays = Math.floor(totalPaid / price) * 7; break;
            case 'bi-weekly': totalDurationDays = Math.floor(totalPaid / price) * 14; break;
            case 'monthly': totalDurationDays = Math.floor(totalPaid / price) * 30; break; // Simplified to 30 days
            case 'one-day': totalDurationDays = Math.floor(totalPaid / price); break;
            default: totalDurationDays = 0;
        }

        const firstPaymentDate = memberData.payments[0]?.date;
        if (!firstPaymentDate) return null;

        const membershipEndDate = new Date(firstPaymentDate);
        membershipEndDate.setDate(membershipEndDate.getDate() + totalDurationDays);
        
        const now = new Date();
        const daysUntilExpiry = (membershipEndDate - now) / (1000 * 60 * 60 * 24);
        
        let status = 'Lapsed';
        if (daysUntilExpiry > 7) {
            status = 'Active';
        } else if (daysUntilExpiry > 0) {
            status = 'Expiring Soon';
        }

        return {
            user: memberData.user,
            totalPaid,
            membershipEndDate,
            status
        };
    }).filter(Boolean).sort((a,b) => b.membershipEndDate - a.membershipEndDate);
}

