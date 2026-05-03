/**
 * Production-grade Referral Sharing Logic
 */
export const shareReferralLink = async (referralCode, onFinish) => {
  const shareUrl = `https://nexapay.app/?ref=${referralCode}`;
  const shareData = {
    title: 'Join NexaPay Wallet',
    text: 'Manage your Stellar assets with institutional-grade security.',
    url: shareUrl,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareUrl);
      return "Link copied to clipboard";
    }
  } catch (err) {
    console.error("Sharing failed", err);
  } finally {
    if (onFinish) onFinish();
  }
};

export const openSocialShare = (type, referralCode) => {
  const shareUrl = encodeURIComponent(`https://nexapay.app/?ref=${referralCode}`);
  const text = encodeURIComponent("Secure your assets with NexaPay.");
  
  let url = "";
  switch (type) {
    case 'whatsapp':
      url = `https://wa.me/?text=${text}%20${shareUrl}`;
      break;
    case 'discord':
      // Discord doesn't have a direct share API, copy to clipboard is preferred
      navigator.clipboard.writeText(`https://nexapay.app/?ref=${referralCode}`);
      return;
    default:
      return;
  }
  window.open(url, '_blank');
};