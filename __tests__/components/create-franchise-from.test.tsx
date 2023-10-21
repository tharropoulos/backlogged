/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import React from "react";
import { CreateFranchiseForm } from "~/components/forms/create-franchise-form";

jest.mock("next-auth/react");
jest.mock("~/lib/api", () => ({
  api: {
    franchise: {
      create: {
        useMutation: jest.fn(),
      },
    },
  },
}));
const mockClient = "mockClient";

const ApiContext = React.createContext({
  client: mockClient,
});

describe("CreateFranchiseForm", () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);
  });

  afterEach(() => {
    document.body.removeChild(root);
  });

  it("renders without crashing", () => {
    (useSession as jest.Mock).mockReturnValueOnce({
      data: {},
      status: "authenticated",
    });

    const app = (
      <ApiContext.Provider value={{ client: "mockClient" }}>
        <CreateFranchiseForm />
      </ApiContext.Provider>
    );

    render(app, { container: root });

    expect(screen.getByText("Name")).toBeInTheDocument();
  });
  describe("when the user is not authenticated", () => {
    it("renders a message", () => {
      // Arrange
      (useSession as jest.Mock).mockReturnValueOnce({
        data: {},
        status: "unauthenticated",
      });

      const app = (
        <ApiContext.Provider value={{ client: "mockClient" }}>
          <CreateFranchiseForm />
        </ApiContext.Provider>
      );

      // Act
      render(app, { container: root });

      // Assert
      expect(screen.getByText("You're not logged in")).toBeInTheDocument();
    });
  });
});
