import { FC } from "react";
import styles from "./ViewEmailTemplate.module.css";
import { COPYRIGHT, DOMAIN } from "src/shared/utils/constants";
import { useTheme } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "src/app/store/store";
import { getImageURL } from "src/shared/utils/helpers";
import { useTranslation } from "react-i18next";

interface ViewEmailTemplateProps {
  content: string;
}

export const ViewEmailTemplate: FC<ViewEmailTemplateProps> = ({ content }) => {
  const theme = useTheme();
  const clientProfile = useSelector(
    (state: RootState) => state.app.clientProfile
  );
  const { i18n } = useTranslation();
  const PROJECT_NAME = clientProfile?.name || "PROJECT_NAME";
  const LOGO_URL = getImageURL(clientProfile?.avatar) || "";
  return (
    <div className={styles.email}>
      <table
        style={{
          backgroundColor: "#F2F2F2",
          paddingTop: "20px",
          paddingBottom: "20px",
        }}
        width="100%"
        cellPadding="0"
        cellSpacing="0"
      >
        <tbody>
          <tr>
            <td width="100%" align="center">
              <table
                width="100%"
                style={{
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 5px 5px rgba(0, 0, 0, 0.35)",
                  width: "100%",
                  maxWidth: "580px",
                }}
                cellPadding="0"
                cellSpacing="0"
              >
                <tbody>
                  <tr>
                    <td>
                      <table
                        width="100%"
                        cellPadding="0"
                        cellSpacing="0"
                        style={{
                          verticalAlign: "middle",
                          maxWidth: "580px",
                          textAlign: "center",
                        }}
                      >
                        <tbody>
                          <tr>
                            <td
                              style={{
                                verticalAlign: "middle",
                                padding: "20px",
                                borderBottom: "1px solid #bbbbbb",
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <table
                                cellPadding="0"
                                cellSpacing="0"
                                style={{
                                  verticalAlign: "middle",
                                  lineHeight: "28px",
                                  textAlign: "left",
                                }}
                              >
                                <tbody>
                                  <tr>
                                    <td
                                      width="36"
                                      height="28"
                                      style={{
                                        verticalAlign: "middle",
                                        lineHeight: "28px",
                                      }}
                                    >
                                      <a
                                        href={DOMAIN}
                                        style={{
                                          color: theme.palette.primary.main,
                                          fontFamily: "Arial, sans-serif",
                                          fontSize: "14px",
                                          lineHeight: "28px",
                                          verticalAlign: "middle",
                                          textDecoration: "none",
                                          display: "inline-block",
                                        }}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <img
                                          src={LOGO_URL}
                                          width="28"
                                          height="28"
                                          style={{
                                            verticalAlign: "middle",
                                            display: "inline-block",
                                          }}
                                          alt="Logo"
                                        />
                                      </a>
                                    </td>
                                    <td
                                      height="28"
                                      valign="middle"
                                      style={{
                                        verticalAlign: "middle",
                                        lineHeight: "28px",
                                      }}
                                    >
                                      <a
                                        href={window.location.origin}
                                        style={{
                                          color: theme.palette.primary.main,
                                          fontFamily:
                                            "'Montserrat', sans-serif",
                                          fontSize: "15px",
                                          fontWeight: 600,
                                          lineHeight: "28px",
                                          textDecoration: "none",
                                          display: "inline-block",
                                        }}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {PROJECT_NAME}
                                      </a>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table
                                cellPadding="0"
                                cellSpacing="0"
                                style={{
                                  verticalAlign: "middle",
                                  lineHeight: "28px",
                                  textAlign: "right",
                                }}
                              >
                                <tbody>
                                  <tr>
                                    <td
                                      align="right"
                                      height="28"
                                      valign="middle"
                                      style={{
                                        verticalAlign: "middle",
                                        lineHeight: "28px",
                                      }}
                                    >
                                      <a
                                        style={{
                                          margin: 0,
                                          padding: 0,
                                          color: theme.palette.primary.main,
                                          textDecoration: "none",
                                        }}
                                        href={window.location.origin}
                                      >
                                        {window.location.origin.replace(
                                          "https://",
                                          ""
                                        )}
                                      </a>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <table
                        width="100%"
                        style={{
                          backgroundColor: "#FFFFFF",
                          maxWidth: "580px",
                        }}
                        cellPadding="0"
                        cellSpacing="0"
                      >
                        <tbody>
                          <tr>
                            <td
                              style={{
                                color: "rgba(0, 0, 0, .87)",
                                padding: "20px",
                                borderBottom: "1px solid #bbbbbb",
                              }}
                              dangerouslySetInnerHTML={{ __html: content }}
                            ></td>
                          </tr>
                        </tbody>
                      </table>
                      <table
                        width="100%"
                        style={{ backgroundColor: "#FFFFFF" }}
                        cellPadding="0"
                        cellSpacing="0"
                      >
                        <tbody>
                          <tr>
                            <td style={{ padding: "20px" }}>
                              <table>
                                <tbody>
                                  <tr>
                                    <td style={{ paddingBottom: "10px" }}>
                                      <a
                                        style={{
                                          color: theme.palette.primary.main,
                                          textDecoration: "none",
                                        }}
                                        href="mailto:example_root@gmail.com"
                                      >
                                        example_root@gmail.com
                                      </a>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table>
                                <tbody>
                                  <tr>
                                    <td>{COPYRIGHT[i18n.language]}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
