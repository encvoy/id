import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PersonIcon from "@mui/icons-material/Person";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import clsx from "clsx";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { connect, useDispatch } from "react-redux";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import { CustomIcon } from "src/shared/ui/components/CustomIcon";
import { SubmitModal } from "src/shared/ui/modal/SubmitModal";
import { ChangePasswordBlock } from "src/features/accountPortal/components/ChangePasswordBlock";
import { IUserClient, useGetUserClientQuery } from "src/shared/api/clients";
import { ProviderType } from "src/shared/api/provider";
import {
  IUserProfile,
  useDeleteUsersMutation,
  useGetPrivateClaimsQuery,
  useGetPublicExternalAccountsQuery,
  useLazyDeleteAllSessionQuery,
} from "src/shared/api/users";
import {
  EClaimPrivacy,
  ERoles,
  routes,
  subTabs,
  tabs,
} from "src/shared/utils/enums";
import {
  exportToJson,
  formatPhoneNumber,
  getClaimPrivacy,
  getImageURL,
  isOwnerOrEditor,
} from "src/shared/utils/helpers";
import { TAppSlice } from "src/shared/lib/appSlice";
import { setNoticeInfo } from "src/shared/lib/noticesSlice";
import {
  useGetProfileFieldsQuery,
  useGetSettingsQuery,
} from "src/shared/api/settings";
import { RootState } from "src/app/store/store";
import { TUserSlice } from "src/shared/lib/userSlice";
import { ExternalAccount } from "../../../shared/ui/ExternalAccount";
import { PublicStatusPopover } from "../../../shared/ui/PublicStatusPopover";
import styles from "./UserProfile.module.css";
import Link from "@mui/material/Link";
import { AccordionBlock } from "src/shared/ui/components/AccordionBlock";
import Typography from "@mui/material/Typography";
import { componentBorderRadius } from "src/shared/theme/Theme";
import { Box } from "@mui/material";

interface IUserProfileProps {
  startRoutePath: TAppSlice["startRoutePath"];
  roleInApp: TUserSlice["roleInApp"];
  loggedUserId: IUserProfile["id"];
  clientProfile: TAppSlice["clientProfile"];
}

const mapStateToProps = (state: RootState) => ({
  startRoutePath: state.app.startRoutePath,
  roleInApp: state.user.roleInApp,
  loggedUserId: state.user.profile.id,
  clientProfile: state.app.clientProfile,
});

