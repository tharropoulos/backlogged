/* eslint-disable testing-library/no-await-sync-query */
import type { User } from "@prisma/client";
import type { Session } from "next-auth";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { createId } from "@paralleldrive/cuid2";
import { faker } from "@faker-js/faker";
import { type z } from "zod";

import { createMockCaller, createTestData } from "~/lib/utils";
import type { createPlaylistSchema } from "~/lib/validations/playlist";

beforeAll(async () => {
  await createTestData({
    comment: "parent_only",
  });

  console.log("game, publisher, franchise, user and comment created");
});

afterAll(async () => {
  const deleteGames = prisma.game.deleteMany();
  const deletePublishers = prisma.publisher.deleteMany();
  const deleteFranchises = prisma.franchise.deleteMany();
  const deletePlatforms = prisma.platform.deleteMany();
  const deleteGenres = prisma.genre.deleteMany();
  const deleteDevelopers = prisma.developer.deleteMany();
  const deleteFeatures = prisma.feature.deleteMany();
  const deleteReviews = prisma.review.deleteMany();
  const deletePlaylists = prisma.playlist.deleteMany();
  const deleteFollows = prisma.follows.deleteMany();
  const deleteUsers = prisma.user.deleteMany();

  await prisma.$transaction([
    deleteGames,
    deletePublishers,
    deleteFranchises,
    deletePlatforms,
    deleteGenres,
    deleteDevelopers,
    deleteFeatures,
    deleteReviews,
    deletePlaylists,
    deleteFollows,
    deleteUsers,
  ]);
  await prisma.$disconnect();
});

const mockUser: User = {
  id: createId(),
  name: "Test User",
  email: "email",
  image: "image",
  emailVerified: null,
};

const unauthorizedCaller = appRouter.createCaller({
  session: null,
  prisma: prisma,
});

const mockSession: Session = {
  expires: new Date().toISOString(),
  user: mockUser,
};
const authorizedCaller = appRouter.createCaller({
  session: mockSession,
  prisma: prisma,
});

describe("When retrieving a playlist by id", () => {
  describe("and the playlist doesn't exist", () => {
    it("should return an error", async () => {
      //Act
      const result = await authorizedCaller.playlist.getById({
        id: createId(),
      });

      //Assert
      expect(result.ok).toBe(false);
      //Assert
      //NOTE: Copilot suggestion
      // await expect(result).rejects.toThrow();
    });
  });
  describe("and the playlist exists", () => {
    //NOTE: Copilot suggestion
    describe("and the playlist is public", () => {
      it("should return the playlist", async () => {
        //Arrange
        const { playlist } = await createTestData({ playlist: "public" });

        if (playlist.some) {
          //Act
          const result = await unauthorizedCaller.playlist.getById({
            id: playlist.val.id,
          });

          //NOTE: Copilot suggestion
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject({
            id: playlist.val.id,
            name: playlist.val.name,
            description: playlist.val.description,
            visibility: playlist.val.visibility,
          });
        } else {
          throw new Error("playlist not created");
        }
      });
    });
    describe("and the playlist is private", () => {
      //NOTE: Copilot suggestion
      describe("and the user is not the owner of the playlist", () => {
        it("should return an error", async () => {
          //Arrange
          const { playlist } = await createTestData({ playlist: "private" });

          if (playlist.some) {
            //Act
            const result = await unauthorizedCaller.playlist.getById({
              id: playlist.val.id,
            });

            //Assert
            expect(result.ok).toBe(false);
          } else {
            throw new Error("playlist not created");
          }
        });
      });
      describe("and the user is the owner of the playlist", () => {
        it("should return the playlist", async () => {
          //Arrange
          const { user, playlist } = await createTestData({
            playlist: "private",
          });

          if (playlist.some && user.some) {
            const caller = createMockCaller({ user: user.val });

            //Act
            const result = await caller.playlist.getById({
              id: playlist.val.id,
            });

            //Assert
            expect(result.ok).toBe(true);
            expect(result.val).toMatchObject({
              id: playlist.val.id,
              name: playlist.val.name,
              description: playlist.val.description,
              visibility: playlist.val.visibility,
            });
          } else {
            throw new Error("user or playlist not created");
          }
        });
      });
    });
    describe("and the playlist is followers only", () => {
      describe("and the user is not the owner of the playlist", () => {
        describe("and the user is not following the owner of the playlist", () => {
          //NOTE: Copilot suggestion
          it("should return an error", async () => {
            //Arrange
            const { playlist } = await createTestData({
              playlist: "followers_only",
            });

            if (playlist.some) {
              //Act
              const result = await unauthorizedCaller.playlist.getById({
                id: playlist.val.id,
              });

              //Assert
              expect(result.ok).toBe(false);
            } else {
              throw new Error("playlist not created");
            }
          });
        });
        describe("and the user is following the owner of the playlist", () => {
          it("should return the playlist", async () => {
            //NOTE: Copilot suggestion
            //Arrange
            const { user, follower, playlist } = await createTestData({
              playlist: "followers_only",
            });

            if (playlist.some && user.some && follower.some) {
              const caller = createMockCaller({ user: follower.val });

              //Act
              const result = await caller.playlist.getById({
                id: playlist.val.id,
              });

              //Assert
              expect(result.ok).toBe(true);
              expect(result.val).toMatchObject({
                id: playlist.val.id,
                name: playlist.val.name,
                description: playlist.val.description,
                visibility: playlist.val.visibility,
              });
            } else {
              throw new Error("user or playlist not created");
            }
          });
        });
      });
      describe("and the user is the owner of the playlist", () => {
        it("should return the playlist", async () => {
          //Arrange
          const { user, playlist } = await createTestData({
            playlist: "followers_only",
          });

          if (playlist.some && user.some) {
            const caller = createMockCaller({ user: user.val });

            //Act
            const result = await caller.playlist.getById({
              id: playlist.val.id,
            });

            //Assert
            expect(result.ok).toBe(true);
            expect(result.val).toMatchObject({
              id: playlist.val.id,
              name: playlist.val.name,
              description: playlist.val.description,
              visibility: playlist.val.visibility,
            });
          } else {
            throw new Error("user or playlist not created");
          }
        });
      });
    });
  });
});

