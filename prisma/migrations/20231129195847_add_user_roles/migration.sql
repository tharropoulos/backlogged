/*
  Warnings:

  - You are about to drop the `Example` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `role` ENUM('User', 'Admin') NOT NULL DEFAULT 'User';

-- DropTable
DROP TABLE `Example`;
