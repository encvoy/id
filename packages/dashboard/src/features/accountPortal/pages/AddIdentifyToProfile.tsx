import { SwapHorizontalCircleOutlined } from "@mui/icons-material";
import { Avatar, Box, useTheme } from "@mui/material";
import { startRegistration } from "@simplewebauthn/browser";
import { Buffer } from "buffer";
import clsx from "clsx";
import QRCode from "qrcode";
import { FC, memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { connect, useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ETags, routes, tabs } from "src/shared/utils/enums";
import { useBindEthereumAccountMutation } from "src/shared/api/profile";
import { usersApi } from "src/shared/api/users";
import { getImageURL, randomString } from "src/shared/utils/helpers";
import { withAppBase } from "src/shared/utils/appBasePath";
import { getLocalizedTextValue } from "src/shared/utils/locales";
import { setNoticeError } from "src/shared/slices/noticesSlice";
import { useGetOauthMutation } from "src/shared/api/auth";
import { useLazyGetNonceQuery } from "src/shared/api/ethereum";
import {
  EGetProviderAction,
  IMTLSParams,
  EProviderType,
  TOauthProvider,
  useGetProvidersQuery,
} from "src/shared/api/provider";
import { RootState } from "src/app/store/store";
import { getAccessToken } from "src/shared/utils/auth";
import {
  ActionButtons,
  CustomIcon,
  InputCode,
  ModalInfo,
  SubmitModal,
  SurfaceBlock,
} from "@encvoy-id/components";
import { Typography } from "@mui/material";
import styles from "./AddIdentifyToProfile.module.css";
import { TFileString } from "src/shared/api/types";
import { TAppSlice } from "src/shared/slices/appSlice";

const mapStateToProps = (state: RootState) => ({
  userId: state.user.profile.id,
  systemClientId: state.app.systemClientId,
});

interface IAddIdentifyToProfileProps {
  userId?: string;
  systemClientId: TAppSlice["systemClientId"];
}

// Type response from /otp/setup
type OtpSetupResponse = {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
  digits: number;
  algorithm: string;
  period?: number;
  counter?: number;
  state: string;
};

const isWebAuthnPreviouslyRegisteredError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const webAuthnError = error as {
    code?: unknown;
    name?: unknown;
    cause?: { name?: unknown };
  };

  return (
    webAuthnError.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED" ||
    webAuthnError.name === "InvalidStateError" ||
    webAuthnError.cause?.name === "InvalidStateError"
  );
};

