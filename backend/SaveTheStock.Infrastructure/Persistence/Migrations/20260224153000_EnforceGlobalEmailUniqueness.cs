using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SaveTheStock.Infrastructure.Persistence;

#nullable disable

namespace SaveTheStock.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260224153000_EnforceGlobalEmailUniqueness")]
    public sealed class EnforceGlobalEmailUniqueness : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP INDEX IF EXISTS "IX_account_company_id_email";
                DROP INDEX IF EXISTS "IX_account_CompanyId_Email";
                """
            );

            migrationBuilder.Sql(
                """
                DO $$
                DECLARE
                    is_unique boolean;
                BEGIN
                    SELECT (indexdef ILIKE 'CREATE UNIQUE INDEX%')
                    INTO is_unique
                    FROM pg_indexes
                    WHERE schemaname = current_schema()
                      AND tablename = 'account'
                      AND indexname = 'IX_account_email';

                    IF is_unique IS NULL THEN
                        CREATE UNIQUE INDEX "IX_account_email" ON account (email);
                    ELSIF NOT is_unique THEN
                        DROP INDEX "IX_account_email";
                        CREATE UNIQUE INDEX "IX_account_email" ON account (email);
                    END IF;
                END $$;
                """
            );
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP INDEX IF EXISTS "IX_account_company_id_email";
                DROP INDEX IF EXISTS "IX_account_CompanyId_Email";
                """
            );

            migrationBuilder.Sql(
                """
                DO $$
                DECLARE
                    is_unique boolean;
                BEGIN
                    SELECT (indexdef ILIKE 'CREATE UNIQUE INDEX%')
                    INTO is_unique
                    FROM pg_indexes
                    WHERE schemaname = current_schema()
                      AND tablename = 'account'
                      AND indexname = 'IX_account_email';

                    IF is_unique IS NULL THEN
                        CREATE UNIQUE INDEX "IX_account_email" ON account (email);
                    ELSIF NOT is_unique THEN
                        DROP INDEX "IX_account_email";
                        CREATE UNIQUE INDEX "IX_account_email" ON account (email);
                    END IF;
                END $$;
                """
            );
        }
    }
}
