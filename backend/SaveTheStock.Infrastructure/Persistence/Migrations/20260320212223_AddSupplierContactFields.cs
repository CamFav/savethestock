using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveTheStock.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSupplierContactFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "email",
                table: "suppliers",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "phone",
                table: "suppliers",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "email",
                table: "suppliers");

            migrationBuilder.DropColumn(
                name: "phone",
                table: "suppliers");
        }
    }
}
