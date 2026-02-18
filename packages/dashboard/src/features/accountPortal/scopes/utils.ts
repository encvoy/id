import { FunctionComponent } from "react";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import BiotechOutlinedIcon from "@mui/icons-material/BiotechOutlined";
import BookmarksOutlinedIcon from "@mui/icons-material/BookmarksOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import { TFunction } from "i18next";

const getScopePropsObject = (translate: TFunction) => ({
  profile: {
    description: translate("pages.scopes.scopesProfileDescription.profile"),
    icon: BadgeOutlinedIcon,
  },
  email: {
    description: translate("pages.scopes.scopesProfileDescription.email"),
    icon: AlternateEmailOutlinedIcon,
  },
  phone: {
    description: translate("pages.scopes.scopesProfileDescription.phone"),
    icon: PhoneIphoneOutlinedIcon,
  },
  offline_access: {
    description: translate(
      "pages.scopes.scopesProfileDescription.offlineAccess"
    ),
    icon: HistoryOutlinedIcon,
  },
  accounts: {
    description: translate("pages.scopes.scopesProfileDescription.accounts"),
    icon: GroupsOutlinedIcon,
  },
  openid: {
    description: translate("pages.scopes.scopesProfileDescription.openid"),
    icon: PersonOutlineOutlinedIcon,
  },
  lk: {
    description: translate("pages.scopes.scopesProfileDescription.lk"),
    icon: BiotechOutlinedIcon,
  },
  catalog: {
    description: translate("pages.scopes.scopesProfileDescription.catalog"),
    icon: BookmarksOutlinedIcon,
  },
  locale: {
    description: translate("pages.scopes.scopesProfileDescription.locale"),
    icon: LanguageOutlinedIcon,
  },
});

const unknownScope = (
  scope: string,
  translate: (key: string, options?: any) => string
) => {
  return {
    description: translate("pages.scopes.scopesProfileDescription.unknown", {
      scope,
    }),
    icon: ErrorOutlineOutlinedIcon,
  };
};

/**
 * Returns an object containing the description and icon for the specified scope.
 * @param {string} scope - The name of the scope for which to get properties (profile, email, phone, offline_access, accounts, openid, lk, locale).
 * @param {function} translate - Translation function from react-i18next.
 * @returns {{ description: string; icon: FunctionComponent }} Object with description and icon component.
 */
export const getScopeProps = (
  scope: string,
  translate: TFunction
): { description: string; icon: FunctionComponent } => {
  const scopeProps = getScopePropsObject(translate);
  return (
    scopeProps[scope as keyof typeof scopeProps] ||
    unknownScope(scope, translate)
  );
};
