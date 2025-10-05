import React, { useEffect, useEffectEvent } from 'react';
import * as ga from '../lib/ga';

/**
 * DonationTracker component
 *
 * Implements enhanced e-commerce style tracking for donation flows.
 * This allows for proper funnel analysis and attribution of donation conversions.
 *
 * Usage:
 * - At start of donation flow: <DonationTracker step="begin" />
 * - When payment info added: <DonationTracker step="add_payment_info" amount={25} />
 * - On donation completion: <DonationTracker step="complete" amount={25} transactionId="tx_123" />
 */

//useEffect - this can be moved to useEffectEvent
const DonationTracker = ({
  step,
  amount = null,
  currency = 'USD',
  transactionId = null,
  campaignId = null,
  donationType = 'one_time'
}) => {
  //React 19.2 useEffectEvent
  const logDonationTracker =useEffectEvent(() => {
       const trackDonationStep = () => {
      const additionalParams = {
        donation_type: donationType
      };

      if (campaignId) {
        additionalParams.campaign_id = campaignId;
      }

      if (transactionId) {
        additionalParams.transaction_id = transactionId;
      }

      // Track the donation step
      ga.trackDonation(
        step,
        amount,
        currency,
        additionalParams
      );

      // Also track as a journey step for funnel analysis
      ga.trackJourneyStep(
        'donation',
        step,
        {
          amount: amount,
          currency: currency,
          ...additionalParams
        }
      );
    };
    trackDonationStep();

  });

  useEffect(() => {
  logDonationTracker(step);
  }, [step]);

  // This component doesn't render anything visible
  return null;
};

export default DonationTracker;
