/*
  Warnings:

  - The primary key for the `GameToPlatform` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `_GameToPlaylist` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `GameToPlatform` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- DropTable
DROP TABLE `_GameToPlaylist`;

-- CreateTable
CREATE TABLE `GameToPlaylist` (
    `id` VARCHAR(191) NOT NULL,
    `gameId` VARCHAR(191) NOT NULL,
    `playlistId` VARCHAR(191) NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `order` INTEGER NOT NULL AUTO_INCREMENT,

    INDEX `GameToPlaylist_gameId_idx`(`gameId`),
    INDEX `GameToPlaylist_playlistId_idx`(`playlistId`),
    INDEX `GameToPlaylist_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
