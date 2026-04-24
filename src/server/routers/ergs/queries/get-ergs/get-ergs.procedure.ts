import { protectedProcedure } from "@/server/procedures";
import { getErgsQuery } from "./get-ergs.query";

export const getErgsProcedure = protectedProcedure.query(({ ctx }) =>
	getErgsQuery(undefined, ctx),
);
