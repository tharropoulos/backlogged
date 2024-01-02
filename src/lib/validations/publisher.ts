//__BEGIN_COPILOT_CODE
import { z } from "zod";

//__BEGIN_NON_COPILOT_CODE
// __REWRITE__2: Changed naming from franchise to publisher
// export const createFranchiseSchema = z.object({
export const createPublisherSchema = z.object({
  //__END_NON_COPILOT_CODE
  name: z.string().min(1, { message: "A name is required" }).max(255),
  description: z
    .string()
    .min(1, { message: "A description is required" })
    .max(255),
  image: z.string().min(1).max(255),
});

//__BEGIN_NON_COPILOT_CODE
// __REWRITE__2: Changed naming from franchise to publisher
// export const updateFranchiseSchema = createFranchiseSchema.extend({
export const updatePublisherSchema = createPublisherSchema.extend({
  //__END_NON_COPILOT_CODE
  //__REWRITE__1: Changed from cuid() to cuid2()
  // id: z.string().cuid(),
  id: z.string().cuid2(),
});
//__END_COPILOT_CODE
