import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { Button, Switch, Typography } from "@mui/material";
import ListItem from "@mui/material/ListItem";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconsLibrary } from "@encvoy-id/components";
import { IconWithTooltip } from "@encvoy-id/components";
import { SurfaceBlock } from "@encvoy-id/components";
import { getLocalizedTextValue } from "src/shared/utils/locales";
import {
  IRuleValidation,
  useAddRuleValidationToRuleMutation,
  useDeleteRuleValidationMutation,
  useRemoveRuleValidationFromRuleMutation,
} from "../../../../shared/api/settings";
import styles from "./RuleValidation.module.css";

type TRuleValidationField = {
  rule: IRuleValidation;
  onEdit: () => void;
  checked: boolean;
  fieldName: string;
  clientId: string;
};

export const RuleValidation: FC<TRuleValidationField> = ({
  rule,
  onEdit,
  checked,
  fieldName,
  clientId,
}) => {
  const { t: translate, i18n } = useTranslation();
  const [deleteRuleValidation] = useDeleteRuleValidationMutation();
  const [addRuleValidationToRule] = useAddRuleValidationToRuleMutation();
  const [removeRuleValidationFromRule] =
    useRemoveRuleValidationFromRuleMutation();
  const [isCheck, setIsCheck] = useState<boolean>(checked);

  const handleDelete = async () => {
    await deleteRuleValidation({ client_id: clientId, id: rule.id });
  };

  const handleCheck = async () => {
    try {
      if (!isCheck) {
        await addRuleValidationToRule({
          client_id: clientId,
          field_name: fieldName,
          id: rule.id,
        }).unwrap();
      } else {
        await removeRuleValidationFromRule({
          client_id: clientId,
          field_name: fieldName,
          id: rule.id,
        }).unwrap();
      }

      setIsCheck(!isCheck);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ListItem
      disablePadding
      data-id="rule-validation-item"
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
    >
      <SurfaceBlock className={styles.rule}>
        <div className={styles.content}>
          <div className={styles.header}>
            <Switch
              data-test-id={`chk-settings-user-profile-rule-active-${rule.id}`}
              checked={isCheck}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                handleCheck();
              }}
              disabled={!rule.active}
            />
            <Typography className="text-14">
              {getLocalizedTextValue(rule.title, i18n.language)}
            </Typography>
          </div>
          <div className={styles.buttons}>
            {!rule.active && (
              <IconWithTooltip
                title={translate("toolTips.notActive")}
                description={translate(
                  "panel.ruleValidation.tooltipDescription"
                )}
                Icon={VisibilityOffOutlinedIcon}
                hideHovered
              />
            )}
            <Button
              variant="text"
              onClick={() => onEdit()}
              data-test-id="btn-settings-user-profile-rule-settings"
            >
              {translate("actionButtons.configure")}
            </Button>
            <IconsLibrary
              title={translate("toolTips.delete")}
              type="delete"
              onClick={handleDelete}
              dataTestId="btn-settings-user-profile-rule-delete"
            />
          </div>
        </div>
      </SurfaceBlock>
    </ListItem>
  );
};
