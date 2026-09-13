export function calculateSummary(payments) {
  if (!payments.length) {
    return {
      totalDue: 0,
      totalPaid: 0,
      totalBalance: 0,
      emptiesDue: 0,
      emptiesReceived: 0,
      emptiesBalance: 0,
      status: 'NO_ACTIVITY',
    };
  }

  const totalPaid = payments.reduce(
    (sum, p) => sum + Number(p.amountPaid),
    0
  );

  //Use LAST payment as source of truth
  const lastPayment = payments.at(-1);

  return {
    totalDue: payments.reduce((sum, p) => sum + Number(p.amountDue), 0),
    totalPaid,
    totalBalance: Number(lastPayment.totalAmountBal),
    emptiesDue: payments.reduce((sum, p) => sum + Number(p.emptiesDue), 0),
    emptiesReceived: payments.reduce((sum, p) => sum + Number(p.emptiesRec), 0),
    emptiesBalance: Number(lastPayment.totalEmptiesBal),
    status:
      lastPayment.totalAmountBal > 0
        ? 'OWING'
        : lastPayment.totalAmountBal < 0
        ? 'CREDIT'
        : 'PAID',
  };
}