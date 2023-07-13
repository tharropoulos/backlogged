-- CreateTable
CREATE TABLE `Platform` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `cover_image` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GameToPlatform` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `gameId` VARCHAR(191) NOT NULL,
    `platformId` VARCHAR(191) NOT NULL,
    `store_link` VARCHAR(191) NOT NULL,

    INDEX `GameToPlatform_gameId_idx`(`gameId`),
    INDEX `GameToPlatform_platformId_idx`(`platformId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
