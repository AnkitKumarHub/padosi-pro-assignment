import { z } from "zod";

export const profileBody = z.strictObject({
  name: z.string().trim().min(1, "Name is required.").max(80),
  mobileNumber: z
    .string()
    .regex(/^\+91\d{10}$/, "Enter a valid mobile number (+91 followed by 10 digits)."),
  address: z.string().trim().min(1, "Address is required.").max(300),
  businessName: z
    .string()
    .max(120)
    .optional()
    .transform((value) => {
      if (value === undefined) return null;
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    }),
});
