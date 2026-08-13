import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import {
  Autocomplete,
  Box,
  Chip,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import {
  ICreatePersonalTokenResponse,
  IPersonalToken,
  useCreatePersonalTokenMutation,
  useGetAvailableTokenPermissionsQuery,
  useLazyGetPersonalTokensQuery,
} from "src/shared/api/tokens";
import { IQuerySortParams } from "src/shared/api/types";
import { setNoticeError, setNoticeInfo } from "src/shared/slices/noticesSlice";
import { ListItems } from "src/shared/ui/CardsList.tsx";
import { ISubmitModalProps, SubmitModal } from "@encvoy-id/components";
import { IconWithTooltip } from "@encvoy-id/components";
import { IconsLibrary } from "@encvoy-id/components";
import { ModalInfo } from "@encvoy-id/components";
import { Order } from "src/shared/utils/enums";
import { ITokenCardProps, TokenCard } from "./TokenCard";

const TOKEN_TTL_OPTIONS = [
  { key: "one_hour", seconds: 60 * 60 },
  { key: "one_day", seconds: 24 * 60 * 60 },
  { key: "seven_days", seconds: 7 * 24 * 60 * 60 },
  { key: "thirty_days", seconds: 30 * 24 * 60 * 60 },
] as const;

const MIN_TOKEN_TTL_MS = 60 * 1000;
const DEFAULT_TOKEN_TTL_SECONDS =
  TOKEN_TTL_OPTIONS[TOKEN_TTL_OPTIONS.length - 1].seconds;

type TTokenExpirationMode = "preset" | "datetime" | "never";

function toDateTimeLocalValue(date: Date): string {
  const offsetDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60 * 1000
  );
  return offsetDate.toISOString().slice(0, 16);
}

