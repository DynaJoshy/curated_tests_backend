-- CreateTable
CREATE TABLE "StreamAssessment" (
    "id" SERIAL NOT NULL,
    "access_token" TEXT NOT NULL,
    "aptitude_scores" JSONB NOT NULL,
    "interest_scores" JSONB NOT NULL,
    "academic_performance" JSONB NOT NULL,
    "personality_traits" JSONB NOT NULL,
    "contextual_inputs" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreamAssessment_pkey" PRIMARY KEY ("id")
);
