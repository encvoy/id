import { useFormContext } from "react-hook-form";
import styles from "./WidgetColor.module.css";
import { useTranslation } from "react-i18next";
import { IClientFull } from "src/shared/api/clients";
import { ColorPicker } from "@encvoy-id/components";

export const WidgetColor = () => {
  const { t: translate } = useTranslation();
  const {
    formState: { errors },
  } = useFormContext<IClientFull>();

  return (
    <div className={styles.widgetColor}>
      <div className={styles.colorPicker}>
        <ColorPicker
          name="widget_colors.button_color"
          label={translate("pages.widget.buttonColor")}
          error={errors.widget_colors?.button_color?.message}
          dataTestId="txt-settings-login-method-button-background-color"
        />
      </div>
      <div className={styles.colorPicker}>
        <ColorPicker
          name="widget_colors.font_color"
          label={translate("pages.widget.fontColor")}
          error={errors.widget_colors?.font_color?.message}
          dataTestId="txt-settings-login-method-button-font-color"
        />
      </div>
    </div>
  );
};
