using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveTheStock.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInventory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "inventory",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    inventory_date = table.Column<DateOnly>(type: "date", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    comment = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_inventory", x => x.id);
                    table.UniqueConstraint("ak_inventory_company_id_id", x => new { x.company_id, x.id });
                    table.CheckConstraint("ck_inventory_status", "status IN ('DRAFT','POSTED','CANCELLED')");
                });

            migrationBuilder.CreateTable(
                name: "inventory_line",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_id = table.Column<Guid>(type: "uuid", nullable: false),
                    inventory_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    theoretical_quantity = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    real_quantity = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_inventory_line", x => x.id);
                    table.CheckConstraint("ck_inventory_line_real_non_negative", "real_quantity >= 0");
                    table.CheckConstraint("ck_inventory_line_theoretical_non_negative", "theoretical_quantity >= 0");
                    table.ForeignKey(
                        name: "fk_inventory_line_inventory_company_id_inventory_id",
                        columns: x => new { x.company_id, x.inventory_id },
                        principalTable: "inventory",
                        principalColumns: new[] { "company_id", "id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_inventory_line_products_company_id_product_id",
                        columns: x => new { x.company_id, x.product_id },
                        principalTable: "products",
                        principalColumns: new[] { "company_id", "id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_inventory_company_id_inventory_date",
                table: "inventory",
                columns: new[] { "company_id", "inventory_date" });

            migrationBuilder.CreateIndex(
                name: "ix_inventory_company_id_status",
                table: "inventory",
                columns: new[] { "company_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_inventory_line_company_id_inventory_id",
                table: "inventory_line",
                columns: new[] { "company_id", "inventory_id" });

            migrationBuilder.CreateIndex(
                name: "ix_inventory_line_company_id_inventory_id_product_id",
                table: "inventory_line",
                columns: new[] { "company_id", "inventory_id", "product_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_inventory_line_company_id_product_id",
                table: "inventory_line",
                columns: new[] { "company_id", "product_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "inventory_line");

            migrationBuilder.DropTable(
                name: "inventory");
        }
    }
}
