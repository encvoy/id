-- CreateEnum
CREATE TYPE "SearchHistoryTypes" AS ENUM ('log', 'users', 'clients');

-- CreateEnum
CREATE TYPE "TargetTypes" AS ENUM ('USER', 'CLIENT', 'PROVIDER');

-- CreateEnum
CREATE TYPE "AuthMethodTypes" AS ENUM ('client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt', 'none');

-- CreateEnum
CREATE TYPE "SigningAlgTypes" AS ENUM ('RS256', 'PS256');

-- CreateEnum
CREATE TYPE "GrantTypes" AS ENUM ('authorization_code', 'implicit', 'refresh_token');

-- CreateEnum
CREATE TYPE "SubjectTypes" AS ENUM ('public', 'pairwise');

-- CreateEnum
CREATE TYPE "RegistrationPolicyVariants" AS ENUM ('allowed', 'allowed_autoregistration_only', 'disabled');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "sub" TEXT,
    "email" TEXT,
    "email_verified" BOOLEAN DEFAULT false,
    "birthdate" TIMESTAMP(3),
    "family_name" TEXT,
    "given_name" TEXT,
    "login" TEXT NOT NULL,
    "middle_name" TEXT,
    "nickname" TEXT,
    "phone_number" TEXT,
    "phone_number_verified" BOOLEAN,
    "picture" TEXT,
    "custom_fields" JSONB,
    "data_processing_agreement" BOOLEAN NOT NULL DEFAULT false,
    "email_public" BOOLEAN,
    "profile_privacy" BOOLEAN NOT NULL DEFAULT true,
    "public_profile_claims_gravatar" TEXT NOT NULL DEFAULT '',
    "public_profile_claims_oauth" TEXT NOT NULL DEFAULT 'id',
    "card_url" TEXT NOT NULL,
    "card_active" BOOLEAN NOT NULL DEFAULT false,
    "hashed_password" TEXT NOT NULL,
    "password_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locale" TEXT,
    "password_change_required" BOOLEAN,
    "updated_at" TIMESTAMP(3),
    "deleted" TIMESTAMP(3),
    "blocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomField" (
    "id" SERIAL NOT NULL,
    "field" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mapping_vcard" TEXT,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ClientType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "avatar" TEXT,
    "cover" TEXT,
    "cover_mode" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "domain" TEXT,
    "name" TEXT,
    "catalog" BOOLEAN NOT NULL DEFAULT false,
    "mini_widget" BOOLEAN NOT NULL DEFAULT false,
    "authorize_only_admins" BOOLEAN NOT NULL DEFAULT false,
    "authorize_only_employees" BOOLEAN NOT NULL DEFAULT false,
    "show_avatar_in_widget" BOOLEAN NOT NULL DEFAULT false,
    "hide_avatars_of_big_providers" BOOLEAN NOT NULL DEFAULT false,
    "hide_widget_header" BOOLEAN NOT NULL DEFAULT false,
    "hide_widget_footer" BOOLEAN NOT NULL DEFAULT false,
    "hide_widget_create_account" BOOLEAN NOT NULL DEFAULT false,
    "widget_title" TEXT NOT NULL DEFAULT 'WIDGET_APP_NAME',
    "widget_colors" JSONB NOT NULL DEFAULT '{}',
    "widget_info" TEXT NOT NULL DEFAULT '',
    "widget_info_out" TEXT NOT NULL DEFAULT '',
    "required_providers_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "client_id" TEXT NOT NULL,
    "client_secret" TEXT NOT NULL,
    "redirect_uris" TEXT[],
    "post_logout_redirect_uris" TEXT[],
    "application_type" TEXT NOT NULL DEFAULT 'web',
    "grant_types" TEXT[] DEFAULT ARRAY['authorization_code']::TEXT[],
    "id_token_signed_response_alg" TEXT NOT NULL DEFAULT 'RS256',
    "request_uris" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "require_auth_time" BOOLEAN NOT NULL DEFAULT false,
    "response_types" TEXT[] DEFAULT ARRAY['code']::TEXT[],
    "subject_type" TEXT NOT NULL DEFAULT 'public',
    "token_endpoint_auth_method" TEXT NOT NULL DEFAULT 'client_secret_basic',
    "introspection_endpoint_auth_method" TEXT NOT NULL DEFAULT 'client_secret_basic',
    "revocation_endpoint_auth_method" TEXT NOT NULL DEFAULT 'client_secret_basic',
    "require_signed_request_object" BOOLEAN NOT NULL DEFAULT false,
    "access_token_ttl" INTEGER NOT NULL DEFAULT 1800,
    "refresh_token_ttl" INTEGER NOT NULL DEFAULT 86400,
    "type_id" TEXT,
    "parent_id" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("client_id")
);

