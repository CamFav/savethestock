using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveTheStock.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UseSnakeCaseNamingConvention : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_account_company_company_id",
                table: "account");

            migrationBuilder.DropPrimaryKey(
                name: "PK_company",
                table: "company");

            migrationBuilder.DropPrimaryKey(
                name: "PK_account",
                table: "account");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "company",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "account",
                newName: "id");

            migrationBuilder.RenameIndex(
                name: "IX_account_email",
                table: "account",
                newName: "ix_account_email");

            migrationBuilder.RenameIndex(
                name: "IX_account_company_id",
                table: "account",
                newName: "ix_account_company_id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_company",
                table: "company",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_account",
                table: "account",
                column: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_account_companies_company_id",
                table: "account",
                column: "company_id",
                principalTable: "company",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_account_companies_company_id",
                table: "account");

            migrationBuilder.DropPrimaryKey(
                name: "pk_company",
                table: "company");

            migrationBuilder.DropPrimaryKey(
                name: "pk_account",
                table: "account");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "company",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "account",
                newName: "Id");

            migrationBuilder.RenameIndex(
                name: "ix_account_email",
                table: "account",
                newName: "IX_account_email");

            migrationBuilder.RenameIndex(
                name: "ix_account_company_id",
                table: "account",
                newName: "IX_account_company_id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_company",
                table: "company",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_account",
                table: "account",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_account_company_company_id",
                table: "account",
                column: "company_id",
                principalTable: "company",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
