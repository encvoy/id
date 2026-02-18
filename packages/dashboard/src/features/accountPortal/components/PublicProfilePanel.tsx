import { Avatar, Box, Typography } from "@mui/material";
import clsx from "clsx";
import { ReactNode, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { IExternalAccount } from "src/shared/api/users";
import { getImageURL } from "src/shared/utils/helpers";
import { setNoticeError } from "src/shared/lib/noticesSlice";
import { TCustomFields } from "src/shared/lib/userSlice";
import { SidePanel } from "src/shared/ui/sidePanel/SidePanel";
import { ExternalAccount } from "src/shared/ui/ExternalAccount";
import styles from "./PublicProfilePanel.module.css";
import {
  IPublicProfile,
  useLazyGetPublicProfileQuery,
  useLazyGetVCardQuery,
} from "src/shared/api/profile";
import { useTranslation } from "react-i18next";
import { componentBorderRadius } from "src/shared/theme/Theme";

export const PublicProfilePanel = ({
  email,
  isOpen,
  onClose,
}: {
  email: string;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const dispatch = useDispatch();
  const { t: translate } = useTranslation();
  const [loadingVCard, setLoadingVCard] = useState(false);
  const [publicProfile, setPublicProfile] = useState<
    IPublicProfile | undefined
  >(undefined);
  const linesExternalAccounts: (ReactNode | null | undefined)[] = [];
  const linesInfo: (ReactNode | null | undefined)[] = [];
  const [getPublicProfile] = useLazyGetPublicProfileQuery();
  const [getVCard] = useLazyGetVCardQuery();

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const fetchPublicProfile = async () => {
      const profile = await getPublicProfile(email).unwrap();
      setPublicProfile(profile);
    };
    fetchPublicProfile();
  }, [isOpen]);

  if (!publicProfile) {
    return null;
  }

  Object.keys(publicProfile).forEach((key) => {
    if (key === "ExternalAccount") {
      const externalAccounts = publicProfile[
        key
      ] as unknown as Array<IExternalAccount>;
      if (externalAccounts) {
        externalAccounts.forEach((externalAccount) => {
          linesExternalAccounts.push(
            <ExternalAccount
              userProfileId={publicProfile.id}
              account={externalAccount}
              withoutButtons={true}
            />
          );
        });
      }
      return;
    }

    if (key === "custom_fields") {
      const cf = publicProfile[key] as TCustomFields;
      Object.keys(cf).forEach((keyCF) => {
        const valueCF = cf[keyCF];
        if (valueCF) {
          linesInfo.push(
            <Typography
              key={keyCF}
              className={clsx("text-14", styles.itemValue)}
            >
              {valueCF as string}
            </Typography>
          );
        }
      });
      return;
    }

    const value = publicProfile[key];
    if (value) {
      if (key === "picture") {
        linesInfo.unshift(
          <Avatar
            src={getImageURL(publicProfile.picture)}
            className={styles.userIcon}
          />
        );
        return;
      }

      linesInfo.push(
        <Typography key={key} className={clsx("text-14", styles.itemValue)}>
          {value as string}
        </Typography>
      );
    }

    return;
  });

  const handleVCardDownload = async () => {
    try {
      setLoadingVCard(true);
      const vCardResponse = await getVCard(email).unwrap();
      let vCardBlob: Blob;

      if (vCardResponse instanceof Blob) {
        vCardBlob = vCardResponse;
      } else if (typeof vCardResponse === "string") {
        // Assume plain text vCard content
        vCardBlob = new Blob([vCardResponse], { type: "text/vcard" });
      } else {
        throw new Error("Unexpected vCard response type");
      }

      const url = window.URL.createObjectURL(vCardBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contact.vcf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      dispatch(setNoticeError(`${error}`));
    } finally {
      setLoadingVCard(false);
    }
  };

  return (
    <>
      <SidePanel
        title={translate("pages.profile.publicProfile.panelTitle")}
        onClose={onClose}
        isOpen={isOpen}
        onSubmit={() => handleVCardDownload()}
        buttonSubmitText={translate("actionButtons.download")}
        disabledButtonSubmit={loadingVCard}
      >
        {linesInfo.length > 0 && (
          <Box
            className={styles.panel}
            sx={{ borderRadius: componentBorderRadius }}
          >
            <Typography className="text-17" sx={{ paddingBottom: "16px" }}>
              {translate("pages.profile.publicProfile.mainInfo")}
            </Typography>
            {linesInfo}
          </Box>
        )}

        {linesExternalAccounts.length > 0 && (
          <Box
            className={styles.panel}
            sx={{ borderRadius: componentBorderRadius }}
          >
            <Typography className="text-17" sx={{ paddingBottom: "16px" }}>
              {translate("pages.profile.publicProfile.externalAccounts")}
            </Typography>
            {linesExternalAccounts}
          </Box>
        )}
      </SidePanel>
    </>
  );
};
