-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'coordinator',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "permissions" TEXT NOT NULL DEFAULT '',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ongoing',
    "budget" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coordinatorId" INTEGER,
    "donorContactId" INTEGER,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Indicator" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "actual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "frameworkNodeId" INTEGER,

    CONSTRAINT "Indicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameworkNode" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "levelLabel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FrameworkNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "sex" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "district" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "enrolled" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" INTEGER,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "joined" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" INTEGER,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" INTEGER,
    "assigneeId" INTEGER,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorUpdate" (
    "id" SERIAL NOT NULL,
    "indicatorId" INTEGER NOT NULL,
    "newActual" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndicatorUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletionLog" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportRequest" (
    "id" SERIAL NOT NULL,
    "reportType" TEXT NOT NULL DEFAULT 'programme_summary',
    "name" TEXT NOT NULL DEFAULT 'PWC M&E Results Report',
    "description" TEXT NOT NULL DEFAULT 'A comprehensive summary of project results, beneficiaries, and feedback for the selected period and scope.',
    "requestedByName" TEXT NOT NULL,
    "requestedById" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "projectId" INTEGER,
    "projectName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Processing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ReportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "likelihood" TEXT NOT NULL DEFAULT 'Medium',
    "impact" TEXT NOT NULL DEFAULT 'Medium',
    "mitigation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" INTEGER,
    "ownerId" INTEGER,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_donorContactId_fkey" FOREIGN KEY ("donorContactId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indicator" ADD CONSTRAINT "Indicator_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indicator" ADD CONSTRAINT "Indicator_frameworkNodeId_fkey" FOREIGN KEY ("frameworkNodeId") REFERENCES "FrameworkNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkNode" ADD CONSTRAINT "FrameworkNode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkNode" ADD CONSTRAINT "FrameworkNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FrameworkNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorUpdate" ADD CONSTRAINT "IndicatorUpdate_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