describe("When creating a playlist", () => {
  //NOTE: Copilot suggestion
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      //Arrange
      const input: z.infer<typeof createPlaylistSchema> = {
        name: faker.lorem.words(),
        description: faker.lorem.words(),
        visibility: "PUBLIC",
      };

      //Act
      const result = unauthorizedCaller.playlist.create(input);

      //Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    it("should create the playlist", async () => {
      //Arrange
      const input: z.infer<typeof createPlaylistSchema> = {
        name: faker.lorem.words(),
        description: faker.lorem.words(),
        visibility: "PUBLIC",
      };

      const { user } = await createTestData({ user: true });

      //NOTE: Copilot suggestion
      if (user.some) {
        const caller = createMockCaller({ user: user.val });

        //Act
        const result = await caller.playlist.create(input);

        //Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject({
          name: input.name,
          description: input.description,
          visibility: input.visibility,
        });
      } else {
        throw new Error("user not created");
      }

      //NOTE: Copilot suggestion
      // const { user } = await createTestData({});

      // //Act
      // const result = await authenticatedCaller.playlist.create(input);
    });
  });
});

describe("When updating a playlist", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      //NOTE: Copilot suggestion
      //Arrange
      const input: z.infer<typeof createPlaylistSchema> & { id: string } = {
        name: faker.lorem.words(),
        description: faker.lorem.words(),
        visibility: "PUBLIC",
        id: createId(),
      };

      //Act
      const result = unauthorizedCaller.playlist.update(input);

      //Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the playlist doesn't exist", () => {
      //NOTE: Copilot suggestion
      it("should return an error", async () => {
        //Arrange
        //NOTE: I added the id: string to the type
        const input: z.infer<typeof createPlaylistSchema> & { id: string } = {
          name: faker.lorem.words(),
          description: faker.lorem.words(),
          visibility: "PUBLIC",
          id: createId(),
        };

        //Act
        const result = await authorizedCaller.playlist.update(input);

        //Assert
        expect(result.ok).toBe(false);
      });
    });
    describe("and the playlist exists", () => {
      //NOTE: Copilot suggestion up to line 409
      describe("and the user is not the owner of the playlist", () => {
        it("should return an error", async () => {
          //Arrange
          const input: z.infer<typeof createPlaylistSchema> = {
            name: faker.lorem.words(),
            description: faker.lorem.words(),
            visibility: "PUBLIC",
          };

          const { playlist } = await createTestData({
            playlist: "private",
          });

          if (playlist.some) {
            //Act
            //NOTE I had to remove the await
            const result = unauthorizedCaller.playlist.update({
              // const result = await unauthorizedCaller.playlist.update({
              id: playlist.val.id,
              name: input.name,
              description: input.description,
              visibility: input.visibility,
            });

            //Assert
            //NOTE: I had to change this
            // expect(result.ok).toBe(false);
            await expect(result).rejects.toThrow();
          } else {
            throw new Error("playlist not created");
          }
        });
      });
      describe("and the user is the owner of the playlist", () => {
        it("should update the playlist", async () => {
          //Arrange
          const input: z.infer<typeof createPlaylistSchema> = {
            name: faker.lorem.words(),
            description: faker.lorem.words(),
            visibility: "PUBLIC",
          };

          const { user, playlist } = await createTestData({
            playlist: "private",
          });

          if (playlist.some && user.some) {
            const caller = createMockCaller({ user: user.val });

            //Act
            const result = await caller.playlist.update({
              id: playlist.val.id,
              name: input.name,
              description: input.description,
              visibility: input.visibility,
            });

            //Assert
            expect(result.ok).toBe(true);
            expect(result.val).toMatchObject({
              name: input.name,
              description: input.description,
              visibility: input.visibility,
            });
          } else {
            throw new Error("user or playlist not created");
          }
        });
      });
    });
    //NOTE: Copilot suggestion
    // it("should update the playlist", async () => {
    //   //Arrange
    //   const input: z.infer<typeof createPlaylistSchema> = {
    //     name: faker.lorem.words(),
    //     description: faker.lorem.words(),
    //     visibility: "PUBLIC",
    //   };
    //   const { user, playlist } = await createTestData({
    //     playlist: "private",
    //   });
    //   if (playlist.some && user.some) {
    //     const caller = createMockCaller({ user: user.val });
    //     //Act
    //     const result = await caller.playlist.update({
    //       id: playlist.val.id,
    //       name: input.name,
    //       description: input.description,
    //       visibility: input.visibility,
    //     });
    //     //Assert
    //     expect(result.ok).toBe(true);
    //     expect(result.val).toMatchObject({
    //       name: input.name,
    //       description: input.description,
    //       visibility: input.visibility,
    //     });
    //   } else {
    //     throw new Error("user or playlist not created");
    //   }
    // });
  });
});

