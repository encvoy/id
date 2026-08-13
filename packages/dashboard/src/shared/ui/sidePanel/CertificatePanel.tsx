import SecurityIcon from "@mui/icons-material/Security";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import type { ChipProps } from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import {
  AccordionBlock,
  CustomIcon,
  InfoFieldRow,
  SidePanel,
  SurfaceBlock,
} from "@encvoy-id/components";
import type { ICertificateRestInfo } from "src/shared/api/users";

type CertificatePanelProps = {
  restInfo: ICertificateRestInfo | null;
  isOpen: boolean;
  onClose: () => void;
  isNoBackdrop?: boolean;
};

const sanitizeFileName = (value?: string) => {
  if (!value) {
    return "certificate";
  }

  const normalizedValue = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, " ");

  return normalizedValue || "certificate";
};

const getCertificateStatus = (
  restInfo: ICertificateRestInfo | null
): { label: string; color: ChipProps["color"] } => {
  if (restInfo?.is_revoked) {
    return { label: "Revoked", color: "error" };
  }

  if (restInfo?.is_expired || restInfo?.is_valid === false) {
    return { label: "Invalid", color: "error" };
  }

  if (
    restInfo?.is_valid ||
    restInfo?.verification_passed ||
    restInfo?.verify === true ||
    restInfo?.verify === "true"
  ) {
    return { label: "Valid", color: "success" };
  }

  return { label: "No data", color: "default" };
};

export const CertificatePanel: FC<CertificatePanelProps> = ({
  restInfo,
  isOpen,
  onClose,
  isNoBackdrop = false,
}) => {
  const { t: translate, i18n } = useTranslation();
  const certificateTitle = restInfo?.cn ?? restInfo?.dn ?? "No data";
  const certificateContent =
    typeof restInfo?.cert === "string" ? restInfo.cert.trim() : "";
  const status = getCertificateStatus(restInfo);

  const formatDateTime = (value?: string | null) => {
    if (!value) {
      return "No data";
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "No data"
      : date.toLocaleString(i18n.language);
  };

  const handleCertificateExport = () => {
    if (!certificateContent) {
      return;
    }

    const certificateExtension = certificateContent.includes(
      "BEGIN CERTIFICATE"
    )
      ? "pem"
      : "cer";
    const certificateBlob = new Blob([certificateContent], {
      type: "application/x-x509-ca-cert",
    });
    const url = window.URL.createObjectURL(certificateBlob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${sanitizeFileName(
      restInfo?.cn ?? restInfo?.dn ?? undefined
    )}.${certificateExtension}`;

    document.body.appendChild(anchor);
    anchor.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(anchor);
  };

  return (
    <SidePanel
      buttonSubmitText={translate("actionButtons.save")}
      customAdditionalText={translate("actionButtons.create")}
      cancelText={translate("actionButtons.cancel")}
      isNoBackdrop={isNoBackdrop}
      title="Certificate details"
      onClose={onClose}
      isOpen={isOpen}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          pt: "24px",
        }}
      >
        <SurfaceBlock
          sx={(theme) => ({
            display: "flex",
            alignItems: "center",
            gap: "16px",
            p: "16px 24px",
            backgroundColor: theme.palette.background.default,
          })}
        >
          <SurfaceBlock
            sx={{
              width: 48,
              height: 48,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CustomIcon Icon={SecurityIcon} color="textSecondary" />
          </SurfaceBlock>

          <Box>
            <Typography>{certificateTitle}</Typography>
            <Button
              sx={{ mt: "8px" }}
              disabled={!certificateContent}
              onClick={handleCertificateExport}
              variant="contained"
              color="secondary"
            >
              Export
            </Button>
          </Box>
        </SurfaceBlock>

        <AccordionBlock title="Certificate status">
          <InfoFieldRow label="Certificate status">
            <Chip label={status.label} color={status.color} />
            <Typography className="text-14" color="text.secondary">
              {`Verified: ${formatDateTime(restInfo?.verified_at)}`}
            </Typography>
          </InfoFieldRow>
          <InfoFieldRow
            label="Certificate validity"
            value={`${formatDateTime(restInfo?.valid_from)} - ${formatDateTime(
              restInfo?.valid_to
            )}`}
          />
        </AccordionBlock>

        <AccordionBlock title="Certificate properties">
          <InfoFieldRow label="Issuer" value={restInfo?.issuer} />
          <InfoFieldRow
            label="Issuer name"
            value={restInfo?.issuer_friendly_name}
          />
          <InfoFieldRow label="Serial number" value={restInfo?.serial} />
          <InfoFieldRow label="Fingerprint" value={restInfo?.fingerprint} />
          <InfoFieldRow
            label="Signature algorithm"
            value={restInfo?.signature_algorithm}
          />
          <InfoFieldRow
            label="Signature hash algorithm"
            value={restInfo?.signature_digest_algorithm}
          />
          <InfoFieldRow
            label="Public-key algorithm"
            value={restInfo?.public_key_algorithm ?? restInfo?.key_algorithm}
          />
          <InfoFieldRow
            label="Certificate content hash"
            value={restInfo?.certificate_content_hash}
          />
          <InfoFieldRow label="Schema version" value={restInfo?.schema_version} />
        </AccordionBlock>

        <AccordionBlock title="Source">
          <InfoFieldRow label="Type" value={restInfo?.source?.kind} />
          <InfoFieldRow label="Identifier" value={restInfo?.source?.id} />
          <InfoFieldRow label="Entry" value={restInfo?.source?.entry_id} />
          <InfoFieldRow label="DN" value={restInfo?.source?.dn} />
        </AccordionBlock>
      </Box>
    </SidePanel>
  );
};
