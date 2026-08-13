import { Paper, Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListItems } from "../src";
import type { ListItemsLabels } from "../src";

interface DemoItem {
  id: number;
  name: string;
  status: "active" | "disabled";
}

interface DemoQuery {
  offset: number;
  search: string;
  filter: string | null;
}

interface DemoRowProps {
  items: DemoItem[];
  index: number;
}

const items: DemoItem[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: `Example item ${index + 1}`,
  status: index % 3 === 0 ? "disabled" : "active",
}));

const labels: ListItemsLabels = {
  empty: "Nothing found",
  loading: "Loading…",
  search: {
    placeholder: "Search",
    ariaLabel: "Search list items",
    history: {
      title: "Recent searches",
      clearAll: "Clear all",
    },
  },
};

const query = (
  offset: number,
  search: string,
  selectedFilterKey?: string | null,
): DemoQuery => ({
  offset,
  search,
  filter: selectedFilterKey ?? null,
});

const createGetItems = (source: DemoItem[]) => (request: DemoQuery) => ({
  unwrap: async () => {
    await new Promise((resolve) => setTimeout(resolve, 250));

    const normalizedSearch = request.search.trim().toLowerCase();
    const filteredItems = source.filter(
      (item) =>
        (!normalizedSearch ||
          item.name.toLowerCase().includes(normalizedSearch)) &&
        (!request.filter ||
          request.filter === "all" ||
          item.status === request.filter),
    );

    return {
      items: filteredItems.slice(request.offset, request.offset + 4),
      totalCount: filteredItems.length,
    };
  },
});

const DemoRow = ({ items: rowItems, index }: DemoRowProps) => {
  const item = rowItems[index];

  return (
    <Paper variant="outlined" sx={{ padding: 2 }}>
      <Stack direction="row" justifyContent="space-between">
        <Typography>{item.name}</Typography>
        <Typography color="text.secondary">{item.status}</Typography>
      </Stack>
    </Paper>
  );
};

const meta = {
  title: "Components/ListItems",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHistoryAndFilters: Story = {
  render: () => (
    <ListItems<DemoItem, DemoQuery, DemoRowProps>
      query={query}
      getItems={createGetItems(items)}
      RowElement={DemoRow}
      labels={labels}
      searchContext="storybook-list-items"
      isSearchStatic
      filters={{
        defaultSelectedKey: "all",
        options: [
          { key: "all", label: "All" },
          { key: "active", label: "Active", color: "success" },
          { key: "disabled", label: "Disabled", color: "warning" },
        ],
      }}
    />
  ),
};

export const WithoutHistory: Story = {
  render: () => (
    <ListItems<DemoItem, DemoQuery, DemoRowProps>
      query={query}
      getItems={createGetItems(items.slice(0, 4))}
      RowElement={DemoRow}
      labels={{
        ...labels,
        search: {
          placeholder: "Search without history",
        },
      }}
      isSearchStatic
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <ListItems<DemoItem, DemoQuery, DemoRowProps>
      query={query}
      getItems={createGetItems([])}
      RowElement={DemoRow}
      labels={labels}
      isSearchActive={false}
    />
  ),
};
