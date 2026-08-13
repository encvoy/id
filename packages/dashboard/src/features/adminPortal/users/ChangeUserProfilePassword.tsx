import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { tabs } from "src/shared/utils/enums";
import { RootState } from "src/app/store/store";
import { ChangeUserPasswordForm } from "./components/ChangeUserPasswordForm";

export const ChangeUserPassword = () => {
  const {
    appId = "",
    userId = "",
    clientId = "",
  } = useParams<{ appId: string; userId: string; clientId: string }>();
  const navigate = useNavigate();
  const startRoutePath = useSelector(
    (state: RootState) => state.app.startRoutePath
  );
  const backUrl = clientId
    ? `/${startRoutePath}/${appId}/${tabs.clients}/${clientId}/${tabs.users}/${userId}`
    : `/${startRoutePath}/${appId}/${tabs.users}/${userId}`;

  return (
    <div className="page-container">
      <div className="content">
        <ChangeUserPasswordForm
          userId={userId}
          onCancel={() => navigate(-1)}
          onSuccess={() => navigate(backUrl)}
        />
      </div>
    </div>
  );
};
