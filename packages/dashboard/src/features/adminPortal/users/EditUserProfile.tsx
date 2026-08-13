import { FC } from "react";
import { EditUserProfileForm } from "./components/EditUserProfileForm";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

export const EditUserProfile: FC = () => {
  const { t: translate } = useTranslation();

  return (
    <div className="page-container">
      <div className="content">
        <Typography className="title-medium" sx={{ margin: "32px 0" }}>
          {translate("pages.editUser.title")}
        </Typography>
        <EditUserProfileForm />
      </div>
    </div>
  );
};