describe("When deleting a playlist", () => {
  describe("and the user is not authenticated", () => {
    //NOTE: Copilot suggestion
    it("should return an error", async () => {
      //Arrange
      const id = createId();

      //Act
      const result = unauthorizedCaller.playlist.delete({ id });

      //Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the playlist doesn't exist", () => {
      //NOTE: Copilot suggestion
      it("should return an error", async () => {
        //Act
        const result = await authorizedCaller.playlist.delete({
          id: createId(),
        });

        //Assert
        expect(result.ok).toBe(false);
      });
    });
  });
  describe("and the playlist exists", () => {
    describe("and the user is not the owner of the playlist", () => {
      //NOTE: Copilot suggestion
      it("should return an error", async () => {
        //Arrange
        const { playlist } = await createTestData({
          playlist: "private",
        });

        if (playlist.some) {
          //Act
          const result = await authorizedCaller.playlist.delete({
            id: playlist.val.id,
          });

          //Assert
          expect(result.ok).toBe(false);
        } else {
          throw new Error("playlist not created");
        }
      });
    });
    describe("and the user is the owner of the playlist", () => {
      it("should delete the playlist", async () => {
        //Arrange
        const { user, playlist } = await createTestData({
          playlist: "private",
        });

        if (playlist.some && user.some) {
          const caller = createMockCaller({ user: user.val });

          //Act
          const result = await caller.playlist.delete({
            id: playlist.val.id,
          });

          //Assert
          expect(result.ok).toBe(true);
        } else {
          throw new Error("user or playlist not created");
        }
      });
    });
  });
});

