import { yupResolver } from "@hookform/resolvers/yup";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { InputField } from "src/shared/ui/components/InputBlock";
import * as yup from "yup";
import {
  IClientType,
  useCreateClientTypeMutation,
  useUpdateClientTypeMutation,
} from "src/shared/api/settings";
import { SidePanel } from "src/shared/ui/sidePanel/SidePanel";
import styles from "./EditTypePanel.module.css";

interface IEditClientTypeProps {
  isOpen: boolean;
  onClose: () => void;
  type?: IClientType;
}

export const EditTypePanel: FC<IEditClientTypeProps> = ({
  isOpen,
  onClose,
  type,
}) => {
  const { t: translate } = useTranslation();
  const [createClientType] = useCreateClientTypeMutation();
  const [updateClientType] = useUpdateClientTypeMutation();

  const schema = yup.object({
    name: yup.string().required(translate("errors.requiredField")),
  });

  const methods = useForm<{ name: string }>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: type?.name || "",
    },
    mode: "onChange",
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const onSubmit: SubmitHandler<{ name: string }> = async (data) => {
    if (Object.keys(errors).length) return;

    if (type) {
      await updateClientType({
        id: type.id,
        body: { name: data.name },
      }).unwrap();
    } else {
      await createClientType({ name: data.name }).unwrap();
    }
    onClose();
  };

  const headerText = type
    ? translate("panel.types.edit.editTitle")
    : translate("panel.types.edit.createTitle");

  return (
    <>
      <SidePanel
        onClose={onClose}
        isOpen={isOpen}
        title={headerText}
        onSubmit={handleSubmit(onSubmit)}
        isNoBackdrop
      >
        <div className={styles.wrapper}>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <InputField
                label={translate("panel.types.edit.nameLabel")}
                name="name"
                description={translate("panel.types.edit.nameDescription")}
              />
            </form>
          </FormProvider>
        </div>
      </SidePanel>
    </>
  );
};
