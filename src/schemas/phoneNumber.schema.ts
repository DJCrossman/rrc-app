import parsePhoneNumber from "libphonenumber-js";
import { z } from "zod";

export const phoneNumberSchema = z.string().transform((value = "", ctx) => {
	const phoneNumber = parsePhoneNumber(value, {
		defaultCountry: "CA",
	});

	if (!phoneNumber?.isValid()) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "Invalid phone number",
		});
		return z.NEVER;
	}

	return phoneNumber.formatInternational();
});
