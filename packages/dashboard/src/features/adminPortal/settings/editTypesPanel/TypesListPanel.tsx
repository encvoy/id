import ListItem from "@mui/material/ListItem";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { IconsLibrary } from "src/shared/ui/components/IconLibrary";
import { SidePanel } from "src/shared/ui/sidePanel/SidePanel";
import { setNoticeError } from "src/shared/lib/noticesSlice";
import {
  IClientType,
  useDeleteClientTypeMutation,
  useGetClientTypesQuery,
} from "src/shared/api/settings";
import { EditTypePanel } from "./EditTypePanel";
import styles from "./TypesListPanel.module.css";
import { Button, Typography } from "@mui/material";
import { componentBorderRadius } from "src/shared/theme/Theme";

interface ITypesListPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TypesListPanel: FC<ITypesListPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { t: translate } = useTranslation();
  const { data: types = [] } = useGetClientTypesQuery();
  const [selectedClientType, setSelectedClientType] = useState<
    IClientType | undefined
  >(undefined);
  const [isEditClientTypeOpen, setIsEditClientTypeOpen] = useState(false);
  const dispatch = useDispatch();

  const [deleteClientType] = useDeleteClientTypeMutation();

  const handleDelete = async (id: string) => {
    try {
      await deleteClientType(id).unwrap();
    } catch (error) {
      console.error(error);
      dispatch(setNoticeError(translate("info.updateError")));
    }
  };

  return (
    <>
      <SidePanel
        onClose={onClose}
        isOpen={isOpen}
        title={translate("panel.types.title")}
        description={translate("panel.types.description")}
        AdditionalAction={() => setIsEditClientTypeOpen(true)}
      >
        <div className={styles.wrapper}>
          {types.map((type) => (
            <ListItem
              key={type.id}
              className={styles.item}
              onClick={() => {
                setSelectedClientType(type);
                setIsEditClientTypeOpen(true);
              }}
              sx={{ borderRadius: componentBorderRadius }}
            >
              <div className={styles.content}>
                <Typography>{type.name}</Typography>
                <div className={styles.buttons}>
                  <Button
                    variant="text"
                    onClick={() => {
                      setSelectedClientType(type);
                      setIsEditClientTypeOpen(true);
                    }}
                  >
                    {translate("actionButtons.configure")}
                  </Button>
                  <IconsLibrary
                    styleButton={styles.button}
                    type="delete"
                    onClick={() => handleDelete(type.id)}
                  />
                </div>
              </div>
            </ListItem>
          ))}
        </div>
      </SidePanel>

      <EditTypePanel
        isOpen={isEditClientTypeOpen}
        onClose={() => {
          setIsEditClientTypeOpen(false);
          setSelectedClientType(undefined);
        }}
        type={selectedClientType}
      />
    </>
  );
};