const UserProfileComponent: FC<IUserProfileProps> = ({
  roleInApp,
  startRoutePath,
  loggedUserId,
  clientProfile,
}) => {
  const {
    appId = "",
    clientId = "",
    userId = "",
  } = useParams<{ appId: string; clientId: string; userId: string }>();
  const { t: translate, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // state
  const [selectedUser, setSelectedUser] = useState<
    { user: IUserClient; role: string } | null | undefined
  >(null);
  const [deleteUsersModalOpen, setDeleteUsersModalOpen] = useState(false);

  // get data
  const { data: externalAccounts } = useGetPublicExternalAccountsQuery({
    user_id: String(userId),
    client_id: clientId || appId,
  });
  const { data: privateClaims } = useGetPrivateClaimsQuery(String(userId), {
    skip: !isOwnerOrEditor(roleInApp) || !userId,
  });
  const { data: profileFields } = useGetProfileFieldsQuery();

  const { data: dataSettings } = useGetSettingsQuery();
  const { data: userProfile } = useGetUserClientQuery({
    clientId: clientId || appId,
    userId: String(userId),
  });

  useEffect(() => {
    setSelectedUser(userProfile);
  }, [userProfile]);

  const [deleteAllSession] = useLazyDeleteAllSessionQuery();
  const [deleteUsers, { isLoading: deleteUsersLoading }] =
    useDeleteUsersMutation();

  const { public_profile_claims_oauth, public_profile_claims_gravatar } =
    privateClaims || {};
  const customFields =
    profileFields?.filter((field) => field.type === "custom" && field.active) ||
    [];
  const currentLanguage = i18n.language;
  const PROJECT_NAME = clientProfile?.name || "PROJECT_NAME";
  const changePasswordLink =
    userId?.toString() === loggedUserId
      ? `/${routes.profile}/change-password`
      : `/${startRoutePath}/${appId}/${tabs.users}/${userId}/change-password`;
  const name = (
    (selectedUser?.user.given_name || "") +
    " " +
    (selectedUser?.user.family_name || "")
  ).trim();
  const date = selectedUser?.user?.birthdate
    ? new Date(selectedUser?.user?.birthdate)
    : null;

  const handleDeleteButton = async () => {
    try {
      if (!selectedUser?.user?.id) return;
      setDeleteUsersModalOpen(true);
    } catch (e) {
      console.error("handleDeleteButton error", e);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser?.user?.id) return;

    try {
      await deleteUsers({
        checked_id: selectedUser?.user.id,
      }).unwrap();

      const id: string =
        selectedUser.user.nickname ||
        selectedUser.user.login ||
        selectedUser.user.id.toString();

      dispatch(
        setNoticeInfo(
          translate("pages.userProfile.notifications.userDeleted", {
            userName: id,
            projectName: PROJECT_NAME,
          })
        )
      );

      setDeleteUsersModalOpen(false);
      if (clientId) {
        navigate(
          `/${startRoutePath}/${appId}/${tabs.clients}/${clientId}${tabs.users}`
        );
      } else {
        navigate(`/${startRoutePath}/${appId}/${tabs.users}`);
      }
    } catch (e) {
      console.error("handleDeleteUsers error", e);
    }
  };

  const lineCustomFields = customFields
    .filter(
      (field) =>
        selectedUser?.user.custom_fields &&
        selectedUser.user.custom_fields[field.field]
    )
    .map((field) => {
      return (
        <div key={field.field} className={styles["info-item"]}>
          <Typography
            className={clsx("text-14", styles["info-item-title"])}
            color="text.secondary"
          >
            {field.title}
          </Typography>
          <Typography className={clsx("text-14", styles["info-item-value"])}>
            {selectedUser?.user.custom_fields &&
            selectedUser.user.custom_fields[field.field]
              ? (selectedUser?.user?.custom_fields[field.field] as string)
              : translate("helperText.value.notSet")}
          </Typography>
          {isOwnerOrEditor(roleInApp) && (
            <PublicStatusPopover
              claimPrivacy={getClaimPrivacy(
                field.field,
                public_profile_claims_oauth,
                public_profile_claims_gravatar
              )}
              field={field.field}
              userId={selectedUser?.user.id?.toString()}
            />
          )}
        </div>
      );
    });

  if (!userProfile) {
    return <div>{translate("helperText.loading")}</div>;
  }

  return (
    <div className="page-container">
      <div className="content">
        <div className={styles["panel-top"]}>
          <Avatar
            className={styles["app-icon-wrapper"]}
            src={getImageURL(selectedUser?.user?.picture)}
          >
            {!selectedUser?.user.picture && selectedUser?.user.nickname && (
              <div className={styles["app-icon-default"]}>
                {selectedUser?.user.nickname
                  ?.split(" ")
                  .map((name: string) => name[0]?.toUpperCase())
                  .join("")}
              </div>
            )}
            {!selectedUser?.user.picture && !selectedUser?.user.nickname && (
              <CustomIcon
                className={styles["app-icon-default"]}
                Icon={PersonIcon}
              />
            )}
          </Avatar>
          <div className={styles["name-wrapper"]}>
            <Typography
              className={clsx("text-20-medium", styles["overflow-ellipsis"])}
            >
              {!name
                ? translate("pages.userProfile.nameHidden")
                : name || translate("pages.userProfile.noName")}
            </Typography>
          </div>
        </div>
        <Box
          className={styles.panel}
          sx={{ borderRadius: componentBorderRadius }}
        >
          <div className={styles.panelTitle}>
            <Typography className="text-17">
              {translate("helperText.mainInfo")}
            </Typography>
            {isOwnerOrEditor(roleInApp) && (
              <Link
                component={RouterLink}
                to={
                  clientId
                    ? `/${startRoutePath}/${appId}/${tabs.clients}/${clientId}/${tabs.users}/${userId}/${subTabs.edit}`
                    : `/${startRoutePath}/${appId}/${tabs.users}/${userId}/${subTabs.edit}`
                }
              >
                {translate("actionButtons.edit")}
              </Link>
            )}
          </div>
          <div>
            <div className={styles["info-item"]}>
              <div className={styles["flex-wrap"]}>
                <Typography
                  className={clsx("text-14", styles["info-item-title"])}
                  color="text.secondary"
                >
                  {translate("pages.profile.fields.userId")}
                </Typography>
                <Typography
                  className={clsx("text-14", styles["info-item-value"])}
                >
                  {selectedUser?.user.id}
                </Typography>
              </div>
              {isOwnerOrEditor(roleInApp) && (
                <PublicStatusPopover
                  claimPrivacy={EClaimPrivacy.public}
                  field="id"
                  disabled
                />
              )}
            </div>
            {!!(selectedUser?.user.nickname || "").trim() && (
              <div className={styles["info-item"]}>
                <div className={styles["flex-wrap"]}>
                  <Typography
                    className={clsx("text-14", styles["info-item-title"])}
                    color="text.secondary"
                  >
                    {translate("pages.profile.fields.publicName")}
                  </Typography>
                  <Typography
                    className={clsx("text-14", styles["info-item-value"])}
                  >
                    {(selectedUser?.user.nickname || "").trim()
                      ? selectedUser?.user.nickname
                      : translate("pages.userProfile.noName")}
                  </Typography>
                </div>
                {isOwnerOrEditor(roleInApp) && (
                  <PublicStatusPopover
                    claimPrivacy={getClaimPrivacy(
                      "nickname",
                      public_profile_claims_oauth,
                      public_profile_claims_gravatar
                    )}
                    field="nickname"
                    userId={String(selectedUser?.user.id)}
                  />
                )}
              </div>
            )}
            {!!selectedUser?.user.picture && (
              <div className={styles["info-item"]}>
                <Typography
                  className={clsx("text-14", styles["info-item-title"])}
                  color="text.secondary"
                >
                  {translate("pages.profile.fields.profilePhoto")}
                </Typography>
                {selectedUser?.user.picture ? (
                  <Avatar
                    src={getImageURL(selectedUser?.user?.picture)}
                    className={styles["user-icon-wrapper"]}
                  />
                ) : (
                  <Avatar className={styles.avatar}>
                    <PersonOutlineOutlinedIcon />
                  </Avatar>
                )}
                {isOwnerOrEditor(roleInApp) && (
                  <PublicStatusPopover
                    claimPrivacy={getClaimPrivacy(
                      "picture",
                      public_profile_claims_oauth,
                      public_profile_claims_gravatar
                    )}
                    field="picture"
                    userId={String(selectedUser?.user.id)}
                  />
                )}
              </div>
            )}
            {!!name && (
              <div className={styles["info-item"]}>
                <div className={styles["flex-wrap"]}>
                  <Typography
                    className={clsx("text-14", styles["info-item-title"])}
                    color="text.secondary"
                  >
                    {translate("pages.profile.fields.fullName")}
                  </Typography>
                  <Typography
                    className={clsx("text-14", styles["info-item-value"])}
                  >
                    {name || translate("helperText.value.notSet")}
                  </Typography>
                </div>
                {isOwnerOrEditor(roleInApp) && (
                  <PublicStatusPopover
                    claimPrivacy={getClaimPrivacy(
                      "family_name",
                      public_profile_claims_oauth,
                      public_profile_claims_gravatar
                    )}
                    field="family_name given_name"
                    userId={String(selectedUser?.user.id)}
                  />
                )}
              </div>
            )}
            {!!selectedUser?.user.login && (
              <div className={styles["info-item"]}>
                <div className={styles["flex-wrap"]}>
                  <Typography
                    className={clsx("text-14", styles["info-item-title"])}
                    color="text.secondary"
                  >
                    {translate("pages.profile.fields.login")}
                  </Typography>
                  <Typography
                    className={clsx("text-14", styles["info-item-value"])}
                  >
                    {selectedUser?.user.login ||
                      translate("helperText.value.notSet")}
                  </Typography>
                </div>
                {isOwnerOrEditor(roleInApp) && (
                  <PublicStatusPopover
                    claimPrivacy={getClaimPrivacy(
                      "login",
                      public_profile_claims_oauth,
                      public_profile_claims_gravatar
                    )}
                    field="login"
                    userId={String(selectedUser?.user.id)}
                  />
                )}
              </div>
            )}
            {!!selectedUser?.user.birthdate && (
              <div className={styles["info-item"]}>
                <div className={styles["flex-wrap"]}>
                  <Typography
                    className={clsx("text-14", styles["info-item-title"])}
                    color="text.secondary"
                  >
                    {translate("pages.profile.fields.birthDate")}
                  </Typography>
                  <Typography
                    className={clsx("text-14", styles["info-item-value"])}
                  >
                    {date
                      ? date.toLocaleDateString(currentLanguage)
                      : translate("helperText.value.notSet")}
                  </Typography>
                </div>
                {isOwnerOrEditor(roleInApp) && (
                  <PublicStatusPopover
                    claimPrivacy={getClaimPrivacy(
                      "birthdate",
                      public_profile_claims_oauth,
                      public_profile_claims_gravatar
                    )}
                    field="birthdate"
                    userId={String(selectedUser?.user.id)}
                  />
                )}
              </div>
            )}
            {!!selectedUser?.user.email && (
              <div className={styles["info-item"]}>
                <div className={styles["flex-wrap"]}>
                  <Typography
                    className={clsx("text-14", styles["info-item-title"])}
                    color="text.secondary"
                  >
                    {translate("pages.profile.fields.email")}
                  </Typography>
                  <Typography
                    className={clsx("text-14", styles["info-item-value"])}
                  >
                    {selectedUser?.user.email
                      ? selectedUser.user.email
                      : translate("helperText.value.notSet")}
                  </Typography>
                </div>
                {isOwnerOrEditor(roleInApp) && (
                  <PublicStatusPopover
                    claimPrivacy={getClaimPrivacy(
                      "email",
                      public_profile_claims_oauth,
                      public_profile_claims_gravatar
                    )}
                    field="email"
                    userId={String(selectedUser?.user.id)}
                  />
                )}
              </div>
            )}
            {!!selectedUser?.user.phone_number && (
              <div className={styles["info-item"]}>
                <div className={styles["flex-wrap"]}>
                  <Typography
                    className={clsx("text-14", styles["info-item-title"])}
                    color="text.secondary"
                  >
                    {translate("pages.profile.fields.phone")}
                  </Typography>
                  <Typography
                    className={clsx("text-14", styles["info-item-value"])}
                  >
                    {selectedUser?.user.phone_number
                      ? formatPhoneNumber(selectedUser.user.phone_number)
                      : translate("helperText.value.notSet")}
                  </Typography>
                </div>
                <PublicStatusPopover
                  claimPrivacy={getClaimPrivacy(
                    "phone_number",
                    public_profile_claims_oauth,
                    public_profile_claims_gravatar
                  )}
                  field="phone_number"
                  userId={String(selectedUser?.user.id)}
                />
              </div>
            )}
            {lineCustomFields.length > 0 && (
              <div>
                <Typography className="text-17">
                  {translate("helperText.additionalInfo")}
                </Typography>
                {lineCustomFields}
              </div>
            )}
          </div>
        </Box>

        <Box
          className={styles.panel}
          sx={{ borderRadius: componentBorderRadius }}
        >
          <Typography style={{ marginBottom: 24 }} className="text-17">
            {translate("pages.profile.sections.identifiers")}
          </Typography>
          <div>
            {externalAccounts
              ?.filter(
                (ea) =>
                  ea.type !== ProviderType.EMAIL &&
                  ea.type !== ProviderType.PHONE
              )
              .map((account) => (
                <ExternalAccount
                  account={account}
                  userProfileId={selectedUser?.user?.id}
                  key={
                    (account.sub || "") +
                    (account.issuer || "") +
                    (account.type || "")
                  }
                />
              ))}
            {!externalAccounts?.filter(
              (ea) =>
                ea.type !== ProviderType.EMAIL && ea.type !== ProviderType.PHONE
            ).length && (
              <Typography className="text-14" color="text.secondary">
                {translate("pages.userProfile.emptyIdentifiers")}
              </Typography>
            )}
          </div>
        </Box>

        {isOwnerOrEditor(roleInApp) &&
          selectedUser?.role !== ERoles.TRUSTED_USER && (
            <Box
              className={styles.panel}
              sx={{ borderRadius: componentBorderRadius }}
            >
              <div className={styles.panelTitle}>
                <Typography className="text-17">
                  {translate("pages.profile.sections.security")}
                </Typography>
              </div>
              <ChangePasswordBlock
                passwordUpdateDate={
                  new Date(selectedUser?.user.password_updated_at || "")
                }
                navigateTo={changePasswordLink}
              />
            </Box>
          )}

        {isOwnerOrEditor(roleInApp) && (
          <AccordionBlock
            title={translate("pages.profile.sections.otherActions")}
          >
            {dataSettings?.data_processing_agreement && (
              <Link
                href={dataSettings.data_processing_agreement}
                target="_blank"
                rel="noreferrer"
              >
                {translate("pages.profile.actions.privacyPolicy")}
              </Link>
            )}

            <div className={styles.actions}>
              {selectedUser?.user.id !== 1 &&
                selectedUser?.user.id !==
                  parseInt(loggedUserId as string, 10) && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleDeleteButton}
                  >
                    {translate("actionButtons.deleteAccount")}
                  </Button>
                )}
              <Button
                variant="contained"
                color="secondary"
                onClick={() => deleteAllSession(selectedUser?.user.id)}
              >
                {translate("pages.profile.actions.logoutAllDevices")}
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() =>
                  exportToJson({ ...selectedUser }, "profile.json")
                }
              >
                {translate("pages.profile.actions.downloadData")}
              </Button>
            </div>
          </AccordionBlock>
        )}

        <div className="zeroBlock"></div>
      </div>

      <SubmitModal
        title={translate("pages.userProfile.deleteAccountModal.title", {
          projectName: PROJECT_NAME,
        })}
        isOpen={deleteUsersModalOpen}
        onClose={() => setDeleteUsersModalOpen(false)}
        onSubmit={() => {
          handleDeleteUser();
          setDeleteUsersModalOpen(false);
        }}
        mainMessage={Object.values(
          translate("pages.userProfile.deleteAccountModal.message", {
            userName:
              selectedUser?.user?.nickname ||
              selectedUser?.user?.login ||
              selectedUser?.user?.id,
            projectName: PROJECT_NAME,
            returnObjects: true,
          }) as Record<string, string>
        )}
        disabled={deleteUsersLoading}
      />
    </div>
  );
};

export const UserProfile = connect(mapStateToProps)(UserProfileComponent);
