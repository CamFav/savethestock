using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveTheStock.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWaste : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "waste_session",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    waste_date = table.Column<DateOnly>(type: "date", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    comment = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_waste_session", x => x.id);
                    table.UniqueConstraint("ak_waste_sessions_company_id_id", x => new { x.company_id, x.id });
                });

            migrationBuilder.CreateTable(
                name: "waste_line",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_id = table.Column<Guid>(type: "uuid", nullable: false),
                    waste_session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    lot_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    reason = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_waste_line", x => x.id);
                    table.CheckConstraint("ck_waste_line_quantity_positive", "quantity > 0");
                    table.CheckConstraint("ck_waste_line_reason_not_empty", "length(trim(reason)) > 0");
                    table.ForeignKey(
                        name: "fk_waste_line_lots_company_id_lot_id",
                        columns: x => new { x.company_id, x.lot_id },
                        principalTable: "lots",
                        principalColumns: new[] { "company_id", "id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_waste_line_waste_sessions_company_id_waste_session_id",
                        columns: x => new { x.company_id, x.waste_session_id },
                        principalTable: "waste_session",
                        principalColumns: new[] { "company_id", "id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_waste_line_company_id_lot_id",
                table: "waste_line",
                columns: new[] { "company_id", "lot_id" });

            migrationBuilder.CreateIndex(
                name: "ix_waste_line_company_id_waste_session_id",
                table: "waste_line",
                columns: new[] { "company_id", "waste_session_id" });

            migrationBuilder.CreateIndex(
                name: "ix_waste_session_company_id_status",
                table: "waste_session",
                columns: new[] { "company_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_waste_session_company_id_waste_date",
                table: "waste_session",
                columns: new[] { "company_id", "waste_date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "waste_line");

            migrationBuilder.DropTable(
                name: "waste_session");
        }
    }
}
