import { endPoints } from "src/shared/utils/enums";
import { emptySplitApi } from "./baseApi";
import { createFetchArgs, createFetchArgsWithBody } from "./helpers";

export enum EContactCodeTypes {
  confirmEmail = "confirmEmail",
}

interface IContactCode {
  uid?: string;
  type?: string;
  user_id?: string;
  name?: string;
  resend?: boolean;
  rebind?: boolean;
  code_type?: EContactCodeTypes;
  timezone_offset?: number;
}

interface IEmailCode extends IContactCode {
  email: string;
}

export const verificationApi = emptySplitApi.injectEndpoints({
  endpoints: (builder) => ({
    checkEmail: builder.query<
      { isExist: boolean; uniqueRule: boolean },
      string
    >({
      query: (email) =>
        createFetchArgs(`${endPoints.verification}/check`, "GET", {
          type: "EMAIL",
          email,
        }),
    }),
    sendEmailCode: builder.mutation<void, IEmailCode>({
      query: (body) => {
        const timezoneOffsetInHours = new Date().getTimezoneOffset() / 60;
        return createFetchArgsWithBody<IEmailCode>(
          `${endPoints.verification}/code`,
          "POST",
          {
            ...body,
            timezone_offset: timezoneOffsetInHours,
            type: "EMAIL",
            code_type: EContactCodeTypes.confirmEmail,
          }
        );
      },
    }),
    checkPhoneNumber: builder.query<{ isExist: boolean }, string>({
      query: (phoneNumber) =>
        createFetchArgs(`${endPoints.verification}/check`, "GET", {
          type: "SMS",
          phone_number: phoneNumber,
        }),
    }),
    checkStatusVerification: builder.query<{ status: boolean }, string>({
      query: (email) =>
        createFetchArgs(`${endPoints.verification}/status`, "GET", {
          email,
        }),
    }),
  }),
});

export const {
  useLazyCheckStatusVerificationQuery,
  useLazyCheckEmailQuery,
  useSendEmailCodeMutation,
} = verificationApi;