export const AddIdentifyToProfileComponent: FC<IAddIdentifyToProfileProps> = ({
  userId,
  systemClientId,
}) => {
  const theme = useTheme();
  // States for OTP
  const [otpModal, setOtpModal] = useState<{
    open: boolean;
    providerType: "TOTP" | "HOTP" | null;
    providerId?: string;
    data?: OtpSetupResponse;
    code?: string;
    error?: string;
    loading?: boolean;
  }>({ open: false, providerType: null });
  const otpConfirmInProgressRef = useRef(false);

  // Request to backend for OTP generation (universal for TOTP/HOTP)
  const handleOtpSetup = async (
    providerType: "TOTP" | "HOTP",
    providerId: string
  ) => {
    setOtpModal({ open: true, providerType, loading: true });
    try {
      const access = await getAccessToken();
      const res = await fetch(
        withAppBase(
          `/api/otp/${providerType.toLowerCase()}/setup?provider_id=${providerId}`
        ),
        {
          method: "GET",
          headers: { Authorization: `Bearer ${access}` },
        }
      );
      if (!res.ok) throw new Error("Request error");
      const data = await res.json();
      setOtpModal({ open: true, providerType, data, providerId });
    } catch (e: any) {
      setOtpModal({ open: true, providerType, error: e.message });
    }
  };

  // Confirm code (POST /api/otp/confirm-setup)
  const handleOtpConfirm = async (code = otpModal.code) => {
    if (
      !otpModal.data ||
      !code ||
      code.length !== otpModal.data.digits ||
      otpConfirmInProgressRef.current
    ) {
      return;
    }

    otpConfirmInProgressRef.current = true;
    setOtpModal((prev) => ({ ...prev, loading: true, error: undefined }));
    try {
      const access = await getAccessToken();
      const res = await fetch(
        withAppBase(`/api/v1/profile/external_accounts/${otpModal.providerId}`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
          body: JSON.stringify({
            token: code,
            state: otpModal.data.state,
            provider_id: otpModal.providerId,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Confirmation error");
      }
      setOtpModal({ open: false, providerType: null });
      dispatch(usersApi.util.invalidateTags([ETags.ExternalAccounts]));
      navigate(`/${routes.profile}/${tabs.profile}`);
    } catch (e: any) {
      setOtpModal((prev) => ({ ...prev, error: e.message, loading: false }));
    } finally {
      otpConfirmInProgressRef.current = false;
    }
  };

  const handleOtpCodeChange = (code: string) => {
    setOtpModal((prev) => ({ ...prev, code, error: undefined }));

    if (
      otpModal.data &&
      !otpModal.loading &&
      code.length === otpModal.data.digits
    ) {
      void handleOtpConfirm(code);
    }
  };

  const { t: translate, i18n } = useTranslation();
  const { data: providers } = useGetProvidersQuery({
    client_id: systemClientId || "",
    query: {
      action: EGetProviderAction.auth,
    },
  });
  const [bindEthereumAccount] = useBindEthereumAccountMutation();
  const [isOpen, setIsOpen] = useState(false);
  const windowRef = useRef<Window | null>(null);
  const popupIntervalRef = useRef<number | null>(null);
  const popupMessageHandlerRef = useRef<((event: MessageEvent) => void) | null>(
    null
  );
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [providerOauth, setProviderOauth] = useState<{
    avatar: TFileString;
    name: string;
    type: string;
  }>({
    avatar: "",
    name: "",
    type: "",
  });
  const [getNonce] = useLazyGetNonceQuery();
  const [getOauthUrl] = useGetOauthMutation();
  const client = useSelector((state: RootState) => state.app.clientProfile);
  const PROJECT_NAME = client?.name || "PROJECT_NAME";

  const cleanupExternalAccountPopup = () => {
    if (popupIntervalRef.current !== null) {
      window.clearInterval(popupIntervalRef.current);
      popupIntervalRef.current = null;
    }

    if (popupMessageHandlerRef.current) {
      window.removeEventListener("message", popupMessageHandlerRef.current);
      popupMessageHandlerRef.current = null;
    }
  };

  const externalAccount = async (providerId: string) => {
    cleanupExternalAccountPopup();

    const oauthParams: any = {
      provider_id: providerId,
      state: randomString(30),
      return_url: true,
    };
    const result = await getOauthUrl(oauthParams);
    windowRef.current = window.open(
      "error" in result ? "" : result.data.url,
      "_blank",
      `left=${screen.width}, top=` +
        (screen.height - 470) / 2 +
        ` width=500, height=500`
    );

    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const params = new URLSearchParams(event.data);
      const result = params.get("result");
      const cause = params.get("cause");

      if (result === "true") {
        cleanupExternalAccountPopup();
        windowRef.current?.close();
        windowRef.current = null;
        dispatch(usersApi.util.invalidateTags([ETags.ExternalAccounts]));
        navigate(`/${routes.profile}/${tabs.profile}`);
      } else if (result === "false") {
        cleanupExternalAccountPopup();
        windowRef.current?.close();
        windowRef.current = null;
        setIsOpen(false);
        dispatch(
          setNoticeError(
            cause || translate("pages.addLoginMethod.errors.bindingError")
          )
        );
      }
    };

    popupMessageHandlerRef.current = messageHandler;
    window.addEventListener("message", messageHandler);

    popupIntervalRef.current = window.setInterval(() => {
      if (windowRef.current?.closed) {
        cleanupExternalAccountPopup();
        windowRef.current = null;
        dispatch(
          setNoticeError(
            translate("pages.addLoginMethod.errors.operationCancelled")
          )
        );
        setIsOpen(false);
      }
    }, 250);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const authByEthereum = async (rebind?: boolean) => {
    if (window.ethereum) {
      const address = await getEthereumAddress();
      if (address) {
        const { data } = await getNonce(address);

        if (userId && data?.nonce) {
          const sign = await getEthereumSign(address, data?.nonce);
          await bindEthereumAccount({
            userId,
            address,
            signature: sign,
            rebind,
            client_id: systemClientId || "",
            provider_id: "ETHEREUM",
          }).unwrap();
        }
      }
      navigate(`/${routes.profile}/${tabs.profile}`);
    } else {
      dispatch(
        setNoticeError(translate("pages.addLoginMethod.errors.installMetamask"))
      );
    }
  };

  const getEthereumAddress = async (): Promise<string | undefined> => {
    try {
      await window?.ethereum?.request({ method: "eth_requestAccounts" });
      const accounts = await window?.ethereum?.request({
        method: "eth_accounts",
      });

      if (accounts?.length) return accounts[0];
      return undefined;
    } catch (e) {
      console.error("getEthereumAddress error: ", e);
    }
  };

  const getEthereumSign = async (address: string, nonce: string) => {
    try {
      const hashedMessage = `0x${Buffer.from(
        translate("pages.addLoginMethod.ethereumSignMessage", {
          projectName: PROJECT_NAME,
          nonce,
        }),
        "utf8"
      ).toString("hex")}`;

      return await window?.ethereum?.request({
        method: "personal_sign",
        params: [hashedMessage, address, ""],
      });
    } catch (e) {
      console.error("getEthereumSign error: ", e);
    }
  };

  const handleMtlsBinding = async (providerId: string, issuer: string) => {
    try {
      const access = await getAccessToken();

      // Call API to start mTLS certificate binding process
      const responseBind = await fetch(
        `${issuer}/api/mtls/bind?provider_id=${providerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
          credentials: "include",
        }
      );
      const optionsJSON = await responseBind.json();
      const responseVerify = await fetch(
        withAppBase(`/api/v1/profile/external_accounts/${providerId}`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
          body: JSON.stringify({
            provider_id: providerId,
            state: optionsJSON.state,
          }),
        }
      );

      if (responseVerify.ok) {
        // Assuming backend redirects or returns success; invalidate cache
        dispatch(usersApi.util.invalidateTags([ETags.ExternalAccounts]));
        navigate(`/${routes.profile}/${tabs.profile}`);
      } else {
        const errorResult = await responseVerify.json();
        throw new Error(
          errorResult.message ||
            translate("pages.addLoginMethod.errors.certificateBindingError")
        );
      }
    } catch (error) {
      console.error("mTLS binding error:", error);
      dispatch(
        setNoticeError(
          `${translate(
            "pages.addLoginMethod.errors.certificateBindingError"
          )}: ${error}`
        )
      );
    }
  };

  const handleWebAuthnBinding = async (providerId: string) => {
    try {
      const access = await getAccessToken();

      // Call API to start WebAuthn device binding process
      const responseBind = await fetch(
        withAppBase(`/api/webauthn/register?provider_id=${providerId}`),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
        }
      );

      const { state, ...optionsJSON } = await responseBind.json();
      const authResponse = await startRegistration(optionsJSON);

      const responseVerify = await fetch(
        withAppBase(`/api/v1/profile/external_accounts/${providerId}`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
          body: JSON.stringify({
            provider_id: providerId,
            state,
            registrationResponse: authResponse,
          }),
        }
      );
      if (responseVerify.ok) {
        dispatch(usersApi.util.invalidateTags([ETags.ExternalAccounts]));
        navigate(`/${routes.profile}/${tabs.profile}`);
      } else {
        const errorResult = await responseVerify.json();
        throw new Error(
          errorResult.message || translate("errors.unknownError")
        );
      }
    } catch (error) {
      console.error("WebAuthn binding error:", error);
      const isPreviouslyRegistered = isWebAuthnPreviouslyRegisteredError(error);
      const errorMessage = isPreviouslyRegistered
        ? translate("pages.addLoginMethod.errors.webauthnAlreadyRegistered")
        : `${translate(
            "pages.addLoginMethod.errors.webauthnBindingError"
          )}: ${error}`;

      dispatch(setNoticeError(errorMessage));
    }
  };

  useEffect(() => {
    return () => {
      cleanupExternalAccountPopup();
    };
  }, []);

  const closeWindow = () => {
    cleanupExternalAccountPopup();
    setIsOpen(false);
    windowRef.current?.close();
    windowRef.current = null;
  };

  const itemsProviders = providers?.map((provider) => {
    return (
      <SurfaceBlock
        key={provider.id}
        className={styles.provider}
        onClick={() => {
          if (provider.type === EProviderType.MTLS) {
            const mtlsParams = provider.params as IMTLSParams;
            handleMtlsBinding(provider.id.toString(), mtlsParams?.issuer);
          } else if (provider.type === EProviderType.WEBAUTHN) {
            handleWebAuthnBinding(provider.id.toString());
          } else if (
            provider.type === EProviderType.TOTP ||
            provider.type === EProviderType.HOTP
          ) {
            handleOtpSetup(provider.type, provider.id.toString());
          } else {
            const providerCopy = { ...provider } as TOauthProvider;
            setProviderOauth({
              name: getLocalizedTextValue(providerCopy.name, i18n.language),
              avatar: providerCopy.avatar,
              type: providerCopy.type,
            });
            setIsOpen(true);
            externalAccount(provider.id);
          }
        }}
      >
        <Avatar
          variant="square"
          src={getImageURL(provider.avatar)}
          className={styles.icon}
        >
          {!provider.avatar && (
            <CustomIcon
              Icon={SwapHorizontalCircleOutlined}
              color="textSecondary"
              sx={{ width: "35px", height: "35px" }}
            />
          )}
        </Avatar>
        <div>
          <Typography className="text-14">
            {getLocalizedTextValue(provider.name, i18n.language)}
          </Typography>
          <Typography className="text-12" color="text.secondary">
            {provider.type}
          </Typography>
        </div>
      </SurfaceBlock>
    );
  });

  const closeOtpModal = () => {
    setOtpModal({ open: false, providerType: null });
  };

  const renderOtpModal = () => (
    <SubmitModal
      isOpen={otpModal.open}
      onClose={closeOtpModal}
      onSubmit={handleOtpConfirm}
      disabled={
        otpModal.loading ||
        !otpModal.data ||
        otpModal.code?.length !== otpModal.data.digits
      }
      actionButtonText={translate("actionButtons.confirm")}
      title={
        otpModal.providerType === EProviderType.TOTP
          ? translate("pages.addLoginMethod.modals.otpSetupTitleTotp")
          : translate("pages.addLoginMethod.modals.otpSetupTitleHotp")
      }
    >
      {otpModal.loading && (
        <Typography className="text-14">
          {translate("helperText.loading")}
        </Typography>
      )}
      {otpModal.error && (
        <Typography className="text-14" color="error">
          {otpModal.error}
        </Typography>
      )}
      {otpModal.data && (
        <>
          <Typography sx={{ textAlign: "center", margin: 2 }}>
            <QrCodeDisplay value={otpModal.data.qrCode} />
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              marginBottom: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography>
              {translate("pages.addLoginMethod.modals.otpSecretManualLabel")}
            </Typography>
            <Typography className="text-12">
              {otpModal.data.manualEntryKey}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              marginBottom: 1,
              alignItems: "center",
            }}
          >
            <Typography>
              {translate("pages.addLoginMethod.modals.otpAlgorithmLabel")}
            </Typography>
            <Typography>{otpModal.data.algorithm}</Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              marginBottom: 1,
              alignItems: "center",
            }}
          >
            <Typography>
              {translate("pages.addLoginMethod.modals.otpDigitsLabel")}
            </Typography>
            <Typography>{otpModal.data.digits}</Typography>
          </Box>
          {otpModal.data.period && (
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                marginBottom: 1,
                alignItems: "center",
              }}
            >
              <Typography>
                {translate("pages.addLoginMethod.modals.otpPeriodLabel")}
              </Typography>
              <Typography>{otpModal.data.period}</Typography>
            </Box>
          )}
          {otpModal.data.counter !== undefined && (
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                marginBottom: 1,
                alignItems: "center",
              }}
            >
              <Typography>
                {translate("pages.addLoginMethod.modals.otpCounterLabel")}
              </Typography>
              <Typography className="text-12">
                {otpModal.data.counter}
              </Typography>
            </Box>
          )}
          <Typography sx={{ marginTop: "16px" }} color="text.secondary">
            {translate("pages.addLoginMethod.modals.otpModalInstruction")}
          </Typography>
          <InputCode
            value={otpModal.code || ""}
            onChange={handleOtpCodeChange}
            length={otpModal.data.digits}
            disabled={otpModal.loading}
            autoFocus
            dataTestId="otp-code-input"
          />
        </>
      )}
    </SubmitModal>
  );

  return (
    <div className="page-container">
      <div className="content">
        <SurfaceBlock className={styles.container}>
          <Typography className="text-20-medium" sx={{ marginBottom: "24px" }}>
            {translate("pages.addLoginMethod.title")}
          </Typography>
          <Typography
            color="text.secondary"
            className={clsx("text-14", styles.description)}
          >
            {itemsProviders?.length
              ? translate("pages.addLoginMethod.description")
              : translate("pages.addLoginMethod.noMethods")}
          </Typography>
          <div className={styles.providerList}>
            {itemsProviders?.length ? itemsProviders : ""}
          </div>
          <ActionButtons onCancel={() => navigate(-1)} />
        </SurfaceBlock>
        <ModalInfo onClose={closeWindow} isOpen={isOpen}>
          <Box
            className={styles.modalHeader}
            sx={{ borderRadius: theme.encvoy.componentBorderRadius }}
          >
            <Avatar
              variant="square"
              src={getImageURL(providerOauth.avatar)}
              className={styles.modalIcon}
              sx={{ borderRadius: theme.encvoy.componentBorderRadius }}
            >
              {!providerOauth.avatar && (
                <CustomIcon
                  Icon={SwapHorizontalCircleOutlined}
                  sx={{ width: "35px", height: "35px" }}
                />
              )}
            </Avatar>
          </Box>
          <Box
            className={styles.modalContent}
            sx={{ borderRadius: theme.encvoy.componentBorderRadius }}
          >
            <Typography className={styles.modalTitle}>
              {translate("pages.addLoginMethod.modals.loginToAccount", {
                providerName: providerOauth?.name,
              })}
            </Typography>
            <Typography color="text.secondary" className="text-14">
              {translate("pages.addLoginMethod.modals.confirmAddition")}
            </Typography>
          </Box>
        </ModalInfo>
        {renderOtpModal()}
      </div>
    </div>
  );
};

interface IQrCodeDisplayProps {
  value: string;
  size?: number;
  ariaLabel?: string;
}

const QrCodeDisplay = memo(
  ({ value, size = 180, ariaLabel = "QR code" }: IQrCodeDisplayProps) => {
    const qrRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (value && qrRef.current && !value.startsWith("data:image")) {
        QRCode.toCanvas(qrRef.current, value, { width: size }).catch(
          (error) => {
            console.error("QR code generation error:", error);
          }
        );
      }
    }, [size, value]);

    if (value.startsWith("data:image")) {
      return (
        <img
          src={value}
          alt={ariaLabel}
          style={{ width: size, height: size }}
        />
      );
    }

    return (
      <canvas
        ref={qrRef}
        aria-label={ariaLabel}
        role="img"
        style={{ width: size, height: size }}
      />
    );
  }
);

QrCodeDisplay.displayName = "QrCodeDisplay";

export const AddIdentifyToProfile = connect(mapStateToProps)(
  AddIdentifyToProfileComponent
);
