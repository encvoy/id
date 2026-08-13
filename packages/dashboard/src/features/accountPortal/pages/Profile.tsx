import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import { Box, SvgIconProps, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import { ElementType, FC, MouseEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { connect, useDispatch } from "react-redux";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { RootState } from "src/app/store/store";
import {
  useGetExternalAccountsQuery,
  useMakePrimaryContactMutation,
} from "src/shared/api/profile";
import { EProviderType } from "src/shared/api/provider";
import {
  useGetProfileFieldsQuery,
  useGetSettingsQuery,
} from "src/shared/api/settings";
import {
  IExternalAccount,
  useDeleteExternalAccountMutation,
  useGetPrivateClaimsQuery,
  useLazyDeleteAllSessionQuery,
  useLazyGetMeInfoQuery,
  useUpdateUserMutation,
} from "src/shared/api/users";
import { setNoticeError, setNoticeInfo } from "src/shared/slices/noticesSlice";
import { setUserProfile, TUserSlice } from "src/shared/slices/userSlice";
import { AccordionBlock } from "@encvoy-id/components";
import { ContactStatusIndicator } from "@encvoy-id/components";
import { CustomIcon } from "@encvoy-id/components";
import { MenuControls } from "@encvoy-id/components";
import { SurfaceBlock } from "@encvoy-id/components";
import { SubmitModal } from "@encvoy-id/components";
import { PublicStatusPopover } from "src/shared/ui/PublicStatusPopover";
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
  getImageURL,
} from "src/shared/utils/helpers";
import { TAppSlice } from "src/shared/slices/appSlice";
import { ExternalAccount } from "../../../shared/ui/ExternalAccount";
import { AdditionalProfileFields } from "../components/AdditionalProfileFields";
import { ChangePasswordBlock } from "../components/ChangePasswordBlock";
import { ProfileLocaleSettings } from "../components/ProfileLocaleSettings";
import { PublicProfileBlock } from "../components/PublicProfileBlock";
import { PublicProfilePanel } from "../components/PublicProfilePanel";
import { TokensBlock } from "../components/TokensBlock";
import { UserProfileField } from "../components/UserProfileField";
import styles from "./Profile.module.css";

interface IProfileProps {
  profile: TUserSlice["profile"];
  roleInApp: TUserSlice["roleInApp"];
  systemClientId: TAppSlice["systemClientId"];
}

const mapStateToProps = (state: RootState) => ({
  profile: state.user.profile,
  roleInApp: state.user.roleInApp,
  systemClientId: state.app.systemClientId,
});

const EMAIL_CONTACT_TYPES = [EProviderType.EMAIL, EProviderType.EMAIL_CUSTOM];
const PHONE_CONTACT_TYPES = [EProviderType.PHONE, EProviderType.KLOUD];

type TContactGroup = "email" | "phone";

const normalizeContactValue = (
  contactGroup: TContactGroup,
  value?: string | null
) => {
  if (!value) return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  return contactGroup === "email"
    ? trimmedValue.toLowerCase()
    : trimmedValue.replace(/\D/g, "");
};

const isContactExternalAccount = (
  account: IExternalAccount,
  contactGroup?: TContactGroup
) => {
  if (contactGroup === "email") {
    return EMAIL_CONTACT_TYPES.includes(account.type as EProviderType);
  }

  if (contactGroup === "phone") {
    return PHONE_CONTACT_TYPES.includes(account.type as EProviderType);
  }

  return (
    EMAIL_CONTACT_TYPES.includes(account.type as EProviderType) ||
    PHONE_CONTACT_TYPES.includes(account.type as EProviderType)
  );
};

const getExternalAccountClaimPrivacy = (value: number) => {
  switch (value) {
    case 0:
      return EClaimPrivacy.private;
    case 1:
      return EClaimPrivacy.request;
    case 2:
      return EClaimPrivacy.public;
    default:
      return EClaimPrivacy.private;
  }
};

type TContactMenuControl = {
  action: () => void;
  dataTestId: string;
  disabled?: boolean;
  icon: ElementType<SvgIconProps>;
  title: string;
};

interface IContactActionsMenuProps {
  controls: TContactMenuControl[];
  dataTestId: string;
}

const ContactActionsMenu: FC<IContactActionsMenuProps> = ({
  controls,
  dataTestId,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  if (!controls.length) {
    return null;
  }

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className={styles.moreButtonWrapper}>
      <Button
        variant="text"
        color="secondary"
        onClick={handleOpen}
        className={styles.moreButton}
        data-test-id={dataTestId}
      >
        <CustomIcon Icon={MoreHorizOutlinedIcon} color="textSecondary" />
      </Button>
      <MenuControls
        dataTestId={controls.map((control) => control.dataTestId)}
        anchorEl={anchorEl}
        onClose={handleClose}
        controls={controls.map((control) => ({
          ...control,
          action: () => {
            handleClose();
            control.action();
          },
        }))}
      />
    </div>
  );
};

const ProfileComponent: FC<IProfileProps> = ({
  profile,
  roleInApp,
  systemClientId,
}) => {
  const dispatch = useDispatch();
  const { t: translate, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentLanguage = i18n.language;
  const date = profile.birthdate ? new Date(profile.birthdate) : null;
  const passwordUpdateDate = new Date(profile.password_updated_at || "");
  const { data: externalAccounts } = useGetExternalAccountsQuery(
    String(profile.id),
    {
      skip: !profile.id,
    }
  );
  const profileScopeClientId = profile.org_id || systemClientId || "";
  const profileFieldScope = { organization_id: String(profileScopeClientId) };
  const { data: profileFields } = useGetProfileFieldsQuery(profileFieldScope);
  const { data: privateClaims } = useGetPrivateClaimsQuery(
    { id: String(profile.id) },
    {
      skip: !profile.id,
    }
  );
  const { data: dataSettings } = useGetSettingsQuery();
  const [deleteAllSession] = useLazyDeleteAllSessionQuery();
  const [getMeInfo] = useLazyGetMeInfoQuery();
  const [updateUser] = useUpdateUserMutation();
  const [deleteExternalAccount] = useDeleteExternalAccountMutation();
  const [makePrimaryContact] = useMakePrimaryContactMutation();

  const [isOutModalOpen, setOutModalOpen] = useState(false);
  const [isOpenPublicPanel, setIsOpenPublicPanel] = useState(false);
  const [agreeModal, setAgreeModal] = useState(false);
  const [typeContact, setTypeContact] = useState<string>("");
  const isTrustedUser = roleInApp === ERoles.TRUSTED_USER;

  const handleOpenPublicPanel = () => {
    if (profile.email && profile.email_verified) {
      setIsOpenPublicPanel(true);
    } else {
      dispatch(
        setNoticeInfo(
          translate("pages.profile.notices.publicDataRequireTrustedEmail")
        )
      );
    }
  };

  const handleDeleteEmail = () => {
    setTypeContact("email");
    setAgreeModal(true);
  };

  const handleDeletePhone = () => {
    setTypeContact("phone");
    setAgreeModal(true);
  };

  const syncProfileState = async () => {
    const freshProfile = await getMeInfo().unwrap();
    dispatch(setUserProfile(freshProfile));
  };

  const handleContact = async () => {
    try {
      const updatedProfile = await updateUser({
        body: typeContact === "email" ? { email: "" } : { phone_number: "" },
        userId: profile?.id || "",
      }).unwrap();

      dispatch(setUserProfile(updatedProfile));
      dispatch(
        setNoticeInfo(translate("pages.profile.notices.contactDeleted"))
      );
    } catch (e) {
      console.error("err", e);
      dispatch(setNoticeError(translate("info.updateError")));
    }
    setAgreeModal(false);
  };

  const canAddEmailContacts = Boolean(
    profileFields?.find((field) => field.field === "email")?.editable
  );

  const canAddPhoneContacts = Boolean(
    profileFields?.find((field) => field.field === "phone_number")?.editable
  );
  const canManagePrimaryEmail = canAddEmailContacts && !isTrustedUser;
  const canManagePrimaryPhone = canAddPhoneContacts && !isTrustedUser;

  const getAdditionalContacts = (
    contactGroup: TContactGroup,
    primaryValue?: string | null
  ) => {
    const normalizedPrimaryValue = normalizeContactValue(
      contactGroup,
      primaryValue
    );

    return (
      externalAccounts?.filter((account) => {
        if (!isContactExternalAccount(account, contactGroup)) {
          return false;
        }

        const normalizedAccountValue = normalizeContactValue(
          contactGroup,
          account.sub
        );

        return Boolean(
          normalizedAccountValue &&
            normalizedAccountValue !== normalizedPrimaryValue
        );
      }) || []
    );
  };

  const additionalEmailContacts = getAdditionalContacts("email", profile.email);
  const additionalPhoneContacts = getAdditionalContacts(
    "phone",
    profile.phone_number
  );

  const handleDeleteAdditionalContact = async (contactId: string) => {
    if (!profile.id) return;

    try {
      await deleteExternalAccount({
        userId: String(profile.id),
        accountId: contactId,
      }).unwrap();
      await syncProfileState();
      dispatch(
        setNoticeInfo(translate("pages.profile.notices.contactDeleted"))
      );
    } catch (e) {
      console.error("err", e);
      dispatch(setNoticeError(translate("info.deleteError")));
    }
  };

  const handleMakePrimaryContact = async (contactId: string) => {
    try {
      await makePrimaryContact({ contactId }).unwrap();
      await syncProfileState();
      dispatch(
        setNoticeInfo(translate("pages.profile.notices.contactUpdated"))
      );
    } catch (e) {
      console.error("err", e);
      dispatch(setNoticeError(translate("info.updateError")));
    }
  };

  const getPrimaryContactMenuControls = (
    contactGroup: TContactGroup,
    value?: string | null,
    verified?: boolean | null,
    canDelete = true
  ): TContactMenuControl[] => {
    const controls: TContactMenuControl[] = [];

    if (value && !verified) {
      controls.push({
        action: () => navigate(`/${routes.profile}/${contactGroup}/confirm`),
        dataTestId: `btn-profile-contact-confirm-${contactGroup}`,
        icon: CheckOutlinedIcon,
        title: translate("actionButtons.confirm"),
      });
    }

    if (value && canDelete) {
      controls.push({
        action:
          contactGroup === "email" ? handleDeleteEmail : handleDeletePhone,
        dataTestId: `btn-profile-contact-delete-${contactGroup}`,
        icon: DeleteOutlineOutlinedIcon,
        title: translate("actionButtons.delete"),
      });
    }

    return controls;
  };

  const renderAddContactRow = (
    contactGroup: TContactGroup,
    canManage: boolean,
    shouldShow: boolean
  ) => {
    if (!canManage || !shouldShow) {
      return null;
    }

    return (
      <UserProfileField
        title=""
        value={
          <Link
            component={RouterLink}
            to={`/${routes.profile}/${contactGroup}/add`}
            data-test-id={`lnk-profile-contact-add-${contactGroup}`}
          >
            {translate("actionButtons.add")}
          </Link>
        }
        fieldName={contactGroup === "email" ? "email" : "phone_number"}
        userId={profile.id}
        showPrivacyStatus={false}
      />
    );
  };

  const renderAdditionalContacts = (
    contactGroup: TContactGroup,
    contacts: IExternalAccount[],
    canManage: boolean,
    canMakePrimary: boolean
  ) =>
    contacts.map((account) => (
      <UserProfileField
        key={account.id}
        title=""
        value={
          contactGroup === "email"
            ? account.sub
            : formatPhoneNumber(account.sub)
        }
        privateClaims={privateClaims}
        userId={profile.id}
        fieldName={contactGroup === "email" ? "email" : "phone_number"}
        showPrivacyStatus={false}
      >
        <>
          {canManage && (
            <ContactActionsMenu
              dataTestId={`btn-profile-contact-menu-${account.id}`}
              controls={[
                ...(canMakePrimary
                  ? [
                      {
                        action: () => handleMakePrimaryContact(account.id),
                        dataTestId: `btn-profile-contact-make-primary-${account.id}`,
                        icon: CheckCircleOutlineOutlinedIcon,
                        title: translate("actionButtons.makePrimary"),
                      },
                    ]
                  : []),
                {
                  action: () => handleDeleteAdditionalContact(account.id),
                  dataTestId: `btn-profile-contact-delete-${account.id}`,
                  icon: DeleteOutlineOutlinedIcon,
                  title: translate("actionButtons.delete"),
                },
              ]}
            />
          )}
          <PublicStatusPopover
            userId={String(profile.id || "")}
            externalAccountId={account.id}
            claimPrivacy={getExternalAccountClaimPrivacy(account.public)}
          />
        </>
      </UserProfileField>
    ));

  return (
    <div className="page-container">
      <div className="content">
        <SurfaceBlock className={styles.panel}>
          <div className={styles.panelTitle}>
            <Typography className="text-17">
              {translate("helperText.mainInfo")}
            </Typography>
            {roleInApp !== ERoles.TRUSTED_USER && (
              <Link
                component={RouterLink}
                to={`/${routes.profile}/${tabs.profile}/${subTabs.edit}`}
                data-test-id="lnk-profile-edit"
              >
                {translate("actionButtons.edit")}
              </Link>
            )}
          </div>
          <div>
            <UserProfileField
              title={translate("pages.profile.fields.userId")}
              value={profile.id}
              privateClaims={privateClaims}
              userId={profile.id}
              fieldName="id"
              disabled
            />
            <UserProfileField
              title={translate("pages.profile.fields.publicName")}
              value={profile.nickname || translate("helperText.value.notSet")}
              privateClaims={privateClaims}
              userId={profile.id}
              fieldName="nickname"
            />
            <UserProfileField
              title={translate("pages.profile.fields.profilePhoto")}
              privateClaims={privateClaims}
              fieldName="picture"
              userId={profile.id}
              isMaxSize
              urlImage={getImageURL(profile?.picture)}
            />
            <UserProfileField
              title={translate("pages.profile.fields.fullName")}
              value={
                (
                  (profile.given_name || "") +
                  " " +
                  (profile.family_name || "")
                ).trim() || translate("helperText.value.notSet")
              }
              privateClaims={privateClaims}
              userId={profile.id}
              otherField="family_name"
              fieldName="family_name given_name"
            />
            <UserProfileField
              title={translate("pages.profile.fields.login")}
              value={profile.login || translate("helperText.value.notSet")}
              privateClaims={privateClaims}
              userId={profile.id}
              fieldName="login"
            />
            <UserProfileField
              title={translate("pages.profile.fields.birthDate")}
              value={
                date
                  ? date.toLocaleDateString(currentLanguage)
                  : translate("helperText.value.notSet")
              }
              privateClaims={privateClaims}
              userId={profile.id}
              fieldName="birthdate"
            />
            {profileFields?.some(
              (field) => field.type === "custom" && field.active
            ) && (
              <Typography className="text-17">
                {translate("helperText.additionalInfo")}
              </Typography>
            )}
            <AdditionalProfileFields
              profileFields={profileFields}
              customFields={profile.custom_fields}
              privateClaims={privateClaims}
              userId={profile.id}
              scopeClientId={profileScopeClientId}
            />
          </div>
        </SurfaceBlock>

        <SurfaceBlock className={styles.panel}>
          <div className={styles.panelTitle}>
            <Typography className="text-17">
              {translate("pages.profile.sections.contacts")}
            </Typography>
          </div>
          <div>
            <UserProfileField
              title={translate("pages.profile.fields.email")}
              value={
                profile.email ? (
                  profile.email
                ) : canAddEmailContacts ? (
                  <Link
                    component={RouterLink}
                    to={`/${routes.profile}/email/add`}
                    data-test-id="lnk-profile-contact-add-email-empty"
                  >
                    {translate("actionButtons.add")}
                  </Link>
                ) : (
                  translate("helperText.value.notSet")
                )
              }
              statusIndicator={
                profile.email && !profile.email_verified ? (
                  <ContactStatusIndicator
                    unverifiedText={translate(
                      "pages.profile.tooltips.contactUnverified"
                    )}
                    verified={false}
                  />
                ) : undefined
              }
              showPrivacyStatus={!!profile.email}
              privateClaims={privateClaims}
              userId={profile.id}
              fieldName="email"
            >
              <>
                {profile.email && (
                  <Chip
                    label={translate("pages.profile.chips.contactPrimary")}
                    size="small"
                    className="text-12"
                  />
                )}
                <ContactActionsMenu
                  dataTestId="btn-profile-contact-menu-email"
                  controls={getPrimaryContactMenuControls(
                    "email",
                    profile.email,
                    profile.email_verified,
                    canManagePrimaryEmail
                  )}
                />
              </>
            </UserProfileField>
            {renderAdditionalContacts(
              "email",
              additionalEmailContacts,
              canAddEmailContacts,
              canManagePrimaryEmail
            )}
            {renderAddContactRow(
              "email",
              canAddEmailContacts,
              Boolean(profile.email)
            )}
            <UserProfileField
              data-test-id="lnk-profile-edit-phone"
              title={translate("pages.profile.fields.phone")}
              value={
                profile.phone_number ? (
                  formatPhoneNumber(profile.phone_number)
                ) : canAddPhoneContacts ? (
                  <Link
                    component={RouterLink}
                    to={`/${routes.profile}/phone/add`}
                    data-test-id="lnk-profile-contact-add-phone-empty"
                  >
                    {translate("actionButtons.add")}
                  </Link>
                ) : (
                  translate("helperText.value.notSet")
                )
              }
              statusIndicator={
                profile.phone_number && !profile.phone_number_verified ? (
                  <ContactStatusIndicator
                    unverifiedText={translate(
                      "pages.profile.tooltips.contactUnverified"
                    )}
                    verified={false}
                  />
                ) : undefined
              }
              showPrivacyStatus={!!profile.phone_number}
              privateClaims={privateClaims}
              userId={profile.id}
              fieldName="phone_number"
            >
              <>
                {profile.phone_number && (
                  <Chip
                    label={translate("pages.profile.chips.contactPrimary")}
                    size="small"
                    className="text-12"
                  />
                )}
                <ContactActionsMenu
                  dataTestId="btn-profile-contact-menu-phone"
                  controls={getPrimaryContactMenuControls(
                    "phone",
                    profile.phone_number,
                    profile.phone_number_verified,
                    canManagePrimaryPhone
                  )}
                />
              </>
            </UserProfileField>
            {renderAdditionalContacts(
              "phone",
              additionalPhoneContacts,
              canAddPhoneContacts,
              canManagePrimaryPhone
            )}
            {renderAddContactRow(
              "phone",
              canAddPhoneContacts,
              Boolean(profile.phone_number)
            )}
          </div>
        </SurfaceBlock>

        <SurfaceBlock className={styles.panel}>
          <div className={styles.panelTitle}>
            <Typography className="text-17">
              {translate("pages.profile.sections.identifiers")}
            </Typography>
            <Link
              component={RouterLink}
              to={`/${routes.profile}/external-provider`}
              data-test-id="lnk-profile-identifier-add"
            >
              {translate("actionButtons.add")}
            </Link>
          </div>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {externalAccounts
              ?.filter((account) => !isContactExternalAccount(account))
              .map((account) => (
                <ExternalAccount
                  account={account}
                  userProfileId={profile?.id}
                  key={
                    (account.sub || "") +
                    (account.issuer || "") +
                    (account.type || "")
                  }
                  withoutButtons={false}
                />
              ))}
          </Box>
        </SurfaceBlock>

        <SurfaceBlock className={styles.panel}>
          <div className={styles.panelTitle}>
            <Typography className="text-17">
              {translate("pages.profile.sections.security")}
            </Typography>
          </div>
          <ChangePasswordBlock
            passwordUpdateDate={passwordUpdateDate}
            navigateTo={`/${routes.profile}/change-password`}
          />
          <TokensBlock
            data-test-id="lnk-profile-tokens"
            navigateTo={`/${routes.profile}/${tabs.tokens}`}
          />
        </SurfaceBlock>

        <SurfaceBlock className={styles.panel}>
          <div className={styles.panelTitle}>
            <Typography className="text-17">
              {translate("pages.profile.sections.privacy")}
            </Typography>
          </div>
          <PublicProfileBlock onOpenDrawer={handleOpenPublicPanel} />
        </SurfaceBlock>

        <AccordionBlock
          dataTestId="ddl-profile-other-actions"
          title={translate("pages.profile.sections.otherActions")}
        >
          <ProfileLocaleSettings profile={profile} />

          {dataSettings?.data_processing_agreement && (
            <Link
              data-test-id="lnk-profile-other-policy"
              href={dataSettings.data_processing_agreement}
              target="_blank"
              rel="noreferrer"
            >
              {translate("pages.profile.actions.privacyPolicy")}
            </Link>
          )}

          {profile.id && profile.id !== "1" && (
            <Link
              component={RouterLink}
              to={subTabs.delete}
              data-test-id="lnk-profile-other-delete-account"
            >
              {translate("actionButtons.deleteAccount")}
            </Link>
          )}

          <div className={styles.actions}>
            <Button
              data-test-id="btn-profile-other-logout-all-devices"
              variant="contained"
              color="secondary"
              onClick={() => setOutModalOpen(true)}
            >
              {translate("pages.profile.actions.logoutAllDevices")}
            </Button>
            <Button
              data-test-id="btn-profile-other-download-data"
              variant="contained"
              color="secondary"
              onClick={() => exportToJson({ ...profile }, "profile.json")}
            >
              {translate("pages.profile.actions.downloadData")}
            </Button>
          </div>
        </AccordionBlock>
        <div className="zeroBlock"></div>
      </div>

      <PublicProfilePanel
        email={profile.email || ""}
        isOpen={isOpenPublicPanel}
        onClose={() => setIsOpenPublicPanel(false)}
      />

      <SubmitModal
        cancelText={translate("actionButtons.cancel")}
        deleteText={translate("actionButtons.delete")}
        title={translate("pages.profile.modals.confirmDeletion.title")}
        mainMessage={[
          translate("pages.profile.modals.confirmDeletion.message"),
        ]}
        isOpen={agreeModal}
        onClose={() => setAgreeModal(false)}
        onSubmit={handleContact}
      />

      <SubmitModal
        cancelText={translate("actionButtons.cancel")}
        deleteText={translate("actionButtons.delete")}
        title={translate("pages.profile.modals.logoutAllDevices.title")}
        mainMessage={[
          translate("pages.profile.modals.logoutAllDevices.message"),
        ]}
        actionButtonText={translate("actionButtons.continue")}
        isOpen={isOutModalOpen}
        onSubmit={async () => {
          setOutModalOpen(false);
          await deleteAllSession(profile.id);
          window.location.reload();
        }}
        onClose={() => setOutModalOpen(false)}
      />
    </div>
  );
};

export const Profile = connect(mapStateToProps)(ProfileComponent);
