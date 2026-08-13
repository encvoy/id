import SearchIcon from "@mui/icons-material/Search";
import type {SvgIconProps} from "@mui/material";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import type {ChipProps} from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import {
  type ComponentType,
  type Dispatch,
  type ElementType,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import {SearchForm} from "./SearchForm";
import type {SearchFormLabels} from "./SearchForm";

export interface ListItemsFilterOption {
  key: string;
  label: string;
  color?: ChipProps["color"];
  disabled?: boolean;
  dataTestId?: string;
  icon?: ElementType<SvgIconProps>;
}

export interface ListItemsResponse<T> {
  items: T[];
  totalCount: number;
}

export interface ListItemsQueryResult<T> {
  unwrap: () => Promise<ListItemsResponse<T>>;
}

export type ListItemsQuery<T, L> = (
  arg: L,
  preferCacheValue?: boolean,
) => ListItemsQueryResult<T>;

export interface ListItemsFilters {
  options: ListItemsFilterOption[];
  defaultSelectedKey: string;
}

export interface ListItemsLabels {
  empty: ReactNode;
  loading: ReactNode;
  search: SearchFormLabels;
}

export interface ListItemsProps<T, L, P> {
  query: (
    offset: number,
    search: string,
    selectedFilterKey?: string | null,
  ) => L;
  getItems: ListItemsQuery<T, L>;
  RowElement: ComponentType<any>;
  labels: ListItemsLabels;
  rowElementProps?: Partial<P>;
  customUpdate?: boolean;
  setCustomUpdate?: Dispatch<SetStateAction<boolean>>;
  isSearchActive?: boolean;
  isSearchStatic?: boolean;
  searchFormChildren?: ReactNode;
  searchDataTestId?: string;
  searchContext?: string;
  filters?: ListItemsFilters;
}

/** Displays a searchable, filterable list with incremental loading. */
export const ListItems = <T, L, P>({
                                     query,
                                     getItems,
                                     RowElement,
                                     labels,
                                     rowElementProps,
                                     customUpdate,
                                     setCustomUpdate,
                                     isSearchActive = true,
                                     isSearchStatic = false,
                                     searchFormChildren,
                                     searchDataTestId,
                                     searchContext,
                                     filters,
                                   }: ListItemsProps<T, L, P>) => {
  const [items, setItems] = useState<T[]>([]);
  const [emptyState, setEmptyState] = useState(false);
  const [searchString, setSearchString] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedFilterKey, setSelectedFilterKey] = useState<string | null>(
    filters?.defaultSelectedKey ?? null,
  );
  const observerTarget = useRef<HTMLDivElement>(null);
  const isInitialFilterRender = useRef(true);
  const isLoadingRef = useRef(false);
  const pendingReloadRef = useRef<{
    searchString: string;
    selectedFilterKey: string | null;
  } | null>(null);

  const loadItems = async (
    startIndex: number,
    nextSearchString = searchString,
    nextSelectedFilterKey = selectedFilterKey,
  ) => {
    if (isLoadingRef.current) {
      if (startIndex === 0) {
        pendingReloadRef.current = {
          searchString: nextSearchString,
          selectedFilterKey: nextSelectedFilterKey ?? null,
        };
      }

      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const queryParams = query(
        startIndex,
        nextSearchString,
        nextSelectedFilterKey,
      );
      const data = await getItems(queryParams, false).unwrap();

      if (!data?.totalCount && startIndex === 0) {
        setItems([]);
        setEmptyState(true);
        setHasMore(false);
      }

      if (data) {
        const hasItems = data.items.length > 0;

        setItems((previousItems) =>
          startIndex === 0 ? data.items : [...previousItems, ...data.items],
        );
        setEmptyState(startIndex === 0 && !hasItems);
        setHasMore(
          hasItems && startIndex + data.items.length < data.totalCount,
        );
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);

      if (pendingReloadRef.current) {
        const pendingReload = pendingReloadRef.current;
        pendingReloadRef.current = null;
        void loadItems(
          0,
          pendingReload.searchString,
          pendingReload.selectedFilterKey,
        );
      }
    }
  };

  useEffect(() => {
    void loadItems(0);
  }, []);

  useEffect(() => {
    if (!filters?.options.length) {
      return;
    }

    const hasSelectedFilter = filters.options.some(
      (filterOption) => filterOption.key === selectedFilterKey,
    );

    if (hasSelectedFilter) {
      return;
    }

    setSelectedFilterKey(filters.defaultSelectedKey);
  }, [filters, selectedFilterKey]);

  useEffect(() => {
    if (customUpdate && setCustomUpdate) {
      void loadItems(0);
      setEmptyState(false);
      setCustomUpdate(false);
    }
  }, [customUpdate]);

  useEffect(() => {
    if (!filters?.options.length) {
      return;
    }

    if (isInitialFilterRender.current) {
      isInitialFilterRender.current = false;
      return;
    }

    setEmptyState(false);
    setHasMore(true);
    void loadItems(0, searchString, selectedFilterKey);
  }, [filters?.options.length, selectedFilterKey]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          void loadItems(items.length);
        }
      },
      {threshold: 0.1},
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [items.length, hasMore, isLoading, searchString]);

  const updateItems = (newItems: T[], totalCount: number) => {
    setItems(newItems);
    setEmptyState(totalCount === 0);
    setHasMore(newItems.length > 0 && newItems.length < totalCount);
  };

  const filterControls = filters?.options.length ? (
    <Box sx={{display: "flex", flexWrap: "wrap", gap: "8px"}}>
      {filters.options.map((filterOption) => (
        <Chip
          key={filterOption.key}
          color={filterOption.color}
          disabled={filterOption.disabled}
          label={filterOption.label}
          {...(filterOption.dataTestId
            ? {
              "data-test-id": filterOption.dataTestId,
            }
            : {})}
          {...(!filterOption.disabled
            ? {
              clickable: true,
              onClick: () => {
                setSelectedFilterKey(
                  filterOption.key === "all" ? null : filterOption.key,
                );
              },
            }
            : {})}
          icon={
            filterOption.icon ? (
              <filterOption.icon
                color={
                  filterOption.color === "default"
                    ? "action"
                    : filterOption.color
                }
              />
            ) : undefined
          }
          variant={
            selectedFilterKey === filterOption.key ? "filled" : "outlined"
          }
        />
      ))}
    </Box>
  ) : null;

  return (
    <Box sx={{display: "flex", flexDirection: "column"}}>
      {isSearchActive && (
        <SearchForm<T, L>
          query={query}
          getItems={getItems}
          setSearchString={setSearchString}
          updateItems={updateItems}
          labels={labels.search}
          dataTestId={searchDataTestId || "txt-search-info"}
          searchContext={searchContext}
          isStatic={isSearchStatic}
          belowContent={filterControls}
          selectedFilterKey={selectedFilterKey}
        >
          {searchFormChildren}
        </SearchForm>
      )}

      {emptyState ? (
        <Box
          sx={{
            position: "relative",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            textAlign: "center",
          }}
        >
          <SearchIcon
            sx={{
              display: "block",
              margin: "0 auto",
              width: "160px",
              height: "160px",
              color: "text.secondary",
            }}
          />
          <Typography className="text-17" color="text.secondary">
            {labels.empty}
          </Typography>
        </Box>
      ) : (
        <Box
          data-id="list-items"
          sx={{display: "flex", flexDirection: "column", gap: "16px"}}
        >
          {Array.from(items.keys(), (index) => (
            <RowElement
              key={index}
              items={items}
              index={index}
              updateItems={updateItems}
              {...rowElementProps}
              selectedFilterKey={selectedFilterKey}
            />
          ))}
          {hasMore && (
            <Box
              ref={observerTarget}
              sx={{padding: "20px", textAlign: "center", minHeight: "60px"}}
            >
              {isLoading && (
                <Typography className="text-14" color="text.secondary">
                  {labels.loading}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
