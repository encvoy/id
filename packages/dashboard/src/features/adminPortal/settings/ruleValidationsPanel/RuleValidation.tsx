import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { Button, Switch, Typography } from "@mui/material";
import ListItem from "@mui/material/ListItem";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconsLibrary } from "src/shared/ui/components/IconLibrary";
import { IconWithTooltip } from "src/shared/ui/components/IconWithTooltip";
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
};

export const RuleValidation: FC<TRuleValidationField> = ({
  rule,
  onEdit,
  checked,
  fieldName,
}) => {
  const { t: translate } = useTranslation();
  const [deleteRuleValidation] = useDeleteRuleValidationMutation();
  const [addRuleValidationToRule] = useAddRuleValidationToRuleMutation();
  const [removeRuleValidationFromRule] =
    useRemoveRuleValidationFromRuleMutation();
  const [isCheck, setIsCheck] = useState<boolean>(checked);

  const handleDelete = async () => {
    await deleteRuleValidation(rule.id);
  };

  const handleCheck = async () => {
    try {
      if (!isCheck) {
        await addRuleValidationToRule({
          field_name: fieldName,
          id: rule.id,
        }).unwrap();
      } else {
        await removeRuleValidationFromRule({
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
      data-id="rule-validation-item"
      className={styles.item}
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <Switch
            checked={isCheck}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              handleCheck();
            }}
            disabled={!rule.active}
          />
          <Typography className="text-14">{rule.title}</Typography>
        </div>
        <div className={styles.buttons}>
          {!rule.active && (
            <IconWithTooltip
              title={translate("toolTips.notActive")}
              description={translate("panel.ruleValidation.tooltipDescription")}
              Icon={VisibilityOffOutlinedIcon}
              hideHovered
            />
          )}
          <Button variant="text" onClick={() => onEdit()}>
            {translate("actionButtons.configure")}
          </Button>
          <IconsLibrary type="delete" onClick={handleDelete} />
        </div>
      </div>
    </ListItem>
  );
};
