import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import {
  ComponentType,
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { responseListItems } from "src/shared/api/types";
import { Typography } from "@mui/material";
import styles from "./listElements.module.css";
import { SearchForm } from "./SearchForm";
import { useTranslation } from "react-i18next";

interface IListElementsProps<T, L, P> {
  query: (offset: number, search: string) => L;
  getItems: (
    arg: L,
    preferCacheValue?: boolean
  ) => {
    unwrap: () => Promise<responseListItems<T[]>>;
  };
  RowElement: ComponentType<any>;
  rowElementProps?: Partial<P>;
  customUpdate?: boolean;
  setCustomUpdate?: Dispatch<SetStateAction<boolean>>;
  isSearchActive?: boolean;
  searchFormChildren?: ReactNode;
}

/**
 * ListElementsComponent displays a list of elements with infinite scrolling.
 * @template T - The type of data displayed in the list.
 * @template L - The type of query parameters.
 * @template P - The type of additional props passed to the RowElement component.
 * @param query - Function to create query parameters with pagination.
 * @param getItems - Asynchronous function to fetch list items.
 * @param RowElement - Component for rendering individual list items.
 * @param rowElementProps - Additional props passed to the RowElement component.
 * @param searchFormChildren - Children elements for the search form component.
 * @param pageSize - Number of items to load per page (default: 20).
 * @returns {JSX.Element} The list component with infinite scrolling.
 */
export const ListItems = <T, L, P>({
  query,
  getItems,
  RowElement,
  rowElementProps,
  customUpdate,
  setCustomUpdate,
  isSearchActive = true,
  searchFormChildren,
}: IListElementsProps<T, L, P>) => {
  const { t: translate } = useTranslation();

  const [items, setItems] = useState<T[]>([]);
  const [emptyState, setEmptyState] = useState<boolean>(false);
  const [searchString, setSearchString] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadItems = async (startIndex: number) => {
    if (isLoading) return;

    setIsLoading(true);
    const queryParams = query(startIndex, searchString);
    const data = await getItems(queryParams, false).unwrap();

    if (!data?.totalCount && startIndex === 0) {
      setEmptyState(true);
      setHasMore(false);
    }

    if (data) {
      setItems((prevItems) =>
        startIndex === 0 ? data.items : [...prevItems, ...data.items]
      );
      setHasMore(startIndex + data.items.length < data.totalCount);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadItems(0);
  }, []);

  useEffect(() => {
    if (customUpdate && setCustomUpdate) {
      loadItems(0);
      setEmptyState(false);
      setCustomUpdate(false);
    }
  }, [customUpdate]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadItems(items.length);
        }
      },
      { threshold: 0.1 }
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
    setHasMore(newItems.length < totalCount);
  };

  return (
    <>
      <div className={styles.container}>
        {isSearchActive && (
          <SearchForm<T, L>
            query={query}
            getItems={getItems}
            setSearchString={setSearchString}
            updateItems={updateItems}
          >
            {searchFormChildren}
          </SearchForm>
        )}

        {emptyState ? (
          <Box className={styles.emptyState}>
            <SearchIcon
              className={styles.emptyIcon}
              sx={{ color: "text.secondary" }}
            />
            <Typography className="text-17" color="text.secondary">
              {translate("info.emptySearch")}
            </Typography>
          </Box>
        ) : (
          <div data-id="list-items" className={styles.listContainer}>
            {items.map((item, index) => (
              <RowElement
                key={index}
                items={items}
                index={index}
                updateItems={updateItems}
                {...rowElementProps}
              />
            ))}
            {hasMore && (
              <div ref={observerTarget} className={styles.loadingTrigger}>
                {isLoading && (
                  <Typography className="text-14" color="text.secondary">
                    {translate("helperText.loading")}
                  </Typography>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
