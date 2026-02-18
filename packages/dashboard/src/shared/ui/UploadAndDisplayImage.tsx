import AddIcon from "@mui/icons-material/Add";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { SvgIconProps } from "@mui/material/SvgIcon";
import clsx from "clsx";
import {
  ChangeEvent,
  ElementType,
  FC,
  SyntheticEvent,
  useRef,
  useState,
} from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import ReactCrop, {
  centerCrop,
  Crop,
  makeAspectCrop,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { CustomIcon } from "src/shared/ui/components/CustomIcon";
import { ModalInfo } from "src/shared/ui/modal/ModalInfo";
import { SubmitModal } from "src/shared/ui/modal/SubmitModal";
import { getImageURL, toBase64 } from "src/shared/utils/helpers";
import styles from "./UploadAndDisplayImage.module.css";

interface IUploadAndDisplayImageProps {
  title: string;
  defaultIcon?: ElementType<SvgIconProps>;
  nameFieldForm?: string;
  maxImageSize?: number;
  defaultIconSrc?: string;
  disabled?: boolean;
  onAvailableClick?: () => void;
  aspect?: number;
  figure?: "square" | "circle" | "rectangle";
  disabledDeleted?: boolean;
  required?: boolean;
}

/**
 * UploadAndDisplayImage component displays an image upload interface with cropping functionality.
 * @param title - The title displayed above the image upload component
 * @param defaultIcon - The default icon component to display when no image is selected
 * @param nameFieldForm - The name of the form field for react-hook-form integration
 * @param maxImageSize - The maximum allowed image size in MB
 * @param defaultIconSrc - The source URL for the default icon image
 * @param disabled - Whether the upload functionality is disabled
 * @param onAvailableClick - Callback function when the available button is clicked
 * @param aspect - The aspect ratio for image cropping
 * @param figure - The shape of the image display
 * @param disabledDeleted - Whether the delete button is disabled
 * @param required - Whether the image upload is required
 */
export const UploadAndDisplayImage: FC<IUploadAndDisplayImageProps> = ({
  title,
  defaultIcon,
  defaultIconSrc,
  disabled,
  maxImageSize = 1,
  onAvailableClick,
  nameFieldForm = "avatar",
  aspect = 1 / 1,
  figure = "square",
  disabledDeleted,
  required,
}) => {
  const {
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useFormContext();
  const { t: translate } = useTranslation();
  const avatar = watch(nameFieldForm) || undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpenCropModal, setIsOpenCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [openLoadImageModal, setIsOpenLoadImageModal] = useState(false);
  const [cropImageFile, setCropImageFile] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const getImageSrc = (avatar?: File | string) => {
    if (!avatar) {
      return typeof defaultIcon === "string" ? getImageURL(defaultIconSrc) : "";
    }
    return avatar instanceof File
      ? URL.createObjectURL(avatar)
      : getImageURL(avatar);
  };

  const handleOpenFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      clearErrors(nameFieldForm);
      return;
    }

    if (
      !["jpeg", "png", "jpg", "bmp", "webp"].find(
        (imageType) => `image/${imageType}` === file.type
      )
    ) {
      setError(nameFieldForm, {
        message: translate("errors.invalidImageFormat"),
      });
      return;
    }

    if (file.size / 1024 / 1024 > maxImageSize) {
      setError(nameFieldForm, {
        message: translate("errors.imageSizeExceeded", {
          maxSize: maxImageSize,
        }),
      });
      return;
    }

    const src = await toBase64(file);
    setImageSrc(src);
    setIsOpenLoadImageModal(false);
    setIsOpenCropModal(true);
  };

  //crop on center
  const centerAspectCrop = (
    mediaWidth: number,
    mediaHeight: number,
    aspect: number
  ) => {
    return centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    );
  };

  const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCropImageFile(centerAspectCrop(width, height, aspect));
    }
  };

  const getCroppedFile = async (
    img: HTMLImageElement,
    crop: PixelCrop
  ): Promise<File | null> => {
    if (!crop?.width || !crop?.height) return null;

    const canvas = document.createElement("canvas");
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const sx = crop.x * scaleX;
    const sy = crop.y * scaleY;
    const sw = crop.width * scaleX;
    const sh = crop.height * scaleY;

    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    return await new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const file = new File([blob], "image_crop.webp", {
          type: blob.type || "image/webp",
        });
        resolve(file);
      }, "image/webp");
    });
  };

  async function saveCropImage() {
    if (!imgRef.current || !completedCrop) {
      setIsOpenCropModal(false);
      return;
    }

    const file = await getCroppedFile(imgRef.current, completedCrop);
    if (file) {
      setValue(nameFieldForm, file, { shouldDirty: true });
    }
    setIsOpenCropModal(false);
  }

  return (
    <>
      <Typography
        className={clsx(
          "text-14",
          styles.title,
          required ? styles.asterisk : "",
          styles.inputLabel
        )}
      >
        {title}
      </Typography>
      <div className={styles.container}>
        <Avatar
          className={clsx(
            styles.avatar,
            figure === "circle"
              ? styles.avatarCircle
              : figure === "rectangle"
              ? styles.avatarRectangle
              : ""
          )}
          src={getImageSrc(avatar)}
        >
          {defaultIcon && (
            <CustomIcon
              Icon={defaultIcon}
              color="textSecondary"
              sx={{ width: "35px", height: "35px" }}
            />
          )}
        </Avatar>
        <Button
          onClick={() => {
            setValue(nameFieldForm, defaultIconSrc ? defaultIconSrc : null, {
              shouldDirty: true,
            });
          }}
          color="secondary"
          variant="contained"
          disabled={disabledDeleted || !avatar}
        >
          {translate("actionButtons.delete")}
        </Button>
        <Button
          variant="contained"
          disabled={disabled}
          onClick={() => {
            setIsOpenLoadImageModal(true);
          }}
        >
          {translate("actionButtons.upload")}
        </Button>
        {onAvailableClick && (
          <Button
            variant="contained"
            color="secondary"
            onClick={onAvailableClick}
          >
            {translate("actionButtons.available")}
          </Button>
        )}

        <ModalInfo
          isOpen={openLoadImageModal}
          onClose={() => {
            setIsOpenLoadImageModal(false);
          }}
          title={translate("modals.uploadImage.title")}
        >
          <Typography className="text-14">
            {translate("modals.uploadImage.description")}
          </Typography>
          <Button className={styles.uploadButton} component="label">
            <CustomIcon Icon={AddIcon} color="primaryMain" />
            <Typography color="custom.accent">
              {translate("modals.uploadImage.uploadButton")}
            </Typography>
            <Typography className="text-14" color="text.secondary">
              {translate("modals.uploadImage.formatInfo")}
            </Typography>
            <Typography className="text-14" color="text.secondary">
              {translate("modals.uploadImage.maxSizeInfo", {
                maxSize: maxImageSize,
              })}
            </Typography>
            <input
              type="file"
              hidden
              onChange={handleOpenFile}
              ref={inputRef}
              accept="image/jpeg, image/png, image/jpg, image/bmp, image/webp"
            />
          </Button>
          {errors[nameFieldForm] && (
            <Typography color="custom.error" className="text-14">
              {errors[nameFieldForm]?.message as string}
            </Typography>
          )}
        </ModalInfo>

        <SubmitModal
          title={translate("modals.editImage.title")}
          isOpen={isOpenCropModal}
          onSubmit={saveCropImage}
          onClose={() => setIsOpenCropModal(false)}
          mainMessage={[translate("modals.editImage.description")]}
          actionButtonText={translate("actionButtons.apply")}
        >
          <div className={styles.modalCropContent}>
            <ReactCrop
              className={styles.cropContainer}
              crop={cropImageFile}
              onChange={(image) => setCropImageFile(image)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              keepSelection={true}
              circularCrop={figure === "circle"}
            >
              <img
                ref={imgRef}
                alt="crop image"
                src={imageSrc}
                style={{
                  objectFit: "contain",
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>
        </SubmitModal>
      </div>
    </>
  );
};
