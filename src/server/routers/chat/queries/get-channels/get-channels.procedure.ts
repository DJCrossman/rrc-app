import { viewerProcedure } from "@/server/procedures";
import { getChannelsQuery } from "./get-channels.query";

export const getChannelsProcedure = viewerProcedure.query(({ ctx }) =>
	getChannelsQuery(undefined, ctx),
);
