import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import PostAddOutlinedIcon from '@mui/icons-material/PostAddOutlined';
import { Box, Button, Typography } from '@mui/material';
import clsx from 'clsx';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  useGetClientInfoQuery,
  useUpdateClientMutation,
  useUpdateClientProvidersListMutation,
} from 'src/shared/api/clients';
import { setNoticeError, setNoticeInfo } from 'src/shared/slices/noticesSlice';
import { SubmitModal } from '@encvoy-id/components';
import {
  EGetProviderAction,
  IProvider,
  EProviderType,
  useActivateProvidersMutation,
  useDeactivateProvidersMutation,
  useDeleteProviderMutation,
  useGetProvidersQuery,
} from '../../../../shared/api/provider';
import { ChooseListProvidersPanel } from './ChooseListProvidersPanel';
import { EditEmailCustomProvider } from './editPanel/EditEmailCustomProvider';
import { EditEthereumProvider } from './editPanel/EditEthereumProvider';
import { EditHOTPProvider } from './editPanel/EditHOTPProvider';
import { EditKloudProvider } from './editPanel/EditKloudProvider';
import { EditMTLSProvider } from './editPanel/EditMTLSProvider';
import { EditProvider } from './editPanel/EditProvider';
import { EditTOTPProvider } from './editPanel/EditTOTPProvider';
import { EditWebAuthnProvider } from './editPanel/EditWebAuthnProvider';
import { EmptyProviderPlaceholder } from './EmptyProviderPlaceholder';
import styles from './ListProvidersPanel.module.css';
import { ProviderItemBase } from './ProviderItemBase';
import { SortableProviderItem } from './SortableProviderItem';

