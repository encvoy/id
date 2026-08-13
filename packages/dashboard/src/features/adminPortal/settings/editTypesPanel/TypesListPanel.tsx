import ListItem from '@mui/material/ListItem';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { IconsLibrary } from '@encvoy-id/components';
import { SidePanel } from '@encvoy-id/components';
import { setNoticeError } from 'src/shared/slices/noticesSlice';
import {
  IClientType,
  useDeleteClientTypeMutation,
  useGetClientTypesQuery,
} from 'src/shared/api/settings';
import { EditTypePanel } from './EditTypePanel';
import styles from './TypesListPanel.module.css';
import { Button, List, Typography } from '@mui/material';
import { SurfaceBlock } from '@encvoy-id/components';
import { getLocalizedTextValue } from 'src/shared/utils/locales';

interface ITypesListPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TypesListPanel: FC<ITypesListPanelProps> = ({ isOpen, onClose }) => {
  const { t: translate, i18n } = useTranslation();
  const { data: types = [] } = useGetClientTypesQuery();
  const [selectedClientType, setSelectedClientType] = useState<IClientType | undefined>(undefined);
  const [isEditClientTypeOpen, setIsEditClientTypeOpen] = useState(false);
  const dispatch = useDispatch();

  const [deleteClientType] = useDeleteClientTypeMutation();

  const handleDelete = async (id: string) => {
    try {
      await deleteClientType(id).unwrap();
    } catch (error) {
      console.error(error);
      dispatch(setNoticeError(translate('info.updateError')));
    }
  };

  return (
    <>
      <SidePanel
        buttonSubmitText={translate('actionButtons.save')}
        customAdditionalText={translate('actionButtons.create')}
        cancelText={translate('actionButtons.cancel')}
        onClose={onClose}
        isOpen={isOpen}
        title={translate('panel.types.title')}
        description={translate('panel.types.description')}
        actionButtonDataTestId="btn-settings-app-types-create"
        closeButtonDataTestId="btn-modal-close"
        AdditionalAction={() => {
          setSelectedClientType(undefined);
          setIsEditClientTypeOpen(true);
        }}
      >
        <List className={styles.wrapper}>
          {types.map((type) => (
            <ListItem
              disablePadding
              key={type.id}
              onClick={() => {
                setSelectedClientType(type);
                setIsEditClientTypeOpen(true);
              }}
            >
              <SurfaceBlock className={styles.type}>
                <div className={styles.content}>
                  <Typography>{getLocalizedTextValue(type.name, i18n.language)}</Typography>
                  <div className={styles.buttons}>
                    <Button
                      data-test-id="btn-settings-app-types-configure-app"
                      variant="text"
                      onClick={() => {
                        setSelectedClientType(type);
                        setIsEditClientTypeOpen(true);
                      }}
                    >
                      {translate('actionButtons.configure')}
                    </Button>
                    <IconsLibrary
                      title={translate('toolTips.delete')}
                      styleButton={styles.button}
                      type="delete"
                      dataTestId={`btn-settings-app-types-delete-${type.id}`}
                      onClick={() => handleDelete(type.id)}
                    />
                  </div>
                </div>
              </SurfaceBlock>
            </ListItem>
          ))}
        </List>
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
