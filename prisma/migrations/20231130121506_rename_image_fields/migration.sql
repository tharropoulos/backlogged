/*
  Warnings:

  - You are about to drop the column `cover_image` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `cover_image` on the `Feature` table. All the data in the column will be lost.
  - You are about to drop the column `background_image` on the `Franchise` table. All the data in the column will be lost.
  - You are about to drop the column `cover_image` on the `Platform` table. All the data in the column will be lost.
  - You are about to drop the column `cover_image` on the `Publisher` table. All the data in the column will be lost.
  - Added the required column `image` to the `Developer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `Feature` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `Franchise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `Platform` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `Publisher` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Developer` DROP COLUMN `cover_image`,
    ADD COLUMN `image` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Feature` DROP COLUMN `cover_image`,
    ADD COLUMN `image` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Franchise` DROP COLUMN `background_image`,
    ADD COLUMN `image` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Platform` DROP COLUMN `cover_image`,
    ADD COLUMN `image` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Publisher` DROP COLUMN `cover_image`,
    ADD COLUMN `image` VARCHAR(191) NOT NULL;
