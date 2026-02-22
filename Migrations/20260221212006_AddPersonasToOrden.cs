using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestauranteAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonasToOrden : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Personas",
                table: "Ordenes",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Personas",
                table: "Ordenes");
        }
    }
}
