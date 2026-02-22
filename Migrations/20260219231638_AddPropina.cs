using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestauranteAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPropina : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Propina",
                table: "Ordenes",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Propina",
                table: "Ordenes");
        }
    }
}
