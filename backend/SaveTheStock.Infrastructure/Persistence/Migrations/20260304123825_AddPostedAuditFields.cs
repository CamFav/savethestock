using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveTheStock.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPostedAuditFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "posted_at",
                table: "waste_session",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "posted_by_account_id",
                table: "waste_session",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "posted_at",
                table: "inventory",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "posted_by_account_id",
                table: "inventory",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "posted_at",
                table: "waste_session");

            migrationBuilder.DropColumn(
                name: "posted_by_account_id",
                table: "waste_session");

            migrationBuilder.DropColumn(
                name: "posted_at",
                table: "inventory");

            migrationBuilder.DropColumn(
                name: "posted_by_account_id",
                table: "inventory");
        }
    }
}