-- CreateTable
CREATE TABLE "FavoriteClients" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "client_id" TEXT NOT NULL,

    CONSTRAINT "FavoriteClients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "user_id" INTEGER NOT NULL,
    "type" "SearchHistoryTypes" NOT NULL,
    "list" TEXT[],

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "EmailTemplates" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "locale" TEXT NOT NULL,

    CONSTRAINT "EmailTemplates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "client_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scopes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "client_id" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalAccount" (
    "id" SERIAL NOT NULL,
    "sub" TEXT NOT NULL,
    "issuer" TEXT,
    "type" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "avatar" TEXT,
    "hashed_email" TEXT,
    "hashed_email_md5" TEXT,
    "label" TEXT,
    "profile_link" TEXT,
    "rest_info" JSONB,
    "public" INTEGER NOT NULL DEFAULT 0,
    "last_active_provider_id" INTEGER,

    CONSTRAINT "ExternalAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "password_required" BOOLEAN NOT NULL DEFAULT false,
    "avatar" TEXT,
    "description" TEXT,
    "name" TEXT NOT NULL,
    "params" JSONB,
    "default_public" INTEGER NOT NULL DEFAULT 0,
    "client_id" TEXT NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider_relations" (
    "id" SERIAL NOT NULL,
    "provider_id" INTEGER NOT NULL,
    "client_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "index" INTEGER NOT NULL DEFAULT 0,
    "groupe" TEXT NOT NULL DEFAULT 'SMALL',

    CONSTRAINT "Provider_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_id" TEXT,
    "client_id" TEXT,
    "device" TEXT,
    "event" TEXT NOT NULL,
    "description" TEXT,
    "details" JSONB NOT NULL,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" SERIAL NOT NULL,
    "target" "TargetTypes" NOT NULL,
    "field_name" TEXT NOT NULL,
    "default" TEXT,
    "editable" BOOLEAN NOT NULL DEFAULT true,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "unique" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleValidation" (
    "id" SERIAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "regex" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleRuleValidation" (
    "rule_id" INTEGER NOT NULL,
    "rule_validation_id" INTEGER NOT NULL,

    CONSTRAINT "RuleRuleValidation_pkey" PRIMARY KEY ("rule_id","rule_validation_id")
);

-- CreateTable
CREATE TABLE "ClientRule" (
    "id" SERIAL NOT NULL,
    "client_id" TEXT NOT NULL,
    "rule_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "User"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "User_card_url_key" ON "User"("card_url");

-- CreateIndex
CREATE UNIQUE INDEX "CustomField_field_key" ON "CustomField"("field");

-- CreateIndex
CREATE UNIQUE INDEX "CustomField_title_key" ON "CustomField"("title");

-- CreateIndex
CREATE UNIQUE INDEX "ClientType_name_key" ON "ClientType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Client_client_id_key" ON "Client"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteClients_user_id_client_id_key" ON "FavoriteClients"("user_id", "client_id");

-- CreateIndex
CREATE UNIQUE INDEX "SearchHistory_user_id_type_key" ON "SearchHistory"("user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplates_action_locale_key" ON "EmailTemplates"("action", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_name_key" ON "Settings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_title_key" ON "Settings"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Role_user_id_client_id_key" ON "Role"("user_id", "client_id");

-- CreateIndex
CREATE UNIQUE INDEX "Scopes_user_id_client_id_key" ON "Scopes"("user_id", "client_id");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_relations_client_id_provider_id_key" ON "Provider_relations"("client_id", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "Rule_target_field_name_key" ON "Rule"("target", "field_name");

-- CreateIndex
CREATE UNIQUE INDEX "RuleValidation_title_key" ON "RuleValidation"("title");

-- CreateIndex
CREATE UNIQUE INDEX "ClientRule_client_id_rule_id_key" ON "ClientRule"("client_id", "rule_id");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "ClientType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteClients" ADD CONSTRAINT "FavoriteClients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteClients" ADD CONSTRAINT "FavoriteClients_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scopes" ADD CONSTRAINT "Scopes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scopes" ADD CONSTRAINT "Scopes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalAccount" ADD CONSTRAINT "ExternalAccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalAccount" ADD CONSTRAINT "ExternalAccount_last_active_provider_id_fkey" FOREIGN KEY ("last_active_provider_id") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider_relations" ADD CONSTRAINT "Provider_relations_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider_relations" ADD CONSTRAINT "Provider_relations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleRuleValidation" ADD CONSTRAINT "RuleRuleValidation_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleRuleValidation" ADD CONSTRAINT "RuleRuleValidation_rule_validation_id_fkey" FOREIGN KEY ("rule_validation_id") REFERENCES "RuleValidation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRule" ADD CONSTRAINT "ClientRule_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRule" ADD CONSTRAINT "ClientRule_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientInvitation" ADD CONSTRAINT "ClientInvitation_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;
