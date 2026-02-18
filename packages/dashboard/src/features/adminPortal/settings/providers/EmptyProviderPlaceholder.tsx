import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Typography } from "@mui/material";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import styles from "./ListProvidersPanel.module.css";

interface EmptyProviderPlaceholderProps {
  id: string;
  groupe: "BIG" | "SMALL";
}

export const EmptyProviderPlaceholder: FC<EmptyProviderPlaceholderProps> = ({
  id,
}) => {
  const { t: translate } = useTranslation();
  const { setNodeRef, transform, transition, isOver } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      className={styles.emptyPlaceholder}
      data-is-over={isOver}
    >
      <div className={styles.emptyPlaceholderContent}>
        <Typography color="text.secondary" className="text-14">
          {translate("pages.widget.emptyGroup")}
        </Typography>
      </div>
    </Box>
  );
};
