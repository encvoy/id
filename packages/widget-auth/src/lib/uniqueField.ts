import { buildPublicUrl } from './constant';

type TUniqueFieldAvailabilityParams = {
  fieldName: string;
  value: string;
  clientId: string;
  userId?: string;
  signal?: AbortSignal;
};

export const checkUniqueFieldAvailability = async ({
  fieldName,
  value,
  clientId,
  userId,
  signal,
}: TUniqueFieldAvailabilityParams): Promise<boolean> => {
  const query = new URLSearchParams({
    field_name: fieldName,
    value,
    client_id: clientId,
  });

  if (userId && userId !== '0') {
    query.set('user_id', userId);
  }

  const response = await fetch(
    buildPublicUrl(`/api/v1/users/check-unique-field-availability?${query.toString()}`),
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Unique field availability request failed: ${response.status}`);
  }

  return (await response.json()) === true;
};
