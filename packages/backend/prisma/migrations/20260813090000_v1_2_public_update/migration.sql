-- CreateEnum
CREATE TYPE "NotificationTarget" AS ENUM ('ALL', 'NEW_USERS', 'EXISTING_USERS', 'USER_LIST');

-- CreateEnum
CREATE TYPE "ProfileFieldValueType" AS ENUM ('STRING', 'TEXT', 'BOOLEAN', 'DATE', 'DATETIME', 'INTEGER', 'NUMBER', 'ENUM', 'MULTI_ENUM', 'JSON', 'EMAIL', 'PHONE', 'URL', 'IMAGE');

-- DropForeignKey
ALTER TABLE "FavoriteClients" DROP CONSTRAINT "FavoriteClients_user_id_fkey";

-- DropForeignKey
ALTER TABLE "SearchHistory" DROP CONSTRAINT "SearchHistory_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Scopes" DROP CONSTRAINT "Scopes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ExternalAccount" DROP CONSTRAINT "ExternalAccount_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ExternalAccount" DROP CONSTRAINT "ExternalAccount_last_active_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "Provider_relations" DROP CONSTRAINT "Provider_relations_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "RuleRuleValidation" DROP CONSTRAINT "RuleRuleValidation_rule_id_fkey";

-- DropForeignKey
ALTER TABLE "RuleRuleValidation" DROP CONSTRAINT "RuleRuleValidation_rule_validation_id_fkey";

-- DropForeignKey
ALTER TABLE "ClientRule" DROP CONSTRAINT "ClientRule_client_id_fkey";

-- DropForeignKey
ALTER TABLE "ClientRule" DROP CONSTRAINT "ClientRule_rule_id_fkey";

-- DropIndex
DROP INDEX "User_login_key";

-- DropIndex
DROP INDEX "User_phone_number_key";

-- DropIndex
DROP INDEX "ClientType_name_key";

-- DropIndex
DROP INDEX "EmailTemplates_action_locale_key";

-- DropIndex
DROP INDEX "RuleValidation_title_key";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "birthdate",
DROP COLUMN "blocked",
DROP COLUMN "custom_fields",
DROP COLUMN "data_processing_agreement",
DROP COLUMN "email",
DROP COLUMN "email_public",
DROP COLUMN "email_verified",
DROP COLUMN "family_name",
DROP COLUMN "given_name",
DROP COLUMN "login",
DROP COLUMN "middle_name",
DROP COLUMN "nickname",
DROP COLUMN "phone_number",
DROP COLUMN "phone_number_verified",
DROP COLUMN "picture",
DROP COLUMN "public_profile_claims_gravatar",
DROP COLUMN "public_profile_claims_oauth",
DROP COLUMN "sub",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "folder_id" TEXT NOT NULL,
ADD COLUMN     "org_id" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" SET NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "";

-- AlterTable
ALTER TABLE "ClientType" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "name",
ADD COLUMN     "name" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "authorize_auto_by_session" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "catalog_name" JSONB,
ADD COLUMN     "folder_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "name",
ADD COLUMN     "name" JSONB,
DROP COLUMN "widget_title",
ADD COLUMN     "widget_title" JSONB NOT NULL DEFAULT '{"ru-RU":"WIDGET_APP_NAME"}';

-- AlterTable
ALTER TABLE "FavoriteClients" ALTER COLUMN "user_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "SearchHistory" DROP CONSTRAINT "SearchHistory_pkey",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("user_id");

-- AlterTable
ALTER TABLE "EmailTemplates" DROP CONSTRAINT "EmailTemplates_pkey",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "provider_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "EmailTemplates_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "";

-- AlterTable
ALTER TABLE "Settings" DROP CONSTRAINT "Settings_pkey",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Settings_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "";

-- AlterTable
ALTER TABLE "Role" DROP CONSTRAINT "Role_pkey",
ADD COLUMN     "blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Role_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "";

-- AlterTable
ALTER TABLE "Scopes" DROP CONSTRAINT "Scopes_pkey",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Scopes_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "";

-- AlterTable
ALTER TABLE "ExternalAccount" DROP CONSTRAINT "ExternalAccount_pkey",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "last_active_provider_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "ExternalAccount_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "";

-- AlterTable
ALTER TABLE "Provider" DROP CONSTRAINT "Provider_pkey",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
DROP COLUMN "name",
ADD COLUMN     "name" JSONB NOT NULL,
ADD CONSTRAINT "Provider_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "";

-- AlterTable
ALTER TABLE "Provider_relations" DROP CONSTRAINT "Provider_relations_pkey",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "provider_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Provider_relations_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "";

-- AlterTable
ALTER TABLE "RuleValidation" DROP CONSTRAINT "RuleValidation_pkey",
ADD COLUMN     "organization_id" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
DROP COLUMN "title",
ADD COLUMN     "title" JSONB NOT NULL,
DROP COLUMN "error",
ADD COLUMN     "error" JSONB NOT NULL,
ADD CONSTRAINT "RuleValidation_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "";

