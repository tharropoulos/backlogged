/*
  Warnings:

  - A unique constraint covering the columns `[reviewId,userId]` on the table `ReviewLike` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `ReviewLike_reviewId_userId_key` ON `ReviewLike`(`reviewId`, `userId`);
