export function calculateMembershipData(tipComments, settings) {
    if (!settings || !tipComments) return [];

    const memberPayments = {};
    const defaultRoleId = settings.rolesEnabled ? settings.defaultRoleId : null;

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

        if (!price || price <= 0) return { ...memberData, user: memberData.user, totalPaid, membershipEndDate: null, status: 'Invalid Settings' };
        
        let totalDurationDays = 0;
        let paidPeriods = 0;
        if (price > 0) {
            paidPeriods = Math.floor(totalPaid / price);
        }

        switch (pricingModel) {
            case 'daily': totalDurationDays = paidPeriods; break;
            case 'weekly': totalDurationDays = paidPeriods * 7; break;
            case 'bi-weekly': totalDurationDays = paidPeriods * 14; break;
            case 'monthly': totalDurationDays = paidPeriods * 30; break; // Simplified to 30 days
            case 'one-day': totalDurationDays = paidPeriods; break;
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
            status,
            role: null, // Role will be merged in the App component
        };
    }).filter(Boolean).sort((a,b) => b.membershipEndDate - a.membershipEndDate);
}

export function getMembershipDurationString(pricingModel) {
    switch (pricingModel) {
        case 'daily': return 'for 1 Day';
        case 'weekly': return 'for 1 Week';
        case 'bi-weekly': return 'for 2 Weeks';
        case 'monthly': return 'for 1 Month';
        case 'one-day': return 'for a One-Day Pass';
        default: return '';
    }
}