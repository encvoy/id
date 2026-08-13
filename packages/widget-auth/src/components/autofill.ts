// Browser autocomplete tokens remain the primary contract. These attributes
// are a best-effort opt-out for password-manager extensions on non-credential
// inputs such as verification-code cells.
export const PASSWORD_MANAGER_IGNORE_ATTRIBUTES = {
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
  'data-bwignore': 'true',
  'data-protonpass-ignore': 'true',
  'data-keeper-ignore': 'true',
  'data-form-type': 'other',
} as const;
