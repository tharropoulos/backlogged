/*
  Warnings:

  - Added the required column `deleted` to the `CommentLike` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Comment` ADD COLUMN `deleted` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `CommentLike` ADD COLUMN `deleted` DATETIME(3) NOT NULL;
