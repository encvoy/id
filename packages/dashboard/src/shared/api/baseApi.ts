import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "./helpers";
import { ETags } from "src/shared/utils/enums";

export const emptySplitApi = createApi({
  reducerPath: "api",
  tagTypes: Object.values(ETags),
  baseQuery: createBaseQuery(),
  endpoints: () => ({}),
});
