/*
  Warnings:

  - You are about to drop the `Francise` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `Francise`;

-- CreateTable
CREATE TABLE `Franchise` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `background_image` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