describe("When liking a playlist", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      //Act
      const result = unauthorizedCaller.playlist.like({
        id: createId(),
      });

      //Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the playlist doesn't exist", () => {
      it("should return an error", async () => {
        //Act
        const result = await authorizedCaller.playlist.like({
          id: createId(),
        });

        //Assert
        expect(result.ok).toBe(false);
      });
    });
    describe("and the playlist exists", () => {
      describe("and the user has already liked the playlist", () => {
        //NOTE: Copilot suggestion
        it("should return an error", async () => {
          //Arrange
          const { user, playlist } = await createTestData({
            playlist: "private",
          });

          if (playlist.some && user.some) {
            const caller = createMockCaller({ user: user.val });

            //Act
            await caller.playlist.like({
              id: playlist.val.id,
            });

            const result = await caller.playlist.like({
              id: playlist.val.id,
            });

            //Assert
            expect(result.ok).toBe(false);
          } else {
            throw new Error("user or playlist not created");
          }
        });
      });
      describe("and the user has not liked the playlist", () => {
        it("should like the playlist", async () => {
          //Arrange
          const { user, playlist } = await createTestData({
            playlist: "private",
          });

          if (playlist.some && user.some) {
            const caller = createMockCaller({ user: user.val });

            //Act
            const result = await caller.playlist.like({
              id: playlist.val.id,
            });

            const playlistPrisma = await prisma.playlist.findUnique({
              where: {
                id: playlist.val.id,
              },
              include: {
                likes: true,
              },
            });

            //Assert
            expect(result.ok).toBe(true);
            expect(playlistPrisma?.likes).toHaveLength(1);
          } else {
            throw new Error("user or playlist not created");
          }
        });
      });
    });
  });
});

describe("When unliking a playlist", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      //Act
      const result = unauthorizedCaller.playlist.unlike({
        id: createId(),
      });

      //Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    //NOTE: Copilot suggestion
    describe("and the playlist doesn't exist", () => {
      it("should return an error", async () => {
        //Act
        const result = await authorizedCaller.playlist.unlike({
          id: createId(),
        });

        //Assert
        expect(result.ok).toBe(false);
      });
    });
    describe("and the playlist exists", () => {
      //NOTE: Copilot suggestion
      describe("and the user has not liked the playlist", () => {
        it("should return an error", async () => {
          //Arrange
          const { playlist } = await createTestData({
            playlist: "private",
          });

          if (playlist.some) {
            //Act
            const result = await authorizedCaller.playlist.unlike({
              id: playlist.val.id,
            });

            //Assert
            expect(result.ok).toBe(false);
          } else {
            throw new Error("user or playlist not created");
          }
        });
      });
      describe("and the user has liked the playlist", () => {
        //NOTE: Copilot suggestion
        it("should unlike the playlist", async () => {
          //Arrange
          const { user, playlist } = await createTestData({
            playlist: "private",
          });

          if (playlist.some && user.some) {
            const caller = createMockCaller({ user: user.val });

            //Act
            await caller.playlist.like({
              id: playlist.val.id,
            });

            const result = await caller.playlist.unlike({
              id: playlist.val.id,
            });

            const playlistPrisma = await prisma.playlist.findUnique({
              where: {
                id: playlist.val.id,
              },
              include: {
                likes: true,
              },
            });

            //Assert
            expect(result.ok).toBe(true);
            expect(playlistPrisma?.likes).toHaveLength(0);
          } else {
            throw new Error("user or playlist not created");
          }
        });
      });
    });
  });
});

describe("When retrieving all playlists", () => {
  describe("and there are no playlists", () => {
    it("should return an empty array", async () => {
      //Arrange
      await prisma.playlist.deleteMany();
      //Act
      const result = await authorizedCaller.playlist.getAll();

      //Assert
      expect(result.ok).toBe(true);
      expect(result.val).toHaveLength(0);
    });
  });
  describe("and there are playlists", () => {
    describe("and the user is not authenticated", () => {
      it("should return only public playlists", async () => {
        //Arrange
        const { playlist } = await createTestData({
          playlist: "public",
        });

        await createTestData({
          playlist: "private",
        });

        if (playlist.some) {
          //Act
          const result = await unauthorizedCaller.playlist.getAll();

          //Assert
          expect(result.ok).toBe(true);
          expect(result.val).toHaveLength(1);
        } else {
          throw new Error("playlist not created");
        }
      });
    });
    describe("and the user is authenticated", () => {
      it("should return all the public playlists, the user's private playlists and the playlists of the users they follow", async () => {
        //Arrange
        const {
          user,
          playlist: followersPlaylist,
          follower: user2,
        } = await createTestData({
          playlist: "followers_only",
        });

        await createTestData({
          playlist: "public",
        });

        if (followersPlaylist.some && user.some && user2.some) {
          const user2Caller = createMockCaller({ user: user2.val });
          const userCaller = createMockCaller({ user: user.val });

          await prisma.playlist.create({
            data: {
              name: faker.lorem.words(1),
              description: faker.lorem.words(),
              visibility: "PRIVATE",
              userId: user2.val.id,
              type: "CUSTOM",
            },
          });

          //Act
          const user2Result = await user2Caller.playlist.getAll();
          const user1Result = await userCaller.playlist.getAll();

          //Assert
          expect(user2Result.ok).toBe(true);
          expect(user2Result.val).toHaveLength(3);
          expect(user1Result.ok).toBe(true);
          expect(user1Result.val).toHaveLength(2);
        } else {
          throw new Error("user or playlist not created");
        }
      });
    });
  });
});

