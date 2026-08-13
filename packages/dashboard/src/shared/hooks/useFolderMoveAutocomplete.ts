import { debounce } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { IFolder, useLazyGetFoldersQuery } from "src/shared/api/folders";

type DebouncedFolderLoader = {
  (value: string): void;
  clear: () => void;
};

export const useFolderMoveAutocomplete = () => {
  const { appId = "" } = useParams<{ appId: string }>();
  const [selectedOption, setSelectedOption] = useState<IFolder | null>(null);
  const [options, setOptions] = useState<IFolder[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequestIdRef = useRef(0);
  const debouncedLoadFoldersRef = useRef<DebouncedFolderLoader | null>(null);

  const [getFolders] = useLazyGetFoldersQuery();

  const loadFolders = useCallback(
    async (search = "") => {
      if (!appId) {
        setOptions([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;
      setIsLoading(true);

      try {
        const data = await getFolders({
          client_id: appId,
          limit: 50,
          offset: 0,
          search,
          sortBy: "name",
          sortDirection: "asc",
        }).unwrap();

        if (latestRequestIdRef.current !== requestId) {
          return;
        }

        setOptions(data.items);
        setError(null);
      } catch (loadError) {
        if (latestRequestIdRef.current !== requestId) {
          return;
        }

        setOptions([]);
        setError("Unable to load folders.");
        console.error("Unable to load folders for moving:", loadError);
      } finally {
        if (latestRequestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [appId, getFolders]
  );

  useEffect(() => {
    const debouncedLoadFolders = debounce((value: string) => {
      void loadFolders(value);
    }, 300);

    debouncedLoadFoldersRef.current = debouncedLoadFolders;

    return () => {
      debouncedLoadFolders.clear();
      if (debouncedLoadFoldersRef.current === debouncedLoadFolders) {
        debouncedLoadFoldersRef.current = null;
      }
    };
  }, [loadFolders]);

  const handleInputChange = (value: string) => {
    const trimmedValue = value.trim();

    setInputValue(value);

    if (!debouncedLoadFoldersRef.current) {
      void loadFolders(trimmedValue);
      return;
    }

    debouncedLoadFoldersRef.current(trimmedValue);
  };

  const reset = () => {
    latestRequestIdRef.current += 1;
    debouncedLoadFoldersRef.current?.clear();
    setSelectedOption(null);
    setOptions([]);
    setInputValue("");
    setIsLoading(false);
    setError(null);
  };

  return {
    selectedOption,
    setSelectedOption,
    options,
    inputValue,
    isLoading,
    error,
    handleInputChange,
    reset,
  };
};
