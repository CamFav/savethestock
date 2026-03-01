using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveTheStock.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLotReceptionTenantFk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddUniqueConstraint(
                name: "ak_products_company_id_id",
                table: "products",
                columns: new[] { "company_id", "id" });

            migrationBuilder.CreateTable(
                name: "receptions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reception_date = table.Column<DateOnly>(type: "date", nullable: false),
                    reference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    has_issue = table.Column<bool>(type: "boolean", nullable: false),
                    issue_note = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    supplier_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_receptions", x => x.id);
                    table.UniqueConstraint("ak_receptions_company_id_id", x => new { x.company_id, x.id });
                    table.ForeignKey(
                        name: "fk_receptions_accounts_account_id",
                        column: x => x.account_id,
                        principalTable: "account",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "lots",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reception_id = table.Column<Guid>(type: "uuid", nullable: true),
                    lot_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    expiry_date = table.Column<DateOnly>(type: "date", nullable: true),
                    unit_cost = table.Column<decimal>(type: "numeric", nullable: false),
                    quantity_initial = table.Column<decimal>(type: "numeric", nullable: false),
                    quantity_remaining = table.Column<decimal>(type: "numeric", nullable: false),
                    has_issue = table.Column<bool>(type: "boolean", nullable: false),
                    issue_note = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_lots", x => x.id);
                    table.UniqueConstraint("ak_lots_company_id_id", x => new { x.company_id, x.id });
                    table.ForeignKey(
                        name: "fk_lots_products_company_id_product_id",
                        columns: x => new { x.company_id, x.product_id },
                        principalTable: "products",
                        principalColumns: new[] { "company_id", "id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_lots_receptions_company_id_reception_id",
                        columns: x => new { x.company_id, x.reception_id },
                        principalTable: "receptions",
                        principalColumns: new[] { "company_id", "id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_lots_company_id",
                table: "lots",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "ix_lots_company_id_product_id",
                table: "lots",
                columns: new[] { "company_id", "product_id" });

            migrationBuilder.CreateIndex(
                name: "ix_lots_company_id_reception_id",
                table: "lots",
                columns: new[] { "company_id", "reception_id" });

            migrationBuilder.CreateIndex(
                name: "ix_receptions_account_id",
                table: "receptions",
                column: "account_id");

            migrationBuilder.CreateIndex(
                name: "ix_receptions_company_id",
                table: "receptions",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "ix_receptions_company_id_reception_date",
                table: "receptions",
                columns: new[] { "company_id", "reception_date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "lots");

            migrationBuilder.DropTable(
                name: "receptions");

            migrationBuilder.DropUniqueConstraint(
                name: "ak_products_company_id_id",
                table: "products");
        }
    }
}
