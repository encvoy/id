import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { debounce } from '@mui/material';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLazyGetUsersClientQuery } from 'src/shared/api/clients';
import { TUserWithRole } from 'src/shared/api/users';
import { ERoles, Order } from 'src/shared/utils/enums';
import { getUserDisplayName } from 'src/shared/utils/userDisplayName';
import { SubmitModal } from '@encvoy-id/components';
import { useTranslation } from 'react-i18next';

type TDebouncedAutocompleteSearch = {
  (value: string): void;
  clear: () => void;
};

interface IUserSearchModalProps {
  isOpen: boolean;
  clientId?: string;
  disabledUserId?: string;
  excludedRoles?: ERoles[];
  title: string;
  mainMessage: string[];
  actionButtonText: string;
  placeholder: string;
  helperText: string;
  onClose: () => void;
  onSubmit: (selectedUser: TUserWithRole) => Promise<void>;
}

const AUTOCOMPLETE_LIMIT = 25;

export const UserSearchModal: FC<IUserSearchModalProps> = ({
  isOpen,
  clientId,
  disabledUserId,
  excludedRoles = [ERoles.OWNER],
  title,
  mainMessage,
  actionButtonText,
  placeholder,
  helperText,
  onClose,
  onSubmit,
}) => {
  const { t: translate } = useTranslation();
  const [selectedUser, setSelectedUser] = useState<TUserWithRole | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [getUsers, { data: usersData, isFetching: isUsersFetching }] = useLazyGetUsersClientQuery();
  const debouncedUserSearchRef = useRef<TDebouncedAutocompleteSearch | null>(null);
  const usersTriggerRef = useRef(getUsers);

  const userCandidates = useMemo(() => {
    return (usersData?.items || []).filter((item) => !excludedRoles.includes(item.role));
  }, [excludedRoles, usersData?.items]);

  const resetState = useCallback(() => {
    debouncedUserSearchRef.current?.clear();
    setSelectedUser(null);
    setUserSearch('');
  }, []);

  const loadUserCandidates = useCallback(
    (search: string) => {
      if (!clientId) {
        return;
      }

      const query = {
        limit: AUTOCOMPLETE_LIMIT,
        offset: 0,
        search,
        sortBy: 'id',
        sortDirection: Order.DESC,
      };

      void usersTriggerRef.current({ id: clientId, query });
    },
    [clientId],
  );

  useEffect(() => {
    usersTriggerRef.current = getUsers;
  }, [getUsers]);

  useEffect(() => {
    if (!isOpen) {
      resetState();
      return;
    }

    const debouncedAutocompleteSearch = debounce((value: string) => {
      loadUserCandidates(value);
    }, 250) as TDebouncedAutocompleteSearch;

    debouncedUserSearchRef.current = debouncedAutocompleteSearch;

    debouncedAutocompleteSearch(userSearch);

    return () => {
      debouncedAutocompleteSearch.clear();
      if (debouncedUserSearchRef.current === debouncedAutocompleteSearch) {
        debouncedUserSearchRef.current = null;
      }
    };
  }, [isOpen, loadUserCandidates, resetState, userSearch]);

  const handleSubmit = async () => {
    if (!selectedUser?.user?.id) {
      return;
    }

    await onSubmit(selectedUser);
    onClose();
  };

  return (
    <SubmitModal
      cancelText={translate('actionButtons.cancel')}
      deleteText={translate('actionButtons.delete')}
      isOpen={isOpen}
      onSubmit={handleSubmit}
      onClose={() => {
        resetState();
        onClose();
      }}
      title={title}
      actionButtonText={actionButtonText}
      disabled={
        isUsersFetching || !selectedUser?.user?.id || selectedUser.user.id === disabledUserId
      }
      mainMessage={mainMessage}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Autocomplete
          value={selectedUser}
          options={userCandidates}
          loading={isUsersFetching}
          onChange={(_, value) => setSelectedUser(value)}
          onInputChange={(_, value) => {
            setUserSearch(value);
            if (!value.trim()) {
              debouncedUserSearchRef.current?.clear();
              loadUserCandidates('');
            }
          }}
          getOptionLabel={(option) => `${getUserDisplayName(option.user, true) || option.user.id}`}
          isOptionEqualToValue={(option, value) =>
            Boolean(value) && option.user.id === value.user.id
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={placeholder}
              autoComplete="new-password"
              type="text"
              inputProps={{
                ...params.inputProps,
                autoComplete: 'off',
                name: 'search-field',
                'data-lpignore': 'true',
                'data-1p-ignore': 'true',
                'data-bwignore': 'true',
              }}
            />
          )}
        />

        <Typography className="text-12" color="text.secondary">
          {helperText}
        </Typography>
      </Box>
    </SubmitModal>
  );
};
