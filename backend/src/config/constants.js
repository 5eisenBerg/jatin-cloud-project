// Predefined violation types with amounts
const VIOLATION_TYPES = {
  SIGNAL_JUMP: { code: 'SIGNAL_JUMP', name: 'Signal Jump', amount: 1000 },
  NO_HELMET: { code: 'NO_HELMET', name: 'No Helmet', amount: 1000 },
  NO_SEATBELT: { code: 'NO_SEATBELT', name: 'No Seatbelt', amount: 1000 },
  USING_MOBILE: { code: 'USING_MOBILE', name: 'Using Mobile', amount: 1000 },
  TRIPLE_RIDING: { code: 'TRIPLE_RIDING', name: 'Triple Riding', amount: 1000 },
  RASH_DRIVING: { code: 'RASH_DRIVING', name: 'Rash Driving', amount: 5000 },
  OVER_SPEEDING: { code: 'OVER_SPEEDING', name: 'Over Speeding', amount: 2000 },
  WRONG_SIDE: { code: 'WRONG_SIDE', name: 'Wrong Side Driving', amount: 1500 },
  NO_LICENSE: { code: 'NO_LICENSE', name: 'No License', amount: 5000 },
  NO_INSURANCE: { code: 'NO_INSURANCE', name: 'No Insurance', amount: 2000 },
  NO_PUC: { code: 'NO_PUC', name: 'No PUC', amount: 1000 },
  EXPIRED_REGISTRATION: { code: 'EXPIRED_REGISTRATION', name: 'Expired Registration', amount: 3000 },
  DRUNK_DRIVING: { code: 'DRUNK_DRIVING', name: 'Drunk Driving', amount: 10000 },
  HIT_AND_RUN: { code: 'HIT_AND_RUN', name: 'Hit and Run', amount: 10000 },
  ACCIDENT: { code: 'ACCIDENT', name: 'Accident', amount: 5000 }
};

// Vehicle types
const VEHICLE_TYPES = {
  CAR: 'Car',
  BIKE: 'Bike',
  TRUCK: 'Truck',
  BUS: 'Bus',
  AUTO: 'Auto',
  OTHER: 'Other'
};

// Fine statuses
const FINE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled'
};

// User roles
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

module.exports = {
  VIOLATION_TYPES,
  VEHICLE_TYPES,
  FINE_STATUS,
  USER_ROLES
};
