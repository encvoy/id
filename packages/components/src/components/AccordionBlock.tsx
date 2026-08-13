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
import { SurfaceBlock } from "./SurfaceBlock";

export interface AccordionBlockProps {
  title?: string;
  titleBlock?: ReactNode;
  onClick?: () => void;
  children?: ReactNode;
  isOpen?: boolean;
  mode?: "default" | "compact";
  dataTestId?: string;
  dataTestIdCompact?: string;
  dataTestIdButton?: string;
  configureText?: string;
}

const AccordionBlockComponent: FC<AccordionBlockProps> = ({
  title,
  titleBlock,
  onClick,
  children,
  isOpen = false,
  mode = "default",
  dataTestId,
  dataTestIdCompact,
  dataTestIdButton,
  configureText = "Configure",
}) => {
  if (mode === "compact") {
    return (
      <SurfaceBlock>
        <div className={styles.accordionSummary}>
          <div className={styles.accordionContentCompact}>
            <Typography className="text-20-medium">{title}</Typography>
            {onClick && (
              <Button
                data-test-id={dataTestIdCompact}
                variant="text"
                onClick={() => onClick()}
              >
                {configureText}
              </Button>
            )}
          </div>
        </div>
      </SurfaceBlock>
    );
  }

  return (
    <SurfaceBlock>
      <Accordion defaultExpanded={isOpen}>
        <AccordionSummary
          data-test-id={dataTestId}
          className={styles.accordionSummary}
          classes={{ content: styles.accordionSummaryContent }}
          expandIcon={<CustomIcon Icon={KeyboardArrowDownOutlinedIcon} />}
        >
          {title && <Typography className="text-20-medium">{title}</Typography>}
          {titleBlock}
        </AccordionSummary>
        <AccordionDetails className={styles.accordionDetails}>
          {onClick && (
            <Button
              data-test-id={dataTestIdButton}
              variant="contained"
              className={styles.button}
              onClick={() => onClick()}
            >
              {configureText}
            </Button>
          )}
          {children}
        </AccordionDetails>
      </Accordion>
    </SurfaceBlock>
  );
};

export const AccordionBlock = memo(AccordionBlockComponent);
