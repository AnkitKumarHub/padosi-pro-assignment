import { z } from "zod";

export const taskSelectionBody = z
  .strictObject({
    taskIds: z.array(z.number().int().positive()).max(100),
  })
  .superRefine((value, ctx) => {
    const unique = new Set(value.taskIds);
    if (unique.size !== value.taskIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "Task IDs must be distinct.",
        path: ["taskIds"],
      });
    }
  });