-- DropTable
DROP TABLE "CustomField";

-- DropTable
DROP TABLE "Rule";

-- DropTable
DROP TABLE "RuleRuleValidation";

-- DropTable
DROP TABLE "ClientRule";

-- DropEnum
DROP TYPE "TargetTypes";

-- CreateTable
CREATE TABLE "ProfileField" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "organization_id" TEXT,
    "title" JSONB NOT NULL,
    "value_type" "ProfileFieldValueType" NOT NULL DEFAULT 'STRING',
    "mapping_vcard" TEXT,
    "default_value" JSONB,
    "default_public" INTEGER NOT NULL DEFAULT 0,
    "editable" BOOLEAN NOT NULL DEFAULT true,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "unique" BOOLEAN NOT NULL DEFAULT false,
    "validate_on_authorization" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfileValue" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "profile_field_id" TEXT NOT NULL,
    "value" JSONB,
    "public" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfileValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileFieldValidation" (
    "profile_field_id" TEXT NOT NULL,
    "rule_validation_id" TEXT NOT NULL,

    CONSTRAINT "ProfileFieldValidation_pkey" PRIMARY KEY ("profile_field_id","rule_validation_id")
);

-- CreateTable
CREATE TABLE "OidcScopeGroup" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "title" JSONB NOT NULL,
    "description" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OidcScopeGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OidcScopeGroupField" (
    "scope_group_id" TEXT NOT NULL,
    "profile_field_id" TEXT NOT NULL,
    "claim_name" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OidcScopeGroupField_pkey" PRIMARY KEY ("scope_group_id","profile_field_id")
);

-- CreateTable
CREATE TABLE "ClientRequiredProfileField" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "profile_field_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientRequiredProfileField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "title" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "target" "NotificationTarget" NOT NULL DEFAULT 'ALL',
    "user_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "client_id" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRead" (
    "id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notification_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "NotificationRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RbacResource" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RbacResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RbacRole" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RbacRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RbacGroup" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "folder_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RbacGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationAccessGroup" (
    "organization_id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "ApplicationAccessGroup_pkey" PRIMARY KEY ("organization_id","application_id","group_id")
);

