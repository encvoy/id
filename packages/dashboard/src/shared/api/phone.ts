import { emptySplitApi } from "./baseApi";
import {
  createFetchArgs,
  createFetchArgsWithBody,
} from "src/shared/api/helpers";
import { endPoints } from "src/shared/utils/enums";

export const phoneApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    checkPhoneExists: builder.query<{ isExist: boolean }, string>({
      query: (phoneNumber) =>
        createFetchArgs(`${endPoints.verification}/check`, "GET", {
          type: "PHONE",
          phone_number: encodeURIComponent(phoneNumber),
        }),
    }),

    callPhone: builder.mutation<
      {
        success: boolean;
        code_type: string;
        code_length?: number;
        message?: string;
      },
      string
    >({
      query: (phoneNumber) =>
        createFetchArgsWithBody(
          `${endPoints.verification}/code`,
          "POST",
          JSON.stringify({
            type: "PHONE",
            phone_number: phoneNumber,
          })
        ),
    }),
  }),
});

export const { useCallPhoneMutation, useLazyCheckPhoneExistsQuery } = phoneApi;