describe("When adding games to playlist", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      //Act
      //NOTE: Copilot suggestion
      const result = unauthorizedCaller.playlist.addGames({
        //NOTE: Copilot messed the naming
        gameIds: [],
        playlistId: createId(),
      });

      //Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the playlist doesn't exist", () => {
      it("should return an error", async () => {
        //NOTE: Copilot suggestion
        //Arrange
        const { game } = await createTestData({ game: true });

        if (game.some) {
          //Act
          const result = await authorizedCaller.playlist.addGames({
            gameIds: [game.val.id],
            playlistId: createId(),
          });

          //Assert
          expect(result.ok).toBe(false);
        } else {
          throw new Error("game not created");
        }
      });
    });
    describe("and the playlist exists", () => {
      describe("and the user is not the owner of the playlist", () => {
        it("should return an error", async () => {
          //NOTE: Copilot suggestion
          //Arrange
          const { game, playlist } = await createTestData({
            game: true,
            playlist: "private",
          });

          if (game.some && playlist.some) {
            //Act
            const result = await authorizedCaller.playlist.addGames({
              gameIds: [game.val.id],
              playlistId: playlist.val.id,
            });

            //Assert
            expect(result.ok).toBe(false);
          } else {
            throw new Error("game or playlist not created");
          }
        });
      });
    });
    describe("and the user is the owner of the playlist", () => {
      //NOTE: Copilot suggestion up to line 900
      describe("and the game doesn't exist", () => {
        it("should return an error", async () => {
          //Arrange
          //NOTE: had to add user
          const { playlist, user } = await createTestData({
            playlist: "private",
          });

          if (playlist.some && user.some) {
            //NOTE: had to change the mock caller
            // const caller = createMockCaller({user: playlist.val.user})
            const caller = createMockCaller({ user: user.val });

            //Act
            const result = await caller.playlist.addGames({
              gameIds: [createId()],
              playlistId: playlist.val.id,
            });

            //Assert
            expect(result.ok).toBe(false);
          } else {
            throw new Error("playlist or user not created");
          }
        });
      });
      describe("and the game exists", () => {
        describe("and the game is already in the playlist", () => {
          it("should add the game twice", async () => {
            //Arrange
            //NOTE: had to add user
            const { game, user, playlist } = await createTestData({
              game: true,
              playlist: "private",
            });

            const { game: game2 } = await createTestData({
              game: true,
            });

            //NOTE: had to change the mock caller
            if (game.some && game2.some && playlist.some && user.some) {
              const caller = createMockCaller({ user: user.val });
              // const caller = createMockCaller({ user: playlist.val.user });

              //Act
              await caller.playlist.addGames({
                gameIds: [game.val.id, game2.val.id],
                playlistId: playlist.val.id,
              });

              const result = await caller.playlist.addGames({
                gameIds: [game.val.id, game2.val.id],
                playlistId: playlist.val.id,
              });

              const playlistPrisma = await prisma.playlist.findUnique({
                where: {
                  id: playlist.val.id,
                },
                include: {
                  games: true,
                },
              });

              //Assert
              expect(result.ok).toBe(true);
              expect(playlistPrisma?.games).toHaveLength(4);
            } else {
              throw new Error("game, user or playlist not created");
            }
          });
        });
        describe("and the game is not in the playlist", () => {
          //NOTE: Copilot suggestion
          it("should add the game to the playlist", async () => {
            //Arrange
            const { game, user, playlist } = await createTestData({
              game: true,
              playlist: "private",
            });

            if (game.some && playlist.some && user.some) {
              const caller = createMockCaller({ user: user.val });
              // const caller = createMockCaller({ user: playlist.val.user });

              //Act
              const result = await caller.playlist.addGames({
                gameIds: [game.val.id],
                playlistId: playlist.val.id,
              });

              const playlistPrisma = await prisma.playlist.findUnique({
                where: {
                  id: playlist.val.id,
                },
                include: {
                  games: true,
                },
              });

              //Assert
              expect(result.ok).toBe(true);
              expect(playlistPrisma?.games).toHaveLength(1);
            } else {
              throw new Error("game, user or playlist not created");
            }
          });
        });
      });
    });
  });
});

