import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";
import { RootState } from "src/app/store/store";
import {
  useGetCatalogEnabledQuery,
  useUpdateCatalogEnabledMutation,
} from "src/shared/api/settings";
import { TUserSlice } from "src/shared/lib/userSlice";
import { componentBorderRadius } from "src/shared/theme/Theme";
import { ERoles } from "src/shared/utils/enums";

interface IFeatures {
  id: number;
  key: string;
  name: string;
  description: string;
  roles: ERoles[];
}

const mapStateToProps = ({ user }: RootState) => ({
  roleInApp: user.roleInApp,
});

interface TExperimentalFeaturesComponent {
  roleInApp: TUserSlice["roleInApp"];
}

export const ExperimentalFeaturesComponent: FC<TExperimentalFeaturesComponent> =
  ({ roleInApp }) => {
    const [stateFeatures, setStateFeatures] = useState<{
      [name: string]: boolean;
    }>({});
    const { data: catalogEnabled, refetch: catalogRefetch } =
      useGetCatalogEnabledQuery();
    const [updateCatalogEnabled] = useUpdateCatalogEnabledMutation();
    const { t: translate } = useTranslation();

    const features: IFeatures[] = [
      {
        id: 1,
        key: "catalog",
        name: "pages.experimental.features.catalog.name",
        description: "pages.experimental.features.catalog.description",
        roles: [ERoles.EDITOR, ERoles.OWNER],
      },
    ];

    useEffect(() => {
      if (catalogEnabled !== undefined) {
        setStateFeatures({
          catalog: catalogEnabled || false,
        });
      }
    }, [catalogEnabled]);

    useEffect(() => {
      if (catalogEnabled !== undefined) {
        setStateFeatures({
          Catalog: catalogEnabled || false,
        });
      }
    }, [catalogEnabled]);

    const handleSwitchChange = async (key: string, checked: boolean) => {
      setStateFeatures((prev) => ({ ...prev, [key]: checked }));

      if (key === "catalog") {
        await updateCatalogEnabled(checked).unwrap();
        catalogRefetch(); // Drop cache and get fresh data catalog
      }
    };

    return (
      <div className="page-container">
        <div className="content">
          <h1>{translate("pages.experimental.title")}</h1>
          <p>{translate("pages.experimental.description")}</p>
          <Box sx={{ marginTop: "32px" }}>
            {features.map((item) => {
              const translatedName = translate(item.name);
              return (
                <Box
                  key={item.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px",
                    borderRadius: componentBorderRadius,
                    border: "1px solid",
                    borderColor: "divider",
                    marginBottom: "10px",
                  }}
                >
                  <Box>
                    <Typography className="text-14">
                      {translatedName}
                    </Typography>
                    <Typography className="text-12" color="text.secondary">
                      {translate(item.description)}
                    </Typography>
                  </Box>
                  <Switch
                    checked={stateFeatures[item.key] || false}
                    onChange={(e) =>
                      handleSwitchChange(item.key, e.target.checked)
                    }
                    disabled={
                      roleInApp ? !item.roles.includes(roleInApp) : true
                    }
                  />
                </Box>
              );
            })}
          </Box>
        </div>
      </div>
    );
  };

export const ExperimentalFeatures = connect(mapStateToProps)(
  ExperimentalFeaturesComponent
);
