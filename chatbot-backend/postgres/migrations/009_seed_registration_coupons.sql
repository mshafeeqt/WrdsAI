INSERT INTO "coupons" (
  "code",
  "discountType",
  "discountValue",
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES
  ('NXT25-K7Q9M', 'percentage', 25, TRUE, NOW(), NOW()),
  ('WRDS50-X4P8Z', 'percentage', 50, TRUE, NOW(), NOW()),
  ('LEARN100-R6T2Y', 'percentage', 100, TRUE, NOW(), NOW())
ON CONFLICT ("code") DO UPDATE SET
  "discountType" = EXCLUDED."discountType",
  "discountValue" = EXCLUDED."discountValue",
  "isActive" = TRUE,
  "updatedAt" = NOW();
