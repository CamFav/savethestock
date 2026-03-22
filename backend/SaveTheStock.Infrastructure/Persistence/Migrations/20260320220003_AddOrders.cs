using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveTheStock.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_account_company_id",
                table: "account");

            migrationBuilder.AddColumn<Guid>(
                name: "order_id",
                table: "receptions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddUniqueConstraint(
                name: "ak_account_company_id_id",
                table: "account",
                columns: new[] { "company_id", "id" });

            migrationBuilder.CreateTable(
                name: "orders",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reference = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    order_date = table.Column<DateOnly>(type: "date", nullable: false),
                    supplier_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_orders", x => x.id);
                    table.UniqueConstraint("ak_orders_company_id_id", x => new { x.company_id, x.id });
                    table.CheckConstraint("ck_orders_status", "status in ('DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')");
                    table.ForeignKey(
                        name: "fk_orders_account_company_id_account_id",
                        columns: x => new { x.company_id, x.account_id },
                        principalTable: "account",
                        principalColumns: new[] { "company_id", "id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_orders_suppliers_company_id_supplier_id",
                        columns: x => new { x.company_id, x.supplier_id },
                        principalTable: "suppliers",
                        principalColumns: new[] { "company_id", "id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "order_line",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_id = table.Column<Guid>(type: "uuid", nullable: false),
                    order_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    unit = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    quantity_ordered = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    quantity_received = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_order_line", x => x.id);
                    table.CheckConstraint("ck_order_line_quantity_ordered_positive", "quantity_ordered > 0");
                    table.CheckConstraint("ck_order_line_quantity_received_non_negative", "quantity_received >= 0");
                    table.ForeignKey(
                        name: "fk_order_line_orders_company_id_order_id",
                        columns: x => new { x.company_id, x.order_id },
                        principalTable: "orders",
                        principalColumns: new[] { "company_id", "id" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_order_line_products_company_id_product_id",
                        columns: x => new { x.company_id, x.product_id },
                        principalTable: "products",
                        principalColumns: new[] { "company_id", "id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_receptions_company_id_order_id",
                table: "receptions",
                columns: new[] { "company_id", "order_id" });

            migrationBuilder.CreateIndex(
                name: "ix_order_line_company_id_order_id",
                table: "order_line",
                columns: new[] { "company_id", "order_id" });

            migrationBuilder.CreateIndex(
                name: "ix_order_line_company_id_order_id_product_id",
                table: "order_line",
                columns: new[] { "company_id", "order_id", "product_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_order_line_company_id_product_id",
                table: "order_line",
                columns: new[] { "company_id", "product_id" });

            migrationBuilder.CreateIndex(
                name: "ix_orders_company_id",
                table: "orders",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "ix_orders_company_id_account_id",
                table: "orders",
                columns: new[] { "company_id", "account_id" });

            migrationBuilder.CreateIndex(
                name: "ix_orders_company_id_order_date",
                table: "orders",
                columns: new[] { "company_id", "order_date" });

            migrationBuilder.CreateIndex(
                name: "ix_orders_company_id_reference",
                table: "orders",
                columns: new[] { "company_id", "reference" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_orders_company_id_status",
                table: "orders",
                columns: new[] { "company_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_orders_company_id_supplier_id",
                table: "orders",
                columns: new[] { "company_id", "supplier_id" });

            migrationBuilder.AddForeignKey(
                name: "fk_receptions_orders_company_id_order_id",
                table: "receptions",
                columns: new[] { "company_id", "order_id" },
                principalTable: "orders",
                principalColumns: new[] { "company_id", "id" },
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_receptions_orders_company_id_order_id",
                table: "receptions");

            migrationBuilder.DropTable(
                name: "order_line");

            migrationBuilder.DropTable(
                name: "orders");

            migrationBuilder.DropIndex(
                name: "ix_receptions_company_id_order_id",
                table: "receptions");

            migrationBuilder.DropUniqueConstraint(
                name: "ak_account_company_id_id",
                table: "account");

            migrationBuilder.DropColumn(
                name: "order_id",
                table: "receptions");

            migrationBuilder.CreateIndex(
                name: "ix_account_company_id",
                table: "account",
                column: "company_id");
        }
    }
}
