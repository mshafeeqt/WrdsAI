import { PgReceiptCounter } from "../postgres/models.js";

export const generateReceiptNo = async () => {
  const currentYear = new Date().getFullYear();

  const [counter] = await PgReceiptCounter.findOrCreate({
    where: { year: currentYear },
    defaults: { year: currentYear, seq: 0 },
  });

  await counter.increment("seq");
  await counter.reload();

  const serial = String(counter.seq).padStart(3, "0");

  return `RCP-${currentYear}-${serial}`;
};
