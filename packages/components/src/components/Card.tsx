import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import Avatar from "@mui/material/Avatar";
import { SvgIconProps } from "@mui/material/SvgIcon";
import clsx from "clsx";
import { ElementType, FC, ReactNode } from "react";
import { CustomIcon } from "./CustomIcon";
import styles from "./Card.module.css";
import { SurfaceBlock } from "./SurfaceBlock";

export interface CardProps {
  content: ReactNode;
  cardId?: string;
  dataTestId?: string;
  isImage?: boolean;
  avatarUrl?: string;
  className?: string;
  DefaultIcon?: ElementType<SvgIconProps>;
  iconColor?: string;
  onClick?: () => void;
  figure?: "circle" | "square";
}

export type ICardProps = CardProps;

/**
 * CardComponent displays a card with content and avatar.
 * @param content - The content to be displayed inside the card.
 * @param cardId - The unique identifier for the card.
 * @param isImage - Flag indicating whether to display the image.
 * @param avatarUrl - The URL of the avatar to be displayed in the card. If null, the default avatar is displayed.
 * @param className - The CSS class for the card.
 * @param DefaultIcon - The default icon component to display when no avatar is provided.
 * @param iconColor
 * @param onClick - The function to be called when the card is clicked.
 * @param figure - The shape of the avatar image, either 'circle' or 'square'.
 */
export const Card: FC<CardProps> = ({
  content,
  cardId,
  dataTestId,
  isImage,
  avatarUrl,
  className,
  DefaultIcon,
  iconColor,
  onClick,
  figure = "square",
}: CardProps) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <SurfaceBlock
      data-id={`card-${cardId}`}
      data-test-id={dataTestId}
      onClick={handleClick}
      className={clsx(styles.card, className, onClick && styles.cardAction)}
    >
      {isImage && (
        <div className={styles.cardImageWrapper}>
          <div
            className={clsx(
              styles.cardImage,
              figure === "circle"
                ? styles.cardImageCircle
                : styles.cardImageSquare
            )}
          >
            {avatarUrl ? (
              <Avatar
                src={avatarUrl}
                className={styles.avatar}
                imgProps={{ loading: "lazy" }}
              />
            ) : (
              <CustomIcon
                colorHex={iconColor}
                Icon={DefaultIcon ?? PersonOutlineOutlinedIcon}
                color={iconColor ? "custom" : "textSecondary"}
              />
            )}
          </div>
        </div>
      )}
      {content}
    </SurfaceBlock>
  );
};
