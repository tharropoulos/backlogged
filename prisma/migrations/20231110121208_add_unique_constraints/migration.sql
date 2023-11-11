/*
  Warnings:

  - You are about to drop the column `cover_image` on the `Feature` table. All the data in the column will be lost.
  - You are about to drop the `Example` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,commentId]` on the table `CommentLike` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[gameId,platformId]` on the table `GameToPlatform` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reviewId]` on the table `ReviewLike` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `ReviewLike` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,reviewId]` on the table `ReviewLike` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Comment` ADD COLUMN `deleted` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Feature` DROP COLUMN `cover_image`;

-- DropTable
DROP TABLE `Example`;

-- CreateIndex
CREATE UNIQUE INDEX `CommentLike_userId_commentId_key` ON `CommentLike`(`userId`, `commentId`);

-- CreateIndex
CREATE UNIQUE INDEX `GameToPlatform_gameId_platformId_key` ON `GameToPlatform`(`gameId`, `platformId`);

-- CreateIndex
CREATE UNIQUE INDEX `ReviewLike_reviewId_key` ON `ReviewLike`(`reviewId`);

-- CreateIndex
CREATE UNIQUE INDEX `ReviewLike_userId_key` ON `ReviewLike`(`userId`);

-- CreateIndex
CREATE UNIQUE INDEX `ReviewLike_userId_reviewId_key` ON `ReviewLike`(`userId`, `reviewId`);
