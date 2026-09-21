import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { GOOGLE_SHEET_API_URL } from "../../utils/constants";
import type { UOG_DATA_TYPE, VU_STUDY_DATA_TYPE } from "./type";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({ baseUrl: GOOGLE_SHEET_API_URL }),
  endpoints: (builder) => ({
    getMyUogAppData: builder.query<UOG_DATA_TYPE, void>({
      query: () =>
        `AKfycbzZkgTYLPD6hZJTa8et6DjumjKbyxS5mr92Mm5SzQC82l9Qyrq1x6s0GbvPs7B7_6yCeQ/exec`,
    }),
     getMyVUStudyAppData: builder.query<VU_STUDY_DATA_TYPE, void>({
      query: () =>
        `AKfycbz-Q59cUDuRRKDABqpRZxZY9w_9CyBMILw07iW7iJRvkSat6TOTNVpjXquku-pq2vXtoA/exec`,
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetMyUogAppDataQuery, useGetMyVUStudyAppDataQuery } = userApi;
