/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Playlist` table. All the data in the column will be lost.
  - The `deleted` column on the `Playlist` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE `Playlist` DROP COLUMN `deletedAt`,
    DROP COLUMN `deleted`,
    ADD COLUMN `deleted` DATETIME(3) NULL;