-- CreateTable
CREATE TABLE "RbacGroupMember" (
    "id" TEXT NOT NULL,
    "parent_group_id" TEXT NOT NULL,
    "member_user_id" TEXT,
    "member_group_id" TEXT,

    CONSTRAINT "RbacGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RbacAssignment" (
    "id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "user_id" TEXT,
    "group_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RbacAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RbacPermission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RbacPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RbacRolePermission" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "RbacRolePermission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "parent_id" TEXT,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileField_key_key" ON "ProfileField"("key");

-- CreateIndex
CREATE INDEX "ProfileField_organization_id_active_idx" ON "ProfileField"("organization_id", "active");

-- CreateIndex
CREATE INDEX "ProfileField_organization_id_key_idx" ON "ProfileField"("organization_id", "key");

-- CreateIndex
CREATE INDEX "UserProfileValue_user_id_idx" ON "UserProfileValue"("user_id");

-- CreateIndex
CREATE INDEX "UserProfileValue_profile_field_id_idx" ON "UserProfileValue"("profile_field_id");

-- CreateIndex
CREATE INDEX "UserProfileValue_profile_field_id_public_idx" ON "UserProfileValue"("profile_field_id", "public");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfileValue_user_id_profile_field_id_key" ON "UserProfileValue"("user_id", "profile_field_id");

-- CreateIndex
CREATE INDEX "OidcScopeGroup_organization_id_active_idx" ON "OidcScopeGroup"("organization_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "OidcScopeGroup_organization_id_name_key" ON "OidcScopeGroup"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "OidcScopeGroupField_profile_field_id_key" ON "OidcScopeGroupField"("profile_field_id");

-- CreateIndex
CREATE UNIQUE INDEX "ClientRequiredProfileField_client_id_profile_field_id_key" ON "ClientRequiredProfileField"("client_id", "profile_field_id");

-- CreateIndex
CREATE INDEX "Notification_client_id_is_active_created_at_idx" ON "Notification"("client_id", "is_active", "created_at");

-- CreateIndex
CREATE INDEX "Notification_client_id_created_at_idx" ON "Notification"("client_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRead_notification_id_user_id_key" ON "NotificationRead"("notification_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "RbacGroup_id_client_id_key" ON "RbacGroup"("id", "client_id");

-- CreateIndex
CREATE INDEX "ApplicationAccessGroup_organization_id_group_id_idx" ON "ApplicationAccessGroup"("organization_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "RbacGroupMember_parent_group_id_member_user_id_key" ON "RbacGroupMember"("parent_group_id", "member_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "RbacGroupMember_parent_group_id_member_group_id_key" ON "RbacGroupMember"("parent_group_id", "member_group_id");

-- CreateIndex
CREATE INDEX "RbacAssignment_resource_id_user_id_idx" ON "RbacAssignment"("resource_id", "user_id");

-- CreateIndex
CREATE INDEX "RbacAssignment_resource_id_group_id_idx" ON "RbacAssignment"("resource_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "RbacPermission_name_key" ON "RbacPermission"("name");

-- CreateIndex
CREATE INDEX "Folder_client_id_parent_id_idx" ON "Folder"("client_id", "parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_client_id_parent_id_name_key" ON "Folder"("client_id", "parent_id", "name");

-- CreateIndex
CREATE INDEX "User_folder_id_idx" ON "User"("folder_id");

-- CreateIndex
CREATE INDEX "User_org_id_idx" ON "User"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "Client_client_id_parent_id_key" ON "Client"("client_id", "parent_id");

-- CreateIndex
CREATE INDEX "EmailTemplates_provider_id_locale_idx" ON "EmailTemplates"("provider_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplates_provider_id_action_locale_key" ON "EmailTemplates"("provider_id", "action", "locale");

-- CreateIndex
CREATE INDEX "Role_client_id_role_idx" ON "Role"("client_id", "role");

-- CreateIndex
CREATE INDEX "RuleValidation_organization_id_idx" ON "RuleValidation"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "RuleValidation_organization_id_title_key" ON "RuleValidation"("organization_id", "title");

-- CreateIndex
CREATE UNIQUE INDEX "ClientInvitation_client_id_email_key" ON "ClientInvitation"("client_id", "email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Client"("client_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileField" ADD CONSTRAINT "ProfileField_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileValue" ADD CONSTRAINT "UserProfileValue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileValue" ADD CONSTRAINT "UserProfileValue_profile_field_id_fkey" FOREIGN KEY ("profile_field_id") REFERENCES "ProfileField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileFieldValidation" ADD CONSTRAINT "ProfileFieldValidation_profile_field_id_fkey" FOREIGN KEY ("profile_field_id") REFERENCES "ProfileField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileFieldValidation" ADD CONSTRAINT "ProfileFieldValidation_rule_validation_id_fkey" FOREIGN KEY ("rule_validation_id") REFERENCES "RuleValidation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OidcScopeGroup" ADD CONSTRAINT "OidcScopeGroup_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OidcScopeGroupField" ADD CONSTRAINT "OidcScopeGroupField_scope_group_id_fkey" FOREIGN KEY ("scope_group_id") REFERENCES "OidcScopeGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OidcScopeGroupField" ADD CONSTRAINT "OidcScopeGroupField_profile_field_id_fkey" FOREIGN KEY ("profile_field_id") REFERENCES "ProfileField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteClients" ADD CONSTRAINT "FavoriteClients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplates" ADD CONSTRAINT "EmailTemplates_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scopes" ADD CONSTRAINT "Scopes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalAccount" ADD CONSTRAINT "ExternalAccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalAccount" ADD CONSTRAINT "ExternalAccount_last_active_provider_id_fkey" FOREIGN KEY ("last_active_provider_id") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider_relations" ADD CONSTRAINT "Provider_relations_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleValidation" ADD CONSTRAINT "RuleValidation_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRequiredProfileField" ADD CONSTRAINT "ClientRequiredProfileField_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRequiredProfileField" ADD CONSTRAINT "ClientRequiredProfileField_profile_field_id_fkey" FOREIGN KEY ("profile_field_id") REFERENCES "ProfileField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RbacResource" ADD CONSTRAINT "RbacResource_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RbacResource" ADD CONSTRAINT "RbacResource_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "RbacResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RbacRole" ADD CONSTRAINT "RbacRole_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RbacGroup" ADD CONSTRAINT "RbacGroup_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RbacGroup" ADD CONSTRAINT "RbacGroup_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationAccessGroup" ADD CONSTRAINT "ApplicationAccessGroup_application_id_organization_id_fkey" FOREIGN KEY ("application_id", "organization_id") REFERENCES "Client"("client_id", "parent_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationAccessGroup" ADD CONSTRAINT "ApplicationAccessGroup_group_id_organization_id_fkey" FOREIGN KEY ("group_id", "organization_id") REFERENCES "RbacGroup"("id", "client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RbacGroupMember" ADD CONSTRAINT "RbacGroupMember_parent_group_id_fkey" FOREIGN KEY ("parent_group_id") REFERENCES "RbacGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RbacGroupMember" ADD CONSTRAINT "RbacGroupMember_member_user_id_fkey" FOREIGN KEY ("member_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RbacGroupMember" ADD CONSTRAINT "RbacGroupMember_member_group_id_fkey" FOREIGN KEY ("member_group_id") REFERENCES "RbacGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RbacAssignment" ADD CONSTRAINT "RbacAssignment_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "RbacResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RbacAssignment" ADD CONSTRAINT "RbacAssignment_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "RbacRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RbacAssignment" ADD CONSTRAINT "RbacAssignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RbacAssignment" ADD CONSTRAINT "RbacAssignment_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "RbacGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RbacRolePermission" ADD CONSTRAINT "RbacRolePermission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "RbacRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RbacRolePermission" ADD CONSTRAINT "RbacRolePermission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "RbacPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;
