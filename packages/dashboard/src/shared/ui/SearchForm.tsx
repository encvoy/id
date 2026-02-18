import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { Box, debounce, InputBase } from "@mui/material";
import clsx from "clsx";
import {
  ChangeEvent,
  Dispatch,
  ReactNode,
  SetStateAction,
  useMemo,
  useState,
} from "react";
import { responseListItems } from "src/shared/api/types";
import styles from "./SearchForm.module.css";
import { useTranslation } from "react-i18next";
import { componentBorderRadius } from "src/shared/theme/Theme";

interface SearchFormProps<T, L> {
  setSearchString: Dispatch<SetStateAction<string>>;
  query: (offset: number, search: string) => L;
  getItems: (
    arg: L,
    preferCacheValue?: boolean
  ) => {
    unwrap: () => Promise<responseListItems<T[]>>;
  };
  updateItems: (items: T[], totalCount: number) => void;
  children?: ReactNode;
}

/**
 * SearchForm component displays a search field with search icon and clear button.
 * @template T - The type of data items.
 * @template L - The type of query parameters.
 * @param setSearchString - Function to manage the search string state (useState).
 * @param query - Function to create query parameters.
 * @param getItems - Function to fetch items.
 * @param updateItems - Function to update items.
 * @param children - Children to display next to the search field.
 * @returns {JSX.Element} The search form component and additional controls.
 */
export const SearchForm = <T, L>({
  setSearchString,
  query,
  getItems,
  updateItems,
  children,
}: SearchFormProps<T, L>) => {
  const { t: translate } = useTranslation();
  const [active, setActive] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const onSearch = async (value: string) => {
    setSearchString(value);
    const queryParams = query(0, value);
    const data = await getItems(queryParams).unwrap();

    if (data) {
      updateItems(data.items, data.totalCount);
    }
  };

  const onSearchDebounce = useMemo(
    () => debounce((value: string) => onSearch(value), 200),
    [onSearch]
  );

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trimStart();
    setSearchValue(value);
    onSearchDebounce(value);
  };

  return (
    <div data-id="search-form" className={styles.searchWrapper}>
      <Box
        className={clsx(styles.search, active && styles.searchActive)}
        sx={{ borderRadius: componentBorderRadius }}
      >
        <SearchIcon
          className={styles.searchIcon}
          sx={{ color: "text.secondary" }}
        />
        <InputBase
          className={styles.searchInputWrapper}
          onBlur={() => setActive(false)}
          onFocus={() => setActive(true)}
          onChange={handleSearch}
          value={searchValue}
          classes={{ input: clsx("text-14", styles.searchInput) }}
          placeholder={translate("helperText.search")}
          inputProps={{ "aria-label": "search" }}
        />
        {searchValue && (
          <CloseOutlinedIcon
            data-id="close-search-button"
            className={styles.closeIcon}
            onClick={() => {
              setSearchValue("");
              onSearch("");
            }}
          />
        )}
      </Box>
      {children}
    </div>
  );
};
