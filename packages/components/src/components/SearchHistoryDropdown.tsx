import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import {
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./SearchHistoryDropdown.module.css";

export interface SearchHistoryLabels {
  title: ReactNode;
  clearAll: ReactNode;
}

interface SearchHistoryDropdownProps {
  history: string[];
  labels: SearchHistoryLabels;
  onSelect: (value: string) => void;
  onRemove: (value: string) => void;
  onClear: () => void;
}

export const SearchHistoryDropdown = ({
  history,
  labels,
  onSelect,
  onRemove,
  onClear,
}: SearchHistoryDropdownProps) => {
  if (!history.length) {
    return null;
  }

  return (
    <Paper
      className={styles.dropdown}
      elevation={4}
      data-search-history-dropdown="true"
    >
      <div className={styles.dropdownHeader}>
        <Typography variant="caption" color="text.secondary">
          {labels.title}
        </Typography>
        <Button size="small" onClick={onClear} className={styles.clearButton}>
          {labels.clearAll}
        </Button>
      </div>
      <List dense disablePadding>
        {history.map((item) => (
          <ListItem
            key={item}
            disablePadding
            secondaryAction={
              <IconButton
                edge="end"
                size="small"
                className={styles.removeButton}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(item);
                }}
              >
                <CloseOutlinedIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemButton
              className={styles.dropdownItem}
              onClick={() => onSelect(item)}
            >
              <HistoryOutlinedIcon
                fontSize="small"
                className={styles.historyIcon}
              />
              <ListItemText
                primary={item}
                primaryTypographyProps={{
                  className: clsx("text-14", styles.itemText),
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
