import clsx from "clsx";
import { useFormContext } from "react-hook-form";
import ColorPicker from "./ColorPicker";
import styles from "./WidgetColor.module.css";
import { useTranslation } from "react-i18next";
import { IClientFull } from "src/shared/api/clients";
import Typography from "@mui/material/Typography";

export const WidgetColor = () => {
  const { t: translate } = useTranslation();
  const {
    formState: { errors },
  } = useFormContext<IClientFull>();

  return (
    <div className={styles.widgetColor}>
      <div className={styles.colorPicker}>
        <Typography className={clsx("text-14", styles.colorTitle)}>
          {translate("pages.widget.buttonColor")}
        </Typography>
        <ColorPicker colorName="button_color" />
        {errors.widget_colors?.button_color && (
          <Typography color="custom.error" className="text-14">
            {errors.widget_colors?.button_color.message}
          </Typography>
        )}
      </div>
      <div className={styles.colorPicker}>
        <Typography className={clsx("text-14", styles.colorTitle)}>
          {translate("pages.widget.fontColor")}
        </Typography>
        <ColorPicker colorName="font_color" />
        {errors.widget_colors?.font_color && (
          <Typography color="custom.error" className="text-14">
            {errors.widget_colors?.font_color.message}
          </Typography>
        )}
      </div>
    </div>
  );
};
