import { SwapHorizontalCircleOutlined } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { startRegistration } from "@simplewebauthn/browser";
import { Buffer } from "buffer";
import clsx from "clsx";
import QRCode from "qrcode";
import { FC, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { connect, useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ETags, routes, tabs } from "src/shared/utils/enums";
import { useBindEthereumAccountMutation } from "src/shared/api/profile";
import { usersApi } from "src/shared/api/users";
import Cookies from "universal-cookie";
import { CLIENT_ID, DOMAIN } from "src/shared/utils/constants";
import { getImageURL, randomString } from "src/shared/utils/helpers";
import { setNoticeError } from "src/shared/lib/noticesSlice";
import { useGetOauthMutation } from "src/shared/api/auth";
import { useLazyGetNonceQuery } from "src/shared/api/ethereum";
import {
  EGetProviderAction,
  IMTLSParams,
  ProviderType,
  TOauthProvider,
  useGetProvidersQuery,
} from "src/shared/api/provider";
import { RootState } from "src/app/store/store";
import { getAccessToken } from "src/shared/utils/auth";
import {
  generateCodeChallenge,
  generateCodeVerifier,
} from "src/shared/utils/pkce";
import { Typography } from "@mui/material";
import { ModalInfo } from "src/shared/ui/modal/ModalInfo";
import { ActionButtons } from "src/shared/ui/components/ActionButtons";
import styles from "./AddIdentifyToProfile.module.css";
import { TFileString } from "src/shared/api/types";
import { componentBorderRadius } from "src/shared/theme/Theme";
import { CustomIcon } from "src/shared/ui/components/CustomIcon";

const mapStateToProps = (state: RootState) => ({
  userId: state.user.profile.id,
});

interface IAddIdentifyToProfileProps {
  userId?: string;
}

// Тип для ответа от /otp/setup
type OtpSetupResponse = {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
  digits: number;
  algorithm: string;
  period?: number;
  counter?: number;
};

export const AddIdentifyToProfileComponent: FC<IAddIdentifyToProfileProps> = ({
  userId,
}) => {
  // Состояния для OTP
  const [otpModal, setOtpModal] = useState<{
    open: boolean;
    providerType: "TOTP" | "HOTP" | null;
    data?: OtpSetupResponse;
    code?: string;
    error?: string;
    loading?: boolean;
  }>({ open: false, providerType: null });

  // Запрос к backend для генерации OTP (универсальный для TOTP/HOTP)
  const handleOtpSetup = async (providerType: "TOTP" | "HOTP") => {
    setOtpModal({ open: true, providerType, loading: true });
    try {
      const access = await getAccessToken();
      const res = await fetch(
        `/api/otp/setup?type=${providerType.toLowerCase()}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${access}` },
        }
      );
      if (!res.ok) throw new Error("Ошибка запроса");
      const data = await res.json();
      setOtpModal({ open: true, providerType, data });
    } catch (e: any) {
      setOtpModal({ open: true, providerType, error: e.message });
    }
  };

  // Подтверждение кода (POST /api/otp/confirm-setup)
  const handleOtpConfirm = async () => {
    if (!otpModal.data || !otpModal.code) return;
    setOtpModal((prev) => ({ ...prev, loading: true, error: undefined }));
    try {
      const access = await getAccessToken();
      const res = await fetch(`/api/otp/confirm-setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ token: otpModal.code }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Ошибка подтверждения");
      }
      setOtpModal({ open: false, providerType: null });
      dispatch(usersApi.util.invalidateTags([ETags.ExternalAccounts]));
      navigate(`/${routes.profile}/${tabs.profile}`);
    } catch (e: any) {
      setOtpModal((prev) => ({ ...prev, error: e.message, loading: false }));
    }
  };
  const { t: translate } = useTranslation();
  const { data: providers } = useGetProvidersQuery({
    client_id: CLIENT_ID,
    query: {
      is_public: true,
      action: EGetProviderAction.auth,
    },
  });
  const [bindEthereumAccount] = useBindEthereumAccountMutation();
  const [isOpen, setIsOpen] = useState(false);
  const windowRef = useRef<Window | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  let intervalId: ReturnType<typeof setTimeout>;
  const cookies = new Cookies();
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

  const externalAccount = async (providerId: string) => {
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
      if (event.origin !== DOMAIN) {
        return;
      }

      const params = new URLSearchParams(event.data);
      const result = params.get("result");
      const cause = params.get("cause");

      cookies.remove(`pkce_code_verifier_${providerId}`, {
        path: "/api/interaction/code",
      });
      cookies.remove(`pkce_state_${providerId}`, {
        path: "/api/interaction/code",
      });
      cookies.remove(`pkce_device_id_${providerId}`, {
        path: "/api/interaction/code",
      });

      if (result === "true") {
        clearInterval(intervalId);
        windowRef.current?.close();
        dispatch(usersApi.util.invalidateTags([ETags.ExternalAccounts]));
        navigate(`/${routes.profile}/${tabs.profile}`);
      } else if (result === "false") {
        clearInterval(intervalId);
        windowRef.current?.close();
        setIsOpen(false);
        dispatch(
          setNoticeError(
            cause || translate("pages.addLoginMethod.errors.bindingError")
          )
        );
      }
    };

    window.addEventListener("message", messageHandler);

    intervalId = setInterval(() => {
      if (windowRef.current?.closed) {
        dispatch(
          setNoticeError(
            translate("pages.addLoginMethod.errors.operationCancelled")
          )
        );
        setIsOpen(false);
        clearInterval(intervalId);
        window.removeEventListener("message", messageHandler);
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
            client_id: CLIENT_ID,
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
        "/api/v1/profile/external_accounts?type=mtls",
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
        `/api/webauthn/register?provider_id=${providerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
        }
      );

      const optionsJSON = await responseBind.json();
      const authResponse = await startRegistration(optionsJSON);

      const responseVerify = await fetch(
        "/api/v1/profile/external_accounts?type=webauthn",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
          body: JSON.stringify({
            provider_id: providerId,
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
      dispatch(
        setNoticeError(
          `${translate(
            "pages.addLoginMethod.errors.webauthnBindingError"
          )}: ${error}`
        )
      );
    }
  };

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== DOMAIN) {
        return;
      }

      const params = new URLSearchParams(event.data);
      const result = params.get("result");
      const cause = params.get("cause");

      if (result === "true") {
        console.info("Authentication successful");
      } else if (result === "false") {
        console.warn("Authentication failed:", cause);
      }
    };

    window.addEventListener("message", messageHandler);

    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, []);

  const closeWindow = () => {
    setIsOpen(false);
    windowRef.current?.close();
  };

  const itemsProviders = providers?.map((provider) => {
    return (
      <Box
        key={provider.id}
        className={styles.provider}
        sx={{ borderRadius: componentBorderRadius }}
        onClick={() => {
          if (provider.type === ProviderType.MTLS) {
            const mtlsParams = provider.params as IMTLSParams;
            handleMtlsBinding(provider.id.toString(), mtlsParams?.issuer);
          } else if (provider.type === ProviderType.WEBAUTHN) {
            handleWebAuthnBinding(provider.id.toString());
          } else if (
            provider.type === ProviderType.TOTP ||
            provider.type === ProviderType.HOTP
          ) {
            handleOtpSetup(provider.type);
          } else {
            const providerCopy = { ...provider } as TOauthProvider;
            setProviderOauth({
              name: providerCopy.name,
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
          <Typography className="text-14">{provider.name}</Typography>
          <Typography className="text-12" color="text.secondary">
            {provider.type}
          </Typography>
        </div>
      </Box>
    );
  });
  // --- Компонент для отображения QR-кода ---
  // Если backend возвращает qrCode как data:image/png;base64..., просто <img src=...>
  // Если otpauth://... — генерируем через qrcode
  const QrCodeDisplay: FC<{ value: string }> = ({ value }) => {
    const qrRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
      if (value && qrRef.current && !value.startsWith("data:image")) {
        QRCode.toCanvas(qrRef.current, value, { width: 180 });
      }
    }, [value]);
    if (value.startsWith("data:image")) {
      return (
        <img src={value} alt="QR code" style={{ width: 180, height: 180 }} />
      );
    }
    return <canvas ref={qrRef} style={{ width: 180, height: 180 }} />;
  };

  // --- Модальное окно для TOTP/HOTP ---
  const renderOtpModal = () => (
    <Dialog
      open={otpModal.open}
      onClose={() => setOtpModal({ open: false, providerType: null })}
    >
      <DialogTitle>
        {otpModal.providerType === "TOTP" ? "Настройка TOTP" : "Настройка HOTP"}
      </DialogTitle>
      <DialogContent>
        {otpModal.loading && <div>Загрузка...</div>}
        {otpModal.error && <div style={{ color: "red" }}>{otpModal.error}</div>}
        {otpModal.data && (
          <>
            <div style={{ textAlign: "center", margin: 16 }}>
              <QrCodeDisplay value={otpModal.data.qrCode} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>Секрет (manual):</b> {otpModal.data.manualEntryKey}
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>Алгоритм:</b> {otpModal.data.algorithm}
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>Цифр:</b> {otpModal.data.digits}
            </div>
            {otpModal.data.period && (
              <div style={{ marginBottom: 8 }}>
                <b>Период:</b> {otpModal.data.period}
              </div>
            )}
            {otpModal.data.counter !== undefined && (
              <div style={{ marginBottom: 8 }}>
                <b>Счетчик:</b> {otpModal.data.counter}
              </div>
            )}
            <TextField
              label="Введите код из приложения"
              value={otpModal.code || ""}
              onChange={(e) =>
                setOtpModal((prev) => ({ ...prev, code: e.target.value }))
              }
              fullWidth
              margin="normal"
              disabled={otpModal.loading}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => setOtpModal({ open: false, providerType: null })}
          disabled={otpModal.loading}
        >
          Отмена
        </Button>
        <Button
          onClick={handleOtpConfirm}
          disabled={otpModal.loading || !otpModal.code}
          variant="contained"
        >
          Подтвердить
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <div className="page-container">
      <div className="content">
        <Box
          className={styles.container}
          sx={{ borderRadius: componentBorderRadius }}
        >
          <Typography className="title-medium">
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
        </Box>
        <ModalInfo onClose={closeWindow} isOpen={isOpen}>
          <Box
            className={styles.modalHeader}
            sx={{ borderRadius: componentBorderRadius }}
          >
            <Avatar
              variant="square"
              src={getImageURL(providerOauth.avatar)}
              className={styles.modalIcon}
              sx={{ borderRadius: componentBorderRadius }}
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
            sx={{ borderRadius: componentBorderRadius }}
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

export const AddIdentifyToProfile = connect(mapStateToProps)(
  AddIdentifyToProfileComponent
);
