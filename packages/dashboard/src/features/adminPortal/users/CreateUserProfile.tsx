import { FC } from "react";
import { CreateUserProfileForm } from "./components/CreateUserProfileForm";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

export const CreateUserProfile: FC = () => {
  const { t: translate } = useTranslation();

  return (
    <div className="page-container">
      <div className="content">
        <Typography className="title-medium" sx={{ margin: "32px 0" }}>
          {translate("pages.createUser.title")}
        </Typography>
        <CreateUserProfileForm />
      </div>
    </div>
  );
};
