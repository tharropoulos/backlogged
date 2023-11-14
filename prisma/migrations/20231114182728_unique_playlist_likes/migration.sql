/*
  Warnings:

  - A unique constraint covering the columns `[userId,playlistId]` on the table `PlaylistLike` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `PlaylistLike_userId_playlistId_key` ON `PlaylistLike`(`userId`, `playlistId`);
