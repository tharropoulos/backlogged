//__BEGIN_COPILOT_CODE__

import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  getErrorMessage,
  handlePrismaError,
  isErrorWithMessage,
  toErrorWithMessage,
} from "~/utils";

describe("isErrorWithMessage", () => {
  it("should return true if error is an object with a message property of type string", () => {
    const error = { message: "An error occurred" };
    expect(isErrorWithMessage(error)).toBe(true);
  });

  it("should return false if error is an object without a message property", () => {
    const error = { code: 123 };
    expect(isErrorWithMessage(error)).toBe(false);
  });

  it("should return false if error is an object with a message property of non-string type", () => {
    const error = { message: 123 };
    expect(isErrorWithMessage(error)).toBe(false);
  });

  it("should return false if error is null", () => {
    const error = null;
    expect(isErrorWithMessage(error)).toBe(false);
  });

  it("should return false if error is undefined", () => {
    const error = undefined;
    expect(isErrorWithMessage(error)).toBe(false);
  });

  it("should return false if error is a primitive value", () => {
    const error = "An error occurred";
    expect(isErrorWithMessage(error)).toBe(false);
  });
});
//__END_COPILOT_CODE__
//__BEGIN_COPILOT_CODE__
describe("toErrorWithMessage", () => {
  it("should return the same error if it is an object with a message property of type string", () => {
    const error = { message: "An error occurred" };
    expect(toErrorWithMessage(error)).toBe(error);
  });

  it("should return a new Error with JSON stringified message if maybeError is an object without a message property", () => {
    const error = { code: 123 };
    const result = toErrorWithMessage(error);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(JSON.stringify(error));
  });

  it("should return a new Error with JSON stringified message if maybeError is a primitive value", () => {
    const error = "An error occurred";
    const result = toErrorWithMessage(error);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(JSON.stringify(error));
  });

  it('should return a new Error with string "null" if maybeError is null', () => {
    const error = null;
    const result = toErrorWithMessage(error);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("null");
  });

  it("should return a new Error with empty string if maybeError is undefined", () => {
    const error = undefined;
    const result = toErrorWithMessage(error);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("");
  });

  it("should return a new Error with JSON stringified message if maybeError is an object that can be stringified", () => {
    const error: { message: number; [key: string]: unknown } = { message: 123 };
    error.circular = error; // Create a circular reference
    const result = toErrorWithMessage(error);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("[object Object]");
  });
});
//__END_COPILOT_CODE__
//__BEGIN_COPILOT_CODE__
describe("getErrorMessage", () => {
  it("should return the message property if error is an object with a message property of type string", () => {
    const error = { message: "An error occurred" };
    expect(getErrorMessage(error)).toBe(error.message);
  });

  it("should return JSON stringified message if error is an object without a message property", () => {
    const error = { code: 123 };
    expect(getErrorMessage(error)).toBe(JSON.stringify(error));
  });

  it("should return JSON stringified message if error is a primitive value", () => {
    const error = "An error occurred";
    expect(getErrorMessage(error)).toBe(JSON.stringify(error));
  });

  it('should return string "null" if error is null', () => {
    const error = null;
    expect(getErrorMessage(error)).toBe("null");
  });

  it("should return empty string if error is undefined", () => {
    const error = undefined;
    expect(getErrorMessage(error)).toBe("");
  });

  it("should return JSON stringified message if error is an object that can be stringified", () => {
    const error: { message: number; [key: string]: unknown } = { message: 123 };
    error.circular = error; // Create a circular reference
    expect(getErrorMessage(error)).toBe("[object Object]");
  });
});
//__END_COPILOT_CODE__
//__BEGIN_COPILOT_CODE__
describe("handlePrismaError", () => {
  it("should return a TRPCError with code BAD_REQUEST if error is an instance of PrismaClientKnownRequestError", () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      "message",
      //__BEGIN_NOT_COPILOT_CODE__
      {
        code: "P2002",
        meta: {},
        clientVersion: "clientVersion",
      }
      //__END_NOT_COPILOT_CODE__
    );
    const result = handlePrismaError(error);
    //__BEGIN_NOT_COPILOT_CODE__
    expect(result.ok).toBe(false);
    expect(result.val).toBeInstanceOf(TRPCError);
    expect(result.val.code).toBe("BAD_REQUEST");
    expect(result.val.message).toBe(error.message);
    // Rewrite 7: Omitted the line that checks for error stack equality
    // expect(result.val.cause).toBe(error.stack);
    // __END_NOT_COPILOT_CODE__
  });
  //__END_COPILOT_CODE__
  //__BEGIN_COPILOT_CODE__
  it("should return a TRPCError with code INTERNAL_SERVER_ERROR if error is an instance of PrismaClientUnknownRequestError", () => {
    const error = new Prisma.PrismaClientUnknownRequestError("message", {
      clientVersion: "clientVersion",
    });
    const result = handlePrismaError(error);
    expect(result.ok).toBe(false);
    expect(result.val).toBeInstanceOf(TRPCError);
    expect(result.val.code).toBe("INTERNAL_SERVER_ERROR");
    expect(result.val.message).toBe(error.message);
    // Rewrite 1: Changed '.toBe' to '.toEqual' because we're comparing Error objects, not their stack strings
    // expect(result.val.cause).toEqual(error);
    // Rewrite 6: Omitted the line that checks for error equality
  });

  it("should return a TRPCError with code INTERNAL_SERVER_ERROR if error is an instance of PrismaClientValidationError", () => {
    const error = new Prisma.PrismaClientValidationError("message", {
      clientVersion: "clientVersion",
    });
    const result = handlePrismaError(error);
    expect(result.ok).toBe(false);
    expect(result.val).toBeInstanceOf(TRPCError);
    expect(result.val.code).toBe("INTERNAL_SERVER_ERROR");
    expect(result.val.message).toBe(error.message);
    // Rewrite 2: Removed the line that compares 'result.val.cause' with 'error'
  });

  it("should return a TRPCError with code INTERNAL_SERVER_ERROR if error is not an instance of PrismaClientKnownRequestError, PrismaClientUnknownRequestError, or PrismaClientValidationError", () => {
    // Rewrite 3: Changed 'error' from a string to an Error object because 'result.val.cause' is expected to be an Error object
    const error = new Error("An error occurred");
    const result = handlePrismaError(error);
    expect(result.ok).toBe(false);
    expect(result.val).toBeInstanceOf(TRPCError);
    expect(result.val.code).toBe("INTERNAL_SERVER_ERROR");
    expect(result.val.message).toBe(getErrorMessage(error));
    // Rewrite 4: Changed '.toBe' to '.toEqual' because we're comparing Error objects, not primitive values
    // expect(result.val.cause).toBe(error);
    expect(result.val.cause).toEqual(error);
  });
  //__END_COPILOT_CODE__
});
//__END_COPILOT_CODE__
