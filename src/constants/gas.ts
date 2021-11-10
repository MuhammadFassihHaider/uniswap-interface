export const GAS_FEE_REFRESH_INTERVAL = 10000 // 10 seconds (roughly 1 Eth block time)

export const GAS_INFLATION_FACTOR = 1 // For padding gas estimations to increase likelyhood of success. 1 == no inflation.
export const GAS_FAST_MULTIPLIER = 1.25 // Gas price factor to raise urgency to fast
export const GAS_URGENT_MULTIPLIER = 1.5 // Gas price factor to raise urgency to urgent

export const GWEI_REWARD_OUTLIER_THRESHOLD = 5 // Gwei amount to exclude block from fee suggestion calculation
export const SAMPLE_MIN_PERCENTILE = 0.1 // 10th - sampled percentile range of exponentially weighted baseFee history
export const SAMPLE_MAX_PERCENTILE = 0.3 // 30th
export const MAX_TIME_FACTOR = 15 // # time factors for which to compute suggestions
