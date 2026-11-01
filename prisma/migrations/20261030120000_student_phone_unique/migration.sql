ALTER TABLE "Student" ADD COLUMN "phoneKey" TEXT;

WITH raw AS (
  SELECT
    id,
    "createdAt",
    regexp_replace("contactHandle", '[^0-9]', '', 'g') AS digits
  FROM "Student"
),
keyed AS (
  SELECT
    id,
    "createdAt",
    CASE
      WHEN length(digits) = 10 AND left(digits, 1) = '0'
        THEN '84' || substring(digits FROM 2)
      ELSE digits
    END AS key
  FROM raw
  WHERE length(digits) BETWEEN 8 AND 15
),
ranked AS (
  SELECT
    id,
    key,
    row_number() OVER (PARTITION BY key ORDER BY "createdAt" ASC, id ASC) AS n
  FROM keyed
)
UPDATE "Student" AS s
SET "phoneKey" = r.key
FROM ranked AS r
WHERE s.id = r.id
  AND r.n = 1;

CREATE UNIQUE INDEX "Student_phoneKey_key" ON "Student"("phoneKey");
