import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Chip } from "@encvoy-id/components";
import styles from "./RequiredFields.module.css";
import {
  IClientFull,
  useAddClientRuleMutation,
  useDeleteClientRuleMutation,
} from "src/shared/api/clients";
import { IRuleWithValidation, useGetRulesQuery } from "src/shared/api/settings";
import { getLocalizedTextValue } from "src/shared/utils/locales";
import Typography from "@mui/material/Typography";

interface IRequiredFieldsProps {
  client: IClientFull;
}

export const RequiredFields: FC<IRequiredFieldsProps> = ({ client }) => {
  const [clientRules, setClientRules] = useState<string[]>([]);

  const [addClientRule] = useAddClientRuleMutation();
  const [deleteClientRule] = useDeleteClientRuleMutation();

  const { data: rules } = useGetRulesQuery(
    client?.client_id ? { client_id: client.client_id } : undefined
  );
  const { t: translate, i18n } = useTranslation();

  const getRequiredFieldDataTestId = (fieldName: string) =>
    `btn-settings-required-fields-${fieldName.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  useEffect(() => {
    const clientRuleIds = client?.rules?.map((rule) => rule.id);
    setClientRules(clientRuleIds || []);
  }, [client]);

  const requiredFieldNames = [
    "sub",
    "login",
    "email",
    "given_name",
    "family_name",
    "phone_number",
    "birthdate",
    "nickname",
    "picture",
    "password",
    "data_processing_agreement",
  ];

  const filterRequiredProfileRules = (rules: IRuleWithValidation[] = []) => {
    return (rules || []).filter((rule) =>
      requiredFieldNames.includes(rule.field_name)
    );
  };

  const filterCustomProfileRules = (rules: IRuleWithValidation[] = []) => {
    return (rules || []).filter(
      (rule) => !requiredFieldNames.includes(rule.field_name)
    );
  };

  const getNameRuleIds = (rules: IRuleWithValidation[] = []) => {
    const given = rules?.find((r) => r.field_name === "given_name");
    const family = rules?.find((r) => r.field_name === "family_name");
    return [given?.id, family?.id].filter(Boolean) as string[];
  };

  const updateClientRule = (ruleId: string) => {
    if (clientRules.includes(ruleId)) {
      deleteClientRule({ clientId: client.client_id, ruleId });
    } else {
      addClientRule({ clientId: client.client_id, ruleId });
    }
  };

  return (
    <>
      <Typography className="text-14">
        {translate("pages.settings.requiredFields.mainFields")}
      </Typography>
      <div className={styles.chipsContainer}>
        {/*Join Chip for "Name and Family name"*/}
        {(() => {
          const nameRuleIds = getNameRuleIds(rules);
          if (nameRuleIds.length === 2) {
            const isActive = nameRuleIds.every((id) =>
              clientRules.includes(id)
            );
            return (
              <div
                className={styles.chipWrapper}
                key="name-family-chip"
                data-test-id={getRequiredFieldDataTestId("name_and_surname")}
                onClick={() => {
                  nameRuleIds.forEach((id) => updateClientRule(id));
                }}
              >
                <Chip
                  status={isActive ? "active" : "default"}
                  customText={{
                    active: translate(
                      "pages.settings.requiredFields.nameAndSurname"
                    ),
                    default: translate(
                      "pages.settings.requiredFields.nameAndSurname"
                    ),
                  }}
                />
              </div>
            );
          }
          return null;
        })()}
        {/* other required fields include given_name, family_name, sub, password */}
        {filterRequiredProfileRules(rules)
          .filter(
            (rule) =>
              rule.field_name !== "given_name" &&
              rule.field_name !== "family_name" &&
              rule.field_name !== "sub" &&
              rule.field_name !== "password"
          )
          .map((rule) => (
            <div
              className={styles.chipWrapper}
              key={rule.id}
              data-test-id={getRequiredFieldDataTestId(rule.field_name)}
              onClick={() => updateClientRule(rule.id)}
            >
              <Chip
                status={clientRules.includes(rule.id) ? "active" : "default"}
                customText={{
                  active: getLocalizedTextValue(rule.title, i18n.language),
                  default: getLocalizedTextValue(rule.title, i18n.language),
                }}
              />
            </div>
          ))}
      </div>
      {/* Custom profile fields */}
      {filterCustomProfileRules(rules).length > 0 && (
        <>
          <Typography className="text-14">
            {translate("pages.settings.requiredFields.customFields")}
          </Typography>
          <div className={styles.chipsContainer}>
            {filterCustomProfileRules(rules).map((rule) => (
              <div
                className={styles.chipWrapper}
                key={rule.id}
                data-test-id={getRequiredFieldDataTestId(rule.field_name)}
                onClick={() => updateClientRule(rule.id)}
              >
                <Chip
                  status={clientRules.includes(rule.id) ? "active" : "default"}
                  customText={{
                    active: getLocalizedTextValue(rule.title, i18n.language),
                    default: getLocalizedTextValue(rule.title, i18n.language),
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};