export const TokensList: FC = () => {
  const { t: translate } = useTranslation();
  const dispatch = useDispatch();
  const [customUpdate, setCustomUpdate] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createdToken, setCreatedToken] =
    useState<ICreatePersonalTokenResponse | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [expirationMode, setExpirationMode] =
    useState<TTokenExpirationMode>("preset");
  const [expiresIn, setExpiresIn] = useState<number>(DEFAULT_TOKEN_TTL_SECONDS);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [minExpiresAt, setMinExpiresAt] = useState<string>("");
  const [minExpirationTimestamp, setMinExpirationTimestamp] = useState<
    number | null
  >(null);
  const [permissionSearchValue, setPermissionSearchValue] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [modalProps, setModalProps] = useState<ISubmitModalProps>({
    isOpen: false,
    onSubmit: () => {},
    onClose: () => {},
    title: "",
    actionButtonText: "",
    mainMessage: [],
  });
  const [getTokens] = useLazyGetPersonalTokensQuery();
  const [createPersonalToken, { isLoading: isCreating }] =
    useCreatePersonalTokenMutation();
  const { data: availablePermissionsData, isFetching: permissionsLoading } =
    useGetAvailableTokenPermissionsQuery();

  const availablePermissions = useMemo(
    () => availablePermissionsData?.permissions || [],
    [availablePermissionsData?.permissions]
  );
  const availablePermissionOptions = useMemo(
    () =>
      availablePermissions.filter(
        (permission) => !selectedPermissions.includes(permission)
      ),
    [availablePermissions, selectedPermissions]
  );
  const expirationDateError = useMemo(() => {
    if (expirationMode !== "datetime") {
      return "";
    }

    if (!expiresAt) {
      return translate("errors.requiredField");
    }

    const expirationDate = new Date(expiresAt);
    if (Number.isNaN(expirationDate.getTime())) {
      return translate("pages.tokens.errors.invalidExpirationDate");
    }

    if (
      typeof minExpirationTimestamp === "number" &&
      expirationDate.getTime() < minExpirationTimestamp
    ) {
      return translate("pages.tokens.errors.expirationDateTooSoon");
    }

    return "";
  }, [expirationMode, expiresAt, minExpirationTimestamp, translate]);

  const query = (offset: number, search = ""): IQuerySortParams => {
    void search;

    return {
      sortBy: "created_at",
      sortDirection: Order.DESC,
      limit: 10,
      offset,
      search: "",
    };
  };

  const setDefaultExpirationValues = (baseTimestamp: number) => {
    const nextMinExpirationTimestamp = baseTimestamp + MIN_TOKEN_TTL_MS;

    setExpiresIn(DEFAULT_TOKEN_TTL_SECONDS);
    setMinExpirationTimestamp(nextMinExpirationTimestamp);
    setMinExpiresAt(toDateTimeLocalValue(new Date(nextMinExpirationTimestamp)));
    setExpiresAt(
      toDateTimeLocalValue(
        new Date(baseTimestamp + DEFAULT_TOKEN_TTL_SECONDS * 1000)
      )
    );
  };

  const openCreateModal = () => {
    setDefaultExpirationValues(Date.now());
    setIsCreateModalOpen(true);
  };

  const resetCreateModal = () => {
    setTokenName("");
    setExpirationMode("preset");
    setDefaultExpirationValues(Date.now());
    setPermissionSearchValue("");
    setSelectedPermissions([]);
    setIsCreateModalOpen(false);
  };

  const handleAddPermission = (permission: string | null) => {
    if (!permission || selectedPermissions.includes(permission)) {
      return;
    }

    setSelectedPermissions((currentPermissions) =>
      [...currentPermissions, permission].sort()
    );
    setPermissionSearchValue("");
  };

  const handleDeletePermission = (permission: string) => {
    setSelectedPermissions((currentPermissions) =>
      currentPermissions.filter((item) => item !== permission)
    );
  };

  const handleCreate = async () => {
    try {
      const response = await createPersonalToken(
        expirationMode === "never"
          ? {
              name: tokenName.trim(),
              permissions: selectedPermissions,
              never_expires: true,
            }
          : expirationMode === "datetime"
          ? {
              name: tokenName.trim(),
              permissions: selectedPermissions,
              expires_at: new Date(expiresAt).toISOString(),
            }
          : {
              name: tokenName.trim(),
              permissions: selectedPermissions,
              expires_in: expiresIn,
            }
      ).unwrap();

      setCreatedToken(response);
      resetCreateModal();
      setCustomUpdate(true);
    } catch (error: any) {
      dispatch(
        setNoticeError(error?.data?.message || translate("info.saveError"))
      );
    }
  };

  const handleCopyToken = async () => {
    if (!createdToken?.access_token) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdToken.access_token);
      dispatch(setNoticeInfo(translate("info.dataCopied")));
    } catch {
      dispatch(setNoticeError(translate("info.saveError")));
    }
  };

  return (
    <Box data-id="tokens" className="page-container">
      <Box className="content">
        <Box
          sx={{
            display: "flex",
            alignItems: "start",
            justifyContent: "space-between",
            gap: "16px",
            margin: "32px 0",
          }}
        >
          <Box>
            <Typography className="title-medium">
              {translate("pages.tokens.title")}
            </Typography>
            <Typography
              color="text.secondary"
              className="text-14"
              sx={{ marginTop: "8px" }}
            >
              {translate("pages.tokens.description")}
            </Typography>
          </Box>

          <IconWithTooltip
            title={translate("pages.tokens.modals.create.title")}
            Icon={AddOutlinedIcon}
            dataTestId="lnk-profile-additional-tokens-add"
            onClick={openCreateModal}
            disabled={permissionsLoading || !availablePermissions.length}
          />
        </Box>

        <ListItems<IPersonalToken, IQuerySortParams, ITokenCardProps>
          query={query}
          getItems={getTokens}
          RowElement={TokenCard}
          rowElementProps={{
            setModalProps,
            setCustomUpdate,
          }}
          customUpdate={customUpdate}
          setCustomUpdate={setCustomUpdate}
          isSearchActive={false}
        />

        <SubmitModal
          cancelText={translate("actionButtons.cancel")}
          deleteText={translate("actionButtons.delete")}
          isOpen={modalProps.isOpen}
          onSubmit={modalProps.onSubmit}
          onClose={modalProps.onClose}
          title={modalProps.title}
          actionButtonText={modalProps.actionButtonText}
          mainMessage={modalProps.mainMessage}
        />

        <SubmitModal
          cancelText={translate("actionButtons.cancel")}
          deleteText={translate("actionButtons.delete")}
          isOpen={isCreateModalOpen}
          onSubmit={handleCreate}
          onClose={resetCreateModal}
          title={translate("pages.tokens.modals.create.title")}
          actionButtonText={translate("actionButtons.create")}
          actionButtonDataTestId="btn-form-save"
          cancelButtonDataTestId="btn-form-cancel"
          disabled={
            isCreating ||
            !tokenName.trim() ||
            !selectedPermissions.length ||
            permissionsLoading ||
            !!expirationDateError
          }
          mainMessage={[translate("pages.tokens.modals.create.mainMessage")]}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <Box>
              <Typography
                color="text.secondary"
                className="text-14 asterisk"
                sx={{ marginBottom: "8px" }}
              >
                {translate("pages.tokens.name")}
              </Typography>
              <TextField
                value={tokenName}
                onChange={(event) => setTokenName(event.target.value)}
                fullWidth
                variant="standard"
                inputProps={{
                  "data-test-id": "txt-profile-additional-tokens-name",
                }}
              />
            </Box>

            <Box>
              <Typography
                color="text.secondary"
                className="text-14"
                sx={{ marginBottom: "8px" }}
              >
                {translate("pages.tokens.expirationMode")}
              </Typography>
              <Select
                data-test-id="ddl-profile-additional-tokens-validity-mode"
                value={expirationMode}
                onChange={(event) =>
                  setExpirationMode(event.target.value as TTokenExpirationMode)
                }
                style={{ width: "100%" }}
              >
                <MenuItem value="preset" className="custom-select">
                  {translate("pages.tokens.expirationModes.preset")}
                </MenuItem>
                <MenuItem value="datetime" className="custom-select">
                  {translate("pages.tokens.expirationModes.datetime")}
                </MenuItem>
                <MenuItem value="never" className="custom-select">
                  {translate("pages.tokens.expirationModes.never")}
                </MenuItem>
              </Select>
            </Box>

            {expirationMode === "preset" && (
              <Box>
                <Typography
                  color="text.secondary"
                  className="text-14"
                  sx={{ marginBottom: "8px" }}
                >
                  {translate("pages.tokens.ttl")}
                </Typography>
                <Select
                  data-test-id="ddl-profile-additional-tokens-validity-period"
                  value={expiresIn}
                  onChange={(event) => setExpiresIn(Number(event.target.value))}
                  style={{ width: "100%" }}
                >
                  {TOKEN_TTL_OPTIONS.map((option) => (
                    <MenuItem
                      key={option.key}
                      value={option.seconds}
                      className="custom-select"
                    >
                      {translate(`pages.tokens.ttlOptions.${option.key}`)}
                    </MenuItem>
                  ))}
                </Select>
                <Typography
                  color="text.secondary"
                  className="text-12"
                  sx={{ marginTop: "8px" }}
                >
                  {translate("pages.tokens.ttlDescription")}
                </Typography>
              </Box>
            )}

            {expirationMode === "datetime" && (
              <Box>
                <Typography
                  color="text.secondary"
                  className="text-14 asterisk"
                  sx={{ marginBottom: "8px" }}
                >
                  {translate("pages.tokens.expirationDateTime")}
                </Typography>
                <TextField
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  fullWidth
                  variant="standard"
                  error={!!expirationDateError}
                  helperText={
                    expirationDateError ||
                    translate("pages.tokens.expirationDateDescription")
                  }
                  inputProps={{
                    min: minExpiresAt,
                    "data-test-id":
                      "txt-profile-additional-tokens-expiration-date",
                  }}
                />
              </Box>
            )}

            {expirationMode === "never" && (
              <Typography color="text.secondary" className="text-12">
                {translate("pages.tokens.neverExpiresDescription")}
              </Typography>
            )}

            <Box>
              <Typography
                color="text.secondary"
                className="text-14 asterisk"
                sx={{ marginBottom: "8px" }}
              >
                {translate("pages.tokens.searchPermission")}
              </Typography>
              {availablePermissions.length ? (
                <>
                  <Autocomplete
                    options={availablePermissionOptions}
                    value={null}
                    inputValue={permissionSearchValue}
                    onInputChange={(_, value) =>
                      setPermissionSearchValue(value)
                    }
                    onChange={(_, value) => handleAddPermission(value)}
                    noOptionsText={translate("pages.tokens.noPermissionsFound")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="standard"
                        inputProps={{
                          ...params.inputProps,
                          "data-test-id":
                            "ddl-profile-additional-tokens-permissions",
                        }}
                        placeholder={translate(
                          "pages.tokens.searchPermissionPlaceholder"
                        )}
                      />
                    )}
                  />

                  <Box sx={{ marginTop: "20px" }}>
                    <Typography
                      color="text.secondary"
                      className="text-14"
                      sx={{ marginBottom: "8px" }}
                    >
                      {translate("pages.tokens.selectedPermissions")}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      {selectedPermissions.map((permission) => (
                        <Chip
                          key={permission}
                          label={permission}
                          size="small"
                          onDelete={() => handleDeletePermission(permission)}
                        />
                      ))}
                    </Box>
                  </Box>
                </>
              ) : (
                <Typography className="text-14" color="text.secondary">
                  {translate("pages.tokens.emptyPermissions")}
                </Typography>
              )}
            </Box>
          </Box>
        </SubmitModal>

        <ModalInfo
          isOpen={!!createdToken}
          onClose={() => setCreatedToken(null)}
          title={translate("pages.tokens.modals.created.title")}
        >
          <Box sx={{ marginBottom: "32px" }}>
            <Typography className="text-14">
              {translate("pages.tokens.modals.created.mainMessage")}
            </Typography>
          </Box>
          <Box>
            <Typography color="text.secondary" className="text-14">
              {translate("pages.tokens.tokenValue")}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <Typography className="text-14">
                {createdToken?.access_token || ""}
              </Typography>
              <IconsLibrary
                title={translate("toolTips.copy")}
                type="copy"
                onClick={handleCopyToken}
              />
            </Box>
          </Box>
        </ModalInfo>
      </Box>
    </Box>
  );
};