export const ListProvidersPanel: FC = () => {
  const { appId = '', clientId = '' } = useParams<{ appId: string; clientId?: string }>();
  const dispatch = useDispatch();
  const { t: translate } = useTranslation();

  const [providerToEdit, setProviderToEdit] = useState<IProvider | null>(null);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<IProvider | null>(null);
  const [bigProviders, setBigProviders] = useState<IProvider[]>([]);
  const [smallProviders, setSmallProviders] = useState<IProvider[]>([]);
  const [otherProviders, setOtherProviders] = useState<IProvider[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: client } = useGetClientInfoQuery({
    id: clientId || appId,
  });
  const { data: clientProviders } = useGetProvidersQuery({
    client_id: clientId || appId,
    query: {
      action: EGetProviderAction.all,
    },
  });

  const [deleteProvider] = useDeleteProviderMutation();
  const [activateProvider] = useActivateProvidersMutation();
  const [deactivateProvider] = useDeactivateProvidersMutation();
  const [updateClient] = useUpdateClientMutation();
  const [updateClientProvidersList] = useUpdateClientProvidersListMutation();

  const currentClientID = clientId || appId;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const editProviderTypes: string[] = [
    EProviderType.GITHUB,
    EProviderType.GOOGLE,
    EProviderType.CUSTOM,
    EProviderType.OAUTH,
    EProviderType.KLOUD,
    EProviderType.ETHEREUM,
    EProviderType.WEBAUTHN,
    EProviderType.MTLS,
    EProviderType.TOTP,
    EProviderType.HOTP,
    EProviderType.KLOUD,
    EProviderType.EMAIL_CUSTOM,
  ];
  const onlyRemoveProviderTypes: string[] = [EProviderType.ETHEREUM];

  useEffect(() => {
    if (clientProviders?.length) {
      const sorted = [...clientProviders].sort((a, b) => {
        const indexA = a.index ?? 999;
        const indexB = b.index ?? 999;
        return indexA - indexB;
      });

      const big = sorted.filter((p) => p.groupe === 'BIG');
      const small = sorted.filter((p) => p.groupe === 'SMALL');
      const others = sorted.filter((p) => p.groupe !== 'BIG' && p.groupe !== 'SMALL');

      setBigProviders(big);
      setSmallProviders(small);
      setOtherProviders(others);
    } else {
      setBigProviders([]);
      setSmallProviders([]);
      setOtherProviders([]);
    }
  }, [clientProviders]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeProvider =
      bigProviders.find((p) => p.id === active.id) ||
      smallProviders.find((p) => p.id === active.id);

    if (!activeProvider) return;

    const activeInBig = bigProviders.some((p) => p.id === active.id);

    if (over.id === 'empty-placeholder-big' || over.id === 'empty-placeholder-small') {
      const targetGroupe = over.id === 'empty-placeholder-big' ? 'BIG' : 'SMALL';
      const targetIsBig = targetGroupe === 'BIG';

      if (activeInBig === targetIsBig) return;

      const sourceProviders = activeInBig ? bigProviders : smallProviders;
      const targetProviders = targetIsBig ? bigProviders : smallProviders;
      const setSourceProviders = activeInBig ? setBigProviders : setSmallProviders;
      const setTargetProviders = targetIsBig ? setBigProviders : setSmallProviders;

      const newSource = sourceProviders.filter((p) => p.id !== active.id);

      const updatedActiveProvider = { ...activeProvider, groupe: targetGroupe };
      const newTarget = [...targetProviders, updatedActiveProvider];

      const sourceGroupe = activeInBig ? 'BIG' : 'SMALL';
      const updatedSource = newSource.map((item, index) => ({
        ...item,
        index,
        groupe: sourceGroupe,
      }));
      const updatedTarget = newTarget.map((item, index) => ({
        ...item,
        index,
        groupe: targetGroupe,
      }));

      setSourceProviders(updatedSource);
      setTargetProviders(updatedTarget);
      if (targetIsBig) {
        sendProvidersUpdate(updatedTarget, updatedSource);
      } else {
        sendProvidersUpdate(updatedSource, updatedTarget);
      }

      return;
    }

    const overProvider =
      bigProviders.find((p) => p.id === over.id) || smallProviders.find((p) => p.id === over.id);

    if (!overProvider) return;

    const overInBig = bigProviders.some((p) => p.id === over.id);

    if (activeInBig === overInBig) {
      const providers = activeInBig ? bigProviders : smallProviders;
      const setProviders = activeInBig ? setBigProviders : setSmallProviders;

      const oldIndex = providers.findIndex((item) => item.id === active.id);
      const newIndex = providers.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(providers, oldIndex, newIndex);
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        index,
      }));

      setProviders(updatedItems);
      if (activeInBig) {
        sendProvidersUpdate(updatedItems, smallProviders);
      } else {
        sendProvidersUpdate(bigProviders, updatedItems);
      }
    } else {
      const targetGroupe = overInBig ? 'BIG' : 'SMALL';
      const sourceProviders = activeInBig ? bigProviders : smallProviders;
      const targetProviders = overInBig ? bigProviders : smallProviders;
      const setSourceProviders = activeInBig ? setBigProviders : setSmallProviders;
      const setTargetProviders = overInBig ? setBigProviders : setSmallProviders;

      const newSource = sourceProviders.filter((p) => p.id !== active.id);

      const targetIndex = targetProviders.findIndex((item) => item.id === over.id);

      const updatedActiveProvider = { ...activeProvider, groupe: targetGroupe };
      const newTarget = [...targetProviders];
      newTarget.splice(targetIndex, 0, updatedActiveProvider);

      const sourceGroupe = activeInBig ? 'BIG' : 'SMALL';
      const updatedSource = newSource.map((item, index) => ({
        ...item,
        index,
        groupe: sourceGroupe,
      }));
      const updatedTarget = newTarget.map((item, index) => ({
        ...item,
        index,
        groupe: targetGroupe,
      }));

      setSourceProviders(updatedSource);
      setTargetProviders(updatedTarget);
      if (overInBig) {
        sendProvidersUpdate(updatedTarget, updatedSource);
      } else {
        sendProvidersUpdate(updatedSource, updatedTarget);
      }
    }
  };

  const sendProvidersUpdate = (big: IProvider[], small: IProvider[]) => {
    updateClientProvidersList({
      client_id: client?.client_id || '',
      big: big.map((p) => p.id),
      small: small.map((p) => p.id),
    });
  };

  const handleDeleteProvider = async () => {
    try {
      await deleteProvider({
        clientId: clientId || appId,
        providerId: providerToDelete?.id || '',
      }).unwrap();
    } catch (error) {
      console.error(error);
      dispatch(setNoticeError(translate('info.deleteError')));
    }
    setProviderToDelete(null);
  };

  const handleCopyProvider = async (provider: IProvider) => {
    await navigator.clipboard.writeText(JSON.stringify(provider));
    dispatch(setNoticeInfo(translate('info.dataCopied')));
  };

  const handleActivateProvider = async (provider: IProvider, index?: number) => {
    if (!provider.is_active) {
      await activateProvider({
        clientId: clientId || appId,
        providerId: provider.id,
        index,
      });
    } else {
      await deactivateProvider({
        clientId: clientId || appId,
        providerId: provider.id,
      });
    }
  };

  const handleChangeRequired = async (provider: IProvider, isRequired?: boolean) => {
    const updatedProvidersIds = isRequired
      ? (client?.required_providers_ids ?? []).filter((id) => id !== provider.id)
      : [...(client?.required_providers_ids ?? []), provider.id];

    try {
      await updateClient({
        client_id: client?.client_id,
        required_providers_ids: updatedProvidersIds,
      }).unwrap();
    } catch (error) {
      dispatch(setNoticeError(translate('info.updateError')));
      console.error(error);
    }
  };

  const credentials = clientProviders?.find((p) => p.type === EProviderType.CREDENTIALS);

  return (
    <>
      <Box>
        <div className={styles.header}>
          <Typography>{translate('pages.widget.editProviders')}</Typography>
          <Button
            data-id="side-panel-create-button"
            data-test-id="btn-settings-login-method-create"
            variant="contained"
            color="secondary"
            onClick={() => setIsCreateFormOpen(true)}
            startIcon={<PostAddOutlinedIcon className={styles.buttonIcon} />}
          />
        </div>

        {!!credentials && (
          <ProviderItemBase
            key={credentials.id}
            provider={credentials}
            currentClientID={currentClientID}
            isRequired={false}
            onlyRemove={false}
            canClick={false}
            onEdit={setProviderToEdit}
            onActivate={handleActivateProvider}
            onChangeRequired={handleChangeRequired}
            onCopy={handleCopyProvider}
            onDelete={setProviderToDelete}
            editProviderTypes={editProviderTypes}
          />
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* BIG */}
          <Typography className={clsx(styles.groupTitle, 'text-14')}>
            {translate('pages.widget.big')}
          </Typography>
          <SortableContext
            items={
              bigProviders.length === 0 ? ['empty-placeholder-big'] : bigProviders.map((p) => p.id)
            }
            strategy={verticalListSortingStrategy}
          >
            <div>
              {bigProviders.map((provider) => {
                const isRequired = client?.required_providers_ids?.includes(provider.id.toString());
                const onlyRemove = onlyRemoveProviderTypes.includes(provider.type);
                const canClick = !onlyRemove && provider.client_id === currentClientID;

                return (
                  <SortableProviderItem
                    key={provider.id}
                    provider={provider}
                    currentClientID={currentClientID}
                    isRequired={isRequired ?? false}
                    onlyRemove={onlyRemove}
                    canClick={canClick}
                    onEdit={setProviderToEdit}
                    onActivate={handleActivateProvider}
                    onChangeRequired={handleChangeRequired}
                    onCopy={handleCopyProvider}
                    onDelete={setProviderToDelete}
                    editProviderTypes={editProviderTypes}
                    maxQuantity={bigProviders.length}
                  />
                );
              })}
              {bigProviders.length === 0 && (
                <EmptyProviderPlaceholder id="empty-placeholder-big" groupe="BIG" />
              )}
            </div>
          </SortableContext>

          {/* SMALL */}
          <Typography className={clsx(styles.groupTitle, 'text-14')}>
            {translate('pages.widget.small')}
          </Typography>
          <SortableContext
            items={
              smallProviders.length === 0
                ? ['empty-placeholder-small']
                : smallProviders.map((p) => p.id)
            }
            strategy={verticalListSortingStrategy}
          >
            <div>
              {smallProviders.map((provider) => {
                const isRequired = client?.required_providers_ids?.includes(provider.id.toString());
                const onlyRemove = onlyRemoveProviderTypes.includes(provider.type);
                const canClick = !onlyRemove && provider.client_id === currentClientID;

                return (
                  <SortableProviderItem
                    key={provider.id}
                    provider={provider}
                    currentClientID={currentClientID}
                    isRequired={isRequired ?? false}
                    onlyRemove={onlyRemove}
                    canClick={canClick}
                    onEdit={setProviderToEdit}
                    onActivate={handleActivateProvider}
                    onChangeRequired={handleChangeRequired}
                    onCopy={handleCopyProvider}
                    onDelete={setProviderToDelete}
                    editProviderTypes={editProviderTypes}
                    maxQuantity={smallProviders.length}
                  />
                );
              })}
              {smallProviders.length === 0 && (
                <EmptyProviderPlaceholder id="empty-placeholder-small" groupe="SMALL" />
              )}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeId ? (
              <div style={{ opacity: 0.8 }}>
                {(() => {
                  const provider =
                    bigProviders.find((p) => p.id === activeId) ||
                    smallProviders.find((p) => p.id === activeId);
                  if (!provider) return null;

                  const isRequired = client?.required_providers_ids?.includes(
                    provider.id.toString(),
                  );
                  const onlyRemove = onlyRemoveProviderTypes.includes(provider.type);
                  const canClick = !onlyRemove && provider.client_id === currentClientID;

                  return (
                    <SortableProviderItem
                      provider={provider}
                      currentClientID={currentClientID}
                      isRequired={isRequired ?? false}
                      onlyRemove={onlyRemove}
                      canClick={canClick}
                      onEdit={setProviderToEdit}
                      onActivate={handleActivateProvider}
                      onChangeRequired={handleChangeRequired}
                      onCopy={handleCopyProvider}
                      onDelete={setProviderToDelete}
                      editProviderTypes={editProviderTypes}
                    />
                  );
                })()}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {otherProviders.length > 0 && (
          <>
            <Typography className={clsx(styles.groupTitle, 'text-14')}>
              {translate('pages.widget.otherProviders')}
            </Typography>
            <div>
              {otherProviders
                .filter((provider) => provider.type !== EProviderType.CREDENTIALS)
                .map((provider) => {
                  const isRequired = client?.required_providers_ids?.includes(
                    provider.id.toString(),
                  );
                  const onlyRemove = onlyRemoveProviderTypes.includes(provider.type);
                  const canClick = !onlyRemove && provider.client_id === currentClientID;

                  return (
                    <ProviderItemBase
                      key={provider.id}
                      provider={provider}
                      currentClientID={currentClientID}
                      isRequired={isRequired ?? false}
                      onlyRemove={onlyRemove}
                      canClick={canClick}
                      onEdit={setProviderToEdit}
                      onActivate={handleActivateProvider}
                      onChangeRequired={handleChangeRequired}
                      onCopy={handleCopyProvider}
                      onDelete={setProviderToDelete}
                      editProviderTypes={editProviderTypes}
                      maxQuantity={smallProviders.length}
                    />
                  );
                })}
            </div>
          </>
        )}
      </Box>

      <ChooseListProvidersPanel
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
      />
      <EditMTLSProvider
        provider={providerToEdit}
        isOpen={providerToEdit?.type === EProviderType.MTLS}
        onClose={() => {
          setProviderToEdit(null);
        }}
      />
      <EditWebAuthnProvider
        provider={providerToEdit}
        isOpen={providerToEdit?.type === EProviderType.WEBAUTHN}
        onClose={() => {
          setProviderToEdit(null);
        }}
      />
      <EditTOTPProvider
        isOpen={providerToEdit?.type === EProviderType.TOTP}
        onClose={() => setProviderToEdit(null)}
        provider={providerToEdit}
      />
      <EditHOTPProvider
        isOpen={providerToEdit?.type === EProviderType.HOTP}
        onClose={() => setProviderToEdit(null)}
        provider={providerToEdit}
      />
      <EditEthereumProvider
        provider={providerToEdit}
        isOpen={providerToEdit?.type === EProviderType.ETHEREUM}
        onClose={() => {
          setProviderToEdit(null);
        }}
      />
      <EditKloudProvider
        provider={providerToEdit}
        isOpen={providerToEdit?.type === EProviderType.KLOUD}
        onClose={() => {
          setProviderToEdit(null);
        }}
      />
      <EditEmailCustomProvider
        provider={providerToEdit}
        isOpen={providerToEdit?.type === EProviderType.EMAIL_CUSTOM}
        onClose={() => {
          setProviderToEdit(null);
        }}
      />
      <EditProvider
        provider={providerToEdit}
        isOpen={
          providerToEdit !== null &&
          [
            EProviderType.OAUTH,
            EProviderType.GITHUB,
            EProviderType.GOOGLE,
            EProviderType.CUSTOM,
          ].includes(providerToEdit.type as EProviderType)
        }
        onClose={() => {
          setProviderToEdit(null);
        }}
      />
      <SubmitModal
        cancelText={translate('actionButtons.cancel')}
        deleteText={translate('actionButtons.delete')}
        isOpen={!!providerToDelete}
        onClose={() => setProviderToDelete(null)}
        onSubmit={handleDeleteProvider}
        title={translate('pages.widget.modals.deleteProvider.title')}
        mainMessage={[translate('pages.widget.modals.deleteProvider.mainMessage')]}
      />
    </>
  );
};