describe("When removing games from a playlist", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      //NOTE: Copilot suggestion
      //Act
      const result = unauthorizedCaller.playlist.removeGames({
        gameIds: [],
        playlistId: createId(),
      });

      //Assert
      //NOTE: I had to add the await
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the playlist doesn't exist", () => {
      it("should return an error", async () => {
        //NOTE: Copilot suggestion
        //Arrange
        const { game } = await createTestData({ game: true });

        if (game.some) {
          //Act
          const result = await authorizedCaller.playlist.removeGames({
            gameIds: [game.val.id],
            playlistId: createId(),
          });

          //Assert
          expect(result.ok).toBe(false);
        } else {
          throw new Error("game not created");
        }
      });
    });
    describe("and the playlist exists", () => {
      describe("and the user is not the owner of the playlist", () => {
        it("should return an error", async () => {
          //Arrange
          //NOTE: Copilot suggestion
          const { game, playlist } = await createTestData({
            game: true,
            playlist: "private",
          });

          if (game.some && playlist.some) {
            //Act
            const result = await authorizedCaller.playlist.removeGames({
              gameIds: [game.val.id],
              playlistId: playlist.val.id,
            });

            //Assert
            expect(result.ok).toBe(false);
          } else {
            throw new Error("game or playlist not created");
          }
        });
      });
      describe("and the user is the owner of the playlist", () => {
        describe("and the game doesn't exist", () => {
          it("should return an error", async () => {
            //Arrange
            //NOTE: Copilot suggestion
            const { playlist, user } = await createTestData({
              playlist: "private",
            });

            if (playlist.some && user.some) {
              //NOTE: Copilot suggestion
              // const caller = createMockCaller({ user: playlist.val.user });
              const caller = createMockCaller({ user: user.val });

              //Act
              const result = await caller.playlist.removeGames({
                gameIds: [createId()],
                playlistId: playlist.val.id,
              });

              //Assert
              expect(result.ok).toBe(false);
            } else {
              throw new Error("playlist or user not created");
            }
          });
        });
        describe("and the game exists", () => {
          describe("and the game is not in the playlist", () => {
            it("should return an error", async () => {
              //NOTE: Copilot suggestion
              //Arrange
              const { game, playlist, user } = await createTestData({
                game: true,
                playlist: "private",
              });

              if (game.some && playlist.some && user.some) {
                const caller = createMockCaller({ user: user.val });
                // const caller = createMockCaller({ user: playlist.val.user });

                //Act
                const result = await caller.playlist.removeGames({
                  gameIds: [game.val.id],
                  playlistId: playlist.val.id,
                });

                //Assert
                expect(result.ok).toBe(false);
              } else {
                throw new Error("game, user or playlist not created");
              }
            });
          });
          describe("and the game is in the playlist", () => {
            it("should remove the game from the playlist", async () => {
              //NOTE: Copilot suggestion
              //Arrange
              const { game, playlist, user } = await createTestData({
                game: true,
                playlist: "private",
              });

              const { game: game2 } = await createTestData({ game: true });

              if (game.some && game2.some && playlist.some && user.some) {
                const caller = createMockCaller({ user: user.val });
                // const caller = createMockCaller({ user: playlist.val.user });

                await caller.playlist.addGames({
                  gameIds: [game.val.id, game2.val.id],
                  playlistId: playlist.val.id,
                });

                //Act
                const result = await caller.playlist.removeGames({
                  gameIds: [game.val.id, game2.val.id],
                  playlistId: playlist.val.id,
                });

                const playlistPrisma = await prisma.playlist.findUnique({
                  where: {
                    id: playlist.val.id,
                  },
                  include: {
                    games: true,
                  },
                });

                //Assert
                expect(result.ok).toBe(true);
                expect(playlistPrisma?.games).toHaveLength(0);
              } else {
                throw new Error("game, user or playlist not created");
              }
            });
          });
        });
      });
    });
  });
});
