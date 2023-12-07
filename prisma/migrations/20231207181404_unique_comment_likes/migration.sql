/*
  Warnings:

  - A unique constraint covering the columns `[commentId,userId]` on the table `CommentLike` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `CommentLike_commentId_userId_key` ON `CommentLike`(`commentId`, `userId`);
