import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Typography,
} from "@mui/material";
import { FC, memo, ReactNode } from "react";
import { CustomIcon } from "./CustomIcon";
import styles from "./AccordionBlock.module.css";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import { componentBorderRadius } from "src/shared/theme/Theme";

export interface ISettingsItemProps {
  title?: string;
  titleBlock?: ReactNode;
  onClick?: () => void;
  children?: ReactNode;
  isOpen?: boolean;
  mode?: "default" | "compact";
}

const AccordionBlockComponent: FC<ISettingsItemProps> = ({
  title,
  titleBlock,
  onClick,
  children,
  isOpen = false,
  mode = "default",
}) => {
  const { t: translate } = useTranslation();

  if (mode === "compact") {
    return (
      <Box
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: componentBorderRadius,
        }}
      >
        <div className={styles.accordionSummary}>
          <div className={styles.accordionContentCompact}>
            <Typography className="text-17">{title}</Typography>
            {onClick && (
              <Button variant="text" onClick={() => onClick()}>
                {translate("actionButtons.configure")}
              </Button>
            )}
          </div>
        </div>
      </Box>
    );
  }

  return (
    <Accordion defaultExpanded={isOpen} className={styles.accordion}>
      <AccordionSummary
        className={styles.accordionSummary}
        classes={{ content: styles.accordionSummaryContent }}
        expandIcon={<CustomIcon Icon={KeyboardArrowDownOutlinedIcon} />}
      >
        {title && <Typography className="text-17">{title}</Typography>}
        {titleBlock}
      </AccordionSummary>
      <AccordionDetails className={styles.accordionDetails}>
        {onClick && (
          <Button
            variant="text"
            className={styles.button}
            onClick={() => onClick()}
          >
            {translate("actionButtons.configure")}
          </Button>
        )}
        {children}
      </AccordionDetails>
    </Accordion>
  );
};

export const AccordionBlock = memo(AccordionBlockComponent);
