function supportedPaymentPurpose(metadata) {
  return metadata?.orderPurpose === 'self' ||
    metadata?.orderPurpose === 'gift' ||
    // Payment Intents created before the metadata rename are still in flight.
    (metadata?.orderPurpose === undefined && metadata?.giftType === 'gift');
}

module.exports = { supportedPaymentPurpose };
