import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {Box, debounce, InputBase} from "@mui/material";
import clsx from "clsx";
import {
  type ChangeEvent,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {useSearchHistory} from "../hooks/useSearchHistory";
import type {ListItemsQuery} from "./ListItems";
import {SearchHistoryDropdown} from "./SearchHistoryDropdown";
import type {SearchHistoryLabels} from "./SearchHistoryDropdown";
import styles from "./SearchForm.module.css";

export interface SearchFormLabels {
  placeholder: string;
  ariaLabel?: string;
  history?: SearchHistoryLabels;
}

export interface SearchFormProps<T, L> {
  setSearchString: Dispatch<SetStateAction<string>>;
  query: (
    offset: number,
    search: string,
    selectedFilterKey?: string | null,
  ) => L;
  getItems: ListItemsQuery<T, L>;
  updateItems: (items: T[], totalCount: number) => void;
  labels: SearchFormLabels;
  children?: ReactNode;
  dataTestId?: string;
  searchContext?: string;
  isStatic?: boolean;
  belowContent?: ReactNode;
  selectedFilterKey?: string | null;
}

/** Displays a debounced search field with optional local search history. */
export const SearchForm = <T, L>(
  {
    setSearchString,
    query,
    getItems,
    updateItems,
    labels,
    children,
    dataTestId,
    searchContext,
    isStatic = false,
    belowContent,
    selectedFilterKey,
  }: SearchFormProps<T, L>) => {
  const [active, setActive] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyEnabled = Boolean(searchContext && labels.history);
  const {history, addToHistory, removeFromHistory, clearHistory} =
    useSearchHistory(historyEnabled ? (searchContext ?? "") : "");

  const onSearch = useCallback(
    async (value: string) => {
      setSearchString(value);
      const queryParams = query(0, value, selectedFilterKey);
      const data = await getItems(queryParams).unwrap();

      if (data) {
        updateItems(data.items, data.totalCount);
      }

      if (historyEnabled && value.trim()) {
        addToHistory(value);
      }
    },
    [
      addToHistory,
      getItems,
      historyEnabled,
      query,
      selectedFilterKey,
      setSearchString,
      updateItems,
    ],
  );

  const onSearchDebounce = useMemo(
    () =>
      debounce((value: string) => {
        void onSearch(value);
      }, 200),
    [onSearch],
  );

  useEffect(() => {
    return () => {
      onSearchDebounce.clear();
    };
  }, [onSearchDebounce]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trimStart();
    setSearchValue(value);
    onSearchDebounce(value);
  };

  const handleHistorySelect = (value: string) => {
    onSearchDebounce.clear();
    setSearchValue(value);
    setDropdownVisible(false);
    void onSearch(value);
  };

  const handleClearSearch = () => {
    onSearchDebounce.clear();
    setSearchValue("");
    setDropdownVisible(historyEnabled);
    void onSearch("");
  };

  const handleClearHistory = () => {
    clearHistory();
    setDropdownVisible(false);
  };

  const handleSearchBoxClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    if (target.closest("[data-search-history-dropdown='true']")) {
      return;
    }

    inputRef.current?.focus();
    setActive(true);
    setDropdownVisible(historyEnabled);
  };

  const shouldShowDropdown =
    historyEnabled &&
    dropdownVisible &&
    history.length > 0 &&
    searchValue.length < 2;

  return (
    <Box
      className={clsx(
        styles.searchWrapper,
        !isStatic && styles.searchWrapperSticky,
      )}
      ref={wrapperRef}
    >
      <Box className={styles.searchHeader}>
        <Box
          className={clsx(styles.search, active && styles.searchActive)}
          sx={(theme) => ({
            borderRadius: theme.encvoy.componentBorderRadius,
          })}
          onClick={handleSearchBoxClick}
        >
          <SearchIcon
            className={styles.searchIcon}
            sx={{color: "text.secondary"}}
          />
          <InputBase
            inputRef={inputRef}
            className={styles.searchInputWrapper}
            onBlur={() => setActive(false)}
            onFocus={() => {
              setActive(true);
              setDropdownVisible(historyEnabled);
            }}
            onChange={handleSearch}
            value={searchValue}
            classes={{input: clsx("text-14", styles.searchInput)}}
            placeholder={labels.placeholder}
            inputProps={{
              "aria-label": labels.ariaLabel ?? labels.placeholder,
              "data-test-id": dataTestId,
            }}
          />
          {searchValue && (
            <CloseOutlinedIcon
              data-id="close-search-button"
              className={styles.closeIcon}
              onClick={handleClearSearch}
            />
          )}
          {shouldShowDropdown && labels.history && (
            <SearchHistoryDropdown
              history={history}
              labels={labels.history}
              onSelect={handleHistorySelect}
              onRemove={removeFromHistory}
              onClear={handleClearHistory}
            />
          )}
        </Box>
        {children}
      </Box>
      {belowContent ? (
        <Box className={styles.searchBelow}>{belowContent}</Box>
      ) : null}
    </Box>
  );
};
