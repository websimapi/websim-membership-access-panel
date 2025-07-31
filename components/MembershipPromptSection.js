import { getMembershipDurationString } from '../utils.js';

const MembershipPromptSection = ({ settings }) => {
    const handleBecomeMember = async () => {
        const message = `Tipping ${settings.price} credits for membership!`;
        const result = await window.websim.postComment({ content: message });
        if (result.error) {
            console.error("Could not open comment dialog:", result.error);
            // Optionally, show an error to the user
        }
    };
    
    if (!settings) {
        return (
            <div className="membership-prompt-section">
                <i className="fas fa-info-circle icon"></i>
                <h3>Membership Not Available</h3>
                <p>The creator has not set up memberships for this project yet. Check back later!</p>
            </div>
        );
    }

    const { price, pricingModel } = settings;
    const durationString = getMembershipDurationString(pricingModel);

    return (
        <div className="membership-prompt-section">
            <i className="fas fa-star icon"></i>
            <h3>Become a Member!</h3>
            <p>Support the creator by becoming a member.</p>
            <div className="offer">
                Tip <strong>{price} credits</strong> {durationString}.
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleBecomeMember}>
                <i className="fas fa-comment-dollar"></i> Become a Member
            </button>
        </div>
    );
};

export default MembershipPromptSection;

