import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { FC } from "react";
import styles from "./ProviderItem.module.css";
import { ProviderItemBase, ProviderItemCommonProps } from "./ProviderItemBase";

export const SortableProviderItem: FC<ProviderItemCommonProps> = (props) => {
  const { provider } = props;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({ id: provider.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ProviderItemBase
      {...props}
      maxQuantity={props.maxQuantity ?? 0}
      rootRef={setNodeRef}
      rootStyle={style}
      shouldRestrictClickToEditableType
      dragHandle={
        <DragIndicatorIcon
          sx={{ color: "grey.500", cursor: "grab" }}
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        />
      }
    />
  );
};
