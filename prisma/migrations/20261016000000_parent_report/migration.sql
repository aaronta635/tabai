ALTER TABLE "Teacher" ADD COLUMN "paymentUrl" TEXT;
ALTER TABLE "Student" ADD COLUMN "reportToken" TEXT;
CREATE UNIQUE INDEX "Student_reportToken_key" ON "Student"("reportToken");
